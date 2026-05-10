# Auditoría DB Actual — MP-007

**Fecha:** 2026-05-10  
**Ejecutado por:** Claude Caveman Ultra  
**Estado:** AUDITADO — ningún dato modificado

---

## Estado Docker / MariaDB

| Campo | Valor |
|-------|-------|
| Contenedor | `kodexa-db` |
| Imagen | `mariadb:10.11` |
| Estado | `Up ~1h (healthy)` |
| Puerto host | `3306` |
| Puerto interno | `3306` |
| Volumen | `db_data` (Docker named volume) |
| Red | `kodexa` (bridge) |
| Servicios activos | `kodexa-db`, `kodexa-redis`, `kodexa-imager`, `kodexa-assets` |

---

## Bases de datos existentes (SHOW DATABASES)

| Base | Tipo | Propósito |
|------|------|-----------|
| `kodexa_hotel` | **BASE ACTIVA** | Toda la aplicación actual |
| `arcturus_main` | NUEVA — vacía | Creada MP-007 para Arcturus Main futuro |
| `arcturus_dev` | NUEVA — vacía | Creada MP-007 para Arcturus Dev futuro |
| `information_schema` | Sistema | Metadatos MariaDB |
| `mysql` | Sistema | Usuarios/permisos MariaDB |
| `performance_schema` | Sistema | Métricas internas |
| `sys` | Sistema | Vistas de diagnóstico |

---

## Base actual: `kodexa_hotel`

Esta base es la única activa del proyecto. Contiene todas las tablas CMS + emulador.

### Tablas encontradas (SHOW TABLES)

| Tabla | Categoría | Propósito |
|-------|-----------|-----------|
| `users` | Core | Registro, login, rangos, SSO |
| `users_badges` | Core | Badges por usuario |
| `users_currency` | Core | Créditos / píxeles |
| `password_resets` | Auth | Tokens de reset de contraseña |
| `kx_activity_log` | Audit | Log de acciones (beta denials, etc.) |
| `kx_staff_tokens` | Auth 2FA | Tokens de staff |
| `bans` | Moderación | Bans activos e históricos |
| `messages` | Social | Sistema de mensajes |
| `rooms` | Hotel | Salas del hotel |
| `room_models` | Hotel | Modelos/heightmaps |
| `items` | Hotel | Items en sala/inventario |
| `items_base` | Hotel | Definiciones de furnis |
| `catalog_pages` | Hotel | Páginas del catálogo |
| `catalog_items` | Hotel | Items del catálogo |
| `permissions` | Roles | Rangos y permisos Arcturus |
| `emulator_settings` | Config | Configuración del emulador |
| `website_settings` | Config | Configuración del CMS |
| `wordfilter` | Moderación | Filtro de palabras |
| `kx_reputation` | Custom | Sistema de reputación |
| `kx_marketplace_listings` | Custom | Marketplace |
| `kx_auctions` | Custom | Subastas |
| `kx_crafting_recipes` | Custom | Crafting |
| `kx_wired_scripts` | Custom | Scripts Wired |
| `kx_user_levels` | Custom | Niveles de usuario |
| `News` | CMS | Noticias del hotel |
| `_prisma_migrations` | ORM | Historial de migraciones Prisma |

### Total usuarios activos: 1

---

## Cuenta Admin — Auditoría

| Campo | Valor |
|-------|-------|
| ID | 1 |
| Username | `admin` (minúscula) |
| Email | `diegomorales11082000@gmail.com` |
| Rank actual | **9** |
| Online | true (sesión activa o flag no reseteado) |
| Creada | 2026-05-08 14:21:54 |
| Password | NO mostrada (hash interno) |

**Estado:** Cuenta encontrada y confirmada. No modificada.

---

## Sistema de rangos en DB (tabla `permissions`)

| level | rank_name | badge |
|-------|-----------|-------|
| 1 | Normal | — |
| 2 | VIP | VIP |
| 3 | Guía | AMB |
| 4 | Moderador | MOD |
| 5 | Senior Mod | SMOD |
| 6 | Gamemaster | GM |
| 7 | Admin | ADM |
| 8 | Director | DIR |
| **9** | **Fundador** | **OWN** |

**Rank máximo en DB: 9 ("Fundador")**

---

## ALERTA CRÍTICA — Conflicto de rangos

El código (middleware.ts, MP-006) define:

```typescript
isDeveloper(rank >= 9)   // rank 9 = DEVELOPER en código
isFounder(rank >= 10)    // rank 10 = FOUNDER en código
```

Pero en la base de datos:

- Rank 9 = **"Fundador"** (máximo absoluto)
- Rank 10 **NO EXISTE** en la tabla `permissions`

**Consecuencia real:**

| Guard | Threshold código | Rank de Diego | ¿Pasa? |
|-------|-----------------|---------------|--------|
| `canAccessDevelopment` | ≥ 9 | 9 | ✅ SÍ |
| `isFounder` | ≥ 10 | 9 | ❌ NO |

**Diego (rank 9 / Fundador) NO puede acceder a `/hotel-beta` con el código actual.**

Esto es un bug arquitectónico introducido en MP-006 al asumir rank 10 = FOUNDER sin auditar la DB.

### Opciones de resolución (requieren aprobación Diego):

**Opción A — Recomendada:** Actualizar `isFounder` a `rank >= 9` en middleware.ts. "Fundador" en DB = FOUNDER en código. Eliminar distinción de rank 10.

**Opción B:** Añadir rank 10 a tabla `permissions` y actualizar cuenta admin a rank 10. Requiere migración DB.

**Opción C:** Mantener rank 9 = FOUNDER, usar un flag/columna separada para DEVELOPER. Requiere schema change.

**Decisión pendiente de Diego.**

---

## Usuario DB

| Usuario | Permisos | Sobre |
|---------|----------|-------|
| `root` | ALL | Todas las bases |
| `kodexa` | ALL PRIVILEGES | `kodexa_hotel` únicamente |

El usuario `kodexa` NO tiene permisos sobre `arcturus_main` ni `arcturus_dev` todavía.

---

## Seed

`database/seed/` contiene solo `.gitkeep` — no hay SQLs de importación todavía.
El seed se ejecuta vía `apps/web/prisma/seed.ts`.
