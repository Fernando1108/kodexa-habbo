# MP-011 — Auth Bridge Kodexa Hotel → Arcturus Main

## Objetivo

Implementar un Auth Bridge seguro entre la sesión web de Kodexa.Hotel (NextAuth/Prisma) y Arcturus Morningstar 3.5.5 (arcturus_main MySQL).

Permite que un usuario autenticado en el CMS entre directamente al cliente Nitro Renderer via SSO ticket sin credenciales adicionales.

---

## Flujo completo

```
Browser                CMS (Next.js)              kodexa_hotel         arcturus_main
  |                        |                            |                    |
  |-- click "Entrar" -->   |                            |                    |
  |                        |-- auth() ----------------> |                    |
  |                        |<-- session (id, email, rank, look, motto, credits)
  |                        |                            |                    |
  |                        |-- generate ticket kodexa_<id>_<uuid32>          |
  |                        |-- prisma.user.update authTicket --> |           |
  |                        |-- syncUserToArcturus() ------------------->     |
  |                        |   (upsert by email, sync rank/look/motto)       |
  |                        |-- writeArcturusTicket() ------------------>     |
  |                        |   (UPDATE users SET auth_ticket = ?)            |
  |                        |                            |                    |
  |<-- { ticket } -------- |                            |                    |
  |                        |                            |                    |
  |-- iframe src: http://localhost:8081/?sso=<ticket>   |                    |
  |                        |                            |                    |
Nitro Renderer                                                 Arcturus
  |-- WS connect -----------------------------------------> port 2096       |
  |-- SSO handshake with ticket --------------------------> validates        |
  |                                                          auth_ticket      |
```

---

## Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `apps/web/.env` | Modificado | Añadido `ARCTURUS_DB_URL` + `NEXT_PUBLIC_NITRO_URL` |
| `apps/web/src/lib/arcturus-db.ts` | Creado | PrismaClient singleton para arcturus_main |
| `apps/web/src/lib/arcturus-sync.ts` | Creado | `syncUserToArcturus()` + `writeArcturusTicket()` |
| `apps/web/src/app/api/sso/route.ts` | Modificado | Sync + ticket en ambas DBs |
| `apps/web/src/components/HotelClient.tsx` | Modificado | iframe usa `NEXT_PUBLIC_NITRO_URL` (8081) |

---

## Variables de entorno añadidas

```env
# apps/web/.env
ARCTURUS_DB_URL="mysql://kodexa:kodexa_pass_change_me@localhost:3306/arcturus_main"
NEXT_PUBLIC_NITRO_URL="http://localhost:8081"
```

Prerequisito: usuario `kodexa` ya tiene acceso a `arcturus_main` (verificado — `SELECT 1` OK).

---

## Ticket format

```
kodexa_<userId>_<uuid32>
```

Ejemplo: `kodexa_3_a1b2c3d4e5f6789012345678901234ab`

- Longitud máxima: 7 + len(userId) + 1 + 32 = ~44 chars → fits `arcturus_main.users.auth_ticket VARCHAR(256)` y `kodexa_hotel.users.auth_ticket VARCHAR(64)`.
- `.slice(0, 64)` como seguridad ante user IDs muy largos.

---

## Sync logic

### Usuario existente (match por email)

```sql
UPDATE users SET rank=?, look=?, motto=? WHERE id=?
```

- `rank`, `look`, `motto` — kodexa_hotel es source of truth.
- `credits` — NO se sobreescribe; Arcturus maneja sus propios créditos in-game.

### Usuario nuevo (no existe en arcturus_main)

```sql
INSERT INTO users (username, mail, password, rank, look, gender, motto, credits, account_created, last_online)
VALUES (?, ?, 'kx_sso_<id>', ?, ?, 'M', ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
```

- `password`: placeholder `kx_sso_<userId>` — SSO no lo usa; Arcturus no autentica por password en flujo SSO.
- `gender`: default `'M'` (requerido por Arcturus ENUM(M,F)).
- `home_room`: NULL (se asigna cuando el usuario configura su sala).

---

## API endpoint

```
POST /api/sso
Authorization: NextAuth session (cookie)

Response 200:
{ "ticket": "kodexa_3_a1b2c3d4..." }

Response 401: { "error": "Unauthorized" }
Response 404: { "error": "User not found" }
```

---

## HotelClient — cambio iframe

```tsx
// Antes (WRONG — Vite dev server, no Nitro)
const clientUrl = process.env['NEXT_PUBLIC_CLIENT_URL'] ?? 'http://localhost:3001';

// Después (CORRECT — Nitro Renderer container)
const clientUrl = process.env['NEXT_PUBLIC_NITRO_URL'] ?? 'http://localhost:8081';
```

iframe final: `http://localhost:8081/?sso=kodexa_3_<uuid>`

---

## Test manual (Fernando)

### Prerequisitos
- kodexa-nitro-renderer UP en 8081
- Arcturus running (port 2096 WS, 3005 game)
- kodexa-db UP
- `apps/web` con `pnpm dev:web`

### Test rank 10 (admin)

```
1. http://localhost:3000/login
2. Login como admin (rank 10)
3. Ir a /hotel
4. Click "Entrar al Hotel Principal"
5. Verificar:
   - No error de SSO
   - Nitro Renderer carga en iframe (http://localhost:8081/?sso=kodexa_3_...)
   - Login en Nitro sin pedir credenciales
   - Usuario entra al hotel con nombre/look correcto
```

### Verificar DB post-login

```bash
# kodexa_hotel — ticket generado
docker exec kodexa-db mysql -u root -proot_password_change_me kodexa_hotel -e \
  "SELECT id, username, auth_ticket FROM users WHERE id=3;"

# arcturus_main — ticket sincronizado
docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT id, username, rank, auth_ticket FROM users WHERE mail='diegomorales11082000@gmail.com';"
```

Ambas deben mostrar el mismo ticket.

### Test rank 1 (usuario normal)

```
1. Login como usuario rank 1
2. Ir a /hotel
3. Click "Entrar al Hotel Principal"
4. Verificar mismo flujo — solo aparece botón "Entrar al Hotel Principal"
   (botones Desarrollo/Beta no visibles para rank 1)
```

---

## Clasificación de errores

| Error | Causa | Fix |
|-------|-------|-----|
| SSO 401 | Sesión NextAuth no válida | Re-login |
| SSO 404 | Usuario no encontrado en kodexa_hotel | Verificar DB kodexa_hotel |
| SSO 500 | arcturus_main unreachable | Verificar ARCTURUS_DB_URL + docker kodexa-db |
| Nitro no carga | NEXT_PUBLIC_NITRO_URL incorrecto | Verificar .env + puerto 8081 |
| Nitro rechaza ticket | auth_ticket mismatch | Verificar que arcturus tenga el ticket = kodexa_hotel.auth_ticket |
| Usuario entra con nombre incorrecto | arcturus username != kodexa username | syncUserToArcturus no hace UPDATE username (intencional — evita conflictos) |

---

## Validaciones obligatorias

- kodexa_hotel — NO reseteado
- arcturus_main — NO reseteado
- catalog_pages/items — NO tocados
- items_base — NO tocado
- inventario — NO tocado
- Prisma schema — NO modificado (solo nuevo PrismaClient con datasource override)
- middleware — NO tocado
- /login, /register — NO tocados

---

## Próximos pasos

| Prioridad | Acción | MP |
|-----------|--------|-----|
| Alta | Test manual admin + rank 1 en browser | Fernando |
| Media | Furniture imager — icons para 6,240 ICON_MISSING | MP-010.2 |
| Media | FD sync — agregar entradas para 7,507 no-FD items | MP-010.3 |
| Baja | Género sincronizado desde perfil kodexa | MP-011.1 |
