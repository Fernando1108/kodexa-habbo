# Arquitectura de 3 Entornos — Kodexa Hotel

**Decisión oficial (MP-006):** Kodexa Hotel opera con 3 entornos separados.

---

## Resumen

| Ruta | Nombre | Motor | Base de datos | Puerto WS | Acceso |
|------|--------|-------|--------------|-----------|--------|
| `/hotel` | Hotel Principal | Arcturus Main (futuro) | `arcturus_main` (futuro) | 2096 | Todos los usuarios autenticados |
| `/desarrollo` | Desarrollo | Arcturus Dev (futuro) | `arcturus_dev` (futuro) | 2098 | DEVELOPER (rank ≥ 9) + FOUNDER (rank ≥ 10) |
| `/hotel-beta` | Hotel Beta | Kodexa Custom Emulator | Compartida actual | 2097 | Solo FOUNDER (rank ≥ 10) |

---

## /hotel — Hotel Principal

- **Motor:** Arcturus Main (Morningstar). Aún no integrado.
- **Base de datos futura:** `arcturus_main` (base separada de dev).
- **Puerto WebSocket:** 2096.
- **Health futuro:** `http://localhost:3096/health`.
- **Acceso:** Cualquier usuario autenticado (rank ≥ 1).
- **Propósito:** Entorno de producción estable. Usuarios reales. Cambios solo tras validación.

### Variables relevantes
```env
NEXT_PUBLIC_MAIN_HOTEL_WS_URL="ws://localhost:2096"
NEXT_PUBLIC_MAIN_HOTEL_ENGINE="arcturus"
```

---

## /desarrollo — Entorno de Desarrollo

- **Motor:** Arcturus Dev (Morningstar). Aún no integrado.
- **Base de datos futura:** `arcturus_dev` (base aislada, sin afectar producción).
- **Puerto WebSocket:** 2098.
- **Health futuro:** `http://localhost:3098/health`.
- **Acceso:** DEVELOPER (rank ≥ 9) y FOUNDER (rank ≥ 10).
- **Propósito:** Probar catálogo, tiendas, furnis, updates y cambios técnicos antes de publicar en main.
- **Aislamiento:** Los cambios aquí NO afectan `/hotel`. Bases de datos completamente separadas.
- **Feature flag:** `NEXT_PUBLIC_ENABLE_DEV_HOTEL=false` oculta/deshabilita el entorno para todos.

### Variables relevantes
```env
NEXT_PUBLIC_DEV_HOTEL_WS_URL="ws://localhost:2098"
NEXT_PUBLIC_DEV_HOTEL_ENGINE="arcturus-dev"
NEXT_PUBLIC_ENABLE_DEV_HOTEL="true"
DEV_ALLOWED_RANK="9"
```

### Estado actual (MP-006)
- Ruta `/desarrollo` creada y protegida.
- Guard middleware: `canAccessDevelopment(rank)` = rank ≥ 9.
- Componente `HotelDesarrolloClient.tsx` preparado para iframe → ws://localhost:2098.
- Arcturus Dev NO integrado todavía. El entorno está "en preparación".

---

## /hotel-beta — Laboratorio Custom

- **Motor:** Kodexa Custom Emulator (TypeScript propio).
- **Base de datos:** Misma que el hotel actual (compartida).
- **Puerto WebSocket:** 2097.
- **Health:** `http://localhost:3097/health` (implementado MP-005).
- **Acceso:** Solo FOUNDER (rank ≥ 10).
- **Propósito:** Laboratorio privado del motor propio de Kodexa. No es el camino comercial principal — es el entorno de investigación del emulador custom.
- **Feature flag:** `NEXT_PUBLIC_ENABLE_BETA_HOTEL=false` oculta/deshabilita.

### Variables relevantes
```env
NEXT_PUBLIC_BETA_HOTEL_WS_URL="ws://localhost:2097"
NEXT_PUBLIC_BETA_HOTEL_ENGINE="kodexa-custom"
NEXT_PUBLIC_ENABLE_BETA_HOTEL="true"
BETA_ALLOWED_RANK="10"
```

---

## Reglas de acceso

| Rank | Rol | /hotel | /desarrollo | /hotel-beta | /admin |
|------|-----|--------|-------------|-------------|--------|
| 1–3 | USER | ✅ | ❌ | ❌ | ❌ |
| 4–6 | STAFF | ✅ | ❌ | ❌ | ✅ (rank ≥ 7) |
| 7–8 | ADMIN | ✅ | ❌ | ❌ | ✅ |
| 9 | DEVELOPER | ✅ | ✅ | ❌ | ✅ |
| 10+ | FOUNDER | ✅ | ✅ | ✅ | ✅ |

---

## Levantar entornos (futuro)

Cuando Arcturus esté integrado:

```bash
# Solo Hotel Principal
pnpm dev:emulator          # WS :2096

# Solo Desarrollo
pnpm dev:emulator:dev      # WS :2098 (pendiente de implementar)

# Custom Beta
pnpm dev:beta              # WS :2097, BETA_MODE=true

# Todo junto (futuro)
pnpm dev:hotel-full        # main :2096 + dev :2098 + beta :2097
```

`pnpm dev:hotel-full` se implementará cuando Arcturus esté integrado. No disponible todavía.

---

## Criterio de separación de bases de datos

| Base | Propósito |
|------|-----------|
| `kodexa_hotel` (actual) | Datos de todos los entornos hasta integración Arcturus |
| `arcturus_main` (futuro) | Producción. Solo cambios validados. |
| `arcturus_dev` (futuro) | Staging/testing. Puede resetearse. |

La separación de bases de datos ocurrirá cuando se integre Arcturus. Hasta entonces, todos los entornos comparten la misma DB.
