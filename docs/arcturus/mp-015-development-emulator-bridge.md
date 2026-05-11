# MP-015 — Development Emulator Bridge

## Objetivo

Conectar Arcturus Dev como entorno de laboratorio separado desde `/desarrollo`.
El bridge es independiente del hotel principal — rutas, endpoints, DB client, sync y tickets son distintos.

---

## Estado inicial de arcturus_dev

| DB | Tablas | Estado |
|----|--------|--------|
| arcturus_main | 122 | Producción — operativo |
| arcturus_dev  | 0   | **Vacío — requiere bootstrap** |

**arcturus_dev existe en MySQL pero no tiene ninguna tabla.**
La infraestructura del bridge está completa, pero el runtime no puede usarse hasta bootstrapear el schema.

---

## Infraestructura creada

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/lib/arcturus-dev-db.ts` | PrismaClient para arcturus_dev con guard de env var |
| `apps/web/src/lib/arcturus-dev-sync.ts` | Sync usuario → arcturus_dev + ticket dev |
| `apps/web/src/app/api/dev/sso/route.ts` | POST /api/dev/sso — genera ticket dev |
| `apps/web/src/app/api/dev/status/route.ts` | GET /api/dev/status — health check dev |
| `apps/web/src/app/hotel-dev/page.tsx` | Server component launcher para Arcturus Dev |
| `apps/web/src/components/HotelDevClient.tsx` | Cliente launcher con estados loading/ready/unavailable |
| `docs/arcturus/mp-015-development-emulator-bridge.md` | Este documento |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/.env` | + ARCTURUS_DEV_DB_URL, + NEXT_PUBLIC_NITRO_DEV_URL |
| `apps/web/src/middleware.ts` | + /hotel-dev en needsAuth, needsDev y matcher |
| `apps/web/src/components/HotelDesarrolloClient.tsx` | Card B activada — link a /hotel-dev si devEnabled |

---

## Env vars

| Variable | Valor actual | Propósito |
|----------|-------------|-----------|
| `ARCTURUS_DEV_DB_URL` | `mysql://kodexa:kodexa_pass_change_me@localhost:3306/arcturus_dev` | DB de laboratorio |
| `NEXT_PUBLIC_NITRO_DEV_URL` | `http://localhost:8082` | Nitro apuntando a Arcturus Dev |

**ARCTURUS_DB_URL no fue modificado** — sigue apuntando a arcturus_main.

---

## Separación main/dev

| Elemento | Hotel Principal | Arcturus Dev |
|----------|----------------|--------------|
| DB client | `arcturus-db.ts` | `arcturus-dev-db.ts` |
| Sync | `arcturus-sync.ts` | `arcturus-dev-sync.ts` |
| SSO endpoint | `POST /api/sso` | `POST /api/dev/sso` |
| Ticket formato | `kodexa_<id>_<uuid32>` | `kodexa_dev_<id>_<uuid32>` |
| Ticket destino | arcturus_main.users.auth_ticket | arcturus_dev.users.auth_ticket |
| Launcher page | `/hotel` | `/hotel-dev` |
| Nitro URL | `NEXT_PUBLIC_NITRO_URL` (:8081) | `NEXT_PUBLIC_NITRO_DEV_URL` (:8082) |
| Protección | Sesión autenticada | Sesión + rank >= 9 |

**Los tickets nunca se mezclan.** `/api/dev/sso` nunca escribe en arcturus_main.

---

## Endpoint POST /api/dev/sso

```
POST /api/dev/sso
Auth: sesión NextAuth (cookie)
```

### Flujo interno

1. Verificar sesión → 401 si no hay
2. Fresh DB read de kodexa_hotel.users → rank, email, pixels, etc.
3. `canAccessDevelopment(user.rank)` → 403 si rank < 9
4. `isArcturusDevReady()` → 503 si arcturus_dev no está bootstrapeado
5. Generar ticket `kodexa_dev_<userId>_<uuid32>` (slice a 64)
6. `syncUserToArcturusDev()` → INSERT o UPDATE en arcturus_dev.users
7. `writeArcturusDevTicket()` → UPDATE arcturus_dev.users.auth_ticket
8. Retornar `{ ok: true, ticket, nitroUrl }`

### Respuestas

| Código | Causa |
|--------|-------|
| 200 | OK — ticket generado |
| 401 | Sin sesión |
| 403 | Rank < 9 |
| 503 | arcturus_dev no bootstrapeado (tabla `users` ausente) |
| 500 | Error interno (DB caída, etc.) |

---

## Endpoint GET /api/dev/status

```
GET /api/dev/status
Auth: sesión + rank >= 9
```

Respuesta:
```json
{
  "ok": true,
  "status": {
    "arcturusDevBootstrapped": false,
    "nitroDevUrlConfigured":   true,
    "devDbUrlConfigured":      true,
    "ready":                   false
  }
}
```

No expone URLs — solo booleanos.

---

## helper isArcturusDevReady()

```typescript
export async function isArcturusDevReady(): Promise<boolean>
```

- Consulta `information_schema.tables` para verificar si existe la tabla `users` en arcturus_dev
- Devuelve `false` en cualquier error (DB caída, schema vacío, tabla ausente)
- No lanza — callers deciden qué hacer con el resultado

---

## Formato del ticket dev

```
kodexa_dev_<userId>_<uuid32hex>
```

Sliced a 64 chars (VARCHAR(64) en kodexa_hotel).
Ejemplos:
- `kodexa_dev_1_a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5` (45 chars — dentro del límite)
- Formato garantiza que nunca colisiona con ticket main `kodexa_<id>_...`

El ticket dev **NO se escribe en kodexa_hotel.users.auth_ticket** (evita contaminar el ticket principal). Solo vive en arcturus_dev.users.auth_ticket.

---

## UI — /hotel-dev launcher

### Estados del launcher

| Estado | Trigger | UI |
|--------|---------|-----|
| `loading` | inicial | Boot animation ambar |
| `ready` | boot completo | Avatar + botón entrar |
| `checking` | click entrar | Botón spinning — verificando |
| `unavailable` | 503 de /api/dev/sso | Pantalla clara con pasos de bootstrap |
| `error` | otro fallo | Error card + reintentar |
| `disconnected` | conexión perdida | Wifi off card |
| `playing` | SSO exitoso | Iframe Nitro Dev + topbar DEV ONLY |

### Estado `unavailable` (el más importante ahora)

Muestra instrucciones claras:
1. Bootstrap arcturus_dev con schema Arcturus
2. Verificar ARCTURUS_DEV_DB_URL
3. Iniciar Nitro Dev en NEXT_PUBLIC_NITRO_DEV_URL
4. Ver docs/arcturus/mp-015

---

## Card B en /desarrollo

**Antes (MP-014):** `status="reserved"`, botón "Próximamente — MP-015" deshabilitado.

**Ahora (MP-015):**
- Si `NEXT_PUBLIC_ENABLE_DEV_HOTEL=true` → `status="active"`, link activo a `/hotel-dev`
- Si `NEXT_PUBLIC_ENABLE_DEV_HOTEL=false` → `status="reserved"`, botón "Deshabilitado por feature flag"

Nota actualizada indica que la infraestructura está lista y qué falta (bootstrap + Nitro Dev en :8082).

---

## Protección por rank

| Ruta | Middleware | Server component |
|------|-----------|-----------------|
| `/hotel-dev` | JWT rank >= 9 | Fresh DB rank >= 9 |
| `/api/dev/sso` | (API — no middleware) | Fresh DB rank >= 9 → 403 |
| `/api/dev/status` | (API — no middleware) | Fresh DB rank >= 9 → 403 |

| Rank | /hotel-dev | /api/dev/sso |
|------|-----------|-------------|
| 1 | Redirect /unauthorized | 403 |
| 8 | Redirect /unauthorized | 403 |
| 9 | Acceso | 200 / 503 según dev state |
| 10 | Acceso | 200 / 503 según dev state |

---

## Estado actual por componente

| Componente | Estado |
|------------|--------|
| DB client `arcturus-dev-db.ts` | ✅ Listo |
| Sync `arcturus-dev-sync.ts` | ✅ Listo |
| Endpoint `/api/dev/sso` | ✅ Listo |
| Endpoint `/api/dev/status` | ✅ Listo |
| Launcher `/hotel-dev` | ✅ Listo |
| HotelDevClient | ✅ Listo |
| Card B activada en gateway | ✅ Listo |
| Middleware `/hotel-dev` protegido | ✅ Listo |
| **arcturus_dev bootstrapeado** | ❌ Pendiente MP-015A |
| **Nitro Dev en :8082** | ❌ Pendiente MP-015A |

---

## Validaciones obligatorias — confirmadas

- arcturus_main — NO modificado
- arcturus_main — NO reseteado
- /hotel — NO roto
- /api/sso principal — NO roto (no fue tocado)
- /api/hotel/wallet — NO roto
- registro/login — NO roto
- Custom Emulator Beta — NO tocado
- usuarios — NO borrados
- inventario — NO borrado
- rooms — NO tocadas
- catálogo — NO tocado
- furniture assets — NO tocados
- FurnitureData — NO tocado
- ExternalTexts — NO tocado
- TypeScript — `tsc --noEmit` pasa sin errores

---

## Limitaciones

1. **arcturus_dev vacío** — el bridge completo está implementado pero el runtime falla con 503 hasta que se ejecute el bootstrap. `/hotel-dev` muestra la pantalla `unavailable` con instrucciones claras.

2. **Sin segundo Nitro** — `NEXT_PUBLIC_NITRO_DEV_URL=http://localhost:8082` está configurado pero no hay instancia corriendo. El iframe cargaría en `:8082` — se necesita un segundo container de Nitro apuntando a Arcturus Dev.

3. **Ticket dev no guardado en kodexa_hotel** — decisión deliberada para no contaminar auth_ticket principal. Si se necesita persistir snapshot dev, agregar campo `devAuthTicket` al schema kodexa_hotel en MP futuro.

4. **Wallet no incluida en /hotel-dev** — HotelDevClient no tiene fetchWallet. Dev no garantiza `users_currency` hasta bootstrap. Agregar en MP-015B post-bootstrap.

---

## Bootstrap arcturus_dev — Pasos para MP-015A

1. Exportar schema de arcturus_main (sin datos o solo datos base):
   ```bash
   docker exec kodexa-db mysqldump -u root -proot_password_change_me \
     --no-data arcturus_main > /tmp/arcturus_schema.sql
   ```

2. Importar schema en arcturus_dev:
   ```bash
   docker exec -i kodexa-db mysql -u root -proot_password_change_me \
     arcturus_dev < /tmp/arcturus_schema.sql
   ```

3. (Opcional) Importar datos base — catalog, items_base, room_models (NO users/inventory de main):
   ```bash
   docker exec kodexa-db mysqldump -u root -proot_password_change_me \
     --ignore-table=arcturus_main.users \
     --ignore-table=arcturus_main.users_currency \
     --ignore-table=arcturus_main.user_items \
     --ignore-table=arcturus_main.items \
     arcturus_main > /tmp/arcturus_data.sql
   docker exec -i kodexa-db mysql -u root -proot_password_change_me \
     arcturus_dev < /tmp/arcturus_data.sql
   ```

4. Verificar:
   ```bash
   docker exec kodexa-db mysql -u root -proot_password_change_me -e \
     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='arcturus_dev';"
   ```

5. Iniciar segunda instancia de Arcturus apuntando a arcturus_dev.

6. Iniciar Nitro Dev en :8082 apuntando al WS del Arcturus Dev.

7. Verificar `GET /api/dev/status` → `arcturusDevBootstrapped: true, ready: true`.

---

## Próximo MP recomendado

**MP-015A — Bootstrap arcturus_dev**: ejecutar schema import, configurar segundo Arcturus y segundo Nitro. Una vez `isArcturusDevReady()` retorne true, el bridge completo se activa automáticamente sin más cambios de código.
