# MP-009.1H — Fix Nitro 80%: librerías .nitro base faltantes

## Estado inicial

Nitro superó el 20% (MP-009.1F/1G). WebSocket conecta. Admin autenticado. Bloqueo actual: 6 assets `.nitro` base con 404, causando "Invalid Collection" en consola.

```
GET http://localhost:8080/assets/nitro/clothes/nitro/place_holder.nitro       → 404
GET http://localhost:8080/assets/nitro/clothes/nitro/room.nitro               → 404
GET http://localhost:8080/assets/nitro/clothes/nitro/place_holder_pet.nitro   → 404
GET http://localhost:8080/assets/nitro/clothes/nitro/tile_cursor.nitro        → 404
GET http://localhost:8080/assets/nitro/clothes/nitro/place_holder_wall.nitro  → 404
GET http://localhost:8080/assets/nitro/clothes/nitro/selection_arrow.nitro    → 404

[Nitro] Invalid Collection place_holder
[Nitro] Invalid Collection room
[Nitro] Invalid Collection place_holder_pet
[Nitro] Invalid Collection tile_cursor
[Nitro] Invalid Collection place_holder_wall
[Nitro] Invalid Collection selection_arrow

Access to fetch ... blocked by CORS policy (consecuencia del 404, no del nginx)
```

## Servicios confirmados activos

| Servicio | Puerto | Estado |
|---------|--------|--------|
| `kodexa-nitro-renderer` | 8081 | Up |
| `kodexa-assets` | 8080 | Up |
| `kodexa-db` | 3306 | Up (healthy) |
| `kodexa-redis` | 6379 | Up (healthy) |
| Arcturus Morningstar | 2096 / 3005 / 3002 | Up (PID 40680) |

## Diagnóstico

### Por qué busca en `clothes/nitro/`

`generic.asset.url` en `renderer-config.local.json`:
```json
"generic.asset.url": "${asset.url}/nitro/clothes/nitro/%libname%.nitro"
```

Nitro usa `generic.asset.url` para cargar assets de sala base: `room`, `place_holder`, `tile_cursor`, `selection_arrow`, `place_holder_pet`, `place_holder_wall`. Estos no son ropa de avatar — son colecciones genéricas del engine.

### Config de referencia vs local

El `renderer-config.json` de referencia (nitro-assets) usa estructura `bundled/`:
```json
"generic.asset.url": "${asset.url}/bundled/generic/%libname%.nitro"
```

Nuestro `renderer-config.local.json` usa:
```json
"generic.asset.url": "${asset.url}/nitro/clothes/nitro/%libname%.nitro"
```

**Decisión:** Copiar archivos a la ruta que `generic.asset.url` ya apunta (`nitro/clothes/nitro/`), sin cambiar config. Cambiar `generic.asset.url` a `bundled/generic/` requeriría migrar todos los clothes de avatar de `nitro/clothes/nitro/` → `bundled/figure/`, operación masiva innecesaria.

### Archivos encontrados

Todos en:
```
external/arcturus/objectretros/nitro/nitro-assets/bundled/generic/
```

| Archivo | Tamaño |
|---------|--------|
| `place_holder.nitro` | 1,208 bytes |
| `room.nitro` | 298,527 bytes |
| `place_holder_pet.nitro` | 5,284 bytes |
| `tile_cursor.nitro` | 2,200 bytes |
| `place_holder_wall.nitro` | 1,087 bytes |
| `selection_arrow.nitro` | 1,702 bytes |

También disponibles (no requeridos con preload=`[]`):
- `avatar_additions.nitro` (4,010 bytes)
- `group_badge.nitro` (55,707 bytes)
- `floor_editor.nitro` (1,866 bytes)

## Fix aplicado

```bash
SRC="external/arcturus/objectretros/nitro/nitro-assets/bundled/generic"
DEST="assets/nitro/clothes/nitro"

cp $SRC/place_holder.nitro    $DEST/place_holder.nitro
cp $SRC/room.nitro             $DEST/room.nitro
cp $SRC/place_holder_pet.nitro $DEST/place_holder_pet.nitro
cp $SRC/tile_cursor.nitro      $DEST/tile_cursor.nitro
cp $SRC/place_holder_wall.nitro $DEST/place_holder_wall.nitro
cp $SRC/selection_arrow.nitro  $DEST/selection_arrow.nitro
```

XML originales no tocados. No se copió masivamente.

## Validación HTTP

| Endpoint | HTTP | Bytes | CORS |
|---------|------|-------|------|
| `place_holder.nitro` | 200 | 1,208 | `*` |
| `room.nitro` | 200 | 298,527 | `*` |
| `place_holder_pet.nitro` | 200 | 5,284 | `*` |
| `tile_cursor.nitro` | 200 | 2,200 | `*` |
| `place_holder_wall.nitro` | 200 | 1,087 | `*` |
| `selection_arrow.nitro` | 200 | 1,702 | `*` |

**CORS**: `Access-Control-Allow-Origin: *` presente en todas las respuestas — el nginx de `kodexa-assets` ya tenía CORS configurado. El error CORS anterior era consecuencia del 404, no de falta de header.

## Cambios en config

Ninguno. Solo se copiaron archivos a la ruta que `generic.asset.url` ya apuntaba.

## Archivos modificados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `assets/nitro/clothes/nitro/place_holder.nitro` | Nuevo | Copiado desde bundled/generic |
| `assets/nitro/clothes/nitro/room.nitro` | Nuevo | Copiado desde bundled/generic |
| `assets/nitro/clothes/nitro/place_holder_pet.nitro` | Nuevo | Copiado desde bundled/generic |
| `assets/nitro/clothes/nitro/tile_cursor.nitro` | Nuevo | Copiado desde bundled/generic |
| `assets/nitro/clothes/nitro/place_holder_wall.nitro` | Nuevo | Copiado desde bundled/generic |
| `assets/nitro/clothes/nitro/selection_arrow.nitro` | Nuevo | Copiado desde bundled/generic |

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

F12 > Network + Console + Preserve log + Disable cache:

- [ ] Sin 404 para las 6 librerías base
- [ ] Sin `[Nitro] Invalid Collection` para room/place_holder/tile_cursor/selection_arrow
- [ ] Sin error CORS
- [ ] WebSocket sigue en Network > WS
- [ ] Nitro pasa del 80% → 100%
- [ ] Hotel visible o nuevo bloqueo documentado

## Próximos bloqueos probables

| Escenario | Síntoma | Siguiente MP |
|-----------|---------|--------------|
| Avatar invisible | Hotel carga 100%, sala visible, avatar no renderiza | MP-009.1I: copiar `hd.nitro`, `bd.nitro`, `li.nitro` |
| Más .nitro 404 | Nuevos Invalid Collection en console | MP-009.1I: identificar y copiar |
| `avatar_additions.nitro` 404 | Error específico de avatar extras | Copiar de bundled/generic a nitro/clothes/nitro |
| Server closed connection | WS cae después de ~60s | Investigar timeout Arcturus o packet sin handler |
| Hotel carga completo + avatar visible | ✓ DONE | MP-010 |

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
- Todos los fixes previos activos — ✓
