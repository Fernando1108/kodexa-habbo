# MP-CMS-003F — Rediseño /admin/logs

> **Fecha:** 2026-05-10
> **Estado:** Completado
> **TypeCheck:** ✅ 0 errores

---

## Archivos revisados (solo lectura)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/app/(dashboard)/admin/logs/page.tsx` | Listado de logs — objetivo principal |
| `apps/web/src/components/admin/AdminPageHeader.tsx` | Header reutilizable |
| `apps/web/src/components/admin/EmptyState.tsx` | Estado vacío |
| `apps/web/src/app/globals.css` | Tokens admin, clases `.badge-*`, `table.kx`, `.inp` |
| `docs/cms/admin-full-visual-audit-atomcms.md` | Backlog de deuda — módulo prioritario A |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(dashboard)/admin/logs/page.tsx` | Reescritura visual completa — sin cambios de lógica |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `docs/cms/admin-logs-redesign.md` | Este documento |

---

## Componentes usados

| Componente | Origen | Dónde |
|-----------|--------|-------|
| `AdminPageHeader` | MP-CMS-003B | Reemplaza header `<div>` manual |
| `EmptyState` | MP-CMS-003B | En `<td colSpan={4}>` cuando no hay logs |

---

## Datos reales mostrados

La query no fue modificada. El componente muestra exactamente los mismos datos que antes:

| Campo | Fuente | Columna |
|-------|--------|---------|
| `log.createdAt` | `kxActivityLog.createdAt` | Tiempo (relativo con `timeAgo()`) |
| `log.user.username` | `include: { user }` | Usuario (link a `/admin/users?q=`) |
| `log.action` | `kxActivityLog.action` | Acción (badge semántico) |
| `log.details` | `kxActivityLog.details` | Detalles (truncado a `max-w-sm`) |

Filtros preservados: `user` (contains), `action` (exact match), `page` (paginación de 50).

---

## Cambio clave — `actionColor()` → `logBadgeClass()`

### Antes
```ts
const ACTION_COLORS: Record<string, string> = {
  login:       '#10B981',
  register:    '#3B82F6',
  ban:         '#EF4444',
  ban_applied: '#EF4444',
  purchase:    '#F59E0B',
  badge_given: '#F59E0B',
  kick:        '#F97316',
  hotel_alert: '#7C3AED',
};

function actionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return color;
  }
  return '#94A3B8';
}
// Uso: style={{ color: actionColor(log.action), background: actionColor(log.action) + '18' }}
```

### Después
```ts
function logBadgeClass(action: string): string {
  if (action.includes('ban'))         return 'badge badge-danger';
  if (action.includes('kick'))        return 'badge badge-danger';
  if (action.includes('login'))       return 'badge badge-ok';
  if (action.includes('register'))    return 'badge badge-info';
  if (action.includes('purchase'))    return 'badge badge-warn';
  if (action.includes('badge_given')) return 'badge badge-warn';
  if (action.includes('hotel_alert')) return 'badge badge-info';
  return 'badge badge-mono';
}
// Uso: <span className={logBadgeClass(log.action)}>{log.action}</span>
```

Las clases `.badge-*` están definidas en `globals.css` con `rgba()` semitransparentes que funcionan en light y dark sin cambios.

---

## Estilos migrados

| Antes | Después |
|-------|---------|
| `text-[#F8FAFC]` — h1 | Clase `admin-page-title` (via `AdminPageHeader`) |
| `text-[#94A3B8] mt-1` — subtitle | Clase `admin-page-subtitle` (via `AdminPageHeader`) |
| `bg-[#0F172A] border border-[#334155] text-[#F8FAFC]` — inputs | Clase `.inp` |
| `border border-[#1f2b41] overflow-hidden` — wrapper tabla | Clase `.card p-0` |
| `background: '#0a1224'` — thead | `table.kx th` con `var(--admin-table-head-bg)` |
| `background: '#0e1627'` — filas | Eliminado (`.kx tbody tr` usa tokens) |
| `divide-[#1f2b41]` — separadores | `.kx td` con `var(--admin-border)` |
| `text-[#475569]` — th labels | `.kx th` usa `var(--admin-text-muted)` |
| `text-[#475569]` — timestamp | `var(--admin-text-subtle)` inline |
| `text-[#94A3B8]` — detalles | `var(--admin-text-muted)` inline |
| `text-primary hover:underline` — username link | `var(--admin-primary)` inline |
| `color: actionColor()` + `background: actionColor()+'18'` | Clases `.badge badge-*` |
| `text-[#475569]` — "Limpiar" link | `var(--admin-text-subtle)` inline |
| `text-[#475569]` — paginación | `var(--admin-text-subtle)` en wrapper |
| Empty state: `<td>` con `text-center text-sm text-[#475569]` | Componente `EmptyState` |

---

## Compatibilidad light/dark

| Token usado | Light | Dark |
|-------------|-------|------|
| `var(--admin-text-subtle)` | `#94A3B8` | `#64748B` |
| `var(--admin-text-muted)` | `#64748B` | `#94A3B8` |
| `var(--admin-primary)` | `#00D4AA` | `#00D4AA` |
| `var(--admin-table-head-bg)` | via `.admin-shell` scope | via `.admin-shell` scope |
| `var(--admin-border)` | `#E2E8F0` | `#1f2b41` |
| Badges `.badge-*` | rgba semitransparentes — funcionan en ambos | ✅ |

---

## Referencia AtomCMS usada

| Patrón AtomCMS | Adaptado en Kodexa |
|---------------|-------------------|
| Logs agrupados por tipo (auth/admin/system) | Implementado vía badge semántico por categoría |
| Tabla de actividad con columna tipo + actor + mensaje | Columnas Acción + Usuario + Detalles |
| Filtro por usuario y tipo de evento | Filtros `user` + `action` (preservados) |
| Estado vacío honesto | `EmptyState` con texto diferenciado (filtro vs. vacío real) |

---

## Qué no se implementó

| Función | Razón |
|---------|-------|
| Filtro por fecha/rango | No existe en query actual — mejora futura |
| Sub-tabs rooms vs. privados (estilo AtomCMS chatlog) | Fuera de scope — módulo futuro `/admin/logs?type=...` |
| Export CSV | Feature nueva — fuera de scope MP-003F |
| Paginación windowed (tipo users) | 50 logs/página solo prev/next — suficiente |
| IP en columna | Campo no incluido en `kxActivityLog` select actual |

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No Arcturus | ✅ |
| No DB / schema / migrations / seed | ✅ |
| No middleware.ts / guards.ts | ✅ |
| No SSO | ✅ |
| No landing / auth | ✅ |
| No /me | ✅ |
| No /admin dashboard | ✅ |
| No /admin/users | ✅ |
| No /admin/news | ✅ |
| No lógica funcional de logs modificada | ✅ |
| No APIs nuevas | ✅ |
| No dependencias nuevas | ✅ |
| TypeCheck 0 errores | ✅ |
| Tailwind arbitrary eliminados | ✅ |
| Inline hex hardcodeados eliminados | ✅ |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| `table.kx th` base CSS aún usa hex (`#64748B`, `#0f1828`, `#1f2b41`) — pero `.admin-shell table.kx th` override usa tokens | Riesgo bajo — el override admin-shell es suficiente |
| Badges `.badge-*` usan colores fijos (no `var(--admin-*)`) — funcionan en ambos temas por ser rgba semitransparentes | Aceptable — intencional |
| `max-w-sm truncate` en columna detalles puede ocultar información crítica | Comportamiento heredado — sin cambios |

---

## Próximo microproceso

**MP-CMS-003G — Normalización módulos admin restantes**

Según backlog priorizado en `admin-full-visual-audit-atomcms.md`:

- **003G.1:** `/admin/rooms` — modal delete custom + stars component + `rgba` overlay
- **003G.2:** `/admin/bans` — botón ban hex inline + tabla sin `.kx`
- **003G.3:** `/admin/wordfilter` — inputs + tabla completa sin tokens
- **003G.4:** `/admin/settings` — toggle custom → `AdminToggle` nuevo componente
- **003G.5:** `/admin/permissions` + `/admin/alerts`
- **003G.6:** `/admin/badges` + `/admin/messages` (más grandes)
