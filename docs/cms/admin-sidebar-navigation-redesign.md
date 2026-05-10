# MP-CMS-003I — Reorganización AdminSidebar con section headers

> **Fecha:** 2026-05-10
> **Estado:** Completado
> **TypeCheck:** ✅ 0 errores

---

## Archivos revisados (solo lectura)

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/components/admin/AdminSidebar.tsx` | Sidebar principal — objetivo |
| `docs/cms/atomcms-full-admin-housekeeping-audit.md` | Referencia estructura AtomCMS |
| `docs/cms/admin-full-visual-audit-atomcms.md` | Navegación propuesta previa |
| `apps/web/src/app/globals.css` | Clases `.nav-section`, `.nav-item`, `.sb` |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/components/admin/AdminSidebar.tsx` | Reorganización de 2 secciones flat → 4 secciones semánticas |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `docs/cms/admin-sidebar-navigation-redesign.md` | Este documento |

---

## Navegación anterior

**Estructura (2 secciones):**

```
Operación
  Dashboard      → /admin (exact)
  Usuarios       → /admin/users
  Salas          → /admin/rooms
  Catálogo       → null (disabled)
  Noticias       → /admin/news

Sistema
  Configuración  → /admin/settings
  Logs           → /admin/logs
  Bans           → /admin/bans
  Wordfilter     → /admin/wordfilter
  Permisos       → /admin/permissions
  Badges         → /admin/badges
  Alertas        → /admin/alerts
  Mensajes       → /admin/messages
```

**Problemas:**
- "Operación" mezcla navegación administrativa (dashboard/salas) con contenido (usuarios/noticias)
- "Sistema" agrupa moderación + configuración + mensajes — sin separación semántica
- Sin distinción entre herramientas de moderación y gestión del sistema
- No refleja la estructura de AtomCMS (Hotel/Website/Moderation/System)

---

## Navegación nueva

**Estructura (4 secciones):**

```
HOTEL
  Dashboard      → /admin (exact)
  Salas          → /admin/rooms
  Catálogo       → null (disabled, badge "soon")   ← futuro: post-Arcturus

COMUNIDAD
  Usuarios       → /admin/users
  Noticias       → /admin/news
  Mensajes       → /admin/messages

MODERACIÓN
  Baneos         → /admin/bans
  Wordfilter     → /admin/wordfilter
  Alertas        → /admin/alerts
  Logs           → /admin/logs

SISTEMA
  Permisos       → /admin/permissions
  Badges         → /admin/badges
  Configuración  → /admin/settings

[al final]
  Cerrar sesión  (botón signOut)
```

---

## Cambios técnicos

### Estructura de datos refactorizada

**Antes — 2 arrays const separados:**
```typescript
const NAV_OP = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard, exact: true },
  ...
] as const;

const NAV_SYS = [
  { label: 'Configuración', href: '/admin/settings', Icon: Settings },
  ...
] as const;
```

**Después — array de secciones tipado:**
```typescript
interface NavItem {
  label: string;
  href:  string | null;
  Icon:  LucideIcon;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  { label: 'Hotel',      items: [...] },
  { label: 'Comunidad',  items: [...] },
  { label: 'Moderación', items: [...] },
  { label: 'Sistema',    items: [...] },
];
```

### Rendering refactorizado

**Antes — 2 bloques `.map()` separados con condición manual:**
```tsx
{!collapsed ? <div className="nav-section">Operación</div> : <div className="h-3" />}
{NAV_OP.map(({ label, href, Icon, exact }) => href ? <Link ...> : <div ...>)}
{!collapsed ? <div className="nav-section">Sistema</div> : <div className="h-3" />}
{NAV_SYS.map(({ label, href, Icon }) => <Link ...>)}
```

**Después — un solo `.map()` sobre secciones:**
```tsx
{NAV_SECTIONS.map(section => (
  <div key={section.label}>
    {!collapsed
      ? <div className="nav-section">{section.label}</div>
      : <div className="h-2" />
    }
    {section.items.map(({ label, href, Icon, exact }) =>
      href ? <Link ...> : <div disabled ...>
    )}
  </div>
))}
```

### Items deshabilitados — mejora visual

**Antes:** Solo `opacity: .4, cursor: 'default'` sin indicador contextual.

**Después:** Mismo estilo base + badge `"soon"` en sidebar expandido:
```tsx
<span className="flex-1 flex items-center justify-between gap-1">
  {label}
  <span className="text-[9px] font-mono uppercase ... badge">soon</span>
</span>
```
En collapsed: `title="Catálogo (próximamente)"` — tooltip con contexto.

### Import limpiado

`rankBadgeClass` eliminado de imports — no se usaba en este archivo. Solo se necesita en `RankBadge.tsx`.

---

## Rutas enlazadas

| Label | Ruta | Sección |
|-------|------|---------|
| Dashboard | `/admin` | Hotel |
| Salas | `/admin/rooms` | Hotel |
| Usuarios | `/admin/users` | Comunidad |
| Noticias | `/admin/news` | Comunidad |
| Mensajes | `/admin/messages` | Comunidad |
| Baneos | `/admin/bans` | Moderación |
| Wordfilter | `/admin/wordfilter` | Moderación |
| Alertas | `/admin/alerts` | Moderación |
| Logs | `/admin/logs` | Moderación |
| Permisos | `/admin/permissions` | Sistema |
| Badges | `/admin/badges` | Sistema |
| Configuración | `/admin/settings` | Sistema |

## Rutas futuras documentadas (no enlazadas)

| Label | Ruta futura | Sección | Razón pendiente |
|-------|-------------|---------|-----------------|
| Catálogo | `/admin/catalog` | Hotel | Requiere Arcturus Morningstar live |
| Economía | `/admin/economy` | Hotel | Post MP-ATOM-003 |
| Staff / Teams | `/admin/teams` | Comunidad | Post MP-COM-002 |
| Chat Logs | `/admin/chatlogs` | Moderación | Requiere Arcturus (room_chat_log) |
| IP Blocking | `/admin/ips` | Moderación | Post MP-MOD-001 |
| Permisos Staff | `/admin/housekeeping-perms` | Sistema | Post MP-CMS-PERM-001 |
| RCON | `/admin/rcon` | Sistema | Post MP-RCON-001 (rank ≥ 9) |
| Desarrollo | `/admin/dev` | Sistema | Post-Arcturus live |

---

## Comportamiento collapsed

| Elemento | Collapsed | Expandido |
|---------|-----------|----------|
| Section headers | Reemplazados por `<div className="h-2" />` spacer | Visibles como `nav-section` |
| Nav items con `href` | Icono solo + `title` tooltip | Icono + label |
| Nav items `disabled` | Icono solo + `title="Label (próximamente)"` | Icono + label + badge "soon" |
| Profile mini | Avatar circular pequeño | Card con avatar + username + rank |
| Brand | Solo logo K | K + "Kodexa." + "Hotel" |
| Server status | Sólo `pulse-dot` | Card completa con CPU/RAM |
| localStorage collapsed | Preservado (sin cambios) | Preservado |

---

## Compatibilidad light/dark

Todos los elementos usan tokens:
- Section headers: `var(--admin-text-subtle)` via `.nav-section`
- Nav items: `var(--admin-text-muted)` via `.nav-item`
- Active items: `var(--admin-nav-active-color)` + `var(--admin-nav-active-bg)` via `.nav-item.active`
- Badge "soon": `var(--admin-surface-soft)` + `var(--admin-text-subtle)`
- Surface/border: `var(--admin-surface-soft)` + `var(--admin-border)`

---

## Referencia AtomCMS aplicada

| Patrón AtomCMS | Adaptación Kodexa |
|---------------|-------------------|
| Navigation groups: Website / Hotel / Moderation | 4 secciones: Hotel / Comunidad / Moderación / Sistema |
| `$navigationGroup` en cada Filament Resource | `NavSection.label` en el array `NAV_SECTIONS` |
| Items deshabilitados → sin mostrar | Items deshabilitados → badge "soon" + opacity (visibilidad de roadmap) |
| Sidebar colapsable | Preservado sin cambios |
| Orden: Dashboard siempre primero en su grupo | Dashboard → primer item de Hotel |

---

## Qué no se implementó

| Feature | Razón |
|---------|-------|
| Tooltips en todos los items collapsed | Ya funcionan con `title` nativo del DOM |
| Hover tooltip custom (Radix/Tooltip) | No instalar dependencias — `title` es suficiente |
| Badges de conteo (unread messages, active bans) | Requiere server data en layout — complejidad futura |
| Collapsible sub-groups | No necesario en este estado del admin |
| Items ocultos por rank | MP-CMS-PERM-001 (permisos granulares) — no implementar aquí |
| Iconos para currencies en sidebar | Post MP-ATOM-002 |

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No rutas nuevas creadas | ✅ |
| No Arcturus | ✅ |
| No DB / schema / migrations / seed | ✅ |
| No middleware.ts | ✅ |
| No SSO | ✅ |
| No auth/landing/me | ✅ |
| No dependencias nuevas | ✅ |
| TypeCheck 0 errores | ✅ |
| Collapsed mode preservado | ✅ |
| localStorage preservado | ✅ |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| Badge "soon" en Catálogo puede confundir si el módulo tarda mucho | Aceptable — comunica roadmap |
| Section headers aumentan altura de nav — posible scroll en pantallas pequeñas | nav ya tiene `overflow-y-auto` — cubierto |
| Items futuros no están protegidos por rank en sidebar | MP-CMS-PERM-001 lo resolverá con filtrado por permiso |
| `title` nativo puede no mostrarse en touch (mobile) | Comportamiento heredado — sidebar mobile out of scope |

---

## Próximo microproceso

**MP-ATOM-002 — Assets currencies + componente CurrencyIcon**

- Copiar `credits.gif`, `duckets.png`, `diamonds.png`, `points.png` de AtomCMS a `/public/images/currencies/`
- Crear componente `<CurrencyIcon type="credits|duckets|diamonds|points" size={n} />` en `components/`
- Usable en admin/users (tab currencies futuro), dashboard stats, y perfil `/me`
- Tipos: seguir `CurrencyTypes` de AtomCMS (`-1`, `0`, `5`, `101`)
