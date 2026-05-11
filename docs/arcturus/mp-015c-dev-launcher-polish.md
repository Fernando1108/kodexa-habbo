# MP-015C — Dev Launcher Polish

## Objetivo

Mejorar el lanzador `/hotel-dev` con wallet dev en tiempo real, verificación de runtime via TCP,
advertencia visual cuando Arcturus Dev WS no está activo, y documentar el estado de salas en dev.

---

## Cambios implementados

### 1. `/api/dev/wallet` — Nuevo endpoint

**Archivo:** `apps/web/src/app/api/dev/wallet/route.ts`

Retorna balances de `arcturus_dev` — NUNCA de `arcturus_main`.

```
GET /api/dev/wallet
Auth: sesión activa + rank >= 9 (leído fresco desde DB)
```

Flujo:
1. Auth guard — 401 si sin sesión
2. Rank guard — 403 si rank < 9
3. Lookup por email en `arcturus_dev.users` — NUNCA por user_id del cliente
4. Si no existe en arcturus_dev: fallback con valores de `kodexa_hotel.users` (source: `kodexa_hotel_fallback`)
5. Si existe: lee `credits` + `users_currency` (type 0 = pixels, type 5 = diamonds)

Respuesta exitosa:
```json
{
  "ok": true,
  "source": "arcturus_dev",
  "wallet": { "credits": 500, "pixels": 200, "diamonds": 0 }
}
```

Fallback (usuario no synced):
```json
{
  "ok": true,
  "source": "kodexa_hotel_fallback",
  "wallet": { "credits": 500, "pixels": 200, "diamonds": 0 }
}
```

Seguridad:
- `user_id` nunca aceptado del cliente — identidad por `session.user.id` → email
- `Number()` en todos los retornos de mysql2 (puede retornar BigInt via `$queryRawUnsafe`)
- Solo lee `ARCTURUS_DEV_DB_URL` via `arcturusDevDb` — nunca toca `prisma` de main

---

### 2. `/api/dev/status` — Mejorado con TCP check

**Archivo:** `apps/web/src/app/api/dev/status/route.ts`

Agregado `runtimeReady` — verifica que el WS de Arcturus Dev acepta conexiones TCP.

```typescript
function checkTcpPort(host: string, port: number, timeoutMs = 1000): Promise<boolean>
```

- Usa `net.createConnection` en Node.js — sin dependencias externas
- Timeout 1000ms — no bloquea el endpoint
- Solo retorna booleano — puerto nunca expuesto al cliente

Nuevo campo en respuesta:
```json
{
  "ok": true,
  "status": {
    "arcturusDevBootstrapped": true,
    "runtimeReady": true,
    "nitroDevUrlConfigured": true,
    "devDbUrlConfigured": true,
    "websocketUrl": "ws://localhost:2097",
    "ready": true
  }
}
```

`runtimeReady`: `false` cuando Arcturus Dev está apagado aunque DB esté lista.
`websocketUrl`: incluida para diagnóstico UI — es la única URL expuesta.

---

### 3. `HotelDevClient.tsx` — Reescritura MP-015C

**Archivo:** `apps/web/src/components/HotelDevClient.tsx`

#### Nuevos estados
```typescript
interface DevWallet { credits: number; pixels: number; diamonds: number; }

const [devWallet, setDevWallet]       = useState<DevWallet | null>(null);
const [walletErr, setWalletErr]       = useState(false);
const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
// null = no chequeado, true = WS up, false = WS down
```

#### Timer de 60s
```typescript
const walletTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// Activo solo en estado 'playing', limpiado en cualquier otro estado
```

#### `fetchDevWallet()`
- Llama `/api/dev/wallet`
- Actualiza `devWallet` o activa `walletErr`

#### `checkDevStatus()`
- Llama `/api/dev/status`
- Actualiza `runtimeReady` (boolean)

#### Boot sequence modificado
- `runBoot()` limpia `runtimeReady`, `devWallet`, `walletErr` al inicio
- En phase 1 (`ph === 1`): llama `checkDevStatus()` durante "Comprobando estado de Arcturus Dev"

#### useEffects nuevos
```typescript
// Fetch wallet al entrar a 'ready' o 'playing'
useEffect(() => {
  if (state === 'ready' || state === 'playing') void fetchDevWallet();
}, [state, fetchDevWallet]);

// Refresh wallet cada 60s en 'playing'
useEffect(() => {
  if (state === 'playing') {
    walletTimerRef.current = setInterval(() => void fetchDevWallet(), 60_000);
  } else {
    if (walletTimerRef.current) { clearInterval(walletTimerRef.current); walletTimerRef.current = null; }
  }
  return () => { if (walletTimerRef.current) clearInterval(walletTimerRef.current); };
}, [state, fetchDevWallet]);
```

#### `WalletBadge()` — helper component
- Error: pill rojo `wallet?` (visible en lg+)
- Cargando: nada
- OK: pill ámbar `Nc` (créditos) + pill verde `Nd` (duckets) (visible en lg+)

#### Estado `ready`
- **Runtime warning**: banner rojo si `runtimeReady === false` con instrucción para iniciar `start-dev.bat`
- **Wallet preview**: cards pequeñas con créditos dev, duckets dev (y diamantes si > 0)

#### Estado `playing` — topbar
```
[D] Kodexa.Dev  [DEV ONLY]  [arcturus_dev]  [ws:2097]  [Nc] [Nd]  ⚙ ⛶ ⏻
```
- `WalletBadge` añadido después de `ws:2097`
- Settings dropdown incluye "Actualizar wallet dev" button

---

## Separación main/dev — Validación

| Endpoint | Lee de | NUNCA lee de |
|----------|--------|-------------|
| `/api/hotel/wallet` | `arcturus_main` + `kodexa_hotel` | `arcturus_dev` |
| `/api/dev/wallet` | `arcturus_dev` + `kodexa_hotel` (fallback) | `arcturus_main` |
| `/api/sso` | `kodexa_hotel` → escribe `arcturus_main.users.auth_ticket` | `arcturus_dev` |
| `/api/dev/sso` | `kodexa_hotel` → escribe `arcturus_dev.users.auth_ticket` | `arcturus_main` |

---

## Salas en arcturus_dev

Estado confirmado post-bootstrap:

| ID | Nombre | Modelo | Max usuarios |
|----|--------|--------|-------------|
| 1 | Pasillo Principal | model_a | 25 |
| 2 | Sala Clásica | model_b | 25 |
| 3 | Sala Grande | model_c | 50 |
| 4 | Salón VIP | model_d | 25 |
| 5 | Cuarto Pequeño | model_e | 10 |
| 6 | Suite | model_f | 20 |
| 7 | Teatro | model_g | 75 |

Las salas vienen del seed base de Arcturus. Son accesibles desde el Navigator de Nitro Dev.

`ARCTURUS_DEFAULT_HOME_ROOM = 0` → usuario entra a Hotel View (lobby) sin sala asignada.
Comportamiento esperado: Nitro muestra Hotel View. Usuario navega al Navigator y elige/crea sala.

---

## Validaciones de permisos

| Escenario | Resultado |
|----------|-----------|
| Sin sesión → `/api/dev/wallet` | 401 Unauthorized |
| rank < 9 → `/api/dev/wallet` | 403 Forbidden — rank 9+ required |
| rank >= 9, synced → `/api/dev/wallet` | 200 + wallet arcturus_dev |
| rank >= 9, no synced → `/api/dev/wallet` | 200 + wallet kodexa_hotel (fallback) |
| Sin sesión → `/api/dev/status` | 401 Unauthorized |
| rank < 9 → `/api/dev/status` | 403 Forbidden |
| rank >= 9, WS up → `/api/dev/status` | 200, runtimeReady: true |
| rank >= 9, WS down → `/api/dev/status` | 200, runtimeReady: false |

---

## Validaciones obligatorias

| Validación | Estado |
|-----------|--------|
| TypeScript `tsc --noEmit` pasa | ✅ |
| `/api/dev/wallet` no toca arcturus_main | ✅ — usa `arcturusDevDb` exclusivamente |
| `/api/hotel/wallet` no modificado | ✅ — sin cambios |
| `/api/dev/sso` no modificado | ✅ — sin cambios |
| Wallet timer limpiado al salir de playing | ✅ — `clearInterval` en cleanup |
| `runtimeReady` null al reiniciar boot | ✅ — `setRuntimeReady(null)` en `runBoot()` |
| rank < 9 → 403 en `/api/dev/wallet` | ✅ — `canAccessDevelopment(user.rank)` |
| user_id no aceptado del cliente | ✅ — identidad solo por sesión + email |
| arcturus_main sin cambios | ✅ |
| /hotel principal funcional | ✅ — sin cambios de código |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/api/dev/wallet/route.ts` | Creado — endpoint GET /api/dev/wallet |
| `apps/web/src/app/api/dev/status/route.ts` | Reescrito — +TCP check, +runtimeReady |
| `apps/web/src/components/HotelDevClient.tsx` | Reescrito — +wallet, +runtimeReady, +WalletBadge, +runtime warning |

---

## Limitaciones

1. **Wallet muestra kodexa_hotel como fallback** hasta primer login en /hotel-dev. Correcto — arcturus_dev no tiene el usuario hasta el SSO inicial.
2. **TCP check bloqueante** en `/api/dev/status` — 1s timeout. Aceptable para diagnóstico.
3. **60s refresh en playing** no resetea el timer si wallet falla — simplemente marca `walletErr`. Timer sigue activo para el próximo intento.
4. **Diamonds**: `users_currency` type 5 — solo se muestra en UI si > 0.

---

## Próximo MP recomendado

**MP-017 — Feature principal de hotel**:
- El puente dev está completo y polish terminado.
- Continuar con roadmap principal: marketplace, catalog visual, rankings, perfiles públicos.
