# MP-013 — Registro/Login + Sync Completo de Usuario Nuevo hacia Arcturus

## Problema inicial

El flujo de registro y login existía y funcionaba en `kodexa_hotel`. Pero el sync hacia `arcturus_main` tenía dos gaps:

1. `syncUserToArcturus()` no creaba filas en `users_currency` → wallet mostraba 0 duckets aunque el usuario tuviera pixels en `kodexa_hotel`
2. `/api/sso` no pasaba `pixels` al sync → imposible inicializar duckets correctamente

El flujo de registro en sí mismo ya era correcto. El fix fue mínimo (2 archivos).

---

## Flujo final completo

```
POST /api/auth/register
  → kodexa_hotel.users (username, email, bcrypt_password, rank=1, credits=5000, pixels=10000, look, motto)
  → kx_user_levels (level=1)
  → kx_reputation (score=0)

POST /login (NextAuth Credentials)
  → verifica contra kodexa_hotel.users
  → JWT: {id, username, rank, credits, look}

GET /hotel (server component)
  → auth() → sesión → kodexa_hotel.users

Click "Entrar al Hotel Principal"
  → POST /api/sso
      → kodexa_hotel.users (fetch: id, username, email, rank, look, motto, credits, pixels)
      → syncUserToArcturus() → arcturus_main.users (INSERT o UPDATE)
      → _initCurrencyRows() → arcturus_main.users_currency type=0 y type=5 (INSERT IGNORE)
      → ticket: kodexa_<id>_<uuid32> → write a kodexa_hotel y arcturus_main
      → return { ticket }

iframe: http://localhost:8081/?sso=<ticket>
  → Nitro WebSocket → Arcturus validates auth_ticket
  → usuario entra al hotel con rank/look correcto

GET /api/hotel/wallet
  → lee arcturus_main.users.credits
  → lee arcturus_main.users_currency type=0 (duckets)
  → lee arcturus_main.users_currency type=5 (diamonds)
  → { credits, pixels, diamonds }
```

---

## Auditoría del flujo de registro/login

### Lo que ya funcionaba

| Componente | Estado |
|-----------|--------|
| `POST /api/auth/register` | Funcional — crea usuario en kodexa_hotel |
| `POST /login` (NextAuth) | Funcional — verifica bcrypt, JWT |
| Middleware de protección de rutas | Funcional |
| `/api/sso` ticket dinámico | Funcional |
| `syncUserToArcturus()` — INSERT nuevo usuario | Funcional |
| `syncUserToArcturus()` — UPDATE usuario existente | Funcional |
| `writeArcturusTicket()` | Funcional |
| `/api/hotel/wallet` | Funcional pero retornaba 0 duckets si no había fila en users_currency |

### Lo que estaba incompleto

| Gap | Fix en este MP |
|-----|---------------|
| `syncUserToArcturus()` no creaba `users_currency` rows | Añadido `_initCurrencyRows()` |
| `/api/sso` no pasaba `pixels` al sync | Añadido `pixels` al select y al payload |

---

## Mapping kodexa_hotel → arcturus_main

| kodexa_hotel.users | arcturus_main.users | Notas |
|-------------------|---------------------|-------|
| `username` | `username` | En INSERT solo |
| `email` | `mail` | Clave de match |
| `rank` | `rank` | Sincronizado en cada SSO — kodexa manda |
| `look` | `look` | Sincronizado en cada SSO |
| `motto` | `motto` | Sincronizado en cada SSO |
| `credits` | `credits` | En INSERT solo — Arcturus maneja en-game |
| `pixels` → | `users_currency type=0` | INSERT IGNORE en cada SSO |
| (hardcoded) | `gender = 'M'` | kodexa_hotel no tiene campo gender todavía |
| (hardcoded) | `home_room = 0` | Arcturus envía a hotel view — correcto |
| `id` → `kx_sso_<id>` | `password` | Opaque placeholder — SSO no usa password |

### Campos NO sincronizados (Arcturus los maneja)

| Campo | Razón |
|-------|-------|
| `credits` (actualización) | Arcturus modifica al comprar — no sobreescribir |
| `users_currency type=0` (actualización) | INSERT IGNORE preserva valor actual si row existe |
| `home_room` (actualización) | Usuario puede haber configurado su sala — no pisar |
| `inventory` / `items` | Nunca tocar |
| `machine_id`, `ip_register`, `ip_current` | Arcturus los escribe — no sobreescribir |

---

## Defaults oficiales para usuario nuevo

| Campo | Valor | Fuente |
|-------|-------|--------|
| `rank` | 1 | kodexa_hotel (definido en registro) |
| `credits` | 5000 | kodexa_hotel (schema default) |
| `pixels` / duckets | 10000 → `users_currency type=0` | kodexa_hotel (schema default) |
| `diamonds` | 0 → `users_currency type=5` | Constante |
| `look` | `hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92` | Registro route |
| `motto` | `'Soy nuevo en Kodexa Hotel'` | Registro route |
| `gender` | `'M'` | Constante (kodexa sin campo gender todavía) |
| `home_room` | `0` | Constante — Arcturus maneja hotel view |
| `auth_ticket` | Generado dinámico en cada SSO | `/api/sso` |

---

## Look inicial

`hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92`

Compatible con FigureData.json y assets de avatar cargados. Similar al look del admin que renderiza correctamente en Nitro.

Deuda: selector visual de avatar en registro → MP futuro.

---

## home_room default

`home_room = 0` — correcto en Arcturus. Significa "sin sala personal configurada". Arcturus lleva al usuario al hotel view (recepción) al login. El usuario puede navegar y entrar a cualquier sala pública.

Salas existentes usadas como referencia:
- id=50 "Dark Elegant Bundle" (owner_id=1 Systemaccount)
- id=57 "ssasas" (owner admin)

No se asigna ninguna de estas por defecto — el usuario elige su propia sala.

---

## Cambios en syncUserToArcturus()

### Añadido: `pixels` en KodexaUser interface

```typescript
interface KodexaUser {
  // ...
  pixels: number; // kodexa_hotel.users.pixels → usado como duckets iniciales
}
```

### Añadido: `_initCurrencyRows()` helper

```typescript
async function _initCurrencyRows(arcturusId: number, initialPixels: number): Promise<void> {
  // INSERT IGNORE es no-op si la fila ya existe — seguro para usuarios existentes
  await arcturusDb.$executeRawUnsafe(
    'INSERT IGNORE INTO users_currency (user_id, type, amount) VALUES (?, 0, ?)',
    arcturusId, initialPixels,
  );
  await arcturusDb.$executeRawUnsafe(
    'INSERT IGNORE INTO users_currency (user_id, type, amount) VALUES (?, 5, 0)',
    arcturusId,
  );
}
```

Llamado tanto en INSERT (nuevo usuario) como en UPDATE (usuario existente) — idempotente.

### Añadido: `ARCTURUS_DEFAULT_LOOK` y `ARCTURUS_DEFAULT_HOME_ROOM` como constantes exportadas

---

## Generación de monedas iniciales

| Moneda | Tabla | Cuándo |
|--------|-------|--------|
| Credits | `arcturus_main.users.credits` | Al INSERT (sync primer SSO) |
| Duckets | `users_currency (user_id, type=0, amount=pixels)` | INSERT IGNORE en cada SSO |
| Diamonds | `users_currency (user_id, type=5, amount=0)` | INSERT IGNORE en cada SSO |

---

## Prueba usuario nuevo (manual)

```
1. POST /api/auth/register → { username, email, password }
2. Login con email/password
3. Ir a /hotel
4. Click "Entrar al Hotel Principal"
5. Verificar:
   - /api/sso retorna { ticket }
   - arcturus_main.users contiene nuevo usuario con rank=1
   - arcturus_main.users_currency contiene type=0 y type=5
   - Nitro carga con look correcto
   - /api/hotel/wallet retorna credits, pixels (duckets), diamonds correctos

Verificación DB:
docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT id, username, rank, look, home_room, credits FROM users WHERE mail='<email>';"

docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT type, amount FROM users_currency WHERE user_id=<id>;"
```

---

## Prueba admin Founder rank 10

```
1. Login admin (email: diegomorales11082000@gmail.com)
2. /hotel → Click "Entrar al Hotel Principal"
3. /api/sso → sync arcturus: UPDATE rank=10, look, motto
4. arcturus_main.users.rank debe = 10
5. INSERT IGNORE users_currency → no-op (rows ya existen: type=0 amount=25, type=5 amount=0)
6. Nitro entra → usuario tiene rank 10 en Arcturus

Verificado: admin en arcturus_main ya tiene rank=10 (sincronizado en MPs anteriores).
```

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/lib/arcturus-sync.ts` | + `pixels` en KodexaUser, + `_initCurrencyRows()`, + constantes exportadas |
| `apps/web/src/app/api/sso/route.ts` | + `pixels` en select y payload |

---

## Validaciones obligatorias — confirmadas

- arcturus_dev — NO modificado
- arcturus_main — NO reseteado, solo INSERT IGNORE y UPDATE
- usuarios existentes — NO borrados
- inventario — NO tocado
- rooms — NO tocadas (home_room=0 no asigna sala)
- catálogo — NO tocado
- furniture assets — NO tocados
- FurnitureData — NO tocado
- ExternalTexts — NO tocado
- Auth Bridge — NO roto (solo añadidos; misma lógica de sync)
- /hotel — NO roto
- /api/hotel/wallet — NO roto (ahora retorna duckets reales)
- ticket fijo — NO es flujo principal
- admin rank 10 — sigue funcionando (UPDATE preserva rank desde kodexa)
- TypeScript — pasa sin errores

---

## Limitaciones

1. **Gender siempre M**: kodexa_hotel no tiene campo gender. Todos los nuevos usuarios en Arcturus entran como masculinos. Selector visual de género → MP futuro (avatar editor en registro).

2. **Look fijo en registro**: no hay selector visual en el formulario de registro — se asigna look default. Selector → MP futuro.

3. **Credits no actualizan kodexa_hotel post-compra**: si el usuario compra en Nitro, arcturus_main.users.credits baja, pero kodexa_hotel.users.credits queda con el snapshot. Sin impacto funcional (wallet ya lee desde arcturus_main).

4. **INSERT IGNORE duckets preserva valor actual**: si un usuario ya tenía duckets en arcturus_main.users_currency y entra de nuevo, sus duckets no se reinician. Correcto.

---

## Próximos MPs

| # | Tarea | MP |
|---|-------|----|
| 1 | Selector visual de avatar en registro | MP-014 |
| 2 | Campo gender en kodexa_hotel + sync | MP-014 |
| 3 | Sync de créditos post-compra (arcturus → kodexa) | MP-015 |
| 4 | Rediseño visual registro/login (Classic Premium Retro) | MP-SWF-001 |
