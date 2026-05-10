# MP-CMS-003B — Theme Foundation Light/Dark + AdminShell

> **Fecha:** 2026-05-10  
> **Estado:** Completado  
> **TypeCheck:** ✅ 0 errores

---

## Decisión de implementación

Tema por defecto: **LIGHT**.  
El admin/housekeeper carga en modo claro. El usuario puede cambiar a dark con el toggle del topbar. La preferencia persiste en `localStorage`.

---

## Tokens CSS — Sistema de variables

Definidos en `apps/web/src/app/globals.css` bajo el selector `.admin-shell`.

### Estrategia de scoping

```css
/* Tokens en el elemento .admin-shell (light = default) */
.admin-shell,
.admin-shell[data-theme="light"] { ... }

/* Override dark */
.admin-shell[data-theme="dark"] { ... }
```

Los tokens están **completamente scoped** al div `.admin-shell`. Landing `/`, auth pages (`/login`, `/register`, `/forgot-password`) no usan variables `--admin-*` y no se ven afectadas.

`color-scheme: light` / `color-scheme: dark` también se define en el scope de `.admin-shell`, sobrescribiendo el `:root { color-scheme: dark }` para el admin solamente.

### Tokens disponibles

| Token | Light | Dark |
|-------|-------|------|
| `--admin-bg` | `#F8FAFC` | `#0B1322` |
| `--admin-surface` | `#FFFFFF` | `#0e1627` |
| `--admin-surface-soft` | `#F1F5F9` | `#131e36` |
| `--admin-border` | `#E2E8F0` | `#1f2b41` |
| `--admin-border-mid` | `#CBD5E1` | `#2a3b5b` |
| `--admin-text` | `#0F172A` | `#F8FAFC` |
| `--admin-text-muted` | `#64748B` | `#94A3B8` |
| `--admin-text-subtle` | `#94A3B8` | `#64748B` |
| `--admin-primary` | `#00D4AA` | `#00D4AA` |
| `--admin-primary-hover` | `#00B894` | `#5BFFD7` |
| `--admin-primary-bg` | `rgba(0,212,170,.1)` | `rgba(0,212,170,.15)` |
| `--admin-danger` | `#EF4444` | `#EF4444` |
| `--admin-warning` | `#F59E0B` | `#F59E0B` |
| `--admin-success` | `#10B981` | `#10B981` |
| `--admin-sidebar-bg` | `#FFFFFF` | `#0e1627` |
| `--admin-sidebar-border` | `#E2E8F0` | `#1f2b41` |
| `--admin-topbar-bg` | `rgba(255,255,255,.92)` | `rgba(14,22,39,.88)` |
| `--admin-topbar-border` | `#E2E8F0` | `#1f2b41` |
| `--admin-nav-hover-bg` | `#F1F5F9` | `rgba(51,65,85,.4)` |
| `--admin-nav-active-bg` | `rgba(0,212,170,.08)` | `rgba(0,212,170,.18)` |
| `--admin-nav-active-color` | `#00B894` | `#5BFFD7` |
| `--admin-inp-bg` | `#FFFFFF` | `#0e1730` |
| `--admin-inp-border` | `#CBD5E1` | `#2a3b5b` |
| `--admin-modal-bg` | `#FFFFFF` | `#131e36` |
| `--admin-table-head-bg` | `#F8FAFC` | `#0f1828` |
| `--admin-table-stripe` | `rgba(248,250,252,.8)` | `rgba(15,23,42,.35)` |
| `--admin-overlay` | `rgba(15,23,42,.45)` | `rgba(8,12,24,.7)` |
| `--admin-card-shadow` | soft `0 1px 3px` | dark glow |
| `--admin-card-shadow-hover` | `0 4px 14px rgba(0,0,0,.09)` | deeper |

### Scoped overrides en globals.css

Las siguientes clases existentes tienen **overrides scoped** bajo `.admin-shell`:
- `.admin-shell .sb` — sidebar bg y border
- `.admin-shell .nav-item` — text, hover, active
- `.admin-shell .topbar` — bg y border
- `.admin-shell .card` — surface, border, shadow (sin glassmorphism en light)
- `.admin-shell[data-theme="dark"] .card` — reactiva glassmorphism en dark
- `.admin-shell .inp` — bg, border, color, placeholder
- `.admin-shell .modal` — bg y border
- `.admin-shell .overlay` — opacity
- `.admin-shell table.kx th/td/tr` — all table colors
- `.admin-shell .btn-outline` — transparent en light, border visible
- `.admin-shell .btn-ghost`, `.icon-btn`, `.pill`, `.crumb`, `.menu`

Las clases originales (sin scope) no fueron tocadas → landing/auth sin cambios.

### Admin typography helpers (nuevas clases)

```css
.admin-eyebrow      /* uppercase mono label */
.admin-page-title   /* h1 de página */
.admin-page-subtitle /* subtítulo de página */
```

---

## ThemeToggle

**Archivo:** `apps/web/src/components/admin/ThemeToggle.tsx`

```tsx
<ThemeToggle theme={theme} onToggle={onToggleTheme} />
```

- Muestra `<Moon>` en light → click cambia a dark
- Muestra `<Sun>` en dark → click cambia a light
- `aria-label` dinámico para accesibilidad
- Persiste en `localStorage('kodexa-admin-theme')`
- Actualiza `data-theme` en el div `.admin-shell` vía React state

**LocalStorage key:** `kodexa-admin-theme`  
**Valores:** `'light'` | `'dark'`  
**Default:** `'light'`

---

## AdminShell (nuevo — thin orchestrator)

**Archivo:** `apps/web/src/components/AdminShell.tsx`

Antes: 465 líneas monolíticas  
Después: ~70 líneas, orquesta los sub-componentes

```tsx
<div className="admin-shell" data-theme={theme}>
  <AdminSidebar user collapsed onToggleCollapse />
  <div className="flex-1 flex flex-col">
    <AdminTopbar user theme onToggleTheme />
    <main>{children}</main>
    <footer />
  </div>
</div>
```

**Hydration strategy:** SSR render con `theme='light'`. Después de mount, `useEffect` lee `localStorage`. Si dark está guardado, cambia a dark. Esto produce flash mínimo aceptable en admin.

---

## AdminSidebar

**Archivo:** `apps/web/src/components/admin/AdminSidebar.tsx`

Extraído de AdminShell. Contiene:
- Brand button (click = toggle collapse)
- Profile mini (avatar del juego o iniciales)
- Nav groups: **Operación** + **Sistema**
- Logout button
- Server status footer
- Sidebar collapse con `localStorage('admin_sb_collapsed')`

Usa `var(--admin-*)` en lugar de colores hardcoded.

---

## AdminTopbar

**Archivo:** `apps/web/src/components/admin/AdminTopbar.tsx`

Extraído de AdminShell. Contiene:
- Breadcrumb dinámico por pathname
- Search input (UI only)
- `<ThemeToggle>` ← nuevo
- Notificaciones dropdown (fetch `/api/admin/notifications`)
- User menu dropdown (Mi dashboard, Mi perfil, Configuración, Logout)

Todos los colores usan `var(--admin-*)`.

---

## Componentes base creados

| Componente | Archivo | Uso |
|-----------|---------|-----|
| `ThemeToggle` | `admin/ThemeToggle.tsx` | Topbar — sun/moon toggle |
| `AdminPageHeader` | `admin/AdminPageHeader.tsx` | Encabezado estándar de página (eyebrow + h1 + actions) |
| `AdminStatCard` | `admin/AdminStatCard.tsx` | Tarjeta de métrica con icon, value, label, trend |
| `EmptyState` | `admin/EmptyState.tsx` | Estado vacío con icon + texto + action |
| `ConfirmModal` | `admin/ConfirmModal.tsx` | Modal de confirmación danger/default |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/globals.css` | Añadida sección completa "ADMIN THEME SYSTEM" (~130 líneas) |
| `apps/web/src/components/AdminShell.tsx` | Reescrito como thin orchestrator (~70 líneas) |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/components/admin/AdminSidebar.tsx` | Sidebar con nav, avatar, collapse |
| `apps/web/src/components/admin/AdminTopbar.tsx` | Topbar con search, toggle, notifs, user menu |
| `apps/web/src/components/admin/ThemeToggle.tsx` | Botón light/dark |
| `apps/web/src/components/admin/AdminPageHeader.tsx` | Header reutilizable de página |
| `apps/web/src/components/admin/AdminStatCard.tsx` | Tarjeta de estadística |
| `apps/web/src/components/admin/EmptyState.tsx` | Estado vacío |
| `apps/web/src/components/admin/ConfirmModal.tsx` | Modal de confirmación |
| `docs/cms/cms-theme-foundation.md` | Este documento |

---

## Hardcoded colors eliminados

De `AdminShell.tsx` (ahora delgado):
- `#0B1322` — eliminado (era background de todo el shell)
- `rgba(148,163,184,.6)` — eliminado (era color del footer)
- `#1f2b41` — eliminado (era border del footer)
- Todos los inline styles del sidebar, topbar, user menu, notifs → CSS vars

De `AdminSidebar.tsx` y `AdminTopbar.tsx`:
- Todos los colores dark hardcoded del AdminShell original reemplazados por `var(--admin-*)` 
- Excepciones mantenidas: colores de rank/gold `#F59E0B`, gradiente de avatar fallback `#5BFFD7,#7C3AED`, accent colors de notif icons — son colores de acento fijos, no de tema

---

## Anti-flash — Pendiente

**Situación actual:** SSR siempre renderiza `theme='light'`. El `useEffect` post-mount aplica dark si localStorage lo tiene. Para usuarios dark habrá un flash white→dark de ~50-100ms al cargar la primera vez.

**Estrategia futura (MP-CMS-003B+):** 
```tsx
// En admin layout (server component), leer cookie de tema:
const cookieStore = await cookies();
const defaultTheme = (cookieStore.get('kodexa-admin-theme')?.value ?? 'light') as 'light' | 'dark';

// Pasar a AdminShell como prop defaultTheme
// ThemeToggle también actualiza la cookie (server action o middleware)
```

Alternativa más simple: script anti-flash en `admin/layout.tsx`:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  try {
    var t = localStorage.getItem('kodexa-admin-theme') || 'light';
    document.currentScript.closest('.admin-shell')?.setAttribute('data-theme', t);
  } catch(e) {}
` }} />
```

Pero este script se ejecuta antes de que React hidrate, cuando `.admin-shell` aún no existe. **Pendiente de resolver en MP-CMS-003C o dedicado.**

---

## Validaciones

| Validación | Resultado |
|------------|-----------|
| TypeCheck `tsc --noEmit` | ✅ 0 errores |
| No se tocó Arcturus | ✅ Confirmado |
| No se tocó Prisma schema | ✅ Confirmado |
| No se creó migración | ✅ Confirmado |
| No se tocó seed.ts | ✅ Confirmado |
| No se tocó middleware.ts | ✅ Confirmado |
| No se tocó SSO | ✅ Confirmado |
| `/admin` protegido por `canAccessAdmin` en layout | ✅ Sin cambios en layout |
| No se creó `/home` | ✅ Confirmado |
| Auth pages sin rediseño | ✅ Confirmado |
| Landing sin cambios | ✅ Confirmado |
| Admin carga en light por defecto | ✅ `useState('light')` + useEffect |
| Toggle cambia dark y persiste | ✅ `localStorage('kodexa-admin-theme')` |
| No imports desde `@/middleware` | ✅ Confirmado |

---

## Riesgos pendientes

| Riesgo | Estado |
|--------|--------|
| Flash white→dark para usuarios dark (~50ms) | Aceptable para admin; estrategia cookie documentada |
| Páginas admin internas (`/admin/*`) aún con colores hardcoded inline | Se migran en MP-003C, 003D, 003E, 003F |
| `/me` dashboard sin tokens admin | MP-003F |

---

## Próximo microproceso

**MP-CMS-003C — Rediseño `/admin` dashboard**

Usar los nuevos tokens y componentes base:
- Reemplazar metric cards inline → `<AdminStatCard>`
- Reemplazar page header copy-paste → `<AdminPageHeader>`
- Eliminar `style={{ color: '#94A3B8' }}` inline → clases con `var(--admin-text-muted)`
- Chart: datos reales o placeholder honesto
- Verificar visual en light y dark
