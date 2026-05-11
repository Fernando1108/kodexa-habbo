# MP-009.1L — Bulk sync c_images + uploads proxy + placeholders

## Estado inicial

Hotel funcional. Avatar y sala cargan. Quedan 404 en:

```
GET http://localhost:8080/assets/swf/c_images/album1584/MYC17_.gif → 404
GET http://localhost:8081/uploads/cetere.png → 404
GET http://localhost:8081/uploads/ducker.png → 404
GET http://localhost:8081/uploads/collect.gif → 404
Uncaught (in promise) NotSupportedError: The element has no supported sources.
```

## Diagnóstico

### Arquitectura de origen (reference compose.yaml)

```
localhost:8081 → CMS (atomcms / Laravel) — sirve /uploads/ de user-generated content
localhost:8080 → assets nginx — sirve /assets/...
localhost:3000 → Nitro renderer (en referencia)
```

En nuestro setup local:
```
localhost:8081 → Nitro renderer nginx (sin CMS)
localhost:8080 → assets nginx
```

`/uploads/` esperaba CMS en 8081. Sin CMS, no existe.

### Assets genuinamente ausentes de Arcturus

| Asset | Por qué falta |
|-------|--------------|
| `cetere.png`, `ducker.png` | CMS collectibles — runtime-generated, no en Arcturus |
| `collect.gif` | Colectibles UI animation — runtime-generated, no en Arcturus |
| `MYC17_.gif` | Badge hotel-específico, no en distribución estándar Arcturus |

### c_images: 21 subdirectorios sin copiar

`assets/swf/c_images/` solo tenía `Habbo-Stories/`. Los 22 subdirectorios del flash completo:

```
AdWarningsUK, Badgeparts, Quests, album137, album1584, album3606,
articles, catalogue, catalogue_otherlangs, client_static, guilds,
habbopages, hot_campaign_images_no, newroom, playlist, reception,
talent, targetedoffers, web_promo, web_promo_small
```

Todos en `external/arcturus/objectretros/flash/c_images/` — nunca copiados.

## Fixes aplicados

### Fix 1 — Bulk copy c_images (38,145 archivos)

```bash
SRC="external/arcturus/objectretros/flash/c_images"
DEST="assets/swf/c_images"
# Script copiaron subdirectorios conservando estructura
# 38,145 archivos totales: album1584(24,325) + catalogue(9,342) + rest
```

### Fix 2 — Nitro images restantes

```bash
# Subdirecotrios ya copiados: additions, furniextras, navigator, wallet
# + 3 root images: big_arrow.png, clear_icon.png, loading_icon.png
```

### Fix 3 — Placeholders para CMS uploads

```python
# assets/uploads/cetere.png  → 1x1 transparent PNG (placeholder)
# assets/uploads/ducker.png  → 1x1 transparent PNG (placeholder)
# assets/uploads/collect.gif → 1x1 transparent GIF (placeholder)
# assets/swf/c_images/album1584/MYC17_.gif → 1x1 GIF (placeholder)
```

Nota: En producción con CMS (atomcms), reemplazar `assets/uploads/` con contenido real de `./atomcms/storage`.

### Fix 4 — Proxy /uploads/ en Nitro renderer nginx

`external/arcturus/nitro-docker/nitro/nginx.conf`:
```nginx
# Añadido antes de location /:
location /uploads/ {
    add_header 'Access-Control-Allow-Origin' '*' always;
    proxy_pass http://host.docker.internal:8080/assets/uploads/;
    proxy_set_header Host $host;
    proxy_intercept_errors off;
}
```

Proxy `localhost:8081/uploads/` → `localhost:8080/assets/uploads/` usando `host.docker.internal` (resuelve al host desde dentro del container).

```bash
docker exec kodexa-nitro-renderer nginx -s reload  # OK
```

### Fix 5 — Sync script reutilizable

`scripts/sync-arcturus-assets.js` — copia incremental de fuentes Arcturus a assets:
```bash
node scripts/sync-arcturus-assets.js          # dry-run
node scripts/sync-arcturus-assets.js --run    # ejecutar
node scripts/sync-arcturus-assets.js --force  # sobreescribir
```

## Validación HTTP

| Endpoint | HTTP | CORS |
|---------|------|------|
| `/uploads/cetere.png` (8081) | 200 | ✓ |
| `/uploads/ducker.png` (8081) | 200 | ✓ |
| `/uploads/collect.gif` (8081) | 200 | ✓ |
| `album1584/MYC17_.gif` (8080) | 200 | ✓ |
| `album1584/ACH.gif` | 200 | ✓ |
| `newroom/model_a.png` | 200 | ✓ |
| `newroom/model_b.png` | 200 | ✓ |
| `wallet/0.png` | 200 | ✓ |
| `wallet/hc.png` | 200 | ✓ |
| `hh_human_body.nitro` | 200 | ✓ |
| `Habbo-Stories/shadow_multiply_02.png` | 200 | ✓ |
| `reception/sun.png` | 200 | ✓ |
| 404 any path | 404 | ✓ (always) |

## Estado de assets después de todos los MPs

| Carpeta | Archivos | Estado |
|---------|----------|--------|
| `assets/swf/c_images/` | 38,145 | ✓ completo |
| `assets/nitro/images/` | 92 | ✓ completo |
| `assets/nitro/clothes/nitro/` | 2000+ | ✓ completo |
| `assets/nitro/furniture/` | pendiente | futuro MP si 404s |
| `assets/gamedata/` | JSON ready | ✓ |
| `assets/uploads/` | 3 placeholders | ✓ dev placeholder |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `assets/swf/c_images/**` | +38,145 archivos de flash/c_images |
| `assets/nitro/images/**` | +additions, furniextras, navigator, wallet, root PNGs |
| `assets/swf/c_images/album1584/MYC17_.gif` | Placeholder 1x1 GIF |
| `assets/uploads/cetere.png` | Placeholder 1x1 PNG |
| `assets/uploads/ducker.png` | Placeholder 1x1 PNG |
| `assets/uploads/collect.gif` | Placeholder 1x1 GIF |
| `external/arcturus/nitro-docker/nitro/nginx.conf` | +location /uploads/ proxy |
| `scripts/sync-arcturus-assets.js` | Script sync reutilizable |

## NotSupportedError

`NotSupportedError: The element has no supported sources.` = elemento HTML5 `<audio>` o `<video>` sin source válida. Probablemente sonido de cámara (`camera.available.effects`) o sonido de sala. No bloqueante — solo afecta efectos de sonido del cliente. Investigar en MP-010 si interfiere con funcionalidad.

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

Verificar en F12 > Network:
- [ ] Sin 404 para uploads/cetere.png, uploads/ducker.png, uploads/collect.gif
- [ ] Sin 404 para album1584/MYC17_.gif
- [ ] Navigator room models cargan (newroom/model_a.png, etc.)
- [ ] Wallet/currency icons cargan
- [ ] Quest/achievement images cargan
- [ ] Catalog icons cargan
- [ ] NotSupportedError: si persiste, documentar qué elemento lo dispara
- [ ] Hotel sigue funcionando: room, avatar, chat, commands

## Próximos pasos

| Escenario | Siguiente |
|-----------|-----------|
| 0 errores críticos en Network | **MP-010** — funcionalidad completa hotel |
| Furniture 404s (catalog items) | `assets/nitro/furniture/` desde bundled/furniture |
| Sonidos faltantes (.mp3) | `sounds.url` en renderer-config → `sounds/` folder |
| Camera feature rota | Configurar camera.url para dev local |
| Más badge 404s hotel-específicos | Crear batch de placeholders con script |
