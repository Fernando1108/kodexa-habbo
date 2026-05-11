# MP-009.1J — Fix final: camera.available.effects + hh_human_50_face.nitro

## Estado inicial

Hotel carga. WebSocket conectado. Admin autenticado. Avatar parcialmente visible. Errores:

```
[Nitro] Missing configuration key: camera.available.effects
Uncaught TypeError: t is not iterable
GET http://localhost:8080/assets/nitro/clothes/nitro/hh_human_50_face.nitro → 404
TypeError: Failed to fetch (consecuencia del 404)
```

## Servicios activos

| Servicio | Puerto | Estado |
|---------|--------|--------|
| `kodexa-nitro-renderer` | 8081 | Up |
| `kodexa-assets` | 8080 | Up |
| `kodexa-db` | 3306 | Up (healthy) |
| `kodexa-redis` | 6379 | Up (healthy) |
| Arcturus | 2096/3005/3002 | Up (PID 40680) |

## Fix 1 — hh_human_50_face.nitro

Archivo encontrado en:
```
external/arcturus/objectretros/nitro/nitro-assets/bundled/figure/hh_human_50_face.nitro
```

```bash
cp external/arcturus/objectretros/nitro/nitro-assets/bundled/figure/hh_human_50_face.nitro \
   assets/nitro/clothes/nitro/hh_human_50_face.nitro
```

**Validación:**
```
HTTP/1.1 200 OK
Content-Length: 992
Access-Control-Allow-Origin: *
```

## Fix 2 — camera.available.effects y ui-config.local.json completo

`camera.available.effects` era un array de 40 objetos en `ui-config.json` (reference), pero ausente en `ui-config.local.json` (el bind-mount real).

`t is not iterable` = Nitro hacía `for...of` sobre null.

Al investigar claves faltantes, se encontraron **9 claves ausentes** en total (no solo camera.available.effects):

| Clave | Tipo | Efecto si falta |
|-------|------|-----------------|
| `camera.available.effects` | array(40) | TypeError iterable |
| `notification` | dict(32) | Notificaciones rotas |
| `catalog.links` | dict(4) | Links catálogo rotos |
| `hc.center` | dict(5) | HC center roto |
| `respect.options` | dict(2) | Respeto roto |
| `avatareditor.show.clubitems.dimmed` | bool | Avatar editor roto |
| `avatareditor.show.clubitems.first` | bool | Avatar editor roto |
| `chat.history.max.items` | int(100) | Chat history roto |
| `currency.seasonal.color` | str("bronze") | Moneda visual rota |

**Solución:** Copiar todas las claves faltantes del reference al local en una operación:

```python
# ui-config.local.json ahora es 1:1 con ui-config.json (51 keys ambos)
# Solo difieren los valores que ya tenían override local:
# - url.prefix = http://localhost:8081 (local, no producción)
# - camera.url, thumbnails.url, habbopages.url (heredan de url.prefix)
```

**Resultado:** `ui-config.local.json` — 51 claves, 0 faltantes vs reference. JSON válido.

## Validación final

| Check | Resultado |
|-------|-----------|
| `hh_human_50_face.nitro` HTTP | 200 / 992 bytes |
| `camera.available.effects` en ui-config servido | list(40) |
| `achievements.unseen.ignored` | array(1) ✓ (MP-009.1I) |
| ui-config.local.json keys == reference keys | 51 == 51 ✓ |
| JSON válido | ✓ |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `assets/nitro/clothes/nitro/hh_human_50_face.nitro` | Nuevo (992 bytes, bundled/figure) |
| `external/arcturus/objectretros/nitro/ui-config.local.json` | +9 claves faltantes del reference |

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
- Look admin — NO modificado

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

F12 > Console + Network + Preserve log + Disable cache:

- [ ] Sin "Missing configuration key: camera.available.effects"
- [ ] Sin "TypeError: t is not iterable"
- [ ] Sin 404 para `hh_human_50_face.nitro`
- [ ] Avatar renderiza con cara visible
- [ ] WebSocket activo en Network > WS
- [ ] Listar cualquier 404 nuevo si aparece

## Estado esperado post-fix

Con todos los fixes de MP-009.1A → MP-009.1J:
- Hotel carga al 100%
- Avatar renderiza completo (body + hair + face + chest + legs)
- No hay TypeErrors de config
- No hay 404 de assets base del avatar

## Próximos pasos

| Escenario | Siguiente MP |
|-----------|-------------|
| Avatar visible y hotel funcional | **MP-010** — funcionalidad hotel (chat, sala, navegador) |
| Quedan 404 de ropa específica (ca/lg/ch custom) | MP-009.1K: copiar clothes adicionales desde bundled/figure |
| Navigator sin imágenes room models | MP-009.1K: model_*.png desde image.library |
| uploads/ 404 (cetere.png, ducker.png) | No bloqueante — dejar para MP-010+ |
