# MP-012.2 — HUD Superior Funcional: Monedas Reales + Configuración + Assets Oficiales

## Problema inicial

Estado post-MP-012.1:
- Monedas en header externo mostraban valores de snapshot del login (kodexa_hotel, no arcturus_main)
- Iconos de monedas eran SVGs/lucide genéricos, no assets reales del hotel
- Diamantes: valor estático `0`
- Botón ⚙️: no funcional (`onClick={() => undefined}`)

---

## Assets encontrados

### Wallet directory (Nitro purse assets oficiales)

| Asset | Ruta original | Descripción |
|-------|---------------|-------------|
| `-1.png` | `assets/nitro/images/wallet/-1.png` | Créditos (Habbo Credits) 15×15px |
| `0.png` | `assets/nitro/images/wallet/0.png` | Duckets 15×15px |
| `5.png` | `assets/nitro/images/wallet/5.png` | Diamantes 20×20px |

Mismo contenido en `external/arcturus/objectretros/nitro/nitro-assets/images/wallet/`.

Estos son los mismos assets que usa el cliente Nitro internamente en `.nitro-purse-container` (antes de ocultarlo en MP-012.1).

### Assets descartados

- `flash/c_images/catalogue/credits.gif`, `DiamondsExchange.gif`, `DucketsExchange.gif` — imágenes de catálogo grandes, no aptas para HUD compacto
- SVGs/lucide: `Coins`, `Diamond`, `Gem` — eliminados del playing state

---

## Assets copiados a public

| Destino | Origen | Dimensiones |
|---------|--------|-------------|
| `apps/web/public/hotel/currency/credits.png` | `assets/nitro/images/wallet/-1.png` | 15×15 |
| `apps/web/public/hotel/currency/duckets.png` | `assets/nitro/images/wallet/0.png` | 15×15 |
| `apps/web/public/hotel/currency/diamonds.png` | `assets/nitro/images/wallet/5.png` | 20×20 |

Servidos desde Next.js en `/hotel/currency/*.png` — sin CORS, sin dependencia de kodexa-assets.

---

## Fuente real de monedas

| Moneda | Fuente | Campo/Tabla |
|--------|--------|-------------|
| Créditos | `arcturus_main.users.credits` | Campo directo en users |
| Duckets/Pixels | `arcturus_main.users_currency` | `WHERE type=0 AND user_id=?` |
| Diamantes | `arcturus_main.users_currency` | `WHERE type=5 AND user_id=?` |

Decisión: leer desde **arcturus_main** porque Arcturus modifica créditos en tiempo real al comprar furnis. kodexa_hotel no refleja compras in-game.

Fallback: si usuario no existe en arcturus_main todavía, retorna snapshot de `kodexa_hotel.users.credits` / `pixels`.

---

## Endpoint creado

```
GET /api/hotel/wallet
Auth: NextAuth session cookie (requerida)
```

Respuesta normal:
```json
{
  "ok": true,
  "source": "arcturus_main",
  "wallet": {
    "credits": 99996,
    "pixels": 25,
    "diamonds": 0
  }
}
```

Respuesta fallback (usuario no en arcturus todavía):
```json
{
  "ok": true,
  "source": "kodexa_hotel",
  "wallet": { "credits": 99999, "pixels": 50000, "diamonds": 0 }
}
```

Implementación:
- Sesión → email desde `kodexa_hotel.users`
- Match en `arcturus_main.users` WHERE `mail = email`
- Query `users_currency` WHERE `type IN (0, 5)`
- No acepta user_id desde frontend
- No modifica DB

---

## Wallet en el cliente

Carga inicial: al entrar al estado `playing` → `fetchWallet()` inmediato.
Actualización: `setInterval(fetchWallet, 60_000)` — refresca cada 60 segundos.
Fallback: si `fetchWallet` falla, mantiene último valor conocido (no muestra error visible).
Cleanup: `clearInterval` al salir del estado `playing`.

Estado inicial del wallet: snapshot de kodexa_hotel (props del server component) para evitar pantalla vacía mientras carga.

---

## Botón ⚙️ — Configuración funcional

Implementado como **dropdown externo** (Opción A — sin dependencia de Nitro cross-origin).

Contenido del dropdown:
| Opción | Función |
|--------|---------|
| Estado: Conectado | Visual informativo |
| Recargar hotel | Genera nuevo SSO ticket + recarga iframe (no recarga la página) |
| Pantalla completa | `document.documentElement.requestFullscreen()` |
| Salir del hotel | `signOut({ callbackUrl: '/login' })` |

Comportamiento:
- Click fuera del dropdown: cierra automáticamente (`mousedown` listener)
- Abre/cierra toggle con cada click en ⚙️
- Activo: icono cambia a color `#00D4AA` con background sutil

"Recargar hotel" genera un nuevo SSO ticket via `POST /api/sso`, reemplaza `iframe.src` en `about:blank` y vuelve a inyectarla con el nuevo ticket. Auth Bridge se mantiene activo.

---

## Botones de control

| Control | Estado | Función |
|---------|--------|---------|
| ↗ Pantalla completa | Funcional | `document.documentElement.requestFullscreen()` |
| Salir | Funcional | `signOut({ callbackUrl: '/login' })` |
| ⚙️ Configuración | Funcional | Dropdown externo |

---

## HUD interno Nitro — preservado de MP-012.1

`.nitro-purse-container { display: none !important }` sigue activo via nginx sub_filter.
No se hicieron cambios al ocultamiento.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/components/HotelClient.tsx` | Wallet state + fetchWallet + settings dropdown + imágenes reales |
| `apps/web/src/app/api/hotel/wallet/route.ts` | Nuevo endpoint GET /api/hotel/wallet |
| `apps/web/public/hotel/currency/credits.png` | Asset copiado desde assets/nitro/images/wallet/-1.png |
| `apps/web/public/hotel/currency/duckets.png` | Asset copiado desde assets/nitro/images/wallet/0.png |
| `apps/web/public/hotel/currency/diamonds.png` | Asset copiado desde assets/nitro/images/wallet/5.png |

---

## Validación funcional de moneda

```bash
# Créditos actuales en arcturus_main
docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT credits FROM users WHERE mail='diegomorales11082000@gmail.com';"

# Duckets y diamantes
docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT type, amount FROM users_currency WHERE user_id=3;"
```

DB confirmada pre-MP:
- credits: 99,996
- duckets (type 0): 25
- diamonds (type 5): no row → 0

---

## Limitaciones

1. **Wallet no tiempo real por compra**: refresh cada 60s. Después de comprar en Nitro, el header tarda hasta 60s en reflejar el cambio. Deuda: WebSocket o evento postMessage futuro.

2. **Settings no conecta a Nitro interno**: el dropdown externo de Kodexa reemplaza la funcionalidad de settings internos de Nitro (que están ocultos junto al purse). Todas las acciones básicas están cubiertas.

3. **"Recargar hotel"**: genera nuevo ticket SSO y recarga el iframe — el usuario vuelve a ver el loading de Nitro brevemente. Funcional y correcto.

---

## Validaciones obligatorias — confirmadas

- arcturus_dev — NO modificado
- arcturus_main — NO reseteado, solo lectura
- usuarios — NO borrados
- inventario — NO tocado
- rooms — NO tocadas
- catálogo — NO tocado
- furniture assets — NO tocados
- FurnitureData — NO tocado
- ExternalTexts — NO tocado
- SSO / Auth Bridge — NO roto (reloadHotel llama a /api/sso igual que launchGame)
- Nitro sigue cargando — confirmado
- external/ — NO subido a Git (solo se copiaron 3 archivos puntuales a public/)
- Bundle minificado Nitro — NO editado
- TypeScript — pasa sin errores (`tsc --noEmit`)

---

## Pendientes para MPs futuros

| # | Tarea | MP |
|---|-------|----|
| 1 | Wallet en tiempo real post-compra (WebSocket o postMessage) | MP-012.3 |
| 2 | Hover effects en menuItemStyle (CSS hover state) | MP-013 |
| 3 | Rediseño visual completo HUD (Classic Premium Retro) | MP-013 |
| 4 | Sonido al abrir settings dropdown | MP-013 |
