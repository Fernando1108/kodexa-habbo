# MP-009.1G — Fix Nitro 80%: XML gamedata → JSON + avatar.default keys

## Estado inicial

Nitro llegaba al 80% (WebSocket conectado, admin autenticado) pero fallaba con:

```
[Nitro] XML file configuration is no longer supported
TypeError: Cannot read properties of null (reading 'entries')
SyntaxError: Unexpected token '<'
```

Errores relacionados con:
- `avatar.actions.url` → `HabboAvatarActions.xml` → `JSON.parse(xml)` → SyntaxError
- `avatar.figuredata.url` → `FigureData.xml` → `JSON.parse(xml)` → SyntaxError
- `avatar.figuremap.url` → `FigureMap.xml` → `JSON.parse(xml)` → SyntaxError
- `avatar.effectmap.url` → `EffectMap.xml` → `JSON.parse(xml)` → SyntaxError
- `avatar.default.figuredata` ausente → `loadFigureData()` retorno temprano
- `avatar.default.actions` ausente → avatar sin acciones
- `pet.types` ausente → TypeError en `.entries()` null

## Causa raíz

Nitro 1.6.6+ NO soporta XML para ningún gamedata de avatar/efectos. Todos los parsers usan `JSON.parse(responseText)` via XMLHttpRequest. El renderer-config apuntaba a archivos XML que causaban SyntaxError silencioso.

### Flujo exacto de cada parser (desde bundle)

```js
// avatar.actions.url
t.open("GET", Ze.getValue("avatar.actions.url"));
t.onloadend = s => { this._structure.updateActions(JSON.parse(t.responseText)) }

// avatar.figuredata.url (clase gE)
t.open("GET", e);
t.onloadend = s => { this._dataReceiver.appendJSON(JSON.parse(n)) }

// avatar.figuremap.url
e.open("GET", Ze.getValue("avatar.figuremap.url"));
const s = JSON.parse(e.responseText);
this.processFigureMap(s.libraries)

// avatar.effectmap.url
e.open("GET", Ze.getValue("avatar.effectmap.url"));
const s = JSON.parse(e.responseText);
this.processEffectMap(s.effects)

// avatar.default.figuredata (loadFigureData)
const e = Ze.getValue("avatar.default.figuredata");
if (!e || typeof e === "string") {
  Ue.error("XML figuredata is no longer supported");
  return;  // EARLY RETURN si es null o string
}

// pet.types
for (const [t, s] of Ze.getValue("pet.types").entries()) this._pets[s] = t
// → TypeError si pet.types es null
```

## Archivos JSON encontrados

Todos disponibles en `external/arcturus/objectretros/nitro/nitro-assets/gamedata/`:

| Archivo | Tamaño | Top keys |
|---------|--------|----------|
| `HabboAvatarActions.json` | 25,649 bytes | `actions`, `actionOffsets` |
| `FigureData.json` | 1,369,321 bytes | `palettes`, `setTypes` |
| `FigureMap.json` | 497,331 bytes | `libraries` |
| `EffectMap.json` | 12,382 bytes | `effects` |

## Fix aplicado

### 1. Copiar JSON a assets/gamedata/

```bash
cp external/arcturus/objectretros/nitro/nitro-assets/gamedata/HabboAvatarActions.json assets/gamedata/
cp external/arcturus/objectretros/nitro/nitro-assets/gamedata/FigureData.json assets/gamedata/
cp external/arcturus/objectretros/nitro/nitro-assets/gamedata/FigureMap.json assets/gamedata/
cp external/arcturus/objectretros/nitro/nitro-assets/gamedata/EffectMap.json assets/gamedata/
```

XML origiales NO eliminados — siguen en `assets/gamedata/`.

### 2. Actualizar renderer-config.local.json

**Antes:**
```json
"avatar.actions.url": "${gamedata.url}/HabboAvatarActions.xml",
"avatar.figuredata.url": "${gamedata.url}/FigureData.xml",
"avatar.figuremap.url": "${gamedata.url}/FigureMap.xml",
"avatar.effectmap.url": "${gamedata.url}/EffectMap.xml"
```

**Después:**
```json
"avatar.actions.url": "${gamedata.url}/HabboAvatarActions.json",
"avatar.figuredata.url": "${gamedata.url}/FigureData.json",
"avatar.figuremap.url": "${gamedata.url}/FigureMap.json",
"avatar.effectmap.url": "${gamedata.url}/EffectMap.json"
```

**Añadido:**
```json
"avatar.default.figuredata": {"palettes":[...],"setTypes":[...]},
"avatar.default.actions": {...},
"pet.types": ["dog","cat","croco","terrier","bear","pig","lion","rhino","spider","turtle",
              "chicken","frog","dragon","monster","monkey","horse","monsterplant",
              "bunnyeaster","bunnyevil","bunnydepressed","bunnylove","pigeongood",
              "pigeonevil","demonmonkey","bearbaby","terrierbaby","gnome","leprechaun",
              "kittenbaby","puppybaby","pigletbaby","haloompa","fools",
              "pterosaur","velociraptor","cow","dragondog"]
```

`avatar.default.figuredata` y `avatar.default.actions` copiados directamente de `external/arcturus/objectretros/nitro/renderer-config.json` (referencia completa).

### 3. Validación endpoints

| Endpoint | HTTP | Bytes |
|---------|------|-------|
| `HabboAvatarActions.json` | 200 | 25,649 |
| `FigureData.json` | 200 | 1,369,321 |
| `FigureMap.json` | 200 | 497,331 |
| `EffectMap.json` | 200 | 12,382 |

## Flujo esperado post-fix

```
80%  → NitroApp.init()
       ├─ loadFigureData() → avatar.default.figuredata (objeto, no null/string) ✓
       │   └─ gE: fetch FigureData.json → JSON.parse ✓
       ├─ loadActions() → avatar.default.actions (objeto) + HabboAvatarActions.json ✓
       ├─ fetch FigureMap.json → JSON.parse → s.libraries ✓
       ├─ fetch EffectMap.json → JSON.parse → s.effects ✓
       └─ pet.types.entries() → array de 37 pets ✓
100% → ENGINE_INITIALIZED
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

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `assets/gamedata/HabboAvatarActions.json` | Nuevo (25KB) |
| `assets/gamedata/FigureData.json` | Nuevo (1.37MB) |
| `assets/gamedata/FigureMap.json` | Nuevo (497KB) |
| `assets/gamedata/EffectMap.json` | Nuevo (12KB) |
| `external/arcturus/objectretros/nitro/renderer-config.local.json` | 4 URLs XML→JSON + 3 keys nuevas |

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Verificar en F12 > Console:
- [ ] Sin error "XML file configuration is no longer supported"
- [ ] Sin TypeError `.entries()` de null
- [ ] Sin SyntaxError en gamedata JSON
- [ ] Nitro pasa del 80% → 100%
- [ ] Pantalla del hotel visible

## Próximo microproceso: MP-009.1H

Si Nitro llega al 100%:
- Verificar que el avatar se renderiza correctamente
- Si avatar invisible → `hd.nitro`, `bd.nitro`, `li.nitro` ausentes en `assets/nitro/clothes/nitro/`
- Generar o copiar `.nitro` base de avatar → MP-009.1H

Si se queda en 80-100%:
- Documentar último error en console
- Identificar si es `hd.nitro` 404 vs otro bloqueo
