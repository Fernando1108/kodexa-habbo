# MP-CMS-003G.2 — Rediseño /admin/bans

> **Fecha:** 2026-05-10
> **Estado:** Completado
> **TypeCheck:** ✅ 0 errores

---

## Archivos revisados (solo lectura)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/app/(dashboard)/admin/bans/page.tsx` | Wrapper Server Component |
| `apps/web/src/app/(dashboard)/admin/bans/BansClient.tsx` | Lógica client — objetivo principal |
| `apps/web/src/components/admin/AdminPageHeader.tsx` | Header reutilizable |
| `apps/web/src/components/admin/EmptyState.tsx` | Estado vacío |
| `apps/web/src/components/admin/ConfirmModal.tsx` | Modal de confirmación |
| `docs/cms/admin-full-visual-audit-atomcms.md` | Backlog — módulo prioritario 1C |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(dashboard)/admin/bans/page.tsx` | `AdminPageHeader` + limpieza del wrapper div |
| `apps/web/src/app/(dashboard)/admin/bans/BansClient.tsx` | Reescritura visual completa — lógica sin cambios |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `docs/cms/admin-bans-redesign.md` | Este documento |

---

## Componentes usados

| Componente | Origen | Dónde |
|-----------|--------|-------|
| `AdminPageHeader` | MP-CMS-003B | `page.tsx` — eyebrow "Moderación", subtitle con total de DB |
| `EmptyState` | MP-CMS-003B | `BansClient.tsx` — en `<td colSpan={7}>` con mensaje diferenciado |
| `ConfirmModal` | MP-CMS-003B | `BansClient.tsx` — confirmar unban (reemplaza acción directa) |

---

## Datos reales mostrados

Query no modificada (ban activos, 20/página, desc por createdAt):

| Campo | Fuente | Columna |
|-------|--------|---------|
| `b.user.username` | `ban.user` include | Usuario (font-mono) |
| `b.type` | `ban.type` | Tipo (badge semántico) |
| `b.reason` | `ban.reason` | Razón (truncada) |
| `b.admin.username` | `ban.admin` include | Por (hidden md) |
| `b.createdAt` | `ban.createdAt` | Aplicado — relativo `rel()` (hidden md) |
| `b.expiresAt` | `ban.expiresAt` | Expira — badge/texto según estado |

---

## Formulario rediseñado

| Elemento | Antes | Después |
|---------|-------|---------|
| Header h2 | `text-[#F8FAFC]` inline | `var(--admin-text)` inline |
| Ban icon | `text-[#EF4444]` clase | `var(--admin-danger)` inline |
| 4× labels | `text-xs text-[#94A3B8]` | Clase `admin-eyebrow` |
| 4× inputs/selects | `px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-[#F8FAFC] ...` | Clase `.inp w-full` |
| Submit btn | `btn btn-primary` + `style={{ background:'#EF4444', borderColor:'#EF4444' }}` | Clase `btn btn-danger` |
| Error text | `text-xs text-[#EF4444]` | `var(--admin-danger)` inline |

---

## Tabla/listado rediseñado

| Elemento | Antes | Después |
|---------|-------|---------|
| Wrapper | `rounded-xl border border-[#1f2b41] overflow-hidden` | Clase `card overflow-hidden p-0` |
| `<table>` | Sin clase `.kx`, custom thead | `table.kx w-full` |
| Thead | `background:'#0a1224', borderBottom:'1px solid #1f2b41'` | Tokens via `.admin-shell table.kx th` |
| Thead cells | `text-[#475569]` | Tokens via `.admin-shell table.kx th` |
| Tbody | `divide-y divide-[#1f2b41]` | Tokens via `.admin-shell table.kx td` |
| Filas | `background:'#0e1627'` | Eliminado (`.kx` maneja via tokens) |
| Username | `text-[#F8FAFC]` | `var(--admin-text)` |
| Razón | `text-[#94A3B8]` | `var(--admin-text-muted)` |
| Por | `text-[#475569]` | `var(--admin-text-subtle)` |
| Aplicado | `text-[#475569]` | `var(--admin-text-subtle)` |
| Unban btn | `text-[#EF4444] hover:bg-red-500/10` | `icon-btn` + `var(--admin-danger)` |

---

## Badges semánticos — tipo de ban

### Antes — `TYPE_COLORS` con hex + inline style
```tsx
const TYPE_COLORS: Record<string, string> = {
  ban:      '#F59E0B',
  ipban:    '#EF4444',
  superban: '#7C3AED',
};
// uso: style={{ color: TYPE_COLORS[ban.type], background: TYPE_COLORS[ban.type] + '18' }}
```

### Después — `typeBadgeClass()` con clases token
```tsx
function typeBadgeClass(type: string): string {
  if (type === 'ipban')    return 'badge badge-danger';
  if (type === 'superban') return 'badge badge-info';
  if (type === 'ban')      return 'badge badge-warn';
  return 'badge badge-mono';
}
// uso: <span className={typeBadgeClass(ban.type)}>{ban.type}</span>
```

## Badges semánticos — expiración

La columna "Expira" ahora usa badges:

| Condición | Badge |
|-----------|-------|
| `expiresAt === null` | `badge badge-danger` — "Permanente" |
| `expiresAt` pasado | `badge badge-mono` — "Expirado" |
| `expiresAt` futuro | texto `var(--admin-text-subtle)` con fecha |

---

## Confirmación unban normalizada

### Antes — acción directa (0 confirmación)
```tsx
async function unban(id: number) {
  await fetch(`/api/admin/bans/${id}`, { method: 'DELETE' });
  setBans(prev => prev.filter(b => b.id !== id));
}
// botón: onClick={() => unban(ban.id)}
```

### Después — `ConfirmModal` + estado separado
```tsx
const [unbanTarget, setUnbanTarget] = useState<BanRow | null>(null);
const [deleting,    setDeleting]    = useState(false);

async function confirmUnban() {
  if (!unbanTarget) return;
  setDeleting(true);
  await fetch(`/api/admin/bans/${unbanTarget.id}`, { method: 'DELETE' });
  setDeleting(false);
  setUnbanTarget(null);
  setBans(prev => prev.filter(b => b.id !== unbanTarget.id));
}
// botón: onClick={() => setUnbanTarget(ban)}
// modal: <ConfirmModal open={unbanTarget !== null} ... />
```

Endpoint `DELETE /api/admin/bans/[id]` sin cambios.

---

## Qué no se implementó

| Función | Razón |
|---------|-------|
| Filtro por tipo de ban | No existía — feature futura |
| Filtro por rango de fechas | No existía — feature futura |
| Ver baneos expirados (histórico) | Query filtra `active: true` — sin cambios |
| IP ban mostrado en tabla | Campo `b.ip` disponible pero no se mostraba — sin cambios |

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No Arcturus | ✅ |
| No DB / schema / migrations / seed | ✅ |
| No middleware.ts / guards.ts | ✅ |
| No SSO | ✅ |
| No landing / auth / /me | ✅ |
| No /admin dashboard / users / news / logs / rooms | ✅ |
| No lógica funcional de bans modificada | ✅ |
| No APIs nuevas | ✅ |
| No dependencias nuevas | ✅ |
| TypeCheck 0 errores | ✅ |
| Inline hex / Tailwind arbitrary eliminados | ✅ |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| `btn-danger` — verificar que clase existe en globals.css | Usada en rooms/news — presente |
| Unban directo sin loading visible en fila — ahora tiene `deleting` en modal | Mejorado vs. anterior |
| Paginación usa `<a href>` (no `Link`) — comportamiento heredado | Sin cambios — hard reload implícito |
| IP del ban no se muestra — dato de Arcturus disponible pero no expuesto | Comportamiento heredado |

---

## Próximo microproceso

**MP-CMS-003G.3 — Rediseño /admin/wordfilter**

Según backlog en `admin-full-visual-audit-atomcms.md` (Prioridad 2D):
- `WordfilterClient.tsx` — todos los inputs + tabla sin `.kx` + `bg-[#...]` completo
- Patrón similar a bans: `AdminPageHeader`, `.inp`, `table.kx`, tokens
