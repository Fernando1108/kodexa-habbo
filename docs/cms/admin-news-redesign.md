# MP-CMS-003E — Rediseño /admin/news

> **Fecha:** 2026-05-10  
> **Estado:** Completado  
> **TypeCheck:** ✅ 0 errores

---

## Archivos revisados (solo lectura)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/app/(dashboard)/admin/news/page.tsx` | Listado principal — rediseñado |
| `apps/web/src/app/(dashboard)/admin/news/NewsAdminActions.tsx` | Acciones toggle/delete — rediseñado |
| `apps/web/src/app/(dashboard)/admin/news/NewsForm.tsx` | Formulario crear/editar — rediseñado |
| `apps/web/src/app/(dashboard)/admin/news/create/page.tsx` | Wrapper create — sin cambios |
| `apps/web/src/app/(dashboard)/admin/news/[id]/edit/page.tsx` | Wrapper edit — sin cambios |
| `apps/web/src/components/admin/*` | Componentes base existentes |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(dashboard)/admin/news/page.tsx` | `AdminPageHeader` + `StatusBadge` + `EmptyState` + tokens |
| `apps/web/src/app/(dashboard)/admin/news/NewsAdminActions.tsx` | `ConfirmModal` + token colors |
| `apps/web/src/app/(dashboard)/admin/news/NewsForm.tsx` | Todos los colores/labels → tokens |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/components/admin/StatusBadge.tsx` | Badge visual por status (PUBLISHED/DRAFT/ARCHIVED) |
| `docs/cms/admin-news-redesign.md` | Este documento |

---

## Componentes usados

| Componente | Origen | Dónde |
|-----------|--------|-------|
| `AdminPageHeader` | MP-CMS-003B | `page.tsx` — eyebrow "Contenido" + "Nueva noticia" CTA |
| `StatusBadge` | Nuevo (este MP) | `page.tsx` — badge por artículo en listado |
| `EmptyState` | MP-CMS-003B | `page.tsx` — cuando no hay artículos |
| `ConfirmModal` | MP-CMS-003B | `NewsAdminActions.tsx` — confirmación de borrado |

---

## StatusBadge — nuevo componente

**Archivo:** `apps/web/src/components/admin/StatusBadge.tsx`

```tsx
const STATUS_MAP = {
  PUBLISHED: { label: 'Publicado', cls: 'badge badge-ok'   },
  DRAFT:     { label: 'Borrador',  cls: 'badge badge-warn' },
  ARCHIVED:  { label: 'Archivado', cls: 'badge badge-mono' },
};

export function StatusBadge({ status, className = '' }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'badge badge-mono' };
  return <span className={`${s.cls} ${className}`.trimEnd()}>{s.label}</span>;
}
```

- Props: `status: string`, `className?: string`
- Fallback seguro: status desconocido → `badge-mono` + label literal
- No depende de Prisma ni de lógica de permisos
- Usa clases `badge-*` ya scoped a `.admin-shell` — funciona en light y dark

---

## Cambios visuales — `page.tsx`

| Antes | Después |
|-------|---------|
| Header `<div>` manual con `color: '#94A3B8'` | `<AdminPageHeader eyebrow="Contenido" ...>` |
| Empty state: `<div className="card p-12">` con `color: '#94A3B8'` hardcoded | `<div className="card"><EmptyState ... /></div>` |
| `STATUS_BADGE` local map → `<span className={badge.cls}>` | `<StatusBadge status={n.status} />` |
| Status bar: `#10B981` / `#F59E0B` / `#475569` hardcoded | `var(--admin-success)` / `var(--admin-warning)` / `var(--admin-text-subtle)` |
| Slug `<code>`: `background: '#1E293B', color: '#94A3B8'` | `var(--admin-surface-soft)` / `var(--admin-text-muted)` |
| Excerpt `color: '#94A3B8'` | `var(--admin-text-muted)` |
| Meta (user/date) `color: '#475569'` | `var(--admin-text-subtle)` |
| Published date `color: '#10B981'` | `var(--admin-success)` |
| "Ver pública" `color: '#00D4AA'` | `var(--admin-primary)` |

---

## Cambios visuales — `NewsAdminActions.tsx`

| Antes | Después |
|-------|---------|
| Delete button `color: '#fca5a5'` | `var(--admin-danger)` |
| Modal inline completo (overlay + modal div + header + icon + buttons) | `<ConfirmModal variant="danger" />` |
| Imports: `Trash2`, `X` (para modal) | Eliminados — `ConfirmModal` los maneja |

---

## Cambios visuales — `NewsForm.tsx`

| Antes | Después |
|-------|---------|
| Todos los `label` con `text-xs uppercase tracking-[.16em] font-mono style={{color:'#94A3B8'}}` | Clase `admin-eyebrow` |
| Helper texts `color: '#475569'` | `var(--admin-text-subtle)` |
| Slug prefix span `color: '#475569'` | `var(--admin-text-subtle)` |
| Header eyebrow `color: '#94A3B8'` | Clase `admin-eyebrow` |
| Header h1 sin color explícito | `var(--admin-text)` |
| Status button inactive border `'#1E293B'` (dark hardcoded) | `var(--admin-border)` |
| Status button inactive color `'#94A3B8'` | `var(--admin-text-muted)` |
| Image preview border `'1px solid #1E293B'` | `var(--admin-border)` |
| Error text `color: '#f87171'` | `var(--admin-danger)` |

### Mantenido intencionalmente
- `Newspaper` icon `color: '#7C3AED'` — color de acento fijo del módulo editorial
- Status buttons: `background: \`${opt.color}18\`` y `borderColor: opt.color` cuando activo — cada status tiene color semántico fijo (verde/amber/gris)
- Error block `rgba(239,68,68,.1)` / `rgba(239,68,68,.3)` — neutros en ambos temas

---

## Acciones preservadas

| Acción | Estado |
|--------|--------|
| Toggle PUBLISHED ↔ DRAFT (`PUT /api/admin/news/[id]`) | ✅ Sin cambios |
| Delete (`DELETE /api/admin/news/[id]`) | ✅ Sin cambios, ahora con `ConfirmModal` |
| Create (`POST /api/admin/news`) | ✅ Sin cambios |
| Edit (`PUT /api/admin/news/[id]`) | ✅ Sin cambios |
| "Ver pública" → `/community/news/[slug]` | ✅ Sin cambios |
| Auto-slug desde título | ✅ Sin cambios |
| "Guardar como borrador" cuando status !== DRAFT | ✅ Sin cambios |

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
| No lógica funcional del News module modificada | ✅ |
| No status enum modificado | ✅ |
| No rutas públicas modificadas | ✅ |
| No nuevas dependencias | ✅ |
| TypeCheck 0 errores | ✅ |
| Inline hex hardcodeados eliminados | ✅ |
| News sigue usando PUBLISHED/DRAFT/ARCHIVED | ✅ |
| Links públicos siguen usando slug | ✅ |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| `NewsForm` no usa editor rich text — contenido es texto plano | Sin cambios — comportamiento heredado, mejora futura |
| `imageUrl` sin validación de URL real | Sin cambios — comportamiento heredado |
| Acciones mobile en listado ocultas (`hidden sm:flex`) | Sin cambios — requiere MP futuro para mobile admin |
| `create/page.tsx` y `[id]/edit/page.tsx` sin metadata dinámica | Sin cambios — metadata estática aceptable |

---

## Próximo microproceso

**MP-CMS-003F — Rediseño /me dashboard**

Alinear visualmente `/me` con el nuevo sistema Light-first:
- Detectar si `/me` usa `AdminShell` o layout propio
- Migrar colores hardcodeados a `var(--admin-*)` si aplica
- O definir set de tokens separado `--me-*` si el `/me` tiene identidad visual distinta
- `AdminPageHeader` si aplica
- TypeCheck 0 errores
