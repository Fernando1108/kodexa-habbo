# Entorno de Desarrollo — Arcturus Dev

**Estado:** PREPARADO (Arcturus Dev aún no integrado)  
**Ruta:** `/desarrollo`  
**Puerto WS futuro:** 2098  
**Acceso:** DEVELOPER (rank ≥ 9) + FOUNDER (rank ≥ 10)

---

## Propósito

El entorno `/desarrollo` es el staging técnico de Kodexa Hotel.

Su función es permitir a developers y founders:
- Probar nuevas versiones de catálogo antes de publicar en main.
- Configurar tiendas, precios y furnis sin afectar usuarios reales.
- Validar plugins, wired scripts y mecánicas de sala.
- Hacer migraciones y cambios de schema en una base de datos aislada.
- Reproducir bugs reportados en producción en un entorno controlado.

---

## Arquitectura prevista

```
Arcturus Dev (Morningstar)
  ├── Motor:    Arcturus Morningstar (misma versión que main, rama dev)
  ├── Base:     arcturus_dev (base de datos aislada)
  ├── Puerto:   2098 (WebSocket)
  ├── Health:   3098 (HTTP /health — cuando se implemente)
  └── Config:   config/emulator.ini separado de main
```

**Importante:** `arcturus_dev` es una base de datos completamente separada de `arcturus_main`.
Un reset en `arcturus_dev` NO afecta producción.

---

## Estado actual (MP-006)

- [x] Ruta `/desarrollo` creada en Next.js.
- [x] Guard middleware `canAccessDevelopment(rank >= 9)` activo.
- [x] `HotelDesarrolloClient.tsx` preparado — usa iframe a `ws://localhost:2098`.
- [x] Variables de entorno definidas (`NEXT_PUBLIC_DEV_HOTEL_WS_URL`, `NEXT_PUBLIC_ENABLE_DEV_HOTEL`).
- [ ] Arcturus Dev no instalado todavía.
- [ ] Base de datos `arcturus_dev` no creada todavía.
- [ ] Script `pnpm dev:emulator:dev` no implementado todavía.
- [ ] Health endpoint en puerto 3098 no implementado todavía.

---

## Lo que NO hace este entorno

- No usa `arcturus_main` ni la base de producción.
- No afecta a usuarios del `/hotel` principal.
- No reemplaza al Custom Emulator (`/hotel-beta`). Son entornos distintos con propósitos distintos.

---

## Diferencia entre /hotel-beta y /desarrollo

| Aspecto | `/hotel-beta` | `/desarrollo` |
|---------|--------------|---------------|
| Motor | Kodexa Custom (TypeScript) | Arcturus Dev (Java) |
| Propósito | Laboratorio del motor propio | Staging de features para producción |
| Acceso | Solo FOUNDER (rank ≥ 10) | DEVELOPER + FOUNDER (rank ≥ 9) |
| DB | Compartida actual | `arcturus_dev` (futuro, aislada) |
| Puerto | 2097 | 2098 |

---

## Próximos pasos para activar

1. Instalar Arcturus Morningstar en instancia separada.
2. Crear base de datos `arcturus_dev`.
3. Configurar `emulator.ini` apuntando a `arcturus_dev` y puerto 2098.
4. Añadir `pnpm dev:emulator:dev` o script Docker equivalente.
5. Verificar que el cliente Nitro conecta correctamente a ws://localhost:2098.
6. Validar que el iframe en `HotelDesarrolloClient` funciona end-to-end.

La ruta `/desarrollo` ya está lista y guardada. Solo falta el backend Arcturus.
