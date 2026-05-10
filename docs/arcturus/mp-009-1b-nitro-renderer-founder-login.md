# MP-009.1B — Build/Servir Nitro Renderer + Login Admin Founder

> **Fecha:** 2026-05-10
> **Estado:** Nitro renderer operativo — login pendiente validación manual en navegador
> **Prerequisito:** MP-009.1A (admin rank 10 con auth_ticket)

---

## Resultado

| Componente | Estado |
|-----------|--------|
| Nitro renderer Docker build | ✅ Completado (kodexa-nitro:latest, 98.9MB) |
| Nitro corriendo en puerto 8081 | ✅ http://localhost:8081 |
| renderer-config.json montado | ✅ asset.url corregida |
| ui-config.json montado | ✅ |
| WebSocket Arcturus (2096) | ✅ LISTENING |
| WS acepta conexión desde origin :8081 | ✅ confirmado |
| Furniture assets (.nitro) CORS | ✅ Access-Control-Allow-Origin: * |
| Furniture assets match furnidata | ✅ (shelves_norja.nitro etc.) |
| hotel.name actualizado | ✅ "Kodexa Hotel" |
| hotel.home.room configurado | ✅ room 50 (Dark Elegant Bundle) |
| Login manual en navegador | ⬜ Pendiente — ver URL abajo |

---

## URL de prueba

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Nitro lee el ticket desde: `new URLSearchParams(window.location.search).get("sso")`

---

## Nitro Renderer — Localización

| Campo | Valor |
|-------|-------|
| Dockerfile | `external/arcturus/nitro-docker/nitro/Dockerfile` |
| Repositorio | https://github.com/Gurkengewuerz/nitro.git |
| Commit | 33ff182 (branch main) |
| Docker image | `kodexa-nitro:latest` (98.9MB) |
| Container | `kodexa-nitro-renderer` |
| Puerto | 8081 |
| Build command | `docker build -t kodexa-nitro ./external/arcturus/nitro-docker/nitro/` |

---

## Comandos ejecutados

```bash
# Build (usa cache si ya existe)
docker build -t kodexa-nitro ./external/arcturus/nitro-docker/nitro/

# Run con configs locales
docker run -d --name kodexa-nitro-renderer -p 8081:80 \
  -v "$(pwd)/external/arcturus/nitro-docker/nitro/nginx.conf:/etc/nginx/conf.d/default.conf" \
  -v "$(pwd)/external/arcturus/objectretros/nitro/renderer-config.local.json:/usr/share/nginx/html/renderer-config.json" \
  -v "$(pwd)/external/arcturus/objectretros/nitro/ui-config.local.json:/usr/share/nginx/html/ui-config.json" \
  kodexa-nitro

# Actualizar hotel settings
docker exec kodexa-db mysql -u kodexa -pkodexa_pass_change_me arcturus_main -e "
  UPDATE emulator_settings SET value='Kodexa Hotel' WHERE key='hotel.name';
  INSERT INTO emulator_settings (key, value) VALUES ('hotel.home.room', '50')
  ON DUPLICATE KEY UPDATE value='50';
"

# Reiniciar Arcturus (cargar nuevos settings)
# Kill: powershell -Command "Get-Process java | Stop-Process -Force"
# Start: cd external/arcturus/objectretros/emulator && java -Dfile.encoding=UTF8 -jar Habbo-3.5.5-jar-with-dependencies.jar
```

---

## Configuración aplicada

### renderer-config.local.json — cambios respecto a MP-009

```json
// ANTES (MP-009)
"asset.url": "http://localhost:8080",
"gamedata.url": "${asset.url}",
// → URLs resultaban en 404 (nginx sirve desde /assets/)

// DESPUÉS (MP-009.1B)
"asset.url": "http://localhost:8080/assets",
"gamedata.url": "${asset.url}/gamedata",
// → URLs correctas confirmadas con 200
```

**URLs verificadas 200:**
- `http://localhost:8080/assets/gamedata/FigureData.xml` ✅
- `http://localhost:8080/assets/gamedata/FigureMap.xml` ✅
- `http://localhost:8080/assets/gamedata/EffectMap.xml` ✅
- `http://localhost:8080/assets/gamedata/FurnitureData.json` ✅
- `http://localhost:8080/assets/gamedata/ExternalTexts.json` ✅
- `http://localhost:8080/assets/nitro/furniture/nitro/shelves_norja.nitro` ✅
- `http://localhost:8080/assets/nitro/clothes/nitro/Hair_F_Bob.nitro` ✅

### emulator_settings modificados

| Key | Antes | Después |
|-----|-------|---------|
| `hotel.name` | "Habbo Hotel" | "Kodexa Hotel" |
| `hotel.home.room` | 0 (ninguno) | 50 (Dark Elegant Bundle) |

---

## Estado de assets

### Furniture ✅ Funcionará

| Métrica | Valor |
|---------|-------|
| .nitro files en assets | 10,558 |
| Entradas en FurnitureData.json | 16,881 |
| Ejemplo verificado | shelves_norja.nitro → 200 |
| CORS | Access-Control-Allow-Origin: * |

Furniture rendering debería funcionar en Nitro.

### Figure (Avatar) ⚠️ No compatible con Nitro estándar

| Problema | Detalle |
|---------|---------|
| Naming convention | Custom Kodexa: `Hair_F_Bob.nitro`, `hair_F_backbun.nitro` |
| Habbo estándar esperado | `hd.nitro`, `hr-115.nitro`, `ch-3030.nitro` |
| FigureMap.xml libs | Apuntan a nombres personalizados, no a `hr-115` |
| Resultado | Avatares no renderizarán con look estándar Habbo |

**Impacto:** Avatar del admin (`hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804`) no renderizará visualmente. Login y WebSocket funcionan independientemente.

**Causa raíz:** Los assets figura en `/assets/nitro/clothes/nitro/` son assets custom del Kodexa custom client (`apps/client`), no los assets estándar Habbo que usa el Nitro renderer.

---

## Arquitectura de puertos final (MP-009.1B)

| Puerto | Protocolo | Qué | Estado |
|--------|-----------|-----|--------|
| 2096 | WebSocket | Arcturus Main (NitroWebsockets) | ✅ ACTIVO |
| 3005 | TCP | Arcturus Main game socket | ✅ ACTIVO |
| 3002 | TCP | Arcturus Main RCON | ✅ ACTIVO |
| 3306 | MySQL | MariaDB Docker | ✅ ACTIVO |
| 6379 | Redis | Redis Docker | ✅ ACTIVO |
| 8080 | HTTP | kodexa-assets nginx | ✅ ACTIVO |
| 8081 | HTTP | kodexa-nitro-renderer nginx | ✅ ACTIVO (NUEVO) |
| 1338 | HTTP | kodexa-imager | ✅ ACTIVO |
| 3000 | HTTP | Next.js CMS | (si corriendo) |

---

## Logs relevantes Arcturus (startup con nuevos settings)

```
08:43:38.937 Permissions Manager -> Loaded! (17 MS) — 10 rangos
08:43:39.552 Item Manager -> Loaded! (581 MS) — 36,268/36,269 items
08:43:39.962 Catalog Manager -> Loaded! (356 MS)
08:43:40.163 Started GameServer on 0.0.0.0:3005@Game Server
08:43:40.165 Started GameServer on 127.0.0.1:3002@RCON Server
08:43:40.167 System launched in: 4144.7916ms
08:43:40.225 OFFICIAL PLUGIN - Nitro Websockets has started!
08:43:40.226 Nitro Websockets Listening on ws://0.0.0.0:2096
```

---

## Para probar en navegador

1. Asegurarse que Arcturus Main está corriendo (`netstat` muestra 2096/3005/3002 LISTENING)
2. Abrir navegador (Chrome/Firefox)
3. Navegar a: `http://localhost:8081/?sso=kodexa_admin_sso_local_2026`
4. Abrir DevTools (F12) → Console y Network
5. Observar:
   - Carga de renderer-config.json (XHR)
   - Carga de FurnitureData.json (XHR)
   - Carga de FigureData.xml (XHR)
   - WebSocket connect a ws://localhost:2096 (WS tab en Network)
   - Handshake packets (si `system.log.packets: true`)

**Resultado esperado:**
- Hotel view carga (pantalla de bienvenida Nitro)
- WebSocket conecta a ws://localhost:2096
- Auth ticket validado → usuario admin entra
- Avatar puede no renderizar (figura assets incompatibles)
- Navigator carga → 7 rooms disponibles
- Catálogo carga (1358 páginas)

---

## Problemas conocidos

| Problema | Causa | Fix |
|---------|-------|-----|
| Avatar no renderiza | Figure assets custom (no Habbo estándar) | MP-009.1C: obtener assets Habbo estándar |
| SSL websocket (wss://) no funciona | `ssl/key.pem` nombre incorrecto (plugin espera `privkey.pem`) | Fix: renombrar key.pem → privkey.pem |
| chat_bubbles table no existe | Tabla de duckietm-extended, no en BaseDB | Ignorar para dev |
| BadgeImager path Linux | Ruta /var/www/ en Windows | Ignorar para dev |

---

## Validaciones obligatorias

| Verificación | Estado |
|-------------|--------|
| kodexa_hotel sin modificar (26 tablas) | ✅ |
| arcturus_dev sin modificar (0 tablas) | ✅ |
| Prisma schema no tocado | ✅ |
| Migraciones no creadas | ✅ |
| seed.ts no tocado | ✅ |
| middleware.ts no tocado | ✅ |
| SSO Kodexa no tocado | ✅ |
| Auth Bridge no implementado | ✅ |
| CMS no tocado | ✅ |
| arcturus_main no reseteado | ✅ |
| admin sigue rank 10 | ✅ |
| auth_ticket = kodexa_admin_sso_local_2026 | ✅ |
| Arcturus Main activo (2096/3005/3002) | ✅ |
| external/ no en Git | ✅ |

---

## Archivos modificados/creados

| Archivo | Cambio |
|---------|--------|
| `external/arcturus/objectretros/nitro/renderer-config.local.json` | `asset.url` y `gamedata.url` corregidos a `/assets` prefix |
| `docs/arcturus/mp-009-1b-nitro-renderer-founder-login.md` | Este documento |

**emulator_settings modificados (DB, no archivos):**
- `hotel.name` → "Kodexa Hotel"
- `hotel.home.room` → 50

---

## Próximos pasos

### Si login funciona en navegador → MP-011
**Auth Bridge Kodexa → Arcturus Main**
- Endpoint `/api/sso` en CMS Next.js
- Genera auth_ticket dinámico en arcturus_main para usuario autenticado en kodexa_hotel
- Sincronización automática look, motto, rank en cada login
- Reemplaza auth_ticket estático `kodexa_admin_sso_local_2026`
- RCON integration (puerto 3002) para operaciones en tiempo real

### Si avatar no renderiza → MP-009.1C (paralelo u opcional)
**Obtener assets figura estándar Habbo**
- Descargar figura assets con `habbo-downloader` (nombres estándar: hd.nitro, hr-115.nitro, etc.)
- Reemplazar/complementar custom figure assets en `/assets/nitro/clothes/nitro/`
- Actualizar FigureData.xml y FigureMap.xml con los libs correctos
- Con assets correctos, avatar admin (`hr-115-42.hd-195-19...`) renderizará completo

### MP-010 (paralelo)
**Arcturus Dev** — Setup en puertos 2098 (WS), 3006 (TCP), 3003 (RCON) contra arcturus_dev
