# MP-009.1I — Normalizar avatar/clothes assets y config post-carga hotel

## Estado inicial

Hotel carga visualmente. Toolbar inferior visible. Entorno/sala visible. Avatar no renderiza. Errores en console/network:

```
GET .../assets/nitro/clothes/nitro/hh_human_50_body.nitro       404
GET .../assets/nitro/clothes/nitro/hh_human_50_leg.nitro        404
GET .../assets/nitro/clothes/nitro/hh_human_50_face.nitro       404
GET .../assets/nitro/clothes/nitro/hh_human_50_hair.nitro       404
GET .../assets/nitro/clothes/nitro/hh_human_50_acc_face.nitro   404
GET .../assets/nitro/clothes/nitro/hh_human_50_acc_chest.nitro  404
GET .../assets/nitro/clothes/nitro/Shirt_M_Tsuirt_Plain.nitro   404

Missing configuration key: achievements.unseen.ignored
TypeError: Cannot read properties of null (reading 'indexOf')
```

## Servicios activos

| Servicio | Puerto | Estado |
|---------|--------|--------|
| `kodexa-nitro-renderer` | 8081 | Up |
| `kodexa-assets` | 8080 | Up |
| `kodexa-db` | 3306 | Up (healthy) |
| `kodexa-redis` | 6379 | Up (healthy) |
| Arcturus | 2096/3005/3002 | Up (PID 40680) |

## Análisis de causa raíz

### Look del admin

```sql
SELECT look FROM users WHERE username='admin';
-- hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804
```

### Mapeo look → part IDs (FigureData.json)

| Parte del look | Set ID | Part IDs |
|---------------|--------|----------|
| `hr-115` (hair) | 115 | 5 |
| `hd-195` (body/head) | 195 | 1, 3, 1, 1, 1, 1 |
| `ch-3030` (chest) | 3030 | 2050 (ch/ls/rs) |
| `lg-275` (legs) | 275 | 2 |
| `fa-1201` (acc face) | 1201 | 1 |
| `ca-1804` (hat) | 1804 | 4 |

### Mapeo part IDs → libraries (FigureMap.json)

| Part IDs | Libraries requeridas |
|---------|----------------------|
| hd parts (1,3) | `hh_human_body`, `hh_human_50_body`, `hh_human_hair`, `hh_human_50_hair` |
| lg part 2 | `hh_human_leg`, `hh_human_50_leg` |
| ch part 2050 | `Shirt_M_Tshirt_Plain`, `Shirt_M_Tsuirt_Plain` |
| fa part 1 | `hh_human_acc_face`, `hh_human_50_acc_face` |
| ca part 4 | `hh_human_acc_chest`, `hh_human_50_acc_chest` |

### Archivos ya presentes vs faltantes

| Library | En assets/nitro/clothes/nitro | En bundled/figure |
|---------|-------------------------------|-------------------|
| `hh_human_body.nitro` | ✓ (existía) | ✓ |
| `hh_human_hair.nitro` | ✓ (existía) | ✓ |
| `hh_human_leg.nitro` | ✓ (existía) | ✓ |
| `hh_human_acc_chest.nitro` | ✓ (existía) | ✓ |
| `hh_human_acc_face.nitro` | ✓ (existía) | ✓ |
| `Shirt_M_Tshirt_Plain.nitro` | ✓ (existía) | ✓ |
| `hh_human_50_body.nitro` | ❌ FALTABA | ✓ |
| `hh_human_50_hair.nitro` | ❌ FALTABA | ✓ |
| `hh_human_50_leg.nitro` | ❌ FALTABA | ✓ |
| `hh_human_50_acc_chest.nitro` | ❌ FALTABA | ✓ |
| `hh_human_50_acc_face.nitro` | ❌ FALTABA | ✓ |
| `Shirt_M_Tsuirt_Plain.nitro` | ❌ FALTABA | ✓ |

**Conclusión:** FigureData/FigureMap de nitro-assets referencia AMBAS versiones `hh_human_*` y `hh_human_50_*`. El set `_50` estaba únicamente en `bundled/figure/`, no en `clothes/nitro/`. Mismatch de fuente.

### achievements.unseen.ignored faltante

`ui-config.local.json` es el bind-mount servido (verificado por docker inspect). No tenía la clave `achievements.unseen.ignored`. El `ui-config.json` (reference) sí la tenía — no fue copiada al local.

Error:
```
Missing configuration key: achievements.unseen.ignored
TypeError: Cannot read properties of null (reading 'indexOf')
```

Causa: Nitro hace `.indexOf()` sobre el valor. Si la clave retorna `null` → TypeError.

## Fix 1 — Copiar hh_human_50_* y Shirt_M_Tsuirt_Plain

```bash
SRC="external/arcturus/objectretros/nitro/nitro-assets/bundled/figure"
DEST="assets/nitro/clothes/nitro"

cp $SRC/hh_human_50_body.nitro      $DEST/
cp $SRC/hh_human_50_hair.nitro      $DEST/
cp $SRC/hh_human_50_leg.nitro       $DEST/
cp $SRC/hh_human_50_acc_chest.nitro $DEST/
cp $SRC/hh_human_50_acc_face.nitro  $DEST/
cp $SRC/hh_human_50_fx.nitro        $DEST/
cp $SRC/hh_human_50_hats.nitro      $DEST/
cp $SRC/hh_human_50_shoe.nitro      $DEST/
cp $SRC/hh_human_50_shirt.nitro     $DEST/
cp $SRC/hh_human_50_item.nitro      $DEST/
cp $SRC/hh_human_50_acc_eye.nitro   $DEST/
cp $SRC/hh_human_50_acc_head.nitro  $DEST/
cp $SRC/hh_human_50_acc_waist.nitro $DEST/
cp $SRC/Shirt_M_Tsuirt_Plain.nitro  $DEST/
```

No se cambió `avatar.asset.url`. No se tocó config. Archivos van a la ruta que `generic.asset.url` ya referencia.

## Fix 2 — achievements.unseen.ignored en ui-config.local.json

```json
// Añadido a external/arcturus/objectretros/nitro/ui-config.local.json:
"achievements.unseen.ignored": [
    "ACH_AllTimeHotelPresence"
]
```

## Validación HTTP

| Archivo | HTTP | Bytes |
|---------|------|-------|
| `hh_human_50_body.nitro` | 200 | 13,810 |
| `hh_human_50_hair.nitro` | 200 | 185,650 |
| `hh_human_50_leg.nitro` | 200 | 30,666 |
| `hh_human_50_acc_chest.nitro` | 200 | 11,087 |
| `hh_human_50_acc_face.nitro` | 200 | 10,542 |
| `hh_human_50_hats.nitro` | 200 | 72,742 |
| `hh_human_50_fx.nitro` | 200 | 1,453,580 |
| `hh_human_50_shoe.nitro` | 200 | 18,362 |
| `hh_human_50_shirt.nitro` | 200 | 107,770 |
| `hh_human_50_item.nitro` | 200 | 75,077 |
| `hh_human_50_acc_eye.nitro` | 200 | 2,113 |
| `hh_human_50_acc_head.nitro` | 200 | 5,117 |
| `hh_human_50_acc_waist.nitro` | 200 | 4,942 |
| `Shirt_M_Tsuirt_Plain.nitro` | 200 | 22,430 |

`ui-config.json` servido en `http://localhost:8081/ui-config.json`:
```json
"achievements.unseen.ignored": ["ACH_AllTimeHotelPresence"]
```

## Assets secundarios pendientes (no bloqueantes)

| Asset | Tipo | MP futuro |
|-------|------|-----------|
| `/uploads/cetere.png` | Imagen catálogo/CMS | MP-009.1J |
| `/uploads/ducker.png` | Imagen catálogo/CMS | MP-009.1J |
| `model_a.png`, `model_b.png`, etc. | Navigator room model images | MP-009.1J |
| `icon_*.png` | Catalog/navigator icons | MP-009.1J |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `assets/nitro/clothes/nitro/hh_human_50_body.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_hair.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_leg.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_acc_chest.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_acc_face.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_fx.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_hats.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_shoe.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_shirt.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_item.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_acc_eye.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_acc_head.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/hh_human_50_acc_waist.nitro` | Nuevo — bundled/figure |
| `assets/nitro/clothes/nitro/Shirt_M_Tsuirt_Plain.nitro` | Nuevo — bundled/figure |
| `external/arcturus/objectretros/nitro/ui-config.local.json` | +`achievements.unseen.ignored: ["ACH_AllTimeHotelPresence"]` |

## Validaciones obligatorias confirmadas

- `kodexa_hotel` — NO modificado
- `arcturus_dev` — NO modificado
- Prisma schema — NO tocado
- migrations — NO tocadas
- `seed.ts` — NO tocado
- `middleware.ts` — NO tocado
- CMS — NO tocado
- Auth Bridge — NO implementado
- `/hotel` y `/me` — NO integrados
- `arcturus_main` — NO reseteado
- `external/` — NO agregado a Git
- Arcturus en 2096/3005/3002 — ✓
- Nitro en 8081 — ✓
- Assets en 8080 — ✓
- WebSocket — ✓ funcional
- Admin auth — ✓ funcionando
- Look admin NO modificado (se determinó compatible con assets disponibles)

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

F12 > Network + Console + Preserve log + Disable cache:

- [ ] Sin 404 para `hh_human_50_*.nitro` y `Shirt_M_Tsuirt_Plain.nitro`
- [ ] Sin "Missing configuration key: achievements.unseen.ignored"
- [ ] Sin TypeError `indexOf` null
- [ ] Avatar renderiza (aunque sea parcialmente)
- [ ] WebSocket sigue en Network > WS
- [ ] Listar cualquier nuevo 404 o error

## Próximos pasos

| Escenario | Siguiente MP |
|-----------|-------------|
| Avatar visible pero sin ropa específica | MP-009.1J: copiar más de bundled/figure según 404s nuevos |
| Navigator/catalog sin imágenes | MP-009.1J: model_*.png, icon_*.png, uploads/ |
| Avatar completamente renderizado | MP-010: funcionalidad hotel (chat, sala, navegador) |
| Server closed connection | Investigar packet handler Arcturus |
