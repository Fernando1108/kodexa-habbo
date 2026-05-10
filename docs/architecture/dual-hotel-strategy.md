# Estrategia Dual-Hotel — Kodexa Hotel

**Decisión arquitectónica aprobada por:** Diego (Supervisor) + ChatGPT 5.5 Thinking (Arquitecto)  
**Estado:** Activa desde Fase 1 del microproceso de arquitectura dual

---

## Resumen

Kodexa.Hotel opera con dos entornos de hotel simultáneos:

| Entorno | Ruta | Motor | Acceso |
|---------|------|-------|--------|
| Hotel Principal | `/hotel` | Arcturus Morningstar | Todos los usuarios autenticados |
| Hotel Beta | `/hotel-beta` | Kodexa Custom Emulator | Solo FOUNDER (rank ≥ 10) |

---

## Hotel Principal — `/hotel`

**Motor objetivo:** Arcturus Morningstar (Java)  
**Cliente objetivo:** Nitro Client (React/PixiJS)  
**WebSocket:** Puerto 2096 (configurable via `NEXT_PUBLIC_MAIN_HOTEL_WS_URL`)  
**Propósito:**
- Hotel funcional, jugable y demostrable.
- Motor maduro con 36K+ muebles, catálogo completo, movimiento, wired, etc.
- Permite avanzar sin quedar bloqueados por la construcción del emulador custom.

---

## Hotel Beta — `/hotel-beta`

**Motor:** Kodexa Custom Emulator (TypeScript/Node.js)  
**Cliente:** Kodexa Client (React + PixiJS, el mismo `apps/client`)  
**WebSocket:** Puerto 2097 (configurable via `NEXT_PUBLIC_BETA_HOTEL_WS_URL`)  
**Propósito:**
- Laboratorio técnico privado.
- Probar módulos propios del emulador Kodexa.
- Comparar comportamiento contra Arcturus como referencia.
- Construir progresivamente el motor propio.

---

## Por qué arquitectura dual

Construir un emulador Habbo-like completo desde cero sin referencia maduro genera bloqueos en:
- Movement / pathfinding
- Sincronización de salas
- Catálogo / inventario / trading
- Permisos / moderación / wired
- Flujo de packets completo

Arcturus Morningstar actúa como:
1. **Motor funcional inicial** — hotel jugable para usuarios reales
2. **Referencia técnica** — permite comparar packet flows, comportamientos esperados
3. **Fallback estable** — si el custom emulator tiene bugs, los usuarios siguen con Arcturus

---

## Lo que NO se debe mezclar

- **No copiar código literal** de Arcturus/Morningstar dentro del custom emulator.
- **No introducir dependencias Java** dentro del stack TypeScript.
- **No mezclar código GPL** directamente en el core del custom emulator.
- **No usar Arcturus como dependencia** — es un proceso externo separado.

---

## Migración futura

La migración de Arcturus → Custom Emulator será **gradual, módulo por módulo**, cuando el custom emulator alcance paridad suficiente en:

1. Chat y movimiento básico
2. Navigator y entrada a salas
3. Inventario y catálogo
4. Furnis y wired
5. Moderación y permisos

No hay fecha fija. La decisión la toma Diego cuando el custom emulator pase las pruebas en Hotel Beta con usuarios FOUNDER.

---

## Variables de entorno relevantes

```env
NEXT_PUBLIC_MAIN_HOTEL_WS_URL=ws://localhost:2096
NEXT_PUBLIC_BETA_HOTEL_WS_URL=ws://localhost:2097
NEXT_PUBLIC_ENABLE_BETA_HOTEL=true
NEXT_PUBLIC_MAIN_HOTEL_ENGINE=arcturus
NEXT_PUBLIC_BETA_HOTEL_ENGINE=kodexa-custom
MAIN_HOTEL_ENGINE=arcturus
BETA_HOTEL_ENGINE=kodexa-custom
BETA_ALLOWED_RANK=10
```
