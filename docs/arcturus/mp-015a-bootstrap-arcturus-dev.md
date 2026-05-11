# MP-015A — Bootstrap arcturus_dev

## Objetivo

Bootstrapear `arcturus_dev` con schema completo + datos operacionales migrados desde `arcturus_main`.
Preparar config del segundo Arcturus emulator (puertos dev) y segundo Nitro Renderer (port 8082).
**arcturus_main NO fue tocado en ningún momento.**

---

## Estado pre-bootstrap → post-bootstrap

| DB | Tablas antes | Tablas después | Cambio |
|----|-------------|---------------|--------|
| `arcturus_dev` | 0 | 122 | ✅ bootstrapeado |
| `arcturus_main` | 122 | 122 | ✅ sin cambios |

---

## Fuente del schema

`external/arcturus/objectretros/BaseDB MS 3.5.5.sql`

- 11 MB, 30,964 líneas, 122 tablas
- Incluye 1 usuario (Systemaccount), 335 items base

### Sanitización para MariaDB 10.11

BaseDB usa collation de MySQL 8 — incompatible con MariaDB 10.11:

```bash
sed -i 's/utf8mb4_0900_ai_ci/utf8mb4_general_ci/g' /tmp/BaseDB_sanitized.sql
sed -i 's/utf8mb3/utf8/g' /tmp/BaseDB_sanitized.sql
```

---

## Schema drift — Fixes aplicados

La BaseDB (2022) está desactualizada vs `arcturus_main` (que tiene patches aplicados).
Se requerieron ALTER TABLE antes de poder INSERT los datos de main:

### items_base — 25 cols (dev) vs 27 cols (main)

```sql
ALTER TABLE items_base
  ADD COLUMN page_id VARCHAR(250) DEFAULT NULL AFTER public_name,
  ADD COLUMN rare   enum('0','1','2','3','4') NOT NULL DEFAULT '0' AFTER page_id;
```

### catalog_items — 16 cols (dev) vs 18 cols (main)

```sql
ALTER TABLE catalog_items
  ADD COLUMN badge VARCHAR(12) DEFAULT NULL,
  ADD COLUMN rate  VARCHAR(255) DEFAULT NULL;
```

---

## Datos migrados desde arcturus_main

| Tabla | Rows migrados | Método |
|-------|--------------|--------|
| `permissions` | todos | INSERT IGNORE SELECT |
| `emulator_settings` | todos | INSERT IGNORE SELECT |
| `emulator_texts` | todos | INSERT IGNORE SELECT |
| `navigator_flatcats` | todos | INSERT IGNORE SELECT |
| `navigator_publiccats` | todos | INSERT IGNORE SELECT |
| `gift_wrappers` | todos | INSERT IGNORE SELECT |
| `wordfilter` | todos | INSERT IGNORE SELECT |
| `items_base` | 36,269 | INSERT IGNORE SELECT (explicit col list) |
| `catalog_pages` | 1,358 | INSERT IGNORE SELECT |
| `catalog_items` | 35,574 | INSERT IGNORE SELECT (explicit col list) |
| `catalog_clothing` | todos | INSERT IGNORE SELECT |

### Override post-migración

```sql
UPDATE arcturus_dev.emulator_settings
SET value = '2097'
WHERE `key` = 'ws.nitro.port';
```

Dev usa WS port 2097, main usa 2096.

---

## Datos explícitamente excluidos

| Tabla | Razón |
|-------|-------|
| `users` | No copiar usuarios de producción — solo Systemaccount de BaseDB |
| `items` (inventario) | No contaminar dev con inventario de producción |
| `users_currency` | Dev empieza con balances limpios |
| `users_badges`, `users_achievements`, `users_settings` | Datos personales — no copiar |
| `rooms` (personales) | Salas de usuarios no se replican |
| `room_rights`, `room_items` | Datos de salas personales |
| `messenger_*`, `chatlogs_*` | Datos privados |
| `bans`, `sanctions` | Registros disciplinarios |
| `auth_ticket` | Nunca copiar tickets activos |

---

## Estado final de arcturus_dev

```
Tablas:          122
items_base:      36,269
catalog_pages:   1,358
catalog_items:   35,574
users:           1 (Systemaccount — from BaseDB)
inventory:       0
rooms:           0 (personales)
```

---

## Configuración del segundo runtime

### Arcturus Dev — config-dev.ini

`external/arcturus/objectretros/emulator/config-dev.ini`

| Parámetro | Valor |
|-----------|-------|
| `db.database` | `arcturus_dev` |
| `game.port` | `3015` |
| `rcon.port` | `3012` |
| Arranque | `java -jar Arcturus.jar --config config-dev.ini` |

WS port 2097 configurado en `emulator_settings` de `arcturus_dev`.

### Nitro Dev — renderer-config.dev.json

`external/arcturus/objectretros/nitro/renderer-config.dev.json`

| Parámetro | Valor |
|-----------|-------|
| `socket.url` | `ws://localhost:2097` |
| `sso.ticket` | `""` (vacío — se inyecta por SSO) |
| `asset.url` | `http://localhost:8080/assets` |

---

## Docker — Nitro Dev

`docker/docker-compose.nitro.yml`

Define dos servicios Nitro usando la misma imagen (`kodexa-nitro:latest`):

| Servicio | Puerto | Config montada |
|---------|--------|---------------|
| `nitro` | 8081 | `renderer-config.local.json` → ws://localhost:2096 |
| `nitro-dev` | 8082 | `renderer-config.dev.json` → ws://localhost:2097 |

### Comandos

```bash
# Primera vez — build de la imagen
docker compose -f docker/docker-compose.nitro.yml build nitro

# Levantar ambos
docker compose -f docker/docker-compose.nitro.yml up -d

# Solo Nitro Dev
docker compose -f docker/docker-compose.nitro.yml up -d nitro-dev

# Solo Nitro main
docker compose -f docker/docker-compose.nitro.yml up -d nitro
```

**Prerequisito:** red `kodexa` debe existir (creada por `docker-compose.yml`).

```bash
docker compose -f docker/docker-compose.yml up -d
```

---

## Validación

### isArcturusDevReady()

```sql
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'arcturus_dev'
  AND table_name = 'users';
-- Esperado: 1
```

Resultado: `1` — `isArcturusDevReady()` retorna `true`.

### GET /api/dev/status (rank >= 9)

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

### POST /api/dev/sso (rank >= 9)

Con arcturus_dev bootstrapeado y Nitro Dev corriendo en :8082:
- Ya no retorna 503
- Crea usuario en `arcturus_dev.users`
- Escribe ticket `kodexa_dev_<id>_<uuid32>` en `arcturus_dev.users.auth_ticket`
- Retorna `{ ok: true, ticket, nitroUrl }`
- HotelDevClient avanza a estado `playing` (iframe en :8082)

---

## Separación completa main/dev

| Elemento | Main | Dev |
|----------|------|-----|
| DB | `arcturus_main` | `arcturus_dev` |
| DB client | `arcturus-db.ts` | `arcturus-dev-db.ts` |
| Game port | 3005 | 3015 |
| WS port | 2096 | 2097 |
| RCON port | 3002 | 3012 |
| Nitro URL | http://localhost:8081 | http://localhost:8082 |
| Config | `config.ini` | `config-dev.ini` |
| Renderer config | `renderer-config.local.json` | `renderer-config.dev.json` |
| Docker service | `nitro` | `nitro-dev` |
| Ticket formato | `kodexa_<id>_<uuid32>` | `kodexa_dev_<id>_<uuid32>` |
| SSO endpoint | `POST /api/sso` | `POST /api/dev/sso` |
| Launcher | `/hotel` | `/hotel-dev` |

---

## Validaciones obligatorias — confirmadas

- `arcturus_main` — NO modificado
- `arcturus_main` — NO reseteado
- `/hotel` — NO roto
- `/api/sso` principal — NO roto
- Usuarios de producción — NO copiados a arcturus_dev
- Inventario de producción — NO copiado
- Rooms de producción — NO copiadas
- TypeScript — `tsc --noEmit` pasa sin errores

---

## Archivos creados/modificados

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `external/arcturus/objectretros/emulator/config-dev.ini` | Nuevo | Config segunda instancia Arcturus |
| `external/arcturus/objectretros/nitro/renderer-config.dev.json` | Nuevo | Config Nitro Dev → ws://localhost:2097 |
| `docker/docker-compose.nitro.yml` | Nuevo | Servicios Nitro main (8081) + dev (8082) |
| `docs/arcturus/reports/dev-bootstrap/arcturus-dev-pre-bootstrap-state.json` | Nuevo | Snapshot pre-bootstrap |
| `docs/arcturus/reports/dev-bootstrap/arcturus-dev-post-bootstrap-state.json` | Nuevo | Snapshot post-bootstrap |
| `docs/arcturus/mp-015a-bootstrap-arcturus-dev.md` | Nuevo | Este documento |

---

## Próximos pasos

### Para activar el bridge completamente:

1. **Iniciar Arcturus Dev:**
   ```bash
   cd external/arcturus/objectretros/emulator
   java -jar Arcturus.jar --config config-dev.ini
   ```

2. **Build y levantar Nitro Dev:**
   ```bash
   # Primera vez (build)
   docker compose -f docker/docker-compose.nitro.yml build nitro

   # Levantar Nitro Dev
   docker compose -f docker/docker-compose.nitro.yml up -d nitro-dev
   ```

3. **Verificar:**
   ```
   GET /api/dev/status → ready: true
   ```

4. **Entrar a /hotel-dev** con rank >= 9 → bridge activo.

### MP-015B (recomendado post-activación)

- Agregar wallet a HotelDevClient (fetchWallet en /api/dev/wallet)
- Agregar campo `devAuthTicket` a kodexa_hotel si se quiere persistir snapshot
- Validar flujo completo en Nitro Dev (rooms, catalog, chat)
