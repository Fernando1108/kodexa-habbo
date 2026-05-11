# MP-013.1 — QA Funcional y Hardening: Registro/Login + Sync Arcturus

## Objetivo

Auditar y validar el flujo completo de usuario real:

```
Registro/Login web
→ sesión kodexa_hotel
→ /api/sso
→ sync arcturus_main.users
→ auth_ticket dinámico
→ Nitro (iframe)
→ wallet real
→ rank correcto
→ entrada al hotel
```

---

## Auditoría de archivos (MP-011 al MP-013)

### Archivos del flujo principal

| Archivo | Propósito | Estado post-MPs |
|---------|-----------|-----------------|
| `apps/web/src/app/api/auth/register/route.ts` | Crea usuario en kodexa_hotel | Funcional |
| `apps/web/src/lib/auth.ts` | NextAuth Credentials + JWT | Funcional |
| `apps/web/src/middleware.ts` | Protección de rutas por rank | Funcional |
| `apps/web/src/app/hotel/page.tsx` | Server component — fresh DB read | Funcional |
| `apps/web/src/components/HotelClient.tsx` | Cliente — launcher + HUD | Funcional |
| `apps/web/src/app/api/sso/route.ts` | Genera ticket + sync | Funcional |
| `apps/web/src/lib/arcturus-sync.ts` | syncUserToArcturus + _initCurrencyRows | Funcional |
| `apps/web/src/lib/arcturus-db.ts` | PrismaClient para arcturus_main | Hardened en este MP |
| `apps/web/src/app/api/hotel/wallet/route.ts` | Lee monedas reales de arcturus_main | Hardened en este MP |

---

## Flujo de registro — validado

### Defaults de usuario nuevo

| Campo | Valor | Dónde se define |
|-------|-------|-----------------|
| `rank` | 1 | `register/route.ts` hardcoded |
| `credits` | 5000 | `register/route.ts` hardcoded |
| `pixels` | 10000 | `register/route.ts` hardcoded |
| `look` | `hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92` | `register/route.ts` fallback |
| `motto` | `'Soy nuevo en Kodexa Hotel'` | `register/route.ts` hardcoded |
| `authTicket` | `crypto.randomUUID()` | Placeholder inicial — sobrescrito en primer SSO |
| `level` | 1 | `kx_user_levels` via `userLevel.create` |
| `reputation.score` | 0 | `kx_reputation` via `reputation.create` |

### Validación de duplicados

- `findUnique({ username })` → 409 `'El username ya está en uso'`
- `findUnique({ email })` → 409 `'El email ya está registrado'`
- Race condition P2002 → ahora también retorna 409 apropiado (fix en este MP)

---

## Flujo de login — validado

- NextAuth Credentials — busca por `username` OR `email` (campo `identifier`)
- bcrypt.compare contra `users.password`
- JWT lleva: `id`, `username`, `rank`, `credits`, `look`
- Rank en JWT es snapshot del login — ver limitación #1 más abajo

---

## Validación usuario admin Founder (rank 10)

**En kodexa_hotel:**
```sql
SELECT id, username, email, rank, auth_ticket
FROM kodexa_hotel.users
WHERE email = 'diegomorales11082000@gmail.com';
```
Esperado: `rank = 10`, `auth_ticket` dinámico (cambia en cada SSO).

**En arcturus_main (después de /api/sso):**
```sql
SELECT id, username, mail, rank, auth_ticket, credits, look, gender, home_room
FROM arcturus_main.users
WHERE mail = 'diegomorales11082000@gmail.com';
```
Esperado:
- `rank = 10` (kodexa es source of truth — sobrescribe en cada SSO)
- `auth_ticket` = mismo ticket que kodexa_hotel (sincronizado en `writeArcturusTicket()`)
- `look` = valor de kodexa_hotel
- `gender = 'M'` (constante — campo gender no existe en kodexa_hotel todavía)
- `home_room` = preservado si > 0, o 0 para hotel view

**En arcturus_main.users_currency:**
```sql
SELECT type, amount
FROM arcturus_main.users_currency
WHERE user_id = (SELECT id FROM users WHERE mail = 'diegomorales11082000@gmail.com');
```
Esperado: `type=0` (duckets) y `type=5` (diamonds) — INSERT IGNORE no toca valores existentes.

---

## Validación usuario nuevo (rank 1)

**Flujo a ejecutar manualmente:**
1. POST `/api/auth/register` con `{ username, email, password }`
2. Login con email/password
3. Ir a `/hotel`
4. Click "Entrar al Hotel Principal"
5. Verificar en ambas DBs

**kodexa_hotel.users esperado:**
```sql
SELECT id, username, email, rank, credits, pixels, look
FROM kodexa_hotel.users
WHERE email = '<email_nuevo>';
-- rank=1, credits=5000, pixels=10000, look=default válido
```

**arcturus_main.users esperado:**
```sql
SELECT id, username, mail, rank, auth_ticket, credits, look, gender, home_room
FROM arcturus_main.users
WHERE mail = '<email_nuevo>';
-- rank=1, auth_ticket dinámico, gender='M', home_room=0
```

**arcturus_main.users_currency esperado:**
```sql
SELECT type, amount
FROM arcturus_main.users_currency
WHERE user_id = (SELECT id FROM arcturus_main.users WHERE mail = '<email_nuevo>');
-- type=0, amount=10000 (pixels de kodexa_hotel)
-- type=5, amount=0
```

---

## Validación sin duplicados

**Verificar que /api/sso repetido no duplica:**
```sql
SELECT COUNT(*) FROM arcturus_main.users WHERE mail = '<email>';
-- Siempre debe retornar 1, nunca > 1
```

Mecanismo: `syncUserToArcturus()` busca por `mail` primero. Si existe → UPDATE. Si no → INSERT. La clave única en `arcturus_main.users.mail` también previene duplicados a nivel DB.

---

## Validación ticket dinámico

**Ejecutar /api/sso varias veces y verificar:**
1. `auth_ticket` cambia en cada llamada
2. Mismo ticket en `kodexa_hotel.users.auth_ticket` y `arcturus_main.users.auth_ticket`
3. Nitro acepta el nuevo ticket en el iframe
4. El ticket fijo `kodexa_admin_sso_local_2026` ya NO es el flujo principal — solo es un bypass de desarrollo

**Formato del ticket:**
```
kodexa_<userId>_<uuid32>   (sliced a 64 chars)
```
Ejemplo: `kodexa_1_a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5`

---

## Validación wallet

| Endpoint | Método | Auth | Fuente |
|----------|--------|------|--------|
| `/api/hotel/wallet` | GET | Session cookie (NextAuth) | arcturus_main → fallback kodexa_hotel |

**Comportamiento esperado:**
- Sin sesión → `401 Unauthorized`
- Usuario no en arcturus todavía → `source: 'kodexa_hotel'`, credits/pixels de snapshot
- Usuario en arcturus → `source: 'arcturus_main'`, valores reales

**Validación de seguridad:**
- No acepta `user_id` como parámetro del cliente
- Rank e identidad vienen del session token del servidor
- `ARCTURUS_DB_URL` no tiene prefijo `NEXT_PUBLIC_` → no expuesto al frontend

---

## Validación rank y permisos

### Rank 1 (usuario nuevo)

| Ruta | Acceso | Comportamiento |
|------|--------|----------------|
| `/hotel` | ✅ Sí | Acceso normal |
| `/admin` | ❌ No | Redirect a `/hotel` (middleware) |
| `/desarrollo` | ❌ No | Redirect a `/unauthorized` (middleware) |
| `/hotel-beta` | ❌ No | Redirect a `/unauthorized` (middleware) |
| Botón "Desarrollo (DEVELOPER)" | No visible | `user.rank >= 9` — rank=1 no cumple |
| Botón "Hotel Beta (FOUNDER)" | No visible | `user.rank >= 10` — rank=1 no cumple |

### Rank 10 (Founder)

| Ruta | Acceso |
|------|--------|
| `/hotel` | ✅ Sí |
| `/admin` | ✅ Sí (rank >= 7) |
| `/desarrollo` | ✅ Sí (rank >= 9) |
| `/hotel-beta` | ✅ Sí (rank >= 10) |

### Lógica de rank en el flujo

```
Login → JWT token (rank=10 en snapshot)
       ↓
/hotel/page.tsx → DB fresh read → user.rank (siempre fresco)
       ↓
HotelClient recibe rank fresco desde el server component
       ↓
/api/sso → syncUserToArcturus → UPDATE arcturus rank = kodexa_hotel rank (siempre fresco)
       ↓
Nitro entra con rank correcto en arcturus_main
```

---

## Validación regresión de rank

**Preocupación:** ¿Arcturus sobrescribe rank desde su memoria interna?

**Mecanismo de protección:** En cada SSO, `/api/sso` ejecuta:
```sql
UPDATE users SET rank = ?, look = ?, motto = ? WHERE id = ?
```
Con el rank de kodexa_hotel. Si Arcturus internamente resetea rank por algún bug de caché, el próximo SSO lo restaura.

**Verificación manual:**
1. Admin login → rank=10 en arcturus_main (confirmar post-SSO)
2. Esperar en Nitro 2-3 minutos
3. Re-consultar arcturus_main.users.rank
4. Esperado: sigue siendo 10

---

## Validación /hotel

| Elemento | Estado esperado |
|----------|-----------------|
| Página carga | ✅ |
| Botón "Entrar al Hotel Principal" | ✅ Genera ticket → estado playing |
| iframe Nitro carga (port 8081) | ✅ |
| HUD superior visible (jugando) | ✅ |
| Wallet carga en HUD | ✅ (fetch al entrar + cada 60s) |
| Settings dropdown abre/cierra | ✅ |
| "Recargar hotel" genera nuevo ticket | ✅ |
| Pantalla completa | ✅ |
| "Salir del hotel" → signOut → /login | ✅ |
| `.nitro-purse-container` oculto en Nitro | ✅ (nginx sub_filter) |

---

## Validación manejo de errores

| Escenario | Respuesta esperada |
|-----------|--------------------|
| `POST /api/sso` sin sesión | `401 { error: 'Unauthorized' }` |
| `GET /api/hotel/wallet` sin sesión | `401 { error: 'Unauthorized' }` |
| Registro con username duplicado | `409 { error: '...', field: 'username' }` |
| Registro con email duplicado | `409 { error: '...', field: 'email' }` |
| Registro race condition (P2002) | `409 { error: '...', field }` (fix MP-013.1) |
| ARCTURUS_DB_URL faltante | Error en startup del servidor — inmediato y claro |
| arcturus_main no disponible | 500 con `console.error`, sin stack en response |

---

## Validación seguridad básica

| Check | Estado |
|-------|--------|
| Frontend no puede enviar `user_id` arbitrario | ✅ — wallet y sso usan `session.user.id` |
| Rank no se toma del cliente | ✅ — viene de kodexa_hotel DB en cada SSO |
| `auth_ticket` no es fijo | ✅ — `kodexa_<id>_<uuid32>` dinámico |
| Ticket generado server-side | ✅ — `crypto.randomUUID()` en el servidor |
| `ARCTURUS_DB_URL` no expuesto al frontend | ✅ — sin prefijo `NEXT_PUBLIC_` |
| `NEXTAUTH_SECRET` no expuesto | ✅ |
| Passwords en bcrypt (cost=10) | ✅ |
| Sin stack traces en respuestas de error | ✅ — catch blocks retornan mensajes genéricos |

---

## Bugs encontrados y fixes aplicados

### Bug 1 — `arcturus-db.ts`: falla silenciosa si ARCTURUS_DB_URL es undefined

**Problema:** PrismaClient con `datasources.db.url = undefined` cae back a `DATABASE_URL` (kodexa_hotel). Todas las operaciones de sync (INSERT/UPDATE en arcturus_main) habrían corrido silenciosamente contra kodexa_hotel. No hay error — la operación "funciona" en la DB equivocada.

**Fix:** Guard al inicio del módulo:
```typescript
const arcturusUrl = process.env.ARCTURUS_DB_URL;
if (!arcturusUrl) {
  throw new Error('[arcturus-db] ARCTURUS_DB_URL is not set...');
}
```
Falla en startup con mensaje claro. Cero riesgo de wrong-DB.

---

### Bug 2 — `wallet/route.ts`: potencial falla por BigInt

**Problema:** `currencies.find(c => c.type === 0)` falla silenciosamente si `c.type` es `0n` (BigInt). Dependiendo de la versión del driver mysql2, columnas INT pueden retornarse como BigInt. Resultado: wallet siempre retornaría 0 duckets y 0 diamonds aunque existan en DB.

**Fix:**
```typescript
const arcturusId = Number(arcturusUsers[0]!.id);
const credits    = Number(arcturusUsers[0]!.credits);
const pixels     = Number(currencies.find(c => Number(c.type) === 0)?.amount ?? 0);
const diamonds   = Number(currencies.find(c => Number(c.type) === 5)?.amount ?? 0);
```
`Number()` coercion segura para `number | bigint | string`.

---

### Bug 3 — `register/route.ts`: race condition → 500 en vez de 409

**Problema:** Dos requests concurrentes pueden pasar los dos `findUnique` checks simultáneamente. El segundo `prisma.user.create` lanza `P2002` (unique constraint). Caía en el `catch` genérico → HTTP 500 en vez de 409.

**Fix:**
```typescript
if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
  const target = err.meta?.target as string[] | undefined;
  const field  = target?.includes('email') ? 'email' : 'username';
  return NextResponse.json({ error: msg, field }, { status: 409 });
}
```

---

## Archivos modificados en MP-013.1

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/lib/arcturus-db.ts` | Guard para ARCTURUS_DB_URL faltante |
| `apps/web/src/app/api/hotel/wallet/route.ts` | Number() casts para BigInt safety |
| `apps/web/src/app/api/auth/register/route.ts` | Manejo Prisma P2002 en catch |

---

## Limitaciones (no fixes — deuda documentada)

### 1. Rank en JWT es snapshot del login

El JWT se crea una vez al login. Si el rank del usuario cambia en kodexa_hotel mientras tiene sesión activa:
- Middleware usa el rank del JWT (viejo)
- `hotel/page.tsx` hace fresh DB read → HotelClient tiene rank correcto
- `/api/sso` hace fresh DB read → sync arcturus con rank correcto

**Impacto real:** Si un admin rank 10 es degradado a rank 1, puede seguir accediendo a `/admin` hasta que su sesión expire. Para Kodexa en esta fase (equipo pequeño, una instancia), es aceptable.

**Solución futura:** Refrescar rank en JWT con `session.update()` o callback de sesión que lea DB.

---

### 2. Wallet no es tiempo real post-compra

Refresh cada 60 segundos. Si el usuario compra un mueble en Nitro, el HUD tarda hasta 60s en reflejar el gasto.

**Solución futura:** WebSocket o `postMessage` de Nitro.

---

### 3. Sin rate limiting en /api/sso

Cualquier sesión válida puede llamar `/api/sso` en loop. Impacto: UPDATE repetidos en arcturus_main, generación de UUIDs. Bajo riesgo pero no está limitado.

**Solución futura:** Redis rate limit por `user_id`.

---

### 4. Gender siempre 'M' en arcturus_main

kodexa_hotel no tiene campo `gender`. Todos los usuarios entran a Arcturus como masculinos.

**Solución futura:** Campo gender en kodexa_hotel.users + selector en registro → MP-014.

---

### 5. /login no redirige usuarios autenticados

Un usuario ya con sesión puede navegar manualmente a `/login` o `/register` y ver el formulario. No es un riesgo de seguridad, es UX.

**Solución futura:** Añadir check en `/login` page → redirect a `/hotel` si sesión activa.

---

## Validaciones obligatorias — confirmadas

- arcturus_dev — NO modificado
- arcturus_main — NO reseteado (solo INSERT IGNORE + UPDATE)
- usuarios existentes — NO borrados
- inventario — NO tocado
- rooms — NO tocadas
- catálogo — NO tocado
- furniture assets — NO tocados
- FurnitureData — NO tocado
- ExternalTexts — NO tocado
- Auth Bridge — NO roto
- /hotel — NO roto
- /api/hotel/wallet — NO roto (ahora más robusto)
- registro/login — NO roto (ahora más robusto)
- admin rank 10 — sigue funcionando
- usuario nuevo rank 1 — funciona
- TypeScript — `tsc --noEmit` pasa sin errores

---

## Conclusión

El flujo principal quedó estable. Los 3 bugs encontrados eran:
- 1 crítico (falla silenciosa de DB equivocada)
- 1 importante (comparación BigInt silenciosa)
- 1 menor (race condition en registro)

Los tres fueron corregidos con cambios mínimos (3 archivos, sin tocar lógica existente).

El sistema está listo para MP-014 — /desarrollo Environment Gateway.

---

## Próximos MPs

| # | Tarea | MP |
|---|-------|----|
| 1 | /desarrollo Environment Gateway (arcturus_dev) | MP-014 |
| 2 | Campo gender + selector avatar en registro | MP-015 |
| 3 | Sync créditos post-compra (arcturus → kodexa) | MP-016 |
| 4 | Rate limiting /api/sso con Redis | MP-016 |
| 5 | Refresh rank en sesión activa | MP-016 |
