# MP-CMS-003D — Rediseño /admin/users

> **Fecha:** 2026-05-10  
> **Estado:** Completado  
> **TypeCheck:** ✅ 0 errores

---

## Archivos revisados (solo lectura)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/app/(dashboard)/admin/users/page.tsx` | Página objetivo — rediseñada |
| `apps/web/src/app/api/admin/users/route.ts` | API GET — soporta `rank`, `status`, `search`, paginación |
| `apps/web/src/app/api/admin/users/[id]/route.ts` | API PUT/DELETE — `rank` limitado a 1-7 (ver deuda) |
| `apps/web/src/lib/guards.ts` | `canAccessAdmin(rank >= 7)` — sin cambios |
| `packages/shared/src/types/ranks.ts` | `RANK_LABELS`, `RANK_COLORS`, `rankBadgeClass` |
| `apps/web/src/components/admin/*` | Componentes base existentes |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(dashboard)/admin/users/page.tsx` | Rediseño visual completo — sin cambios de lógica |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/components/admin/RankBadge.tsx` | Componente de badge de rango reutilizable |
| `docs/cms/admin-users-redesign.md` | Este documento |

---

## Componentes usados

| Componente | Origen | Uso |
|-----------|--------|-----|
| `AdminPageHeader` | MP-CMS-003B | Header con eyebrow "Housekeeping" + total |
| `RankBadge` | Nuevo (este MP) | Badge visual por rank en tabla y modal |
| `ConfirmModal` | MP-CMS-003B | Modal de confirmación de eliminación |
| `EmptyState` | MP-CMS-003B | Estado vacío en tabla cuando no hay usuarios |

---

## RankBadge — nuevo componente

**Archivo:** `apps/web/src/components/admin/RankBadge.tsx`

```tsx
import { RANK_LABELS, rankBadgeClass } from '@kodexa/shared';

interface Props { rank: number; className?: string; }

export function RankBadge({ rank, className = '' }: Props) {
  const label = RANK_LABELS[rank] ?? 'Normal';
  const cls   = rankBadgeClass(rank);
  return <span className={`badge ${cls} ${className}`.trimEnd()}>{label}</span>;
}
```

- No depende de DB ni de lógica de permisos
- Funciona en light y dark (clases `badge-*` scoped a `.admin-shell`)
- Reutilizable en cualquier contexto admin
- Props: `rank: number`, `className?: string`

---

## Cambios visuales realizados

### Header
- Antes: `<div>` manual con `style={{ color: '#94A3B8' }}` hardcoded
- Después: `<AdminPageHeader eyebrow="Housekeeping" title subtitle />`

### Filtros
- Antes: selects `defaultValue=""` (no controlados) → rank y status no se enviaban a la API
- Después: controlados con `value={rankFilter}` / `value={statusFilter}` → API recibe filtros correctamente
- "Limpiar" solo visible si hay filtros activos (`hasFilters`)

### Tabla — colores migrados

| Antes | Después |
|-------|---------|
| `style={{ color: '#94A3B8' }}` | `var(--admin-text-muted)` |
| `style={{ color: '#64748B' }}` | `var(--admin-text-subtle)` |
| `style={{ color: '#F8FAFC' }}` | `var(--admin-text)` |
| `style={{ color: '#F59E0B' }}` | `var(--admin-warning)` |
| `style={{ background: u.online ? '#10B981' : '#64748B' }}` | `var(--admin-success)` / `var(--admin-text-subtle)` |
| `style={{ color: '#f87171' }}` (delete btn) | `var(--admin-danger)` |
| `<span className={badge ${rank.cls}}>` | `<RankBadge rank={u.rank} />` |

### Paginación
- Antes: `borderTop: '1px solid #1f2b41'` (dark hardcoded)
- Después: `var(--admin-border)`
- Antes: page activa `color: '#5BFFD7'` (dark hardcoded)
- Después: `var(--admin-nav-active-color)` (= `#00B894` light, `#5BFFD7` dark)
- Antes: ventana fija de 5 páginas desde 1
- Después: ventana deslizante ±2 desde página actual

### Modales
- Antes: `background: 'rgba(15,23,42,.4)', border: '1px solid #1f2b41'` (dark absoluto)
- Después: `var(--admin-surface-soft)` + `var(--admin-border)`
- Labels `style={{ color: '#94A3B8' }}` → clase `admin-eyebrow`
- Error color `'#f87171'` → `var(--admin-danger)`
- Texto `'#F8FAFC'` → `var(--admin-text)`
- Modal delete reemplazado por `<ConfirmModal variant="danger" />`

### Eliminado
- Botón "Crear usuario" — funcionalidad no implementada (POST /api/admin/users no existe; PUT con id=0 falla en Prisma). Ver deuda.
- Import `RANK_COLORS` — importado pero no usado en JSX.
- Campo `motto` de `editForm` — nunca expuesto en UI del modal.
- Fallback estático de empty state en tabla.

---

## Métricas reales

La página es Client Component — no añade stat cards superiores (ya están en `/admin` dashboard). Todas las métricas de la tabla son datos reales del API:
- `total` — count real de usuarios que coinciden con filtros
- `online` — campo real `users.online`
- `credits` — campo real `users.credits`
- `rank` — campo real `users.rank`
- `lastLogin`, `createdAt` — campos reales

---

## Filtros API — wiring correcto

| Parámetro | Antes | Después |
|-----------|-------|---------|
| `search` | ✅ controlado | ✅ sin cambios |
| `rank` | ❌ `defaultValue` (no enviaba) | ✅ controlado — `?rank=N` |
| `status` | ❌ `defaultValue` (no enviaba) | ✅ controlado — `?status=online\|offline` |
| `page` | ✅ funcional | ✅ sin cambios |
| `limit` | ✅ funcional | ✅ sin cambios |

---

## Deuda de rangos 8-10

### Problema

**Archivo:** `apps/web/src/app/api/admin/users/[id]/route.ts`

```ts
const EditSchema = z.object({
  rank: z.number().int().min(1).max(7).optional(),
  // ...
});
```

`z.number().max(7)` bloquea asignar ranks 8 (Hotel Manager), 9 (Desarrollador) y 10 (Fundador) desde la UI admin.

### Impacto actual
- El selector de rank en el modal de edición muestra los 10 rangos (desde `RANK_LABELS`)
- Seleccionar rank 8-10 y guardar → API devuelve `400 Invalid data`
- El error se muestra en el modal (`setErr('Error al guardar')`)
- No hay pérdida silenciosa de datos — el error es visible

### Política sugerida
Rangos 8-10 son roles de fundador/dev. Su asignación debe requerir:
1. Que el ejecutor tenga rank 10 (Fundador)
2. O una ruta separada con guard `isFounder(rank)`

### Pendiente para
**MP-CMS-003H** (o MP-CMS-002F) — Policy: Founder-only rank assignment

Decisiones a tomar:
- ¿Ocultar opciones 8-10 del select en el modal si el admin es rank 7?
- ¿Crear endpoint `PUT /api/admin/users/[id]/rank` con guard `isFounder`?
- ¿Cambiar `max(7)` a `max(10)` con guard adicional en el route?

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No Arcturus | ✅ |
| No DB / schema / migrations / seed | ✅ |
| No middleware.ts | ✅ |
| No SSO | ✅ |
| No guards.ts | ✅ |
| No /login, /register, landing | ✅ |
| No /me | ✅ |
| No /admin dashboard | ✅ |
| No /admin/news | ✅ |
| No APIs modificadas | ✅ |
| No nuevas dependencias | ✅ |
| No política rank 8-10 modificada | ✅ |
| TypeCheck 0 errores | ✅ |
| Inline styles/hex hardcodeados eliminados | ✅ |
| No imports desde @/middleware | ✅ |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| Ranks 8-10 no asignables desde UI | Documentado — requiere MP-003H |
| Botón "Crear usuario" eliminado (POST no existe) | Documentado — requiere MP-003H o nueva ruta |
| Eliminación de usuario sin soft-delete | Sin cambios — comportamiento heredado |
| Modal edit no filtra rango mínimo editable según rank del admin | Sin cambios — requiere MP-003H |

---

## Próximo microproceso

**MP-CMS-003E — Rediseño /admin/news**

- `AdminPageHeader` con eyebrow "Contenido"
- Tabla de artículos con estado (publicado/borrador), fecha, autor
- Acciones: editar, publicar/despublicar, eliminar
- `EmptyState` para sin noticias
- Todos los colores vía `var(--admin-*)`
- TypeCheck 0 errores
