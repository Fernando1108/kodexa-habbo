# MP-009.1K — Fix assets: camera effects PNGs + reception images + CORS en 404

## Estado inicial

Hotel y sala cargan. Avatar visible. Pero fondo azul plano y efectos de cámara fallan:

```
GET http://localhost:8080/assets/swf/c_images/Habbo-Stories/shadow_multiply_02.png → 404
GET http://localhost:8080/assets/nitro/images/reception/sun.png → 404
Access to image ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

Archivos afectados: 28 camera effect PNGs (Habbo-Stories) + reception images (sun, drape, US_right, US_top_right, ts, stretch_blue).

## Diagnóstico

### Dónde buscaba Nitro

Config resolución de URLs:
```
asset.url          = http://localhost:8080/assets
flash.asset.url    = http://localhost:8080/assets/swf
image.library.url  = http://localhost:8080/assets/swf/c_images/
→ camera effects: http://localhost:8080/assets/swf/c_images/Habbo-Stories/*.png

images.url = ${asset.url}/nitro/images
→ reception: http://localhost:8080/assets/nitro/images/reception/*.png
```

### Dónde estaban realmente los archivos

| Asset | Ruta esperada | Ruta real |
|-------|---------------|-----------|
| Camera effects PNGs | `assets/swf/c_images/Habbo-Stories/` | `external/arcturus/objectretros/flash/c_images/Habbo-Stories/` |
| Reception images | `assets/nitro/images/reception/` | `external/arcturus/objectretros/nitro/nitro-assets/images/reception/` |

**`assets/swf/`** existía pero estaba VACÍO — `c_images/` nunca fue copiado.

### CORS en 404

`docker/nginx/assets.conf` usaba `add_header` sin `always`:
```nginx
add_header Access-Control-Allow-Origin *;  # Sin 'always'
```

nginx solo agrega headers en respuestas 2xx/3xx con esa sintaxis. En 404, `try_files $uri =404` retorna sin ejecutar `add_header` → browser ve CORS error aunque el problema real sea 404.

**Resultado**: errores de CORS enmascaraban errores reales de 404.

## Fixes aplicados

### Fix 1 — Camera effects (Habbo-Stories)

```bash
mkdir -p assets/swf/c_images/Habbo-Stories
cp external/arcturus/objectretros/flash/c_images/Habbo-Stories/*.png \
   assets/swf/c_images/Habbo-Stories/
# Resultado: 28 archivos copiados
```

Archivos: `alien_hrd.png`, `bluemood_mpl.png`, `coffee_mpl.png`, `drops_mpl.png`, `finger_nrm.png`, `frame_black.png`, `frame_black_2.png`, `frame_gold.png`, `frame_gray.png`, `frame_gray_4.png`, `frame_wood.png`, `frame_wood_2.png`, `glitter_hrd.png`, `hearts_hardlight.png`, `hearts_hardlight_02.png`, `misty_hrd.png`, `pinky_nrm.png`, `rusty_mpl.png`, `security_hardlight.png`, `shadow_multiply.png`, `shadow_multiply_02.png`, `shiny_hrd.png`, `stars_hardlight.png`, `stars_hardlight_02.png`, `texture_overlay.png`, `toxic_hrd.png` (+ 2 extra).

### Fix 2 — Reception images

```bash
mkdir -p assets/nitro/images/reception
cp external/arcturus/objectretros/nitro/nitro-assets/images/reception/* \
   assets/nitro/images/reception/
# Resultado: sun.png, drape.png, US_right.png, US_top_right.png, ts.png, stretch_blue.png + otros
```

### Fix 3 — CORS en 404 (nginx)

`docker/nginx/assets.conf`:
```nginx
# Antes:
add_header Access-Control-Allow-Origin *;
add_header Cache-Control "public, max-age=31536000";

# Después:
add_header Access-Control-Allow-Origin * always;
add_header Cache-Control "public, max-age=31536000" always;
```

`always` hace que nginx incluya el header en TODAS las respuestas (2xx, 3xx, 4xx, 5xx).

```bash
docker exec kodexa-assets nginx -s reload
# 2026/05/10 23:44:51 [notice] signal process started — OK
```

## Validación HTTP

| Endpoint | HTTP | CORS |
|---------|------|------|
| `Habbo-Stories/shadow_multiply_02.png` | 200 | ✓ |
| `Habbo-Stories/hearts_hardlight_02.png` | 200 | ✓ |
| `Habbo-Stories/texture_overlay.png` | 200 | ✓ |
| `Habbo-Stories/glitter_hrd.png` | 200 | ✓ |
| `reception/sun.png` | 200 | ✓ |
| `reception/drape.png` | 200 | ✓ |
| `reception/US_right.png` | 200 | ✓ |
| `reception/US_top_right.png` | 200 | ✓ |
| `reception/stretch_blue.png` | 200 | ✓ |
| Path inexistente (404) | 404 | **✓** (ahora con CORS) |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `assets/swf/c_images/Habbo-Stories/*.png` | 28 nuevos archivos (camera effects) |
| `assets/nitro/images/reception/*.png` | 29 nuevos archivos (hotelview) |
| `docker/nginx/assets.conf` | `add_header ... always` en ambos headers |

## Validaciones obligatorias confirmadas

- `kodexa_hotel` — NO modificado
- `arcturus_dev` — NO modificado
- Prisma — NO tocado
- CMS — NO tocado
- Auth Bridge — NO implementado
- `/hotel` y `/me` — NO integrados
- `arcturus_main` — NO reseteado
- `external/` — NO agregado a Git
- WebSocket — ✓ funcional
- Admin auth — ✓ funcionando
- Todos los fixes previos — ✓ activos

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

F12 > Network + Console:

- [ ] Sin 404 para `Habbo-Stories/*.png`
- [ ] Sin 404 para `reception/sun.png`, `drape.png`, `US_right.png`
- [ ] Sin "blocked by CORS policy" para assets de localhost:8080
- [ ] Fondo del hotelview visible (no azul plano)
- [ ] Efectos de cámara disponibles (icono cámara en toolbar)
- [ ] Listar 404 nuevos si aparecen

## Próximos pasos

| Escenario | Siguiente MP |
|-----------|-------------|
| Hotel funcional, sin 404 críticos | **MP-010** — funcionalidad hotel (chat, sala, navegador) |
| Más c_images/ subdirectorios con 404 | Copiar desde `external/arcturus/objectretros/flash/c_images/` |
| Catalog images faltantes (`catalogue/`) | `external/arcturus/objectretros/flash/c_images/catalogue/` |
| Badge images faltantes (`album1584/`) | `external/arcturus/objectretros/flash/c_images/album1584/` |
| Navigator room model images | Revisar `external/.../flash/c_images/newroom/` |
