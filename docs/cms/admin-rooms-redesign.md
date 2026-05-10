# MP-CMS-003G.1 — Rediseño /admin/rooms

> **Fecha:** 2026-05-10
> **Estado:** Completado
> **TypeCheck:** ✅ 0 errores

---

## Archivos revisados (solo lectura)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/app/(dashboard)/admin/rooms/page.tsx` | Listado y gestión de salas — objetivo principal |
| `apps/web/src/app/api/admin/rooms/route.ts` | GET rooms — sin cambios |
| `apps/web/src/components/admin/AdminPageHeader.tsx` | Header reutilizable |
| `apps/web/src/components/admin/EmptyState.tsx` | Estado vacío |
| `apps/web/src/components/admin/ConfirmModal.tsx` | Modal de confirmación danger |
| `docs/cms/admin-full-visual-audit-atomcms.md` | Backlog — módulo prioritario B |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(dashboard)/admin/rooms/page.tsx` | Reescritura visual completa — lógica funcional sin cambios |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `docs/cms/admin-rooms-redesign.md` | Este documento |

---

## Componentes usados

| Componente | Origen | Dónde |
|-----------|--------|-------|
| `AdminPageHeader` | MP-CMS-003B | Reemplaza header `<div>` manual con eyebrow "Hotel" |
| `EmptyState` | MP-CMS-003B | En `<td colSpan={7}>` cuando no hay salas, con mensaje diferenciado |
| `ConfirmModal` | MP-CMS-003B | Reemplaza modal delete custom completo |

---

## Datos reales mostrados

Query no modificada (`/api/admin/rooms` GET, 50 salas ordenadas por score desc):

| Campo | Fuente | Columna |
|-------|--------|---------|
| `r.id` | `room.id` | ID (font-mono, `--admin-text-subtle`) |
| `r.name` | `room.name` | Sala — nombre principal |
| `r.description` | `room.description` | Sala — descripción truncada |
| `r.ownerName` | `room.ownerName` | Dueño (`@username`, hidden md) |
| `r.maxUsers` | `room.maxUsers` | Aforo (`0/maxUsers` + barra visual) |
| `r.score` | `room.score` | Score via `<Stars>` (hidden lg) |
| `r.state` | `room.state` | Estado via `stateBadge()` (hidden lg) |

---

## Modal delete normalizado

### Antes — modal custom completo (25 líneas JSX)
```tsx
{deleteRoom !== null && (
  <div className="overlay" onClick={...}>
    <div className="modal p-6" style={{ maxWidth: 420 }}>
      <div className="w-12 h-12 ..." style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)' }}>
        <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
      </div>
      <h3 ...>¿Eliminar <span style={{ color: '#EF4444' }}>{deleteRoom.name}</span>?</h3>
      <p ... style={{ color: '#94A3B8' }}>Se eliminarán todos los ítems...</p>
      <div className="mt-6 flex gap-2">
        <button className="btn btn-outline ..." onClick={() => setDeleteRoom(null)}>Cancelar</button>
        <button className="btn btn-danger ..." onClick={confirmDelete} disabled={saving}>...</button>
      </div>
    </div>
  </div>
)}
```

### Después — `ConfirmModal` (6 líneas)
```tsx
<ConfirmModal
  open={deleteRoom !== null}
  onClose={() => setDeleteRoom(null)}
  onConfirm={confirmDelete}
  title={`¿Eliminar "${deleteRoom?.name}"?`}
  description="Se eliminarán todos los ítems dentro de la sala. Esta acción es permanente."
  variant="danger"
  loading={saving}
  confirmLabel="Eliminar"
/>
```

Lógica `confirmDelete()` sin cambios. Endpoint `DELETE /api/admin/rooms/[id]` sin cambios.

---

## Stars/rating migrado

### Antes
```tsx
<Star style={{ color: i <= full ? '#F59E0B' : '#334155', fill: i <= full ? '#F59E0B' : 'none' }} />
<span style={{ color: '#94A3B8' }}>{score}</span>
```

### Después
```tsx
<Star style={{ color: i <= full ? 'var(--admin-warning)' : 'var(--admin-border)', fill: i <= full ? 'var(--admin-warning)' : 'none' }} />
<span style={{ color: 'var(--admin-text-subtle)' }}>{score}</span>
```

`var(--admin-warning)` = `#F59E0B` (light y dark). `var(--admin-border)` = `#E2E8F0` (light) / `#1f2b41` (dark) — estrella vacía visible en ambos temas.

---

## Estilos migrados

| Antes | Después |
|-------|---------|
| Eyebrow `color: '#94A3B8'` inline | Clase `admin-eyebrow` |
| Header subtitle `color: '#94A3B8'` | `AdminPageHeader` subtitle (token `--admin-text-muted`) |
| Search icon `color: '#64748B'` | `var(--admin-text-subtle)` |
| ID `color: '#94A3B8'` | `var(--admin-text-subtle)` |
| Description `color: '#64748B'` | `var(--admin-text-subtle)` |
| Owner `color: '#94A3B8'` | `var(--admin-text-subtle)` |
| Aforo `0/max` (sin color) | `var(--admin-text-muted)` |
| Aforo track `rgba(15,23,42,.7)` | `var(--admin-surface-soft)` |
| Aforo fill `'#EF4444'`/`'#F59E0B'`/`'#00D4AA'` | `var(--admin-danger)`/`var(--admin-warning)`/`var(--admin-primary)` |
| Delete btn `color: '#f87171'` | `var(--admin-danger)` |
| Table footer `borderTop: '1px solid #1f2b41'` | `var(--admin-border)` |
| Table footer `color: '#94A3B8'` | `var(--admin-text-subtle)` |
| Edit modal Lock icon `color: '#00D4AA'` | `var(--admin-primary)` |
| Edit modal 4× labels `color: '#94A3B8'` | Clase `admin-eyebrow` |
| Edit modal aforo value `color: '#F8FAFC'` | `var(--admin-text)` |
| Edit modal `accentColor: '#00D4AA'` | `var(--admin-primary)` |
| Delete modal custom completo | `ConfirmModal variant="danger"` |
| Empty state `color: '#94A3B8'` inline | Componente `EmptyState` |

### También eliminado
- Emojis en `<option>` del select Estado (`🔓 Pública` → `Pública`) — `stateBadge()` maneja el ícono visual en la tabla

---

## Compatibilidad light/dark

| Token | Light | Dark |
|-------|-------|------|
| `var(--admin-warning)` estrellas llenas | `#F59E0B` | `#F59E0B` |
| `var(--admin-border)` estrellas vacías | `#E2E8F0` (claro, visible) | `#1f2b41` (oscuro, visible) |
| `var(--admin-surface-soft)` barra aforo | `#F1F5F9` | `#131e36` |
| `var(--admin-danger/warning/primary)` fill | Mismos en ambos temas | ✅ |
| `admin-eyebrow` labels modal | `#64748B` | `#94A3B8` | ✅ |

---

## Referencia AtomCMS usada

| Patrón AtomCMS | Adaptado |
|---------------|---------|
| Tabla de salas con columnas ID / nombre / dueño / capacity / estado | Sí — misma jerarquía |
| Badge por estado de sala (open/locked/password) | Sí — `stateBadge()` preservado, ya usaba `.badge-*` |
| Acciones inline (editar, borrar) | Sí — preservadas |

---

## Qué no se implementó

| Función | Razón |
|---------|-------|
| Aforo real (usuarios actuales vs max) | API devuelve `maxUsers` no usuarios online — dato de Arcturus, sin conexión aún |
| "Entrar" a sala | `LogIn` btn existe pero sin handler — ruta/funcionalidad futura |
| Paginación | API devuelve max 50 salas — sin offset param — feature futura |
| Categoría en tabla | Columna omitida — info disponible solo en modal edición |

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No Arcturus | ✅ |
| No DB / schema / migrations / seed | ✅ |
| No middleware.ts / guards.ts | ✅ |
| No SSO | ✅ |
| No landing / auth / /me | ✅ |
| No /admin dashboard / users / news / logs | ✅ |
| No lógica funcional de rooms modificada | ✅ |
| No APIs nuevas | ✅ |
| No dependencias nuevas | ✅ |
| TypeCheck 0 errores | ✅ |
| Inline hex hardcodeados eliminados | ✅ |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| `var(--admin-warning)` en `fill:` de SVG — algunos navegadores pueden ignorar CSS vars en SVG fill inline | Bajo riesgo — funciona en Chrome/Firefox/Safari modernos |
| Aforo bar muestra `score` como proxy de ocupación (`pct = Math.min(100, r.score)`) — no es aforo real | Comportamiento heredado sin cambios |
| "Entrar" btn (`LogIn`) sin handler — UX incompleta | Comportamiento heredado — feature futura |
| Edit modal sin validación visual de nombre vacío | Comportamiento heredado |

---

## Próximo microproceso

**MP-CMS-003G.2 — Rediseño /admin/bans**

Según backlog en `admin-full-visual-audit-atomcms.md` (Prioridad 1C):
- `bans/page.tsx` — header con `text-[#F8FAFC]`
- `BansClient.tsx` — inputs full-hardcoded, tabla sin `.kx`, botón ban con `background:'#EF4444'`
- Reemplazar con `AdminPageHeader`, `.inp`, `table.kx`, `ConfirmModal`, tokens
