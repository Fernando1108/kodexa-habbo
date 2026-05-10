# MP-009.1E — Fix bloqueo Nitro 20%: external.texts.url contiene XML parseado como JSON

## Estado inicial

Nitro Renderer seguía congelado en **"The hotel is loading 20%..."** después de:
- MP-009.1C: configuró `avatar.mandatory.libraries: []`, `sso.ticket`, `url.prefix`
- MP-009.1D: corrigió `HabboAvatarActions.xml` de 0 bytes → 36,510 bytes

## Servicios confirmados activos

| Servicio | Puerto | Estado |
|---------|--------|--------|
| `kodexa-nitro-renderer` | 8081 | Up |
| `kodexa-assets` | 8080 | Up |
| `kodexa-db` | 3306 | Up (healthy) |
| `kodexa-redis` | 6379 | Up (healthy) |
| Arcturus Morningstar (Java) | 2096 / 3005 / 3002 | Up (PID 39700) |

## Análisis del bundle Nitro

### Método de análisis

Se inspeccionó directamente `/usr/share/nginx/html/assets/index-f70cc2eb.js` (3.08 MB) servido por el contenedor `kodexa-nitro-renderer`.

### Hallazgo 1 — Mapa exacto de fases de carga

```js
switch(g.type) {
  case Ya.LOADED:               // "NCE_LOADED" — configs loaded
    tt().localization.init()   // inicia carga de ExternalTexts.json
    c(m => m + 20)             // → 0 + 20 = 20%
    
  case qd.LOADED:               // "NLE_LOADED" — localization loaded
    await Xn().downloadAssets(p)  // descarga preload.assets.urls (vacío)
      ? (wg().init(), c(T => T + 20))  // → 20 + 20 = 40% + WS INICIA
      : error

  case Si.CONNECTION_HANDSHAKING:  // WS conectando
    c(m => m + 20)             // → 40 + 20 = 60%

  case Si.CONNECTION_AUTHENTICATED:  // SSO validado
    c(m => m + 20)             // → 60 + 20 = 80%
    tt().init()                 // NitroApp.init()

  case bt.ENGINE_INITIALIZED:  // Room Engine listo
    c(m => m + 20)             // → 80 + 20 = 100%
}
```

**El 20% equivale exactamente a: configuración cargada.**

El siguiente paso es que `qd.LOADED` (localization loaded) dispare. Eso nunca ocurría.

### Hallazgo 2 — Cómo carga Rme (LocalizationManager) los textos

```js
loadLocalizationFromURL(e) {
  fetch(e)
    .then(t => t.json())   // ← SIEMPRE parsea como JSON
    .then(t => this.onLocalizationLoaded(t, e))
    .catch(t => this.onLocalizationFailed(t))  // ← silencioso, no dispara LOADED
}
```

El `LocalizationManager` carga **todas las URLs** de `external.texts.url` como JSON usando `.json()`. No hay manejo especial por extensión.

### Hallazgo 3 — external.texts.url contenía HabboAvatarActions.xml

```json
"external.texts.url": [
  "${gamedata.url}/ExternalTexts.json",
  "${gamedata.url}/HabboAvatarActions.xml"
]
```

Flujo de error:
1. Nitro fetches `ExternalTexts.json` → `.json()` → ✓ parsea OK
2. Nitro fetches `HabboAvatarActions.xml` → `.json()` → **SyntaxError: XML ≠ JSON**
3. `.catch()` llama `onLocalizationFailed()` → **`qd.LOADED` nunca se dispara**
4. Stuck en 20% → `wg().init()` nunca se llama → **WebSocket nunca se crea**

### Hallazgo 4 — WebSocket sí funciona (no era el problema)

Test de la firma del WS handshake con `Origin: http://localhost:8081`:

```
curl -H "Origin: http://localhost:8081" -H "Upgrade: websocket" ... http://localhost:2096/
→ HTTP/1.1 101 Switching Protocols
```

Arcturus acepta la conexión desde `http://localhost:8081`. El whitelist (`localhost,127.0.0.1`) incluye `localhost` y Arcturus lo valida por substring. El problema era solo que el WS nunca se intentaba crear.

### Hallazgo 5 — WebSocket iniciado por `wg().init()` post-localization

```js
function wg() { return tt()?.communication }  // returns NitroCommunicationManager
```

`wg().init()` → `NitroCommunicationManager.onInit()` → `new WebSocket(socket.url)` → conexión a `ws://localhost:2096`.

Esto solo se llama dentro del handler de `qd.LOADED`, que requiere que localization cargue sin error.

## Causa raíz

**`external.texts.url` era un array que incluía `HabboAvatarActions.xml`.** Nitro parsea todas las URLs de este array como JSON. El XML causaba un SyntaxError silencioso que cortaba el flujo de carga antes de que `qd.LOADED` se disparara, impidiendo el inicio del WebSocket.

## Fix aplicado

**Archivo:** `external/arcturus/objectretros/nitro/renderer-config.local.json`

**Antes:**
```json
"external.texts.url": [
  "${gamedata.url}/ExternalTexts.json",
  "${gamedata.url}/HabboAvatarActions.xml"
],
```

**Después:**
```json
"external.texts.url": "${gamedata.url}/ExternalTexts.json",
```

`HabboAvatarActions.xml` sigue referenciado correctamente en:
```json
"avatar.actions.url": "${gamedata.url}/HabboAvatarActions.xml"
```

Este path es procesado por el parser XML del AvatarManager, no por el LocalizationManager.

**No se requirió restart.** El archivo es bind-mount de nginx; el cambio es inmediato.

## Validación post-fix

### renderer-config.json servido (HTTP 200)

```json
{
  "socket.url": "ws://localhost:2096",
  "sso.ticket": "kodexa_admin_sso_local_2026",
  "external.texts.url": "${gamedata.url}/ExternalTexts.json",
  "avatar.actions.url": "${gamedata.url}/HabboAvatarActions.xml",
  "avatar.mandatory.libraries": [],
  "preload.assets.urls": []
  ...
}
```

### Gamedata endpoints

| Endpoint | Status | Bytes |
|---------|--------|-------|
| ExternalTexts.json | 200 | 3,523,084 |
| HabboAvatarActions.xml | 200 | 36,510 |
| FurnitureData.json | 200 | 8,549,278 |
| ProductData.json | 200 | 2,695,300 |
| FigureData.xml | 200 | 1,050,832 |
| FigureMap.xml | 200 | 423,542 |
| EffectMap.xml | 200 | 16,227 |

## Flujo esperado post-fix

```
0%   → configs load (renderer-config.json, ui-config.json)
20%  → NCE_LOADED: localization.init() → fetch ExternalTexts.json → JSON parse ✓
40%  → NLE_LOADED: preload assets (vacío) → wg().init() → new WebSocket(ws://localhost:2096)
60%  → CONNECTION_HANDSHAKING: Arcturus recibe conexión
80%  → CONNECTION_AUTHENTICATED: SSO ticket validado → NitroApp.init()
100% → ENGINE_INITIALIZED: Room Engine listo
```

## Prueba requerida (Fernando)

Abrir en navegador con DevTools (F12):

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Verificar:
- [ ] Nitro pasa del 20%
- [ ] Network > WS muestra `ws://localhost:2096`
- [ ] Console no muestra errores rojos (o documentar si los hay)
- [ ] Si llega a otro % → documentar el nuevo bloqueo

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

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `external/arcturus/objectretros/nitro/renderer-config.local.json` | `external.texts.url` array → string (solo ExternalTexts.json) |
| `assets/gamedata/HabboAvatarActions.xml` | (MP-009.1D) 0 bytes → 36,510 bytes |

## Próximo bloqueo probable

Una vez que Nitro pase del 20%, el siguiente bloqueo probable es en la fase de **WebSocket / SSO**:

| Escenario | Síntoma | Siguiente MP |
|-----------|---------|--------------|
| SSO ticket inválido o expirado | `CONNECTION_HANDSHAKE_FAILED` en console | MP-009.1F: validar `auth_ticket` en `arcturus_main.users` |
| Arcturus no envía paquete esperado | Stuck en 40-60% | MP-009.1F: revisar protocolo handshake Arcturus |
| `hd.nitro` missing → avatar invisible | Entra al hotel pero sin avatar | MP-009.1G: generar libs base de avatar |
| Hotel carga completo | ✓ DONE | MP-010 |

## Próximo microproceso recomendado

**MP-009.1F — Validación de SSO y autenticación WebSocket**

Confirmar:
1. Nitro pasó del 20% (Network > WS muestra ws://localhost:2096)
2. Arcturus recibe la conexión y responde al handshake
3. SSO ticket `kodexa_admin_sso_local_2026` existe y es válido en `arcturus_main.users`
4. Usuario entra al hotel o se identifica el siguiente bloqueo
