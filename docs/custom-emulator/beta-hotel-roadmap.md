# Roadmap Hotel Beta — Kodexa Custom Emulator

**Propósito:** Guía de implementación del emulador TypeScript propio de Kodexa Hotel.

> **Nota MP-006:** `/hotel-beta` es el **laboratorio del motor custom**, no el camino comercial principal.
> El camino a producción va por: `/desarrollo` (Arcturus Dev) → `/hotel` (Arcturus Main).
> El Custom Emulator es investigación técnica propia de Kodexa, acceso solo FOUNDER.

---

## Estado actual (post MP-001 → MP-005)

El emulador custom (`apps/emulator`) ya tiene:
- ✅ Conexión WebSocket (ws, puerto configurable via PORT/EMULATOR_WS_PORT)
- ✅ SSO ticket auth (one-time, cleared after use)
- ✅ Session manager (conectados/desconectados)
- ✅ Chat básico (ROOM_CHAT, ROOM_SHOUT)
- ✅ Navigator search
- ✅ Room entry (EnterRoomHandler)
- ✅ Movement / pathfinding (MoveHandler + pathfinding.ts)
- ✅ Heartbeat (ping/pong cada 30s)
- ✅ Broadcast a sala (roomManager)
- ✅ BETA_MODE — validación FOUNDER rank ≥ 10 en WebSocket (MP-002)
- ✅ Script `dev:beta` — corre en puerto 2097 con BETA_MODE=true
- ✅ Script `dev:beta:win` — compatibilidad Windows cmd.exe (MP-003)
- ✅ SSO ticket se consume al rechazar por rank — no reutilizable contra WS principal (MP-003)
- ✅ Audit log en `kx_activity_log` al rechazar acceso beta por rank (MP-003)
- ✅ `sanitizeWsUrl()` — valida `?ws=` param: solo ws:// / wss:// (MP-003)
- ✅ `KxActivityLog` añadido al schema Prisma del emulador (MP-003)
- ✅ Whitelist de hosts `VITE_ALLOWED_WS_HOSTS` — rechaza `?ws=` a hosts externos (MP-004)
- ✅ Rate limiting por IP en WebSocket — `WS_CONNECTION_RATE_LIMIT_MAX/WINDOW_MS` (MP-004)
- ✅ Rate limiting SSO beta por userId — `BETA_SSO_DENY_LIMIT_MAX/WINDOW_MS` (MP-004)
- ✅ IP incluida en `GameSession` y en audit log `kx_activity_log` (MP-004)
- ✅ Soporte `X-Forwarded-For` para IP real detrás de Nginx/proxy (MP-004)
- ✅ Cleanup periódico `connectionRateMap` + `betaDenyMap` — evita crecimiento de memoria (MP-005)
- ✅ Health endpoint `GET /health` vía `node:http` — sin dependencias nuevas (MP-005)
- ✅ `HEALTH_PORT` configurable (default 3096 main / 3097 beta) (MP-005)
- ✅ `WS_RATE_LIMIT_CLEANUP_INTERVAL_MS` configurable (default 5 min) (MP-005)

**En arquitectura dual:**
- Hotel Principal usa port 2096 (Arcturus futuro, actualmente custom)
- Hotel Beta usa port 2097 con BETA_MODE=true (custom emulator)

---

## Módulos por implementar — orden de paridad

El orden prioriza comparar comportamiento contra Arcturus módulo a módulo.

### Fase 1 — Chat completo
- [ ] Whisper (chat privado en sala)
- [ ] Chat bubbles con gestos del avatar
- [ ] Flood protection (rate limit por usuario)
- [ ] Word filter básico

### Fase 2 — Navigator completo
- [ ] Listado de salas populares
- [ ] Búsqueda por nombre y categoría
- [ ] Creación de salas (CreateRoomHandler)
- [ ] Metadatos de sala (nombre, descripción, capacidad, owner)

### Fase 3 — Room entry completo
- [ ] Heightmap parsing correcto (modelo ASCII)
- [ ] Stacking de tiles (z-index)
- [ ] Door position
- [ ] Room password (salas privadas)
- [ ] Capacity check (rechazar si lleno)

### Fase 4 — Movement / Pathfinder
- [ ] Pathfinder A* ya existe — validar edge cases
- [ ] Colisión con otros usuarios
- [ ] Rolling (animación diagonal)
- [ ] Sit/Stand en sillas
- [ ] Wave / wave gesture

### Fase 5 — Inventario
- [ ] UserInventory: cargar items del usuario desde DB
- [ ] InventoryHandler (list, add, remove)
- [ ] Item serialization al cliente
- [ ] Paginación de inventario

### Fase 6 — Catálogo
- [ ] CatalogManager: páginas y items
- [ ] CatalogHandler (open page, buy item)
- [ ] Purchase validation (credits suficientes)
- [ ] Purchase flow: deducir credits → add item to inventory → broadcast

### Fase 7 — Furnis (muebles en sala)
- [ ] RoomItem: posición, rotación, estado
- [ ] PlaceFurni / MoveFurni / PickupFurni
- [ ] FurniInteract (toggle estados)
- [ ] Persistencia en DB

### Fase 8 — Wired
- [ ] WiredTrigger / WiredCondition / WiredAction
- [ ] WiredManager
- [ ] Node graph de scripting visual (data en DB)
- [ ] Evaluación de scripts en tiempo real

### Fase 9 — Moderación y permisos
- [ ] Kick / Ban / Mute handlers
- [ ] ModerationManager
- [ ] Room bans
- [ ] Auto-moderation (NLP, future)
- [ ] Admin packet handlers

---

## Cómo comparar contra Arcturus

1. **Captura de paquetes**: Usar Wireshark o un proxy TCP para capturar packets entre Nitro Client y Arcturus.
2. **Comparar IDs**: Verificar que los packet IDs en `packages/protocol/src/PacketIds.ts` coincidan con los de Arcturus Morningstar.
3. **Comparar payload**: Validar orden de campos (int/string) contra el código Java de Arcturus.
4. **Testing manual**: Crear test rooms en el Hotel Beta y reproducir el mismo flujo en el Hotel Principal.
5. **Logs comparativos**: El logger del emulador custom debe logear todos los packets recibidos/enviados en modo DEBUG.

---

## Criterio de migración a producción

El emulador custom reemplaza a Arcturus como hotel principal cuando:
- [ ] Paridad funcional en fases 1-7 verificada por Diego
- [ ] 100 conexiones simultáneas sin degración
- [ ] Sin memory leaks en 24h de uptime
- [ ] Room persistence correcta tras restart
- [ ] SSO + auth + permisos auditados por Diego

La decisión final la toma Diego. No migrar sin aprobación explícita.
