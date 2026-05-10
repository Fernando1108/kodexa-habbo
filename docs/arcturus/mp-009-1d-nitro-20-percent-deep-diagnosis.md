# MP-009.1D — Diagnóstico Profundo: Nitro bloqueado en 20%

## Estado inicial

Nitro Renderer (`kodexa-nitro-renderer`) servido en `http://localhost:8081` quedaba permanentemente en "The hotel is loading 20%..." incluso después de que MP-009.1C corrigiera `avatar.mandatory.libraries: []`.

## Lo que ya estaba corregido (MP-009.1C)

- `avatar.mandatory.libraries` limpiado a `[]`
- `avatar.mandatory.effect.libraries` limpiado a `[]`
- `bd.nitro` y `li.nitro` dejaron de ser prerequiridos

## Servicios confirmados activos

| Servicio | Puerto | Estado |
|---------|--------|--------|
| `kodexa-nitro-renderer` | 8081 | Up |
| `kodexa-assets` | 8080 | Up |
| `kodexa-db` | 3306 | Up (healthy) |
| `kodexa-redis` | 6379 | Up (healthy) |
| Arcturus Morningstar (Java) | 2096 / 3005 / 3002 | Up (PID 12132) |

## Diagnóstico — Cadena de carga observada

### Desde logs de `kodexa-assets` (nginx, puerto 8080)

El navegador (Edge/Chrome, Mozilla/5.0) solo generaba requests a:
```
GET /assets/gamedata/ExternalTexts.json → 200 (3.5 MB)
```

No aparecían requests del navegador a:
- `FigureData.xml`
- `FigureMap.xml`
- `EffectMap.xml`
- `FurnitureData.json`
- `ProductData.json`
- `HabboAvatarActions.xml`
- `ws://localhost:2096` (WebSocket)

Esto confirma que Nitro se bloqueaba **después de cargar ExternalTexts.json**, antes de avanzar a la siguiente fase.

## Causa raíz encontrada

### `HabboAvatarActions.xml` — archivo vacío (0 bytes)

```
assets/gamedata/HabboAvatarActions.xml → 200 OK, 0 bytes
```

En `renderer-config.json`, la clave `external.texts.url` es un **array** que carga dos archivos en la misma fase:

```json
"external.texts.url": [
  "${gamedata.url}/ExternalTexts.json",
  "${gamedata.url}/HabboAvatarActions.xml"
]
```

Nitro carga ambos como "external texts" en la misma etapa (fase ~20%). Cuando `HabboAvatarActions.xml` devuelve 200 con cuerpo vacío:

1. El parser XML de Nitro recibe un string vacío
2. Intenta parsear → falla o produce documento vacío
3. La promesa de carga queda en estado incompleto / excepción atrapada internamente
4. Nitro no avanza más allá del 20%

La clave `avatar.actions.url` también apunta a `HabboAvatarActions.xml`, pero `external.texts.url` se procesa primero y bloquea la cadena.

## Endpoints validados post-fix

| Endpoint | Status | Tamaño |
|---------|--------|--------|
| `ExternalTexts.json` | 200 | 3,523,084 bytes |
| `HabboAvatarActions.xml` | 200 | **36,510 bytes** ✓ |
| `FigureData.xml` | 200 | 1,050,832 bytes |
| `FigureMap.xml` | 200 | 423,542 bytes |
| `EffectMap.xml` | 200 | 16,227 bytes |
| `FurnitureData.json` | 200 | 8,549,278 bytes |
| `ProductData.json` | 200 | 2,695,300 bytes |

## Fix aplicado

### Origen del archivo correcto

Se encontraron dos copias válidas en el repo:

| Ruta | Tamaño | Notas |
|------|--------|-------|
| `external/arcturus/objectretros/flash/gamedata/HabboAvatarActions.xml` | 29,798 bytes | Versión flash base |
| `tools/converter/Compiled/Habbo_Default/files/xml/HabboAvatarActions.xml` | 36,510 bytes | Versión más completa (fx.207-fx.244) |

Se usó la versión de `tools/converter` por ser la más actualizada.

### Comando ejecutado

```bash
cp tools/converter/Compiled/Habbo_Default/files/xml/HabboAvatarActions.xml \
   assets/gamedata/HabboAvatarActions.xml
```

**No se requirió restart del contenedor.** El archivo es servido vía bind-mount de nginx; el cambio es inmediato.

## Config antes/después

`renderer-config.json` **no fue modificado**. El problema era el archivo en disco, no la config.

```json
// Sin cambios en renderer-config.json
"external.texts.url": [
  "${gamedata.url}/ExternalTexts.json",
  "${gamedata.url}/HabboAvatarActions.xml"
]
```

## Observaciones adicionales (no bloqueantes para el 20%)

### `hd.nitro`, `li.nitro`, `bd.nitro` ausentes

```
assets/nitro/clothes/nitro/hd.nitro → NO EXISTE
assets/nitro/clothes/nitro/li.nitro → NO EXISTE
assets/nitro/clothes/nitro/bd.nitro → NO EXISTE
```

Estos son partes base del avatar. Con `avatar.mandatory.libraries: []`, Nitro **no los prerequiere** al inicio. Se cargarán dinámicamente cuando se renderice un avatar en sala. Pueden causar el siguiente bloqueo (avatar invisible / error al entrar a sala).

### `avatar.asset.url` pattern

```json
"avatar.asset.url": "${asset.url}/nitro/clothes/nitro/%libname%.nitro"
```

Si Nitro pide `hd.nitro` y no existe → 404 → avatar no renderiza pero el hotel podría seguir cargando. Necesita investigación post-20%.

## Validaciones obligatorias confirmadas

- `kodexa_hotel` — NO modificado
- `arcturus_dev` — NO modificado
- Prisma schema — NO tocado
- migrations — NO tocadas
- `seed.ts` — NO tocado
- `middleware.ts` — NO tocado
- CMS — NO tocado
- Auth Bridge — NO implementado
- `arcturus_main` — NO reseteado
- `external/` — NO agregado a Git
- Arcturus en 2096/3005/3002 — ✓ activo
- Nitro en 8081 — ✓ activo
- Assets en 8080 — ✓ activo

## Resultado esperado

Abrir `http://localhost:8081/?sso=kodexa_admin_sso_local_2026` debe:
1. Pasar del 20%
2. Cargar FigureData, FurnitureData, EffectMap
3. Intentar conexión WebSocket a `ws://localhost:2096`
4. Arcturus valida SSO ticket → usuario admin entra

## Pendientes / próximo bloqueo probable

Si Nitro pasa del 20% y queda colgado después:

| Escenario | Síntoma | Siguiente MP |
|-----------|---------|--------------|
| WS conecta pero SSO falla | Error en consola, no entra a sala | MP-009.1E: validar SSO ticket en arcturus_main |
| WS no conecta | Network → WS no aparece | MP-009.1E: revisar WebSocket handshake Arcturus |
| Avatar invisible en sala | Entra pero no se ve avatar | MP-009.1F: generar hd.nitro, li.nitro, bd.nitro |
| Sigue en otro % | Network muestra 404 en otro asset | MP-009.1E: diagnóstico del nuevo bloqueo |

## Próximo microproceso recomendado

**MP-009.1E — Prueba de entrada al hotel y validación de SSO**

Verificar:
1. Nitro supera 20% (confirmar en navegador)
2. `ws://localhost:2096` aparece en Network > WS
3. Arcturus recibe y valida ticket
4. Usuario entra a sala o se identifica el siguiente bloqueo
5. Si avatar invisible: investigar `hd.nitro` / `li.nitro` / `bd.nitro`
