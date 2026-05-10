# MP-CMS-003C — Rediseño /admin Dashboard

> **Fecha:** 2026-05-10  
> **Estado:** Completado  
> **TypeCheck:** ✅ 0 errores

---

## Cambios realizados

### `apps/web/src/app/(dashboard)/admin/page.tsx`

#### Eliminado
| Elemento | Motivo |
|----------|--------|
| `CHART_HEIGHTS` array (24 valores fake) | Gráfico hardcodeado sin datos reales |
| Barras del sparkbar chart | Sin fuente de datos real — falso |
| Widget "Actividad últimas 24h" con pico/promedio/sesión estimados | Valores calculados de `onlineUsers` con offsets arbitrarios |
| Widget "Salud del hotel" (CPU 24%, RAM 3.2 GB, Latencia 42 ms) | Valores hardcodeados fake, no reflejan estado real |
| `creditsAgg` query (`prisma.user.aggregate({ _sum: { credits } })`) | Créditos no es métrica relevante para dashboard principal |
| `totalCredits` variable | Derivada del query eliminado |
| Todos los `style={{ color: '#94A3B8' }}` inline | Reemplazados por `var(--admin-text-muted)` |
| Todos los `style={{ color: '#64748B' }}` inline | Reemplazados por `var(--admin-text-subtle)` |
| Colores inline hardcodeados de fondo oscuro (`rgba(15,23,42,...)`) | Reemplazados por tokens |
| Bloque de fallback estático en el feed (UserRound/Package/Gavel/Ban hardcoded) | Reemplazado por `<EmptyState>` |

#### Añadido
| Elemento | Propósito |
|----------|-----------|
| `<AdminPageHeader>` | Header estandarizado con eyebrow, h1, subtitle, actions |
| `<AdminStatCard>` ×4 | Métricas reales: onlineUsers, totalUsers, totalRooms, totalNews |
| `prisma.news.count()` query | 4ta métrica honesta — noticias publicadas |
| Sección "Acciones rápidas" | Links a /admin/users, /admin/news, /admin/logs, /admin/settings |
| `.admin-quick-action` CSS class | Hover con tokens CSS (sin JS, compatible con Server Components) |
| `<EmptyState>` para feed vacío | Estado honesto sin logs inventados |
| Sección "Estado del sistema" | Reemplaza health fake — muestra CMS/Auth/DB activos, Emulador pendiente |
| `<CheckCircle2>` / `<XCircle>` icons | Estado visual por componente |
| `Link` (next/link) para "Ver logs" button | Era `<button>` sin href — ahora navega |
| `Link` para "Ver todos →" en tabla | Era `<a>` raw — ahora usa next/link |

#### Queries actuales
```ts
const [onlineUsers, totalUsers, totalRooms, totalNews, recentUsers, recentLogs] = await Promise.all([
  prisma.user.count({ where: { online: true } }),
  prisma.user.count(),
  prisma.room.count(),
  prisma.news.count(),                    // nuevo
  prisma.user.findMany({ take: 5, ... }), // sin cambios
  prisma.kxActivityLog.findMany({ take: 5, ... }), // sin cambios
]);
```

---

### `apps/web/src/app/globals.css`

Añadida clase `.admin-quick-action` al final del bloque "Admin typography helpers":

```css
.admin-quick-action {
  display: flex;
  flex-direction: column;
  padding: .875rem;
  border-radius: .75rem;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface);
  transition: border-color 150ms, background 150ms, box-shadow 150ms;
  cursor: pointer;
}
.admin-quick-action:hover {
  border-color: var(--admin-primary);
  background: var(--admin-primary-bg);
  box-shadow: 0 0 0 1px var(--admin-primary-bg);
}
```

Motivo: el dashboard es Server Component — no puede usar `onMouseEnter`. Hover puro en CSS.

---

## Estructura final de la página

```
AdminPageHeader (eyebrow + h1 + subtitle + Link "Ver logs")
↓
Grid 4 col: AdminStatCard ×4
  - onlineUsers  (primary + live dot)
  - totalUsers   (purple)
  - totalRooms   (amber)
  - totalNews    (green)
↓
Grid 2 col: Acciones rápidas | Actividad reciente
  - Acciones: 4 admin-quick-action links (2×2 grid)
  - Actividad: EmptyState o lista de recentLogs reales
↓
Grid 2 col: Últimos registros | Estado del sistema
  - Tabla kx: recentUsers reales (5)
  - Sistema: CMS ✓ Auth ✓ DB ✓ Emulador ✗
```

---

## Componentes usados

| Componente | Archivo | Desde |
|-----------|---------|-------|
| `AdminPageHeader` | `admin/AdminPageHeader.tsx` | MP-CMS-003B |
| `AdminStatCard` | `admin/AdminStatCard.tsx` | MP-CMS-003B |
| `EmptyState` | `admin/EmptyState.tsx` | MP-CMS-003B |

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No Arcturus | ✅ |
| No schema/migrations/seed | ✅ |
| No middleware.ts | ✅ |
| No SSO | ✅ |
| No /admin/users, /admin/news internos modificados | ✅ |
| No nuevas dependencias | ✅ |
| No datos falsos/estimados | ✅ |
| TypeCheck 0 errores | ✅ |
| Todos los colores vía `var(--admin-*)` | ✅ |

---

## Próximo microproceso

**MP-CMS-003D — Rediseño /admin/users**

- Tabla completa con `AdminPageHeader`, filtros, paginación
- `RankBadge` component
- Acciones: ver perfil, cambiar rank, ban
- Todos los colores vía tokens
