# MP-010 — Catalog & Furniture Assets Audit

## Estado inicial

Hotel funcional: room, avatar, ModTools, chat, catalog abre. Pero:

```
GET http://localhost:8081/uploads/credits.gif → 404
GET http://localhost:8081/uploads/casino.gif → 404
Catalog item icons → 404 (assets/nitro/furniture/ empty o incompleto)
NotSupportedError: The element has no supported sources (sounds)
```

## Diagnóstico completo

### ¿Por qué /uploads/credits.gif y /uploads/casino.gif?

Nitro solicita estos desde `localhost:8081` (mismo origen). Son URLs relativas generadas
por el cliente para imágenes CMS de ciertos layouts de catalog. El proxy `/uploads/` en
nginx del nitro-renderer ya redirige a `localhost:8080/assets/uploads/`. Fix = placeholder.

### Arquitectura de URLs de furniture

| Config key | Patrón | Resuelve a |
|-----------|--------|-----------|
| `furni.asset.url` | `%libname%.nitro` | `assets/nitro/furniture/nitro/%libname%.nitro` |
| `furni.asset.icon.url` | `%libname%%param%_icon.png` | `assets/nitro/furniture/icons/%libname%_icon.png` |
| `sounds.url` | `%sample%.mp3` | `assets/nitro/furniture/sounds/%sample%.mp3` |

`hof.furni.url` — configurado pero NO referenciado en el bundle de Nitro. No se usa.

### Classnames con variante de color (`*`)

FurnitureData usa `classname = "table_plasto_4leg*1"`. Nitro hace:
```javascript
const [base, colorIdx] = classname.split("*");
// base = "table_plasto_4leg", colorIdx = "1"
// Requests: .../nitro/furniture/nitro/table_plasto_4leg.nitro
```

El `*N` no va en el nombre del archivo. Solo el base classname se usa para el request.

### Cobertura de assets (FurnitureData vs disco)

| Categoría | Total FD | Disponibles | Faltantes |
|-----------|----------|-------------|-----------|
| Floor + Wall items (FurnitureData) | 17,698 | - | - |
| Base classnames sin `*` | 12,913 | 10,177 (79%) | 2,736 (21%) |
| Base de variantes `*N` | 419 | 355 (85%) | 64 (15%) |
| Iconos | 17,698 | ~10,078 (57%) | ~7,620 (43%) |

Faltantes: mayoría son `nft_*`, items custom del hotel, no en distribución estándar Arcturus.

### Sounds

`sounds.url = ${asset.url}/nitro/furniture/sounds/%sample%.mp3`

Los UI sounds (`camera_shutter`, `credits`, `duckets`, etc.) estaban en
`assets/nitro/sounds/` pero NO en `assets/nitro/furniture/sounds/`. Nitro los busca
en el segundo path → `NotSupportedError` en `<audio>` sin source válida.

## Fixes aplicados

### Fix 1 — Placeholders /uploads/

```
assets/uploads/credits.gif → 1x1 GIF placeholder
assets/uploads/casino.gif  → 1x1 GIF placeholder
```
(misma estrategia que cetere.png, ducker.png, collect.gif en MP-009.1L)

### Fix 2 — Furniture .nitro bundles

Copiados de `external/arcturus/objectretros/nitro/nitro-assets/bundled/furniture/`:

```
11,595 archivos nuevos → assets/nitro/furniture/nitro/
Total resultante: 22,152 .nitro files
```

### Fix 3 — Furniture icons (ya existían)

```
assets/nitro/furniture/icons/ ya tenía 14,346 archivos (generados por imager)
682 adicionales del bundled: todos duplicados, 0 nuevos copiados
```

### Fix 4 — UI sounds en furniture/sounds/

```bash
cp assets/nitro/sounds/*.mp3 assets/nitro/furniture/sounds/
# camera_shutter.mp3, credits.mp3, duckets.mp3,
# messenger_message_received.mp3, messenger_new_thread.mp3,
# modtools_new_ticket.mp3, sound_respect_received.mp3
```

### Fix 5 — Sync script actualizado

`scripts/sync-arcturus-assets.js` ahora incluye:
- `bundled/furniture/*.nitro` → `assets/nitro/furniture/nitro/`
- `bundled/furniture/*_icon.png` → `assets/nitro/furniture/icons/`
- `nitro-assets/sounds/*.mp3` → `assets/nitro/sounds/`
- `nitro-assets/sounds/*.mp3` → `assets/nitro/furniture/sounds/`

## Validación HTTP

| Endpoint | HTTP | CORS |
|---------|------|------|
| `furniture/nitro/shelves_norja.nitro` | 200 | ✓ |
| `furniture/icons/CFC_100_coin_gold_icon.png` | 200 | ✓ |
| `furniture/sounds/camera_shutter.mp3` | 200 | ✓ |
| `furniture/sounds/credits.mp3` | 200 | ✓ |
| `/uploads/credits.gif` (8081) | 200 | ✓ |
| `/uploads/casino.gif` (8081) | 200 | ✓ |
| `catalogue/catalog_bank_teaser.gif` | 200 | ✓ |
| `album1584/ACH_AllTimeHotelPresence.gif` | 404 | ✓ (hotel-specific badge) |

## Estado de assets (post MP-010)

| Directorio | Archivos | Estado |
|-----------|----------|--------|
| `assets/nitro/furniture/nitro/` | 22,152 | ✓ (79-85% cobertura FD) |
| `assets/nitro/furniture/icons/` | 14,347 | ✓ (57% cobertura FD) |
| `assets/nitro/furniture/sounds/` | 743 | ✓ (736 sound_machine + 7 UI) |
| `assets/swf/c_images/` | 38,145+ | ✓ completo |
| `assets/nitro/images/` | 92 | ✓ completo |
| `assets/uploads/` | 5 placeholders | ✓ dev |
| `assets/nitro/sounds/` | 7 | ✓ UI sounds |

## Items faltantes (no bloqueantes)

| Categoría | Count | Razón |
|-----------|-------|-------|
| Base .nitro sin `*` | 2,736 | Items NFT/custom del hotel, no en Arcturus standard |
| Base de variantes `*N` | 64 | Items premium sin bundle |
| Iconos faltantes | ~7,620 | Subset no generado por imager |
| `ACH_AllTimeHotelPresence.gif` | 1 | Badge hotel-específico |

Todos degradan gracefully: Nitro muestra placeholder o icono vacío.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `assets/uploads/credits.gif` | Placeholder 1x1 GIF |
| `assets/uploads/casino.gif` | Placeholder 1x1 GIF |
| `assets/nitro/furniture/nitro/**` | +11,595 .nitro bundles |
| `assets/nitro/furniture/sounds/*.mp3` | +7 UI sounds |
| `assets/nitro/sounds/*.mp3` | +7 UI sounds (nuevo dir) |
| `scripts/sync-arcturus-assets.js` | +4 sync pairs (furniture, icons, sounds×2) |

## Validaciones obligatorias confirmadas

- `kodexa_hotel` — NO modificado
- `arcturus_dev` — NO modificado
- Prisma / migrations / seed / middleware — NO tocado
- CMS — NO tocado
- Auth Bridge / /hotel / /me — NO implementado
- `arcturus_main` — NO reseteado
- `external/` — NO agregado a Git
- WebSocket / admin auth — ✓ funcional
- Todos los assets anteriores — ✓ siguen funcionando

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

F12 > Network + Console:

- [ ] Sin 404 para `/uploads/credits.gif`, `/uploads/casino.gif`
- [ ] Catalog abre y muestra iconos de items
- [ ] Items en sala renderizan (furniture .nitro carga)
- [ ] Cámara (screenshot) funciona sin NotSupportedError
- [ ] Sonidos UI no causan error en Console
- [ ] Listar 404 restantes si aparecen

## Próximos pasos

| Escenario | Siguiente |
|-----------|-----------|
| 0 errores críticos, catalog funcional | **MP-011** — flujo purchase → inventory → placement |
| Más furniture 404s (nft_* items) | Investigar si son items activos en el hotel |
| Iconos faltantes | Regenerar con imager tool para classnames sin icono |
| Badge 404s | Crear batch placeholder script |
| Furniture variant icon 404s | Verificar `%param%` handling en bundle |
