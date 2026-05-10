# Beta Emulator Runtime — Kodexa Custom Emulator

**Motor:** TypeScript / Node.js (`apps/emulator`)  
**Puerto:** 2097 (beta) / 2096 (principal)  
**Acceso:** Solo FOUNDER (rank ≥ 10)

---

## Cómo correr el emulador beta

### Opción 1 — Script npm (recomendado)

```bash
cd apps/emulator
pnpm dev:beta
# Equivale a: BETA_MODE=true PORT=2097 tsx watch src/index.ts
```

Salida esperada:
```
[INFO] ⚗  Kodexa Custom Emulator — BETA MODE
[INFO] 🔒 Founder-only access enforced (rank >= 10)
[INFO] 🔌 Starting WebSocket on 0.0.0.0:2097
[INFO] 🔌 WebSocket listening on 0.0.0.0:2097
```

### Opción 2 — Windows cmd.exe (sin bash)

```cmd
node scripts/dev-beta.mjs
```

Equivalente al script `dev:beta:win`. No requiere `cross-env`.

### Opción 3 — Variables de entorno manuales (bash)

```bash
BETA_MODE=true PORT=2097 tsx watch apps/emulator/src/index.ts
```

### Opción 3 — Usando .env.beta (futuro)

Cuando se configure soporte de `--env-file` en el stack:
```bash
node --env-file=apps/emulator/.env.beta --import tsx/esm apps/emulator/src/index.ts
```

---

## Corriendo ambos emuladores simultáneamente

Para tener Hotel Principal (2096) y Hotel Beta (2097) al mismo tiempo:

**Terminal 1 — Hotel Principal:**
```bash
cd apps/emulator && pnpm dev
# WebSocket en :2096, BETA_MODE=false
```

**Terminal 2 — Hotel Beta:**
```bash
cd apps/emulator && pnpm dev:beta
# WebSocket en :2097, BETA_MODE=true
```

Comparten la misma base de datos (mismo DATABASE_URL). La separación es solo por puerto y modo.

---

## Variables de entorno del emulador

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | — | Puerto principal (override sobre EMULATOR_WS_PORT) |
| `EMULATOR_WS_PORT` | `2096` | Puerto fallback |
| `EMULATOR_HOST` | `0.0.0.0` | Host de escucha |
| `BETA_MODE` | `false` | Activa validación founder + logs beta |
| `BETA_FOUNDER_RANK` | `10` | Rank mínimo para beta |
| `WS_CONNECTION_RATE_LIMIT_MAX` | `20` | Máx conexiones por IP por ventana |
| `WS_CONNECTION_RATE_LIMIT_WINDOW_MS` | `60000` | Ventana de rate limit de conexión (ms) |
| `BETA_SSO_DENY_LIMIT_MAX` | `5` | Máx intentos beta fallidos por userId por ventana |
| `BETA_SSO_DENY_LIMIT_WINDOW_MS` | `60000` | Ventana de rate limit SSO beta (ms) |
| `WS_RATE_LIMIT_CLEANUP_INTERVAL_MS` | `300000` | Intervalo de cleanup periódico de Maps de rate limit (ms) |
| `HEALTH_PORT` | `3096` / `3097` | Puerto del HTTP health endpoint |
| `DATABASE_URL` | — | MySQL/MariaDB connection string |

## Variables de entorno del cliente (Vite)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_SOCKET_URL` | `ws://localhost:2096` | WS hotel principal |
| `VITE_BETA_SOCKET_URL` | `ws://localhost:2097` | WS hotel beta |
| `VITE_ALLOWED_WS_HOSTS` | `localhost:2096,localhost:2097,...` | Whitelist de host:port para `?ws=` param |

---

## Validación de acceso FOUNDER en WebSocket

Implementado en `SSOTicketHandler.ts` (MP-002, MP-003, MP-004, MP-005):

```
Cliente → SSO Ticket
Emulador → IP rate limit check (WebSocketServer, pre-sesión)
         → busca usuario en DB por authTicket
         → si BETA_MODE=true y user.rank < BETA_FOUNDER_RANK:
              → userId rate limit check → si excede: action='BETA_RANK_DENIED_RATE_LIMITED'
              → CONSUME el ticket (authTicket = '') — no reutilizable contra WS principal
              → escribe en kx_activity_log: action=BETA_RANK_DENIED[_RATE_LIMITED] ip=X
              → log: "BETA_RANK_DENIED: userId=X username=Y rank=Z ip=W"
              → envía AUTH_FAILED al cliente
              → cierra conexión
         → si rank >= BETA_FOUNDER_RANK:
              → borra ticket (one-time use)
              → marca online=true
              → envía AUTH_OK
```

**Ticket lifecycle post MP-003:** El ticket se invalida en AMBOS casos (acceso autorizado y denegado). Un ticket rechazado por rank NO puede reutilizarse contra el WebSocket principal.

---

## Validación de ?ws= en el cliente

Implementado en `renderer.config.ts` (`sanitizeWsUrl()`):

- Solo acepta protocolos `ws://` y `wss://`.
- Rechaza: `http://`, `https://`, `javascript:`, `file:`, `data:`, cadenas vacías, URLs inválidas.
- Si el param es inválido: cae al `VITE_SOCKET_URL` por defecto (o `ws://localhost:2096`).
- El URL completo no se loguea para evitar flood con payloads maliciosos.

```typescript
// En App.tsx — el ?ws= se sanitiza ANTES de pasar a connect()
const wsUrl = sanitizeWsUrl(params.get('ws'));
useConnectionStore.getState().connect(ticket, wsUrl);
```

---

## Flujo completo de acceso beta (post MP-003)

1. Usuario con rank ≥ 10 entra a `/hotel-beta` (middleware valida rango)
2. `HotelBetaClient.tsx` llama a `/api/sso` → genera SSO ticket
3. Iframe se lanza con: `?sso=<ticket>&ws=ws://localhost:2097`
4. `App.tsx` lee `?ws=` → pasa por `sanitizeWsUrl()` → solo acepta `ws://` / `wss://`
5. `useConnectionStore.connect(ticket, "ws://localhost:2097")` usa la URL sanitizada
6. `WebSocketClient` abre conexión a `ws://localhost:2097`
7. `SSOTicketHandler` en emulador beta: valida ticket → valida rank → consume ticket
8. Si rank ≥ 10: AUTH_OK → usuario entra
9. Si rank < 10: consume ticket → audit log → AUTH_FAILED → conexión cerrada

---

## Audit log (kx_activity_log)

Cuando beta rechaza por rank, se escribe en `kx_activity_log`:

| Campo | Valor |
|-------|-------|
| `userId` | ID del usuario que intentó conectar |
| `action` | `'BETA_RANK_DENIED'` |
| `details` | `"rank=X required>=10"` |
| `createdAt` | timestamp automático |

El write es fire-and-forget (no bloquea la respuesta al cliente). Si falla, se loga el error pero no interrumpe el flujo.

---

## Health Endpoint (MP-005)

`GET http://localhost:3096/health` (main) / `http://localhost:3097/health` (beta)

Respuesta JSON:

```json
{
  "status": "ok",
  "service": "kodexa-emulator-beta",
  "mode": "beta",
  "uptimeSec": 3600,
  "wsPort": 2097,
  "onlineCount": 5,
  "timestamp": "2026-05-10T00:00:00.000Z",
  "rateLimit": {
    "connectionTrackedIps": 12,
    "betaTrackedUsers": 1
  }
}
```

Puerto configurable via `HEALTH_PORT`. Default: `3096` (main) o `3097` (beta, inferido de `BETA_MODE`).

---

## Cleanup de Maps de rate limit (MP-005)

`connectionRateMap` (IPs) y `betaDenyMap` (userIds) son Maps in-memory con arrays de timestamps.
Sin cleanup, un hotel con muchas IPs únicas acumularía entradas indefinidamente.

**Solución:** `WebSocketServer.startRateLimitCleanup()` corre cada `WS_RATE_LIMIT_CLEANUP_INTERVAL_MS` (default 5 min):
- Filtra timestamps viejos de `connectionRateMap`, elimina entradas vacías.
- Llama `purgeStaleBetaDenyEntries()` exportado de `SSOTicketHandler.ts`.
- Loguea cuántas entradas activas quedan en DEBUG.

El timer se cancela en `stop()` junto al heartbeat timer.

---

## Qué queda pendiente

- [ ] Soporte `--env-file` nativo para cargar `.env.beta` sin scripts de shell.
