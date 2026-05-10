# Control de Acceso — Roles y Entornos

**Documento de referencia para:** Middleware, UI guards, WebSocket auth, API routes  
**Actualizado:** MP-006 — arquitectura de 3 entornos

---

## Sistema de Roles

Kodexa Hotel usa un sistema de **ranks numéricos** (heredado de Arcturus). Las capas de acceso son:

| Rank | Nombre lógico | Acceso |
|------|--------------|--------|
| 1–3 | USER | `/hotel` únicamente |
| 4–6 | STAFF | `/hotel` + `/admin` |
| 7–8 | ADMIN | `/hotel` + `/admin` |
| 9 | DEVELOPER | `/hotel` + `/desarrollo` + `/admin` |
| 10+ | FOUNDER | `/hotel` + `/desarrollo` + `/hotel-beta` + `/admin` |

**Constantes en código:**
```typescript
// apps/web/src/middleware.ts
export function isStaff(rank: number)              { return rank >= 4; }
export function isAdmin(rank: number)              { return rank >= 7; }
export function isDeveloper(rank: number)          { return rank >= 9; }
export function isFounder(rank: number)            { return rank >= 10; }
export function canAccessDevelopment(rank: number) { return rank >= 9; }
```

---

## Rutas protegidas

| Ruta | Requiere | Guard |
|------|----------|-------|
| `/hotel` | Login | Middleware NextAuth |
| `/desarrollo` | Login + rank ≥ 9 | Middleware `canAccessDevelopment()` |
| `/hotel-beta` | Login + rank ≥ 10 | Middleware `isFounder()` |
| `/admin` | Login + rank ≥ 7 | Middleware `isAdmin()` |
| `/unauthorized` | — | Pública (página de error) |

---

## Visibilidad en UI

**Usuario normal (rank 1-3):**
- Ve botón "Entrar al Hotel" → `/hotel`
- NO ve botón Desarrollo
- NO ve botón de Hotel Beta
- NO ve enlace a `/admin`

**Staff (rank 4-6):**
- Ve botón "Entrar al Hotel" → `/hotel`
- Ve enlace a `/admin`
- NO ve botón Desarrollo
- NO ve botón de Hotel Beta (salvo rank ≥ 9 o ≥ 10)

**Admin (rank 7-8):**
- Ve botón "Entrar al Hotel" → `/hotel`
- Ve enlace a `/admin`
- NO ve botón Desarrollo
- NO ve botón de Hotel Beta

**Developer (rank 9):**
- Ve botón "Entrar al Hotel" → `/hotel`
- Ve botón "Desarrollo" → `/desarrollo`
- Ve enlace a `/admin`
- NO ve botón de Hotel Beta

**Founder (rank ≥ 10):**
- Ve botón "Entrar al Hotel Principal" → `/hotel`
- Ve botón "Desarrollo" → `/desarrollo`
- Ve botón "Hotel Beta" → `/hotel-beta`
- Ve enlace a `/admin`

---

## Protección en capas

La protección del Hotel Beta debe existir en **tres capas**:

### Capa 1: UI (ocultamiento)
- El botón de Hotel Beta solo se renderiza si `session.user.rank >= 10` Y `NEXT_PUBLIC_ENABLE_BETA_HOTEL === 'true'`.
- No basta con ocultar el botón — las capas 2 y 3 son obligatorias.

### Capa 2: Middleware / Ruta
- `/hotel-beta` en el middleware valida `isFounder(rank)`.
- Si no autorizado → redirect a `/unauthorized`.
- Configurado en `apps/web/src/middleware.ts`.

### Capa 3: WebSocket Beta — IMPLEMENTADA + HARDENED (MP-002, MP-003)
- El emulador custom en modo beta (`BETA_MODE=true`) valida rank en `SSOTicketHandler`.
- Si `user.rank < BETA_FOUNDER_RANK (10)`:
  - **Consume el ticket** (`authTicket = ''`) — no reutilizable contra WS principal (puerto 2096).
  - Escribe en `kx_activity_log` con `action='BETA_RANK_DENIED'`.
  - Envía `AUTH_FAILED` con mensaje "Access denied: FOUNDER rank required for Hotel Beta".
  - Cierra la conexión.
  - Registra en logs: `BETA AUTH DENIED: userId=X username=Y rank=Z`.

### Capa 4: Sanitización + Whitelist de URL WebSocket — IMPLEMENTADA (MP-003, MP-004)
- `sanitizeWsUrl()` en `renderer.config.ts` valida el `?ws=` query param.
- Solo acepta `ws://` y `wss://` — rechaza `http://`, `javascript:`, `file:`, etc.
- **Nuevo (MP-004):** Además valida que `host:port` esté en `VITE_ALLOWED_WS_HOSTS`.
  - Por defecto permite solo `localhost:2096`, `localhost:2097`, `127.0.0.1:2096`, `127.0.0.1:2097`.
  - `?ws=ws://evil.com:2097` → rechazado aunque protocolo sea válido.
  - En producción: configurar `VITE_ALLOWED_WS_HOSTS` con dominios oficiales.
- Si la URL es inválida o no está en whitelist, cae al `VITE_SOCKET_URL` por defecto.

### Capa 5: Rate limiting por IP en WebSocket — IMPLEMENTADA (MP-004)
- `WebSocketServer.ts` rechaza conexiones de IPs que superan el límite antes de crear sesión.
- Default: 20 conexiones / 60s por IP.
- Beta default: 10 conexiones / 60s por IP (configurado en `.env.beta`).
- IP obtenida de `X-Forwarded-For` (proxy) o `socket.remoteAddress` (directo).

### Capa 6: Rate limiting SSO beta por userId — IMPLEMENTADA (MP-004)
- `SSOTicketHandler.ts` registra intentos fallidos por userId en Map in-memory.
- Default beta: 5 intentos / 60s. Si excede: `action='BETA_RANK_DENIED_RATE_LIMITED'` en audit log.
- El ticket se consume SIEMPRE aunque esté rate limitado.

**Estado capas 3-6:** ✅ IMPLEMENTADAS — ticket siempre se invalida, URL siempre se valida + whitelist, rate limiting por IP y userId.

---

## Casos de acceso no autorizado

| Escenario | Comportamiento |
|-----------|---------------|
| No autenticado → `/hotel` | Redirect a `/login?callbackUrl=/hotel` |
| No autenticado → `/hotel-beta` | Redirect a `/login` |
| Rank < 10 → `/hotel-beta` | Redirect a `/unauthorized` |
| Rank < 7 → `/admin` | Redirect a `/hotel` |
| WebSocket beta sin rank ≥ 10 | Desconexión + log (PENDIENTE) |

---

## Variable de control

```env
NEXT_PUBLIC_ENABLE_BETA_HOTEL=true   # false = oculta beta para todos, incluso FOUNDERs
BETA_ALLOWED_RANK=10                  # rank mínimo para acceso beta
```

Cuando `NEXT_PUBLIC_ENABLE_BETA_HOTEL=false`:
- El botón de Beta desaparece de la UI para todos.
- La ruta `/hotel-beta` redirige a `/unauthorized`.
- Útil para mantenimiento del emulador custom.
