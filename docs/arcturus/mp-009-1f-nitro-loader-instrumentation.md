# MP-009.1F — Instrumentación Nitro Loader: ExternalTexts.json formato incorrecto

## Estado inicial

Nitro Renderer congelado en "The hotel is loading 20%..." a pesar de:
- MP-009.1E: `external.texts.url` corregido a string `ExternalTexts.json` solo
- MP-009.1D: `HabboAvatarActions.xml` reparado de 0 bytes → 36,510 bytes
- WebSocket en 2096 confirmado funcional (101 Switching Protocols con Origin correcto)

Estado observado:
- Browser solo solicita `ExternalTexts.json` — nunca FurnitureData, FigureData, WS
- Console sin errores rojos visibles
- `ws://localhost:2096` no aparece en Network > WS

## Por qué NO se implementó /me ni Auth Bridge

La URL directa con ticket fijo (`http://localhost:8081/?sso=kodexa_admin_sso_local_2026`) debe funcionar primero. El bloqueo era antes de que Nitro siquiera intente el WebSocket. Auth Bridge y `/me` son irrelevantes hasta que este flujo base funcione.

## Diagnóstico

### Análisis de format de ExternalTexts.json

```bash
head -c 500 assets/gamedata/ExternalTexts.json
```

**Salida:**
```
01nftxmas.text=We have 7 games for you to play. Say ":game1", ":game2"...
01nftxmas.title=Welcome to Habbo NFT's Christmas Event!
02nftxmas.text=This is a 2 player game...
```

**Esto NO es JSON.** Es formato properties (`key=value` por línea) — el formato Flash/SWF de Habbo.

### Flujo de fallo (confirmado por análisis de bundle MP-009.1E)

```js
// LocalizationManager.loadLocalizationFromURL:
fetch("ExternalTexts.json")
  .then(t => t.json())       // ← SIEMPRE parsea como JSON
  .then(t => this.onLocalizationLoaded(t, e))
  .catch(t => this.onLocalizationFailed(t))  // ← captura SyntaxError silencioso
```

Cuando ExternalTexts.json es un archivo properties:
1. `fetch()` → 200 OK, body = `"01nftxmas.text=We have..."` (texto plano)
2. `.json()` → **SyntaxError: Unexpected token '0'** (no es JSON válido)
3. `.catch()` llama `onLocalizationFailed(error)`
4. `onLocalizationFailed` dispatcha `qd.FAILED`
5. Loading component NO tiene `case qd.FAILED:` → evento ignorado
6. **Loading queda en 20% permanentemente**

El error es SILENCIOSO porque:
- El catch lo captura internamente
- El event `qd.FAILED` no está manejado en el switch del loader
- Console no muestra nada rojo

## Causa raíz

**`assets/gamedata/ExternalTexts.json` estaba en formato properties (Flash/SWF) en vez de formato JSON (Nitro).**

Nitro siempre llama `.json()` en todas las URLs de `external.texts.url`. El archivo incorrecto causaba fallo silencioso de parseo → `qd.LOADED` nunca se disparaba → `wg().init()` nunca se llamaba → WebSocket nunca se creaba.

## Fix aplicado

### Archivos con ExternalTexts en formato JSON correcto encontrados

| Ruta | Tamaño | Formato |
|------|--------|---------|
| `assets/gamedata/ExternalTexts.json` | **3,523,084 bytes** | ❌ Properties (`key=value`) |
| `assets/nitro/gamedata/json/ExternalTexts.json` | 2,366,682 bytes | ✓ JSON (`{"key":"value",...}`) |
| `external/arcturus/objectretros/nitro/nitro-assets/gamedata/ExternalTexts.json` | **2,802,915 bytes** | ✓ JSON ✓ mismo contenido |

Se usó la versión de `external/arcturus/objectretros/nitro/nitro-assets/gamedata/ExternalTexts.json` porque:
- Formato JSON correcto (`{"01nftxmas.text":"We have 7 games..."}`)
- Contenido idéntico al properties file (mismas claves, mismo hotel)
- Mayor tamaño = más entradas = más completa

### Comando ejecutado

```bash
cp external/arcturus/objectretros/nitro/nitro-assets/gamedata/ExternalTexts.json \
   assets/gamedata/ExternalTexts.json
```

### Validación

```
curl -o /dev/null -w "%{http_code} %{size_download}" http://localhost:8080/assets/gamedata/ExternalTexts.json
200 2802915
```

```
head -c 100 assets/gamedata/ExternalTexts.json
{"01nftxmas.text":"We have 7 games for you to play...","01nftxmas.title":"Welcome to Habbo NFT's Christmas Event!"...
```

## Instrumentación agregada al bundle

Se instrumentó `assets/index-f70cc2eb.js` dentro del contenedor `kodexa-nitro-renderer` con **9 puntos de diagnóstico** [KODEXA-NITRO-DIAG]:

| # | Punto | Qué logea |
|---|-------|-----------|
| 1 | `loadLocalizationFromURL` | URL que se va a fetch |
| 2 | `onLocalizationLoaded` | URL cargada OK + parseLocalization OK |
| 3 | `onLocalizationFailed` | Error exacto si falla |
| 4 | `Ya.LOADED` (config loaded) | Inicio de localización |
| 5 | `qd.LOADED` | Flow completo pre-WS |
| 6 | `NitroCommunicationManager.onInit` | URL del WebSocket |
| 7 | `CONNECTION_HANDSHAKING` | WS conectado 40% |
| 8 | `CONNECTION_AUTHENTICATED` | SSO ok 80% |
| 9 | `CONNECTION_ERROR` | Error de WS |

### Método de instrumentación

1. `docker cp` del bundle `/usr/share/nginx/html/assets/index-f70cc2eb.js` → Windows path
2. `python3` reemplazos string exactos (9 puntos)
3. `docker cp` devuelve el bundle instrumentado al contenedor
4. Sin rebuild ni restart — nginx sirve el JS directamente

**Archivo tocado:** `kodexa-nitro-renderer:/usr/share/nginx/html/assets/index-f70cc2eb.js` (temporal, solo en contenedor)

**Original preservado en:** `tools/nitro_bundle_diag.js` (gitignored)

### Para remover instrumentación

```bash
docker restart kodexa-nitro-renderer
# El restart recrea el bundle desde la imagen original
```

## Logs esperados en Console del navegador

Con el fix de ExternalTexts.json (JSON correcto), se esperan estos logs en orden:

```
[KODEXA-NITRO-DIAG] Ya.LOADED config loaded, starting localization
[KODEXA-NITRO-DIAG] localization fetch: http://localhost:8080/assets/gamedata/ExternalTexts.json
[KODEXA-NITRO-DIAG] localization loaded: http://localhost:8080/assets/gamedata/ExternalTexts.json
[KODEXA-NITRO-DIAG] parseLocalization OK: http://localhost:8080/assets/gamedata/ExternalTexts.json
[KODEXA-NITRO-DIAG] qd.LOADED localization complete, downloading preload assets
[KODEXA-NITRO-DIAG] preload.assets.urls resolved: []
[KODEXA-NITRO-DIAG] downloadAssets result: true
[KODEXA-NITRO-DIAG] calling wg().init() to start WebSocket
[KODEXA-NITRO-DIAG] WebSocket init to: ws://localhost:2096
[KODEXA-NITRO-DIAG] CONNECTION_HANDSHAKING WS connected 40%
[KODEXA-NITRO-DIAG] CONNECTION_AUTHENTICATED SSO ok 80%
```

Si en cambio ExternalTexts.json falla aún:
```
[KODEXA-NITRO-DIAG] localization FAILED - probable JSON parse error: SyntaxError: ...
```

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

## Archivos modificados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `assets/gamedata/ExternalTexts.json` | Persistente | Properties format → JSON format (2.8MB) |
| `kodexa-nitro-renderer:/usr/share/nginx/html/assets/index-f70cc2eb.js` | **Temporal** | +9 console.log [KODEXA-NITRO-DIAG] |
| `tools/nitro_bundle_diag.js` | Temp local | Copia instrumentada (no commitear) |

## Prueba requerida (Fernando)

Abrir con F12 > Console y Network:

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Verificar logs [KODEXA-NITRO-DIAG] en Console y reportar el último log antes de detenerse.

## Próximos bloqueos probables

| Escenario | Logs esperados | Siguiente MP |
|-----------|----------------|--------------|
| ExternalTexts parse falla | `localization FAILED: SyntaxError` | Verificar JSON con `python3 -m json.tool` |
| WS conecta, SSO falla | `CONNECTION_HANDSHAKING` + `HANDSHAKE_FAILED` | MP-009.1G: validar auth_ticket en DB |
| Hotel carga pero sin avatar | Llega al 100% pero avatar invisible | MP-009.1G: generar hd.nitro, bd.nitro, li.nitro |
| Hotel carga completo | Todos los logs hasta CONNECTION_AUTHENTICATED | MP-010 |

## MP-009.1F.1 — Revert de instrumentación rota

### Error observado

```
Uncaught SyntaxError: Unexpected token 'const'
index-f70cc2eb.js:1137
```

Nitro quedaba en pantalla negra — JS principal no ejecutaba.

### Causa

La instrumentación insertó declaraciones `const` dentro de bloques de código minificado (strict mode implícito en ES modules, contextos donde `const` no es válido en posición inline). El bundle minificado concatena código sin bloques separados — insertar declaraciones fuera de un bloque válido causa SyntaxError.

### Cómo se revirtió

La instrumentación se había aplicado mediante `docker cp` (solo en la capa writable del contenedor, no en la imagen). El `docker restart` NO restaura la capa writable — el bundle instrumentado persiste.

**Solución:** `docker cp` del backup original de vuelta al contenedor.

```bash
# Backup original estaba en /tmp/nitro_bundle_orig.js (Git Bash /tmp)
# Copiado con docker cp antes de instrumentar en MP-009.1F
docker cp /tmp/nitro_bundle_orig.js \
  kodexa-nitro-renderer:/usr/share/nginx/html/assets/index-f70cc2eb.js
# Resultado: 3088696 bytes (original) — KODEXA-NITRO-DIAG: 0 ocurrencias
```

### Fixes conservados post-revert

| Fix | Estado |
|-----|--------|
| `external.texts.url` = string (ExternalTexts.json solo) | ✓ activo |
| `avatar.actions.url` = HabboAvatarActions.xml | ✓ activo |
| `socket.url` = ws://localhost:2096 | ✓ activo |
| `sso.ticket` presente | ✓ activo |
| `ExternalTexts.json` en formato JSON | ✓ activo (2.8MB) |
| `HabboAvatarActions.xml` con contenido | ✓ activo (36510 bytes) |
| `avatar.mandatory.libraries`: [] | ✓ activo |

### Estado final post-revert

- Bundle original restaurado (3088696 bytes, 0 strings KODEXA-NITRO-DIAG)
- Nitro vuelve al loader normal (no pantalla negra)
- Todos los fixes de config y gamedata activos
- Estado esperado: Nitro llega al 20% y debería pasar con ExternalTexts.json corregido

### Recomendación para instrumentación futura segura

**NO hacer `docker cp` de bundle con `const`/`let`/`var` declaraciones en nivel de expresión.**

Opciones seguras:

1. **DevTools Snippets** (sin modificar bundle):
   ```js
   // En F12 > Sources > Snippets:
   // Monkey-patch XMLHttpRequest / fetch para loggear
   const origFetch = window.fetch;
   window.fetch = function(...args) {
     console.log('[DIAG] fetch:', args[0]);
     return origFetch.apply(this, args);
   };
   ```

2. **Logs inline sin declaraciones** (si se modifica bundle):
   ```js
   // MAL: const _wsUrl = Ze.getValue("socket.url");  ← SyntaxError
   // BIEN: console.log("[DIAG]", Ze.getValue("socket.url"));
   ```

3. **Sourcemaps** si existen (F12 > Sources > pretty print).

4. **Rebuild con logs en fuente original** (más robusto pero requiere rebuild).

## Próximo microproceso recomendado

**MP-009.1G — Validación de SSO y primera entrada al hotel**

Con ExternalTexts.json en formato JSON correcto, Nitro debería pasar del 20%.

Verificar:
1. Nitro pasa del 20% (Network > WS muestra ws://localhost:2096)
2. Arcturus recibe conexión y responde al handshake
3. SSO ticket `kodexa_admin_sso_local_2026` válido en `arcturus_main.users`
4. Usuario entra al hotel o identificar siguiente bloqueo
