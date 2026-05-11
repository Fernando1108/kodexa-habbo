# MP-012.1 — Unificación HUD Superior /hotel

## Problema inicial

Al entrar al hotel tras MP-011 (Auth Bridge), el usuario veía monedas duplicadas:
- **Barra externa Kodexa**: chips de créditos + pixels, botones fullscreen/salir
- **Cliente Nitro interno**: `.nitro-purse-container` con créditos/duckets/diamantes en la esquina superior derecha

Además, la barra externa mostraba texto innecesario ("Kodexa.Hotel", "/sala/lobby") que consumía espacio.

---

## Decisión visual

La barra externa de Kodexa es la fuente visual principal. El HUD interno de Nitro se oculta completamente. El usuario ve sus monedas una sola vez, en la barra externa, con layout horizontal limpio.

```
[K]                        99.999 🪙   20 💜   0 💎   ⚙️   ↗   Salir
```

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/components/HotelClient.tsx` | Topbar playing state: eliminado texto, añadidos diamantes + settings |
| `external/arcturus/nitro-docker/nitro/nginx.conf` | `sub_filter` inyecta CSS que oculta `.nitro-purse-container` |

---

## Estructura final del header (playing state)

### Antes
```tsx
<div className="topbar-game">
  <div className="logo-k">K</div>
  <span>Kodexa.Hotel</span>          // ELIMINADO
  <span>/sala/lobby</span>           // ELIMINADO
  <div className="ml-auto">
    <span>créditos</span>
    <span>pixels</span>
    <button fullscreen />
    <button salir />
  </div>
</div>
```

### Después
```tsx
<div className="topbar-game">
  <div className="logo-k">K</div>   // solo logo
  <div className="ml-auto">
    <span title="Créditos">🪙 99.999</span>
    <span title="Duckets">💜 20</span>
    <span title="Diamantes">💎 0</span>    // nuevo (valor estático)
    <button title="Configuración" />        // nuevo (placeholder)
    <button fullscreen />
    <button salir />
  </div>
</div>
```

---

## Eliminado del header externo

| Elemento | Razón |
|----------|-------|
| Texto "Kodexa.Hotel" | Ocupa espacio innecesario en modo juego |
| Ruta "/sala/lobby" | No refleja la sala real del usuario; cosmético sin función |

---

## Fuente actual de monedas

| Moneda | Fuente | Campo |
|--------|--------|-------|
| Créditos | `kodexa_hotel.users.credits` | Session prop desde `/hotel/page.tsx` |
| Duckets/Pixels | `kodexa_hotel.users.pixels` | Session prop desde `/hotel/page.tsx` |
| Diamantes | Estático `0` | **Deuda MP futuro** — requiere sync desde `arcturus_main.users_currency` tipo 5 |

Los valores vienen del server component `HotelPage` que lee de kodexa_hotel. NO vienen de arcturus_main. Los créditos en la barra externa reflejan el snapshot al momento de entrar al hotel, NO se actualizan en tiempo real durante la sesión de juego.

**Deuda técnica**: para monedas en tiempo real se necesita un WebSocket o polling al API. Fuera del alcance de este MP.

---

## HUD interno duplicado de Nitro — dónde estaba

Componente React `PurseView` del cliente Nitro, renderizado con la clase CSS `.nitro-purse-container` (confirmado en `assets/index-172d3486.css`):
```css
.nitro-purse-container { font-size: .7875rem; pointer-events: all }
.nitro-purse-container .nitro-purse { background-color: #1c1c20f2; ... }
```

Posición: esquina superior derecha del viewport del cliente Nitro, z-index alto, fijo sobre el canvas del juego.

---

## Cómo se ocultó el HUD interno

**Método**: `nginx sub_filter` en el servidor de Nitro.

El iframe del cliente Nitro es **cross-origin** (puerto 8081 vs CMS en 3000) → no es posible inyectar CSS desde el padre con JavaScript.

Solución limpia: `sub_filter` de nginx intercepta la respuesta de `index.html` y agrega un bloque `<style>` inline antes de `</head>`:

```nginx
# en external/arcturus/nitro-docker/nginx.conf
sub_filter '</head>' '<style>.nitro-purse-container{display:none!important}</style></head>';
sub_filter_once on;
```

El `index.html` resultante que recibe el browser:
```html
<head>
  ...
  <style>.nitro-purse-container{display:none!important}</style>
</head>
```

Verificado con `curl http://localhost:8081/ | grep nitro-purse` → confirmado inyectado.

### Qué se oculta
- `.nitro-purse-container` — bloque completo de monedas internas de Nitro

### Qué NO se oculta (confirmado)
- `.nitro-toolbar` — toolbar inferior con navegador, inventario, catálogo, chat
- Chat, inventario, catálogo, mod tools, salas — no afectados

---

## Configuración externa — estado

| Control | Estado | Notas |
|---------|--------|-------|
| Créditos en header | Funcional | Valor de kodexa_hotel, snapshot al login |
| Duckets/Pixels en header | Funcional | Valor de kodexa_hotel, snapshot al login |
| Diamantes en header | Placeholder estático 0 | Requiere MP futuro para sync con arcturus_main.users_currency |
| Settings (⚙️) en header | Icono preparado, NO funcional | Cross-origin impide llamar al settings de Nitro directamente. Pendiente MP visual |
| Fullscreen | Funcional | `document.documentElement.requestFullscreen()` |
| Salir | Funcional | `signOut({ callbackUrl: '/login' })` |

---

## Validaciones realizadas

| Check | Estado |
|-------|--------|
| nginx config test sin errores | OK — `nginx -t` limpio |
| nginx reload exitoso | OK |
| sub_filter inyecta CSS en index.html | OK — verificado con curl |
| `.nitro-purse-container` oculto en HTML servido | OK |
| Nitro toolbar inferior sin cambios | OK — solo se oculta el purse |
| Auth Bridge POST /api/sso | NO TOCADO |
| Ticket dinámico generado | NO TOCADO |
| iframe URL con ticket | NO TOCADO |
| HotelClient.tsx compila | OK — solo cambios en JSX del topbar |

---

## Limitaciones

1. **Diamantes siempre 0**: no hay campo `diamonds` en `kodexa_hotel.users`. Requiere query a `arcturus_main.users_currency WHERE type=5` en el endpoint de sesión o un nuevo campo en kodexa_hotel.

2. **Settings no funcional**: el botón ⚙️ existe visualmente pero no abre nada. Para conectarlo a Nitro se necesita `postMessage` cross-origin, lo cual requiere que el cliente Nitro implemente un listener (fuera de alcance ahora).

3. **Créditos no en tiempo real**: el header muestra el snapshot al momento de entrar al hotel. Si el usuario compra algo dentro de Nitro, los créditos en la barra externa no se actualizan hasta el próximo reload.

4. **Inyección CSS ephemeral por soft restart**: si el container Nitro se reinicia (`docker restart kodexa-nitro-renderer`), el nginx.conf está volume-mounted y se aplica automáticamente — el sub_filter persiste. No hay riesgo de pérdida.

---

## Pendientes para MP futuro

| # | Tarea | MP |
|---|-------|----|
| 1 | Diamantes en tiempo real (arcturus_main.users_currency tipo 5) | MP-012.2 |
| 2 | Settings funcional via postMessage cross-origin | MP-012.3 |
| 3 | Créditos en tiempo real (WebSocket o polling /api/me) | MP-012.4 |
| 4 | Rediseño visual completo header juego (Classic Premium Retro) | MP-013 |

---

## Validaciones obligatorias — confirmadas

- arcturus_dev — NO modificado
- arcturus_main — NO reseteado
- usuarios — NO borrados
- inventario — NO tocado
- rooms — NO tocadas
- catálogo — NO tocado
- furniture assets — NO tocados
- FurnitureData — NO tocado
- ExternalTexts — NO tocado
- SSO / Auth Bridge — NO roto
- Nitro carga correctamente — confirmado (sub_filter no rompe el HTML)
- Ticket dinámico — NO tocado
- Bundle minificado Nitro — NO editado
- Rediseño global — NO hecho
- Cambio reversible — SÍ (revertir: quitar sub_filter del nginx.conf + revertir HotelClient.tsx)
