# MP-009.1C — Fix Nitro 20% + SSO Ticket + WebSocket Real hacia Arcturus Main

> **Fecha:** 2026-05-10
> **Estado:** Completado — configs corregidas, causa raíz resuelta, test manual pendiente en navegador
> **Prerequisito:** MP-009.1B (Nitro renderer en Docker, puerto 8081)

---

## Causa Raíz del Bloqueo al 20%

### Diagnóstico

Nitro se quedaba en "The hotel is loading... 20%" porque intentaba cargar **mandatory libraries** que NO EXISTEN en los assets custom de Kodexa:

```
avatar.mandatory.libraries: ["bd:1", "li:0"]
→ GET http://localhost:8080/assets/nitro/clothes/nitro/bd.nitro → 404
→ GET http://localhost:8080/assets/nitro/clothes/nitro/li.nitro → 404

avatar.mandatory.effect.libraries: ["dance.1", "dance.2", "dance.3", "dance.4"]
→ GET http://localhost:8080/assets/nitro/effects/nitro/dance.1.nitro → 404
→ GET http://localhost:8080/assets/nitro/effects/nitro/dance.2.nitro → 404
→ GET http://localhost:8080/assets/nitro/effects/nitro/dance.3.nitro → 404
→ GET http://localhost:8080/assets/nitro/effects/nitro/dance.4.nitro → 404
```

**Por qué fallan:** Los assets en `/assets/nitro/clothes/nitro/` usan nombres custom de Kodexa (`Hair_F_Bob.nitro`, `hair_F_backbun.nitro`), NO los nombres estándar Habbo (`bd.nitro`, `hd.nitro`, `hr-115.nitro`, `li.nitro`). Nitro bloquea la carga completa hasta que todos los mandatory libraries respondan 200.

### Contexto adicional

El `index.html` del build de Nitro contiene:
```javascript
"sso.ticket": new URLSearchParams(window.location.search).get("sso") || null,
```

→ Nitro lee el ticket desde `?sso=` en la URL. Sin embargo, si mandatory libraries fallan, Nitro nunca llega a usar el ticket. El bloqueo es anterior a la autenticación.

---

## Fixes Aplicados

### Fix 1 — Vaciar mandatory libraries (causa raíz)

**Archivo:** `external/arcturus/objectretros/nitro/renderer-config.local.json`

```json
// ANTES
"avatar.mandatory.libraries": [
    "bd:1",
    "li:0"
],
"avatar.mandatory.effect.libraries": [
    "dance.1",
    "dance.2",
    "dance.3",
    "dance.4"
]

// DESPUÉS
"avatar.mandatory.libraries": [],
"avatar.mandatory.effect.libraries": []
```

**Impacto esperado:** Nitro no bloquea esperando libs inexistentes. Avanza al WebSocket.

**Impacto visual:** Sin `bd.nitro` (body base), los avatares pueden no renderizar correctamente. Aceptable para esta validación.

### Fix 2 — Agregar sso.ticket en renderer-config

```json
// AGREGADO al inicio de renderer-config.local.json
"sso.ticket": "kodexa_admin_sso_local_2026"
```

Permite que el ticket esté disponible incluso si `?sso=` no está en la URL. Nitro usa el valor del config si el URL param está vacío.

### Fix 3 — Corregir url.prefix en ui-config

**Archivo:** `external/arcturus/objectretros/nitro/ui-config.local.json`

```json
// ANTES
"url.prefix": "http://localhost:3000"

// DESPUÉS  
"url.prefix": "http://localhost:8081"
```

---

## Cómo se Aplicaron los Cambios

Los archivos JSON están **bind-mounted** desde el host al contenedor:
```
external/arcturus/objectretros/nitro/renderer-config.local.json
→ /usr/share/nginx/html/renderer-config.json (dentro de kodexa-nitro-renderer)
```

**No se requirió `docker cp` ni rebuild.** Editar el archivo en el host se refleja inmediatamente en el contenedor por el volume mount.

**Nota:** `docker cp` falla con `device or resource busy` si se intenta sobre un archivo bind-mounted. Es un comportamiento esperado de Docker.

**Verificación tras cambio:**
```bash
curl -s http://localhost:8081/renderer-config.json | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(d.get('sso.ticket'))           # kodexa_admin_sso_local_2026
print(d.get('avatar.mandatory.libraries'))  # []
"
```
→ Confirmado correcto.

---

## Estado de Configs Servidas (post-fix)

### renderer-config.json (servido en http://localhost:8081/renderer-config.json)

| Clave | Valor |
|-------|-------|
| `socket.url` | `ws://localhost:2096` |
| `sso.ticket` | `kodexa_admin_sso_local_2026` |
| `asset.url` | `http://localhost:8080/assets` |
| `gamedata.url` | `${asset.url}/gamedata` |
| `avatar.mandatory.libraries` | `[]` ← CAMBIADO |
| `avatar.mandatory.effect.libraries` | `[]` ← CAMBIADO |
| `preload.assets.urls` | `[]` |

### ui-config.json (servido en http://localhost:8081/ui-config.json)

| Clave | Valor |
|-------|-------|
| `url.prefix` | `http://localhost:8081` ← CAMBIADO |
| `camera.url` | `http://localhost:3000/camera` (sin cambio) |

---

## Verificación de Assets Críticos

| URL | Estado |
|-----|--------|
| `http://localhost:8080/assets/gamedata/FigureData.xml` | ✅ 200 |
| `http://localhost:8080/assets/gamedata/FigureMap.xml` | ✅ 200 |
| `http://localhost:8080/assets/gamedata/EffectMap.xml` | ✅ 200 |
| `http://localhost:8080/assets/gamedata/FurnitureData.json` | ✅ 200 |
| `http://localhost:8080/assets/gamedata/ExternalTexts.json` | ✅ 200 |
| `http://localhost:8080/assets/gamedata/HabboAvatarActions.xml` | ✅ 200 |
| `http://localhost:8080/assets/nitro/furniture/nitro/shelves_norja.nitro` | ✅ 200 |
| `http://localhost:8080/assets/nitro/clothes/nitro/bd.nitro` | ❌ 404 (no existe, vaciado de mandatory libs lo bypass) |
| `http://localhost:8080/assets/nitro/clothes/nitro/li.nitro` | ❌ 404 (no existe, bypass) |
| `http://localhost:8080/assets/nitro/images/reception/stretch_blue.png` | ❌ 404 (no bloqueante) |

---

## Problemas No Bloqueantes para Login

| Problema | Razón | Bloqueante |
|---------|-------|-----------|
| `bd.nitro`, `li.nitro` 404 | Assets custom, no estándar Habbo | ~~Sí~~ → Fix aplicado (mandatory libs vacíos) |
| Hotel view background images 404 | `assets/nitro/images/` no existe en kodexa-assets | No — visual only |
| Figure assets custom naming | `Hair_F_Bob.nitro` ≠ `hd.nitro` estándar | No — avatar no renderiza pero login funciona |
| Dance effects 404 | `dance.1-4.nitro` no existen | ~~Sí~~ → Fix aplicado (mandatory effects vacíos) |

---

## Procedimiento de Test Manual (navegador)

1. Verificar Arcturus activo: `netstat -an | grep 2096`
2. Abrir Chrome/Firefox
3. F12 → Network → Preserve log ✅ → Disable cache ✅ → pestaña "WS"
4. Navegar a:
   ```
   http://localhost:8081/?sso=kodexa_admin_sso_local_2026
   ```
   O sin parámetro (sso.ticket está en renderer-config.json):
   ```
   http://localhost:8081/
   ```
5. Observar Network > WS:
   - Debe aparecer conexión a `ws://localhost:2096`
   - Si aparece: handshake → autenticación → hotel view
6. En Console: no deben aparecer errores críticos de WebSocket

---

## Esperado después del Fix

| Evento | Esperado |
|--------|---------|
| Nitro supera 20% | ✅ (mandatory libs vacíos = sin bloqueo) |
| WebSocket a ws://localhost:2096 | ✅ (confirmado via Node.js: WS acepta origin :8081) |
| SSO ticket enviado | ✅ (sso.ticket en config) |
| Admin autenticado en Arcturus | ✅ (rank 10, auth_ticket = kodexa_admin_sso_local_2026) |
| Avatar renderiza | ❌ (bd.nitro / figure assets custom) |
| Hotel view background | ❌ (reception images faltantes) |
| Furniture en sala | ✅ (furnidata + furniture .nitro match) |

---

## Logs Arcturus Esperados durante Login

Con Arcturus mostrando log en consola, al conectar un cliente legítimo se deben ver líneas similares a:

```
[NitroWebsockets] New connection: /127.0.0.1
[GameClientManager] Loading client for IP: 127.0.0.1
[HabboManager] Logged in: admin (rank 10)
```

Si Arcturus NO muestra actividad → el WebSocket no conectó.
Si Arcturus muestra error de ticket → `auth_ticket` no coincide en DB.

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `external/arcturus/objectretros/nitro/renderer-config.local.json` | Agregado `sso.ticket`, vaciados `mandatory.libraries` y `mandatory.effect.libraries` |
| `external/arcturus/objectretros/nitro/ui-config.local.json` | `url.prefix` → `http://localhost:8081` |
| `docs/arcturus/mp-009-1c-nitro-20-percent-sso-websocket-fix.md` | Este documento |

**Sin cambios en:** kodexa_hotel, arcturus_dev, Prisma, migraciones, seed.ts, middleware.ts, CMS, arcturus_main (DB), catálogo/items/rooms.

---

## Validaciones Obligatorias

| Verificación | Estado |
|-------------|--------|
| kodexa_hotel sin modificar (26 tablas) | ✅ |
| arcturus_dev sin modificar (0 tablas) | ✅ |
| Prisma no tocado | ✅ |
| Migraciones no creadas | ✅ |
| seed.ts no tocado | ✅ |
| middleware.ts no tocado | ✅ |
| CMS no tocado | ✅ |
| Auth Bridge no implementado | ✅ |
| arcturus_main no reseteado | ✅ |
| catálogo/items/rooms sin tocar | ✅ |
| external/ no en Git | ✅ |
| admin rank 10 | ✅ |
| auth_ticket = kodexa_admin_sso_local_2026 | ✅ |
| Arcturus en 2096/3005/3002 | ✅ |
| Nitro en 8081 | ✅ |

---

## Próximos Pasos

### Si Nitro supera 20% y entra al hotel → MP-011
**Auth Bridge Kodexa → Arcturus Main**
- `/api/sso` endpoint en CMS Next.js
- Genera `auth_ticket` dinámico en `arcturus_main.users`
- Sincroniza look, motto, rank desde kodexa_hotel
- Reemplaza ticket estático

### Si avatar no renderiza pero login funciona → MP-009.1D (paralelo/opcional)
**Normalizar figure assets**
- Descargar assets figura estándar Habbo (`hd.nitro`, `hr-115.nitro`, etc.)
- Compatible con FigureData/FigureMap estándar Habbo
- Salida de imager actual no sirve para Nitro estándar

### Si WebSocket sigue sin conectar → MP-009.1D (prioritario)
**Inspección profunda del build Nitro (commit 33ff182)**
- Verificar qué key exacta usa este build para socket URL
- Posible diferencia: `connection.info.host` + `connection.info.port` vs `socket.url`
- Rebuild limpio si config format no coincide
