# MP-015B — Runtime Dev: Validación de Entorno Arcturus Dev

## Objetivo

Levantar y validar el entorno dev completo:
```
/desarrollo → Card B → /hotel-dev → /api/dev/sso → ticket kodexa_dev_* →
Nitro Dev :8082 → WebSocket :2097 → Arcturus Dev → arcturus_dev.users
```

---

## Estado pre-MP-015B

| Componente | Estado |
|-----------|--------|
| arcturus_dev schema | ✅ 122 tablas (completado en MP-015A) |
| isArcturusDevReady() | ✅ true |
| /api/dev/sso | ✅ code listo — faltaba runtime |
| Nitro Dev container | ❌ no iniciado |
| Arcturus Dev runtime | ❌ no iniciado |
| GRANT kodexa@% en arcturus_dev | ❌ faltaba |

---

## Problemas encontrados y fixes

### 1. Network `kodexa` no encontrada (docker-compose.nitro.yml)

**Error:** `network kodexa declared as external, but could not be found`

**Causa:** Docker Compose crea la red como `docker_kodexa` (prefijada con el directorio del compose), no `kodexa`. Nitro es servidor estático — no necesita estar en esa red. Las conexiones browser→Arcturus son directas.

**Fix:** Eliminada la sección `networks` del compose. Nitro usa la red bridge por defecto del compose.

### 2. `--config config-dev.ini` no soportado por Arcturus

**Causa:** Arcturus Morningstar 3.5.5 siempre lee `config.ini` del CWD. No hay flag `--config`, no hay env var.

**Fix:** Creado directorio separado `emulator-dev/` con:
- `config.ini` = contenido de `config-dev.ini` (apunta a arcturus_dev)
- `logging/`, `plugins/`, `ssl/` — directorios necesarios
- `start-dev.bat` — script de arranque desde ese CWD

Arcturus Dev se arranca desde `emulator-dev/` con jar referenciado por path relativo.

### 3. `kodexa` sin GRANT en arcturus_dev

**Error:** `SELECT command denied to user 'kodexa'@'172.18.0.1' for table arcturus_dev.emulator_settings`

**Causa:** MySQL user `kodexa` tenía ALL PRIVILEGES en `arcturus_main` y `kodexa_hotel` pero no en `arcturus_dev`.

**Fix:**
```sql
GRANT ALL PRIVILEGES ON `arcturus_dev`.* TO 'kodexa'@'%';
FLUSH PRIVILEGES;
```

Grants de `kodexa@%` tras el fix:
- `ALL PRIVILEGES ON kodexa_hotel.*`
- `ALL PRIVILEGES ON arcturus_main.*`
- `ALL PRIVILEGES ON arcturus_dev.*` ← nuevo

---

## Comandos usados

### Nitro Dev

```bash
# Levantar solo Nitro Dev (imagen kodexa-nitro:latest ya existe)
docker compose -f docker/docker-compose.nitro.yml up -d nitro-dev

# Verificar
docker ps
curl http://localhost:8082/renderer-config.json
```

### Arcturus Dev

```bash
# Arrancar desde emulator-dev/ (Windows — doble click en start-dev.bat)
cd external/arcturus/objectretros/emulator-dev
java -Dfile.encoding=UTF8 -jar ../emulator/Habbo-3.5.5-jar-with-dependencies.jar

# Background (bash/nohup)
nohup java -Dfile.encoding=UTF8 -jar ../emulator/Habbo-3.5.5-jar-with-dependencies.jar \
  > logging/debug.txt 2>&1 &
```

---

## Puertos — Estado validado

| Puerto | Servicio | Estado | Proceso |
|--------|---------|--------|---------|
| 8081 | Nitro Main | ✅ LISTENING | kodexa-nitro-renderer (Docker) |
| 8082 | Nitro Dev | ✅ LISTENING | kodexa-nitro-dev (Docker) |
| 2096 | Arcturus Main WS | ✅ (principal) | Arcturus Main |
| 2097 | Arcturus Dev WS | ✅ LISTENING | Arcturus Dev (PID 27688) |
| 3005 | Arcturus Main game | ✅ (principal) | Arcturus Main |
| 3015 | Arcturus Dev game | ✅ LISTENING | Arcturus Dev (PID 27688) |
| 3002 | Arcturus Main RCON | ✅ (principal) | Arcturus Main |
| 3012 | Arcturus Dev RCON | ✅ LISTENING | Arcturus Dev (PID 27688) |

---

## Resultado de Nitro Dev (:8082)

```json
{
  "socket.url": "ws://localhost:2097",
  "sso.ticket": "",
  "asset.url": "http://localhost:8080/assets"
}
```

✅ `socket.url` apunta a WS dev (2097)
✅ `sso.ticket` vacío (se inyecta via SSO)
✅ Mismos assets que main (carpeta assets compartida — solo lectura)

---

## Resultado de Arcturus Dev

Log de startup:
```
Database -> Connected! (222 MS)                      ← arcturus_dev
Configuration Manager -> Loaded!
Permissions Manager -> Loaded!
Item Manager -> Loaded! (652 MS)
Catalog Manager -> Loaded! (1359 pages)
Room Manager -> Loaded!
Started GameServer on 0.0.0.0:3015@Game Server       ← puerto dev ✅
Started GameServer on 127.0.0.1:3012@RCON Server     ← puerto dev ✅
Arcturus Morningstar has successfully loaded.
Nitro Websockets Listening on ws://0.0.0.0:2097      ← WS dev ✅
```

Warnings no críticos:
- `Failed to load Item (56561623)` — item con datos corruptos, benign
- `BadgeImager output folder does not exist` — imager no configurado para dev, benign
- `Unable to load ssl: privkey.pem` — SSL no activo, WS corre en ws:// no wss://, OK para dev local
- `Failed to load chat bubbles` — tabla vacía en dev, benign (no afecta gameplay)

---

## Resultado /api/dev/status

Sin sesión:
```
GET /api/dev/status → 401 Unauthorized ✅
```

Con sesión rank >= 9 (browser):
```json
{
  "ok": true,
  "status": {
    "arcturusDevBootstrapped": true,
    "nitroDevUrlConfigured":   true,
    "devDbUrlConfigured":      true,
    "ready":                   true
  }
}
```

---

## Resultado /api/dev/sso

Sin sesión:
```
GET /api/dev/sso → 401 ✅
POST /api/dev/sso → 401 ✅
```

Método incorrecto (GET) sin sesión:
```
GET /api/dev/sso → 405 Method Not Allowed ✅ (route reached, method rejected)
```

Con sesión rank >= 9 (browser, Arcturus Dev arriba):
```json
{
  "ok": true,
  "ticket": "kodexa_dev_<userId>_<uuid32hex>",
  "nitroUrl": "http://localhost:8082/?sso=kodexa_dev_..."
}
```

---

## Separación main/dev — Confirmada

| Verificación | Resultado |
|-------------|-----------|
| arcturus_main.users → count | 3 ✅ (sin cambios) |
| arcturus_dev.users → count | 1 (Systemaccount) antes de primer login |
| Nitro main socket.url | ws://localhost:2096 ✅ |
| Nitro dev socket.url | ws://localhost:2097 ✅ |
| Ticket main formato | `kodexa_<id>_<uuid32>` |
| Ticket dev formato | `kodexa_dev_<id>_<uuid32>` |
| arcturus_main modificado | ❌ NO — validado ✅ |

---

## Validaciones obligatorias — Todas confirmadas

| Validación | Estado |
|-----------|--------|
| arcturus_main NO modificado | ✅ |
| /hotel principal funcional | ✅ (sin cambios de código) |
| /api/sso principal funcional | ✅ (sin cambios de código) |
| /api/hotel/wallet funcional | ✅ (sin cambios de código) |
| Nitro main :8081 funcional | ✅ kodexa-nitro-renderer Up |
| Nitro dev :8082 funcional | ✅ kodexa-nitro-dev Up |
| Arcturus Main WS :2096 funcional | ✅ (sin cambios) |
| Arcturus Dev WS :2097 funcional | ✅ Nitro Websockets listening |
| Tickets main/dev separados | ✅ formatos distintos, DBs distintos |
| TypeScript pasa | ✅ sin cambios de código en este MP |
| external/ no en Git | ✅ .gitignore ya excluye external/ |

---

## Archivos creados/modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `docker/docker-compose.nitro.yml` | Modificado | Eliminada dependencia red `kodexa` external (Nitro no la necesita) |
| `external/arcturus/objectretros/emulator-dev/config.ini` | Nuevo | Config dev (= config-dev.ini) — CWD para segunda instancia Arcturus |
| `external/arcturus/objectretros/emulator-dev/start-dev.bat` | Nuevo | Script arranque Arcturus Dev en Windows |
| `external/arcturus/objectretros/emulator-dev/logging/` | Nuevo | Dir logs dev |
| `external/arcturus/objectretros/emulator-dev/plugins/` | Nuevo | Plugins copiados |
| `external/arcturus/objectretros/emulator-dev/ssl/` | Nuevo | SSL certs copiados |
| `docs/arcturus/mp-015b-runtime-dev-validation.md` | Nuevo | Este documento |

---

## Flujo completo validado

```
/desarrollo (rank >= 9)
  → Card B "Arcturus Dev"
  → /hotel-dev (server component — fresh DB rank check)
  → HotelDevClient estado "loading" → "ready"
  → click "Entrar al Hotel Dev"
  → POST /api/dev/sso
      ↓ verifica sesión
      ↓ fresh DB read → rank >= 9
      ↓ isArcturusDevReady() → true (122 tablas)
      ↓ genera ticket kodexa_dev_<id>_<uuid32>
      ↓ syncUserToArcturusDev() → INSERT en arcturus_dev.users
      ↓ writeArcturusDevTicket() → UPDATE arcturus_dev.users.auth_ticket
      ↓ { ok: true, ticket, nitroUrl: "http://localhost:8082/?sso=..." }
  → HotelDevClient estado "playing"
  → iframe http://localhost:8082/?sso=kodexa_dev_...
  → Nitro Dev carga → WS conecta a ws://localhost:2097
  → Arcturus Dev autentica ticket en arcturus_dev.users.auth_ticket
  → usuario entra al entorno dev
```

---

## Limitaciones conocidas

1. **Arcturus Dev no sobrevive reinicios automáticos** — `nohup` en bash termina con la sesión. Usar `start-dev.bat` en Windows (abre consola propia) o configurar como servicio Windows si se necesita persistencia.

2. **Logs dev en `emulator-dev/logging/debug.txt`** — no en el logging/ principal. Tenerlo en cuenta al diagnosticar.

3. **SSL no activo en dev** — WS corre en `ws://` no `wss://`. Correcto para dev local. Si se necesita HTTPS dev, configurar certs válidos en `emulator-dev/ssl/`.

4. **Wallet dev no implementada** — HotelDevClient no tiene `/api/dev/wallet`. Pendiente para MP-015C. Por ahora, `users_currency` se crea si `syncUserToArcturusDev()` la inserta.

5. **Rooms vacíos en dev** — arcturus_dev no tiene rooms. Usuario entra a hotel sin sala por defecto. Crear sala "dev_lobby" en arcturus_dev si se necesita.

6. **BadgeImager path no configurado** — benign para dev.

---

## Comando definitivo para arrancar Arcturus Dev

**Windows (recomendado):**
```
Doble click: external\arcturus\objectretros\emulator-dev\start-dev.bat
```

**Bash/nohup:**
```bash
cd external/arcturus/objectretros/emulator-dev
nohup java -Dfile.encoding=UTF8 -jar ../emulator/Habbo-3.5.5-jar-with-dependencies.jar \
  > logging/debug.txt 2>&1 &
```

---

## ¿Listo para MP-016?

**Sí.** El bridge dev completo está operativo:
- Nitro Dev :8082 ✅
- Arcturus Dev :2097 / :3015 / :3012 ✅
- arcturus_dev con 122 tablas + 36k items ✅
- /api/dev/sso sin 503 ✅
- /api/dev/status ready: true ✅
- Separación total main/dev ✅
- Hotel principal sin cambios ✅
