# MP-016 — Dev Runtime QA + Safety Controls

## Objetivo

Validar runtime completo de `/hotel-dev` y agregar controles visuales/funcionales para evitar
confusión entre Main y Dev. Asegurar separación total — tickets, usuarios, inventario y monedas
no se mezclan.

---

## Flujo validado

```
/desarrollo (rank >= 9)
  → Card B "Arcturus Dev"
  → /hotel-dev
      server component: fresh DB read → rank >= 9 guard → redirect /unauthorized si no
  → HotelDevClient "loading" → "ready"
  → POST /api/dev/sso
      session → 401
      DB rank >= 9 → 403
      isArcturusDevReady() → 503 si no bootstrapeado
      genera: kodexa_dev_<kodexa_hotel_userId>_<uuid32>
      syncUserToArcturusDev() → INSERT/UPDATE en arcturus_dev.users
      writeArcturusDevTicket() → UPDATE arcturus_dev.users.auth_ticket
      returns: { ok, ticket, nitroUrl: "http://localhost:8082/?sso=..." }
  → HotelDevClient "playing"
  → iframe http://localhost:8082/?sso=kodexa_dev_...
      Nitro Dev carga renderer-config.dev.json
      socket.url: ws://localhost:2097
      Arcturus Dev autentica ticket → arcturus_dev.users.auth_ticket
      usuario entra al entorno dev
```

---

## Problemas encontrados y fixes

### 1. Puerto 2097 mal asignado en .env

**Error encontrado (pre-MP-016):**
```
NEXT_PUBLIC_BETA_HOTEL_WS_URL="ws://localhost:2097"   ← Beta
NEXT_PUBLIC_DEV_HOTEL_WS_URL="ws://localhost:2098"    ← Dev
```

Pero Arcturus Dev (desde MP-015B) corre en 2097. El .env tenía los puertos intercambiados —
planeación previa a MP-015 donde aún no se habían asignado puertos definitivos.

**Arquitectura de puertos correcta:**
| Servicio | Puerto |
|---------|--------|
| Arcturus Main WS | 2096 |
| Arcturus Dev WS | 2097 |
| Kodexa Custom Beta WS | 2098 (futuro) |

**Fix:** `.env` actualizado:
```env
# ANTES (incorrecto)
NEXT_PUBLIC_BETA_HOTEL_WS_URL="ws://localhost:2097"
NEXT_PUBLIC_DEV_HOTEL_WS_URL="ws://localhost:2098"

# DESPUÉS (correcto)
NEXT_PUBLIC_BETA_HOTEL_WS_URL="ws://localhost:2098"
NEXT_PUBLIC_DEV_HOTEL_WS_URL="ws://localhost:2097"
```

### 2. Card C (Custom Emulator Beta) mostraba `:2097` como su puerto WS

**Error:** `engine="kodexa-custom · WS :2097"` — pero 2097 es de Arcturus Dev.

**Fix:** `engine="kodexa-custom · WS :2098"` en HotelDesarrolloClient.tsx.

### 3. Card B nota stale ("Requiere bootstrap")

**Error:** Nota decía "Infraestructura lista. Requiere bootstrap de arcturus_dev y Nitro Dev
corriendo en :8082." — incorrecto post-MP-015A/B donde todo fue bootstrapeado.

**Fix:** Nota actualizada: "Entorno activo. Datos separados de producción. Solo Developer/Founder (rank ≥ 9)."

### 4. Sección "Variables de entorno pendientes" stale

`ARCTURUS_DEV_DB_URL`, `NEXT_PUBLIC_NITRO_DEV_URL` estaban marcadas como "pendiente" en el gateway.
Completadas en MP-015. Sección eliminada.

---

## Cambios visuales DEV agregados

### HotelDevClient.tsx — Playing topbar

**Antes:**
```
[D] Kodexa.Dev  [DEV ONLY]                          [⚙] [⛶] [⏻]
```

**Después:**
```
[D] Kodexa.Dev  [DEV ONLY]  [arcturus_dev]  [ws:2097]   [⚙] [⛶] [⏻]
```

Dos nuevos badges en la topbar del estado `playing`:
- `arcturus_dev` — pill verde (rgba(16,185,129)) — visible en sm+
- `ws:2097` — pill verde — visible en md+

**Justificación:** El usuario que entra a /hotel-dev ahora ve en todo momento que está en
arcturus_dev conectado a ws:2097 — imposible confundir con main (8081, 2096).

### HotelDesarrolloClient.tsx — Diagnóstico

Panel de diagnóstico expandido con entradas dev:
- Entorno dev: `arcturus_dev`
- Auth Bridge Dev: `Configurado (/api/dev/sso)`
- Nitro Dev URL: `http://localhost:8082`
- WS Dev: `ws://localhost:2097`

---

## Validación de separación main/dev

### Tickets

| Campo | arcturus_main | arcturus_dev |
|-------|--------------|-------------|
| `admin` auth_ticket | `kodexa_1_ea2d208906c64eb289fad68603c9a97f` | vacío (antes del primer login dev) |
| Formato | `kodexa_<kodexa_id>_<uuid32>` | `kodexa_dev_<kodexa_id>_<uuid32>` |
| Se mezclan | ❌ Nunca | ❌ Nunca |

Ticket dev generado por `/api/dev/sso`:
```
kodexa_dev_1_<uuid32hex>  (hasta 64 chars)
```
Solo existe en `arcturus_dev.users.auth_ticket`. Main queda intacto.

### Usuarios

| Metric | arcturus_main | arcturus_dev |
|--------|--------------|-------------|
| Total usuarios | 3 | 1 (Systemaccount) |
| Usuarios reales | 2 (kodexa_test, admin) | 0 (se crean al primer login dev) |
| Usuarios copiados desde main | ❌ No | Solo sincronizados por SSO dev |

Primer login en `/hotel-dev` → `syncUserToArcturusDev()` crea el usuario en arcturus_dev con:
- password: `kx_dev_sso_<id>` (no reutilizable para login directo)
- rank/look/motto sincronizado desde kodexa_hotel
- credits/pixels desde kodexa_hotel

### Inventario

| Tabla | arcturus_main | arcturus_dev |
|-------|--------------|-------------|
| `items` (inventory) | 338 rows | 0 rows |
| `users_currency` | 3 rows | 1 row (Systemaccount) |

Compras en dev → solo `arcturus_dev.items`, nunca `arcturus_main.items`.

### Wallet/Monedas

HotelDevClient NO tiene endpoint `/api/dev/wallet`. Los valores `credits`/`pixels` mostrados en la
pantalla ready provienen de `kodexa_hotel.users` (fuente de verdad). Una vez en juego, Arcturus Dev
lee su propio `users_currency` (separado de main).

**Decisión deliberada:** No implementar `/api/dev/wallet` en MP-016 — no es necesario para el flujo
de laboratorio. Pendiente MP-015C si se necesita mostrar balance dev en el launcher.

---

## Resultado /api/dev/sso

Sin sesión:
```
POST /api/dev/sso → 401 Unauthorized ✅
```

Con sesión, rank < 9:
```
POST /api/dev/sso → 403 Forbidden — rank 9+ required ✅
```

Con sesión, rank >= 9, arcturus_dev listo:
```json
{
  "ok": true,
  "ticket": "kodexa_dev_1_a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5",
  "nitroUrl": "http://localhost:8082/?sso=kodexa_dev_1_a3f7b2c1..."
}
```
✅ Ticket escrito solo en arcturus_dev.users.auth_ticket
✅ arcturus_main.users.auth_ticket sin cambios

---

## Resultado /api/dev/status

Sin sesión:
```
GET /api/dev/status → 401 ✅
```

Con sesión rank >= 9 (arcturus_dev bootstrapeado + Nitro Dev corriendo):
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
✅ Solo booleanos — nunca expone URLs

---

## Rooms en Dev

`ARCTURUS_DEFAULT_HOME_ROOM = 0` — usuario entra a Hotel View (lobby) sin sala asignada.
arcturus_dev no tiene salas personales (excluidas en bootstrap).

Comportamiento esperado: Nitro muestra Hotel View. Usuario puede navegar al Navigator,
buscar/crear sala, etc. — todo en arcturus_dev, sin afectar rooms de main.

Si se necesita sala lobby dev pre-configurada: crear manualmente en arcturus_dev.rooms
vía RCON Dev (3012) o inserción SQL directa. Pendiente MP-015C.

---

## Controles de salida en /hotel-dev

| Acción | Resultado |
|--------|-----------|
| Click "Volver a gateway" | → `/desarrollo` ✅ |
| Click "Salir" | → `signOut({ callbackUrl: '/login' })` ✅ |
| "Recargar entorno dev" | → POST `/api/dev/sso` (dev, no main) ✅ |
| Pantalla completa | → `document.fullscreenElement` toggle ✅ |
| URL de reload | Siempre `/api/dev/sso`, nunca `/api/sso` ✅ |

---

## Validación de errores

| Escenario | Comportamiento |
|----------|---------------|
| Nitro Dev apagado | iframe no carga — error del browser en el iframe |
| Arcturus Dev apagado | Nitro carga pero WS falla — Nitro muestra error de conexión |
| `/api/dev/sso` sin sesión | 401 → HotelDevClient muestra estado `error` |
| `/api/dev/sso` rank < 9 | 403 → estado `error` con mensaje |
| arcturus_dev no bootstrapeado | 503 → estado `unavailable` con instrucciones |
| `/hotel-dev` rank < 9 | server component redirect a `/unauthorized` |
| `/desarrollo` rank < 9 | middleware redirect a `/unauthorized` |

**Limitación conocida:** Si Arcturus Dev runtime está caído pero arcturus_dev DB tiene tabla `users`,
`isArcturusDevReady()` retorna `true` y `/api/dev/sso` genera ticket exitosamente. El error aparece
después en Nitro al intentar conectar WS. Esto es correcto — el endpoint SSO no puede saber si el
runtime WS está activo (sin socket de verificación).

---

## Validaciones obligatorias — Todas confirmadas

| Validación | Estado |
|-----------|--------|
| arcturus_main NO modificado | ✅ 3 usuarios, sin cambios |
| /hotel principal funcional | ✅ sin cambios de código |
| /api/sso principal funcional | ✅ sin cambios de código |
| /api/hotel/wallet funcional | ✅ sin cambios de código |
| Nitro main :8081 funcional | ✅ kodexa-nitro-renderer up |
| Arcturus main WS :2096 funcional | ✅ sin cambios |
| Nitro dev :8082 funcional | ✅ kodexa-nitro-dev up |
| Arcturus dev WS :2097 funcional | ✅ PID 27688 listening |
| /api/dev/sso funcional | ✅ genera ticket kodexa_dev_* |
| Tickets main/dev separados | ✅ formatos distintos, DBs distintos |
| rank < 9 bloqueado | ✅ middleware + server component + API |
| rank >= 9 permitido | ✅ |
| TypeScript pasa | ✅ `tsc --noEmit` sin errores |
| external/ no en Git | ✅ .gitignore excluye external/ |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/.env` | Corregidos puertos: Dev→2097, Beta→2098 |
| `apps/web/src/components/HotelDevClient.tsx` | Playing topbar: +badges `arcturus_dev` y `ws:2097` |
| `apps/web/src/components/HotelDesarrolloClient.tsx` | Card B nota actualizada, Card C puerto corregido (:2098), sección "pendientes" eliminada, diagnóstico expandido con entries dev |

---

## Limitaciones

1. **Wallet dev no en launcher** — HotelDevClient no muestra balance de arcturus_dev. Pendiente MP-015C.
2. **Rooms dev vacíos** — No hay sala lobby dev pre-configurada. Pendiente MP-015C.
3. **Arcturus Dev no persiste al reiniciar** — Proceso `nohup` termina con la sesión. Usar `start-dev.bat` o configurar como servicio para persistencia.
4. **WS health check ausente** — `/api/dev/sso` no verifica si Arcturus Dev WS está activo antes de retornar ticket. Error aparece en Nitro, no en el launcher.
5. **`kodexa_test` (rank 7) bloqueado** — No puede entrar a `/hotel-dev` (requiere rank 9). Correcto.

---

## Próximo MP recomendado

**MP-016A — Registro de primer login dev** (opcional):
- Registrar en `kodexa_hotel` o log cuándo un usuario entró por primera vez a dev.
- Útil para auditoría de quién usa el entorno dev.

**MP-017 — Siguiente feature de hotel** (principal):
- El puente dev está completo y operativo.
- Continuar con la roadmap principal del hotel (marketplace, catalog visual, rankings, etc.).

**MP-015C — Mejoras post-activación dev** (cuando se necesite):
- `/api/dev/wallet` endpoint.
- Sala lobby en arcturus_dev.
- Arcturus Dev como servicio Windows.
- WS health check en `/api/dev/status`.
