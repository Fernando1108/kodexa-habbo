# MP-CMS-003A — Auditoría Visual + Dirección de Rediseño CMS

> **Fecha:** 2026-05-10  
> **Estado:** Completado  
> **Tipo:** Solo documentación — sin modificaciones de código

---

## 1. Resumen Ejecutivo

El CMS actual funciona pero está construido como **dark-only hardcoded sin sistema de temas**. Todos los colores están embebidos como hex literales en inline styles y clases CSS. No existe capa semántica de tokens de color. Migrar a light-first requiere introducir variables CSS (`--color-bg-panel`, `--color-text-muted`, etc.) y reemplazar todos los inline styles por clases semánticas.

**Decisión adoptada:**
- Tema predeterminado: **LIGHT**
- Tema opcional: **DARK**
- Toggle: en topbar, persistencia en `localStorage` (fase inmediata) / DB (fase futura)

---

## 2. Decisión Light-first

### Por qué Light como default

| Argumento | Detalle |
|-----------|---------|
| **Herramientas admin son light** | Filament, Retool, Notion, Linear, Vercel dashboard — todos light by default |
| **Legibilidad en tablas densas** | Tablas de usuarios/bans/logs son más legibles sobre fondo blanco |
| **Formularios** | Inputs blancos, labels dark — lectura más rápida que sobre fondo oscuro |
| **Accesibilidad** | Contraste más fácil de cumplir en light (WCAG 4.5:1 sobre blanco) |
| **Diferenciación interna** | Landing/auth = dark gaming. Admin/housekeeper = light professional |

### Dark sigue disponible

Staff con preferencia de trabajo nocturno puede cambiar. El toggle persiste en `localStorage`. En fase futura, se guarda en la tabla `kx_user_preferences` (o campo en `users`).

---

## 3. Estado Visual Actual

### 3.1 AdminShell (`components/AdminShell.tsx`)

| Elemento | Estado actual | Problema |
|----------|--------------|---------|
| Background shell | `#0B1322` inline | Hardcoded, no token |
| Sidebar | `#0e1627` clase `.sb` en CSS | Hardcoded en globals.css |
| Topbar | `rgba(14,22,39,.85)` clase `.topbar` | Hardcoded |
| Brand area | `border-bottom: 1px solid #1f2b41` inline | Hardcoded |
| Nav item active | `.nav-item.active` con `#5BFFD7` | Solo funciona en dark |
| Profile mini en sidebar | `background: #0a1224` inline | Hardcoded, 4to color de bg diferente |
| Notificaciones dropdown | `background: #0e1627` inline | 5to color de bg diferente |
| User menu dropdown | `background: #0e1627, #131e36` inline | Hardcoded |
| Footer | `color: rgba(148,163,184,.6)` inline | Hardcoded |

**Problema mayor:** AdminShell tiene 465 líneas, es monolítico, no separable en sidebar/topbar sin refactor.

### 3.2 Admin Dashboard (`/admin/page.tsx`)

| Elemento | Problema visual |
|----------|----------------|
| Metric cards | `.card.metric` dark glassmorphism, `.metric::after` solo dark |
| Chart sparkbars | `#00D4AA → #0F766E` gradiente dark, invisible en light |
| Activity feed | `rgba(0,212,170,.15)` sobre dark — no funcionaría en light |
| Health bars | `background: rgba(15,23,42,.7)` — dark hardcoded |
| Todos los textos de ayuda | `style={{ color: '#94A3B8' }}` inline — 12+ instancias |
| Tabla "Últimos registros" | `.avt` con gradiente de colores sobre dark |

### 3.3 Admin Usuarios (`/admin/users/page.tsx`)

| Elemento | Problema visual |
|----------|----------------|
| Filter bar | `.card p-3` dark glassmorphism |
| Inputs `.inp` | `background: #0e1730` hardcoded dark |
| Tabla `.kx` | `th background: #0f1828`, striped `rgba(15,23,42,.35)` |
| Pagination | `border-top: 1px solid #1f2b41` hardcoded |
| Modal edit user | `background: #131e36` hardcoded |
| Modal confirm delete | Danger icon box `rgba(239,68,68,.15)` — OK en ambos modos |
| Avatar `.avt` | Gradientes funcionales en ambos modos |
| Inline errors | `color: #f87171` inline — OK en ambos |

### 3.4 Admin Noticias (`/admin/news/page.tsx`)

| Elemento | Estado |
|----------|--------|
| Lista de artículos | `.card` dark glassmorphism |
| Status bar lateral | Hardcoded: `#10B981`, `#475569`, `#F59E0B` |
| Badge status | `.badge-ok`, `.badge-warn`, `.badge-mono` — OK semánticos |
| Empty state | `card p-12` con icon opacity .40 — funcional |
| Acciones | `.btn btn-outline`, `.btn btn-ghost` — OK |

### 3.5 globals.css — Análisis de tokens

```
:root { color-scheme: dark; }   ← GLOBAL, afecta landing + auth + admin
```

**Clases admin hardcoded (solo dark):**
| Clase | Color hardcoded |
|-------|----------------|
| `.sb` | `background: #0e1627` |
| `.topbar` | `background: rgba(14,22,39,.85)` |
| `.card` | `rgba(30,41,59,.75) / rgba(15,23,42,.85)` |
| `.inp` | `background: #0e1730; border: #2a3b5b` |
| `.modal` | `background: #131e36; border: #243149` |
| `table.kx th` | `background: #0f1828; color: #64748B` |
| `table.kx td` | `border-bottom: rgba(31,43,65,.7)` |
| `.nav-item.active` | `rgba(0,212,170,.18)` — OK en dark, invis en light |
| `.badge-ok/warn/danger` | Semi-transparentes — FUNCIONALES en ambos |
| `.btn-primary` | `linear-gradient(#14E4BB, #00D4AA)` — OK en ambos |

**Variables CSS existentes en `@theme`:** Solo colores de branding (`--color-primary`, etc.). **No existen tokens semánticos de admin** como `--color-panel-bg`, `--color-sidebar-bg`, `--color-border-subtle`, `--color-text-secondary`.

### 3.6 `/me` Dashboard (`MeDashboard.tsx`)

- Sistema CSS **completamente distinto** al admin (clases `.card`, `.xp-bar`, `.badge` propias en línea)
- Background `#0B1421` hardcoded
- Inline styles en cada elemento de color
- Visualmente coherente internamente pero **desconectado del sistema admin**
- No comparte ni `.card` admin ni tokens

### 3.7 Landing `/` y auth (`/login`, `/register`, `/forgot-password`)

- **Fuera del scope de rediseño CMS** — mantienen identidad dark gaming
- `color-scheme: dark` global actual los afecta también, pero no causa problemas visibles porque ya son dark
- En el futuro: admin usa su propio `color-scheme` scoped, no el global

---

## 4. Referencias Funcionales Tomadas de AtomCMS

AtomCMS (Filament/Livewire/PHP) se usó solo como mapa funcional. **Cero código copiado.**

### Módulos de Housekeeping relevantes para Kodexa CMS

| Grupo | Módulos detectados en AtomCMS | Kodexa equivalente |
|-------|------------------------------|-------------------|
| **Usuarios** | Lista, editar, ban, IP lookup, historial login | `/admin/users` — existe |
| **Bans** | Listado, ban manual, IP ban, expiración | `/admin/bans` — existe |
| **Permisos** | Housekeeping permissions por rank | `/admin/permissions` — existe |
| **Wordfilter** | Palabras bloqueadas / advertencia | `/admin/wordfilter` — existe |
| **Artículos** | CRUD, tags, estado, slugs | `/admin/news` — existe |
| **Catálogo** | Páginas, items, precios | `/admin` → pendiente |
| **Emulador settings** | Key-value configuración emulador | Pendiente |
| **Logs** | Command logs, chatlog rooms, chatlog privates | `/admin/logs` — parcial |
| **Badges** | Upload, asignar, editor texto | `/admin/badges` — existe |
| **Camera / fotos** | Galería de fotos de sala | Pendiente |
| **Achievements** | Logros, categorías | Pendiente |
| **Staff applications** | Solicitudes de staff, gestión | Pendiente |
| **Alertas / mensajes** | Hotel alerts, mensajes masivos | `/admin/alerts`, `/admin/messages` — existen |
| **CMS Settings** | Configuración del CMS propio | `/admin/settings` — existe |

### Lecciones de organización del nav en AtomCMS

AtomCMS separa el nav en **3 grupos**:
1. **Atom** (CMS): Articles, Tags, Teams, Navigation, CMS Settings
2. **Hotel** (juego): Users, Catalog, Achievements, Badges, Chatlog, Command logs, Emulator settings
3. **Home** (habitación web): Categories, Items

Kodexa actualmente tiene 2 grupos: **Operación** y **Sistema**. Propuesta: refactorizar a:
1. **Hotel** (usuarios, salas, economía)
2. **Contenido** (noticias, badges, alertas, mensajes)
3. **Sistema** (permisos, bans, wordfilter, logs, configuración)

---

## 5. Problemas Visuales Detectados

### CRÍTICOS (bloquean light mode)

| ID | Problema | Archivos afectados |
|----|---------|-------------------|
| VIS-001 | `color-scheme: dark` en `:root` global — afecta todo | `globals.css:28` |
| VIS-002 | Sin tokens CSS semánticos de admin | `globals.css` — `@theme` section |
| VIS-003 | `.sb`, `.topbar`, `.card`, `.inp`, `.modal` hardcoded dark | `globals.css:496-580` |
| VIS-004 | `AdminShell` monolítico con 40+ inline styles hardcoded dark | `AdminShell.tsx` |
| VIS-005 | Todos los page headers usan `style={{ color: '#94A3B8' }}` | `/admin/page.tsx`, `/admin/users/page.tsx`, etc. |

### MODERADOS (UX/legibilidad)

| ID | Problema | Detalle |
|----|---------|---------|
| VIS-006 | `AdminShell` es monolítico (465 líneas) | Sidebar, topbar, notifs, user menu — no separables |
| VIS-007 | Sin `AdminPageHeader` reutilizable | Cada página copy-paste div con eyebrow + h1 |
| VIS-008 | `/me` completamente desconectado del sistema admin | Dos lenguajes visuales distintos |
| VIS-009 | Nav de admin tiene 2 grupos, podría beneficiarse de 3 | "Operación" mezcla hotel + contenido |
| VIS-010 | Sidebar mobile no tiene overlay/backdrop implementado en React | Solo CSS transform, sin toggle desde topbar en mobile |
| VIS-011 | Server status en sidebar son valores hardcoded (CPU 24%, RAM 3.2G) | No son datos reales |

### MENORES (polish)

| ID | Problema | Detalle |
|----|---------|---------|
| VIS-012 | Métrica de "Créditos en circulación" usa `TrendingDown` siempre | Debería ser dinámico |
| VIS-013 | Chart de actividad usa valores hardcoded (`CHART_HEIGHTS`) | No son datos reales |
| VIS-014 | Empty state de tabla usa solo texto, sin ilustración | AtomCMS usa icon + texto + CTA |
| VIS-015 | `/admin/news` lista en cards, no en tabla | Inconsistente con `/admin/users` |

---

## 6. Qué Conservar del Diseño Actual

| Elemento | Por qué conservar |
|----------|------------------|
| **Estructura shell** (sidebar + topbar + main) | Correcta, probada, bien organizada |
| **Sidebar colapsable** con localStorage | Buena UX, funciona |
| **Breadcrumb** en topbar | Claro, útil |
| **Sistema de badges** (`.badge-ok/warn/danger/info/mono`) | Semánticamente correcto, funciona en ambos modos |
| **Botones** (`.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.icon-btn`) | Sistema completo y funcional |
| **Modal + overlay** con animación | Calidad visual buena |
| **Rank badges** centralizados en `@kodexa/shared` | Correcto, mantener |
| **Notificaciones dropdown** y **user menu** | Estructura correcta, solo necesita recolor |
| **Tabla `.kx`** | Estructura HTML correcta, solo CSS a actualizar |
| **Nav items con active state** via `pathname.startsWith()` | Lógica correcta |
| **Lógica de todos los módulos** | Sin tocar — solo rediseño visual |

---

## 7. Qué Reemplazar

| Elemento | Por qué reemplazar | Con qué |
|----------|-------------------|---------|
| **Inline styles hardcoded** (40+ instancias) | Imposibles de tematizar | Clases semánticas Tailwind + tokens CSS |
| **`:root { color-scheme: dark }`** global | Afecta landing + auth | `color-scheme` scoped solo al admin wrapper |
| **Colores hardcoded en globals.css** (`.sb`, `.card`, `.inp`, `.modal`) | Sin theming | Variables `--admin-*` en `data-theme` |
| **AdminShell monolítico** | No testeable, no mantenible | `AdminSidebar` + `AdminTopbar` separados |
| **Copy-paste de headers** en cada página | Duplicación | `AdminPageHeader` reutilizable |
| **Sin `AdminStatCard`** | Metric cards inline | Componente encapsulado |
| **Server status hardcoded** | Datos falsos | Real API o eliminado |
| **Chart hardcoded** | Datos falsos | Real o placeholder honesto |

---

## 8. Nueva Dirección Visual — Light-first

### Paleta Light Mode (admin)

```
Panel bg:        #FFFFFF
Sidebar bg:      #F8FAFC  (slate-50)
Sidebar hover:   #F1F5F9  (slate-100)
Topbar bg:       #FFFFFF  (con border-b slate-200)
Card bg:         #FFFFFF  (con border slate-200, shadow-sm)
Card hover:      #FAFAFA
Input bg:        #FFFFFF  (border slate-300, focus ring primary)
Input focus:     border #00D4AA, shadow rgba(0,212,170,.2)
Text primary:    #0F172A  (slate-900)
Text secondary:  #475569  (slate-600)
Text muted:      #94A3B8  (slate-400)
Border subtle:   #E2E8F0  (slate-200)
Border medium:   #CBD5E1  (slate-300)
Active nav:      background #F0FDF9 (green-50), color #00D4AA, border-l #00D4AA
Table header:    #F8FAFC  (slate-50)
Table row hover: #F8FAFC
Table stripe:    #FAFAFA
Modal bg:        #FFFFFF  (border slate-200)
Overlay:         rgba(15,23,42,.5)
```

### Paleta Dark Mode (admin — equivalente)

```
Panel bg:        #0B1322
Sidebar bg:      #0e1627
Topbar bg:       rgba(14,22,39,.85)  +  backdrop-blur
Card bg:         rgba(30,41,59,.75)
Input bg:        #0e1730
Text primary:    #F8FAFC
Text secondary:  #94A3B8
Border subtle:   #1f2b41
Active nav:      rgba(0,212,170,.18), color #5BFFD7
Table header:    #0f1828
Modal bg:        #131e36
```

### Color primario de acción

`#00D4AA` — se mantiene. Es la identidad Kodexa, funciona en ambos modos como color de acción/énfasis.

### Tipografía

Sora (sans) + JetBrains Mono — se mantienen. Correctos para admin.

### Sombras Light Mode

```
card:        0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)
card-hover:  0 4px 12px rgba(0,0,0,.1)
modal:       0 20px 60px rgba(0,0,0,.15)
topbar:      0 1px 0 #E2E8F0  (border-bottom, sin shadow)
```

### Anti-patterns a evitar

- No glassmorphism en light mode (`.card` glass solo en dark)
- No gradientes de fondo en cards de dashboard en light
- No aurora/grid-bg/stars — esos son para landing/auth
- No `text-gradient` en headers de admin en light (solo texto plano)
- Sin `backdrop-filter` en sidebar light (solo en dark)

---

## 9. Sistema de Tema Propuesto

### Mecanismo

```html
<!-- En AdminShell wrapper: -->
<div data-theme="light">   <!-- o "dark" -->
  <!-- todo el admin aquí -->
</div>
```

CSS en `globals.css`:
```css
/* Admin theme tokens */
[data-theme="light"] {
  --admin-bg:          #FFFFFF;
  --admin-sidebar-bg:  #F8FAFC;
  --admin-topbar-bg:   #FFFFFF;
  --admin-card-bg:     #FFFFFF;
  --admin-border:      #E2E8F0;
  --admin-text:        #0F172A;
  --admin-text-muted:  #475569;
  --admin-input-bg:    #FFFFFF;
  --admin-input-border:#CBD5E1;
  --admin-nav-active-bg: rgba(0,212,170,.1);
  --admin-nav-active:  #00B894;
  --admin-table-head:  #F8FAFC;
  color-scheme: light;
}

[data-theme="dark"] {
  --admin-bg:          #0B1322;
  --admin-sidebar-bg:  #0e1627;
  --admin-topbar-bg:   rgba(14,22,39,.85);
  --admin-card-bg:     rgba(30,41,59,.75);
  --admin-border:      #1f2b41;
  --admin-text:        #F8FAFC;
  --admin-text-muted:  #94A3B8;
  --admin-input-bg:    #0e1730;
  --admin-input-border:#2a3b5b;
  --admin-nav-active-bg: rgba(0,212,170,.18);
  --admin-nav-active:  #5BFFD7;
  --admin-table-head:  #0f1828;
  color-scheme: dark;
}
```

### Toggle

```tsx
// En AdminTopbar:
<ThemeToggle />
// Cambia data-theme en el wrapper de AdminShell
// Persiste en localStorage('admin_theme')
// Default: 'light'
```

### Sin flash visual

En `AdminLayout`:
```tsx
// Script inline (antes de hidratación React):
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    const t = localStorage.getItem('admin_theme') || 'light';
    document.getElementById('admin-shell').setAttribute('data-theme', t);
  })()
` }} />
```

### Persistencia futura en DB

Cuando exista `kx_user_preferences` (tabla futura):
```
kx_user_preferences.admin_theme = 'light' | 'dark'
```
Leer al cargar `AdminLayout` server-side. Si DB dice `dark`, pasar prop a AdminShell → `defaultTheme="dark"`.

### Scope

- Tema admin **NO afecta** landing `/`
- Tema admin **NO afecta** auth (`/login`, `/register`, `/forgot-password`)
- Cada scope tiene su propio `color-scheme` (admin = light/dark dinámico, landing = dark fijo)

---

## 10. Componentes Base Propuestos

### `AdminShell`

**Actual:** 1 archivo, 465 líneas, monolítico  
**Nuevo:** Wrapper delgado que compone:

```tsx
<div id="admin-shell" data-theme={theme} className="flex min-h-screen">
  <AdminSidebar user={user} />
  <div className="flex-1 min-w-0 flex flex-col">
    <AdminTopbar user={user} crumb={crumb} />
    <main className="flex-1 px-5 lg:px-7 py-6 max-w-[1400px] w-full mx-auto">
      {children}
    </main>
    <AdminFooter />
  </div>
</div>
```

### `AdminSidebar`

- Recibe: `user`, `collapsed`, `onToggle`
- Contiene: brand, nav sections, logout, server status
- Sin topbar, sin notifs

### `AdminTopbar`

- Recibe: `user`, `crumb`, `onToggleSidebar` (mobile)
- Contiene: breadcrumb, search, notifs, user menu, `ThemeToggle`

### `ThemeToggle`

```tsx
<ThemeToggle />
// Sun/Moon icon
// onClick: toggle light/dark en data-theme + localStorage
```

### `AdminPageHeader`

```tsx
<AdminPageHeader
  eyebrow="Gestión"
  title="Usuarios"
  subtitle="432 registrados"
  actions={<Button>Crear usuario</Button>}
/>
```

Elimina copy-paste de `<div className="flex items-end justify-between...">` en cada página.

### `AdminCard`

```tsx
<AdminCard>
  <AdminCard.Header>Título</AdminCard.Header>
  <AdminCard.Body>...</AdminCard.Body>
</AdminCard>
```

Usa `var(--admin-card-bg)` y `var(--admin-border)` — funciona en ambos temas.

### `AdminStatCard`

```tsx
<AdminStatCard
  icon={<UsersRound />}
  iconColor="primary"   // primary | purple | amber | green
  value={fmt(onlineUsers)}
  label="Usuarios online"
  trend={{ direction: 'up', label: 'activos ahora' }}
/>
```

Encapsula las 4 metric cards del dashboard.

### `AdminTable`

```tsx
<AdminTable
  columns={[{ key: 'username', label: 'Usuario' }, ...]}
  rows={users}
  loading={loading}
  emptyState={<EmptyState icon={<Users />} message="No hay usuarios" />}
/>
```

Usa `var(--admin-table-head)` y `var(--admin-border)`.

### `AdminFormCard`

```tsx
<AdminFormCard title="Editar usuario">
  <FormField label="Email">
    <Input ... />
  </FormField>
</AdminFormCard>
```

### `RankBadge`

```tsx
<RankBadge rank={7} />
// Usa RANK_LABELS + rankBadgeClass centralizados
```

Ya existe como patrón — encapsular en componente.

### `StatusBadge`

```tsx
<StatusBadge status="PUBLISHED" />   // verde
<StatusBadge status="DRAFT" />       // amarillo
<StatusBadge status="ARCHIVED" />    // gris
<StatusBadge online={true} />        // dot online/offline
```

### `EmptyState`

```tsx
<EmptyState
  icon={<Newspaper />}
  title="Sin noticias todavía"
  description="Crea la primera noticia del hotel."
  action={<Link href="/admin/news/create">Nueva noticia</Link>}
/>
```

### `LoadingState`

```tsx
<LoadingState rows={5} />   // skeleton table rows
```

### `ConfirmModal`

```tsx
<ConfirmModal
  open={!!deleteUser}
  onClose={() => setDeleteUser(null)}
  onConfirm={confirmDelete}
  title={`¿Eliminar a ${deleteUser?.username}?`}
  description="Acción permanente. Se borrarán todos sus datos."
  variant="danger"
  loading={saving}
/>
```

### `ActionButton`

```tsx
<ActionButton icon={<Pencil />} title="Editar" onClick={...} />
<ActionButton icon={<Trash2 />} title="Eliminar" variant="danger" onClick={...} />
```

---

## 11. Roadmap de Implementación

### MP-CMS-003B — Theme Foundation + AdminShell Visual Global

**Objetivo:** Infraestructura de temas + nuevo shell.

Tareas:
- Añadir tokens `[data-theme="light"]` / `[data-theme="dark"]` en `globals.css`
- Reemplazar colores hardcoded de `.sb`, `.topbar`, `.card`, `.inp`, `.modal`, `table.kx` por variables
- Separar `AdminShell` → `AdminSidebar` + `AdminTopbar` + `AdminShell` (thin wrapper)
- Implementar `ThemeToggle` con localStorage
- Script anti-flash en `AdminLayout`
- `AdminPageHeader`, `AdminStatCard`, `EmptyState`, `ConfirmModal` como componentes base
- TypeCheck final

### MP-CMS-003C — Rediseño `/admin` Dashboard

**Objetivo:** Dashboard principal con datos reales.

Tareas:
- 4 metric cards con `AdminStatCard`
- Chart de actividad: conectar datos reales o eliminar hardcode
- Activity feed: limpiar diseño, light/dark correcto
- "Últimos registros": `AdminTable` + `RankBadge`
- "Salud del hotel": datos reales o widget placeholder honesto
- Responsive: verificar mobile

### MP-CMS-003D — Rediseño `/admin/users`

**Objetivo:** Gestión de usuarios light-first.

Tareas:
- Filters bar → `AdminCard` con inputs temáticos
- Tabla → `AdminTable` con `RankBadge`, `StatusBadge`
- Modales → `ConfirmModal` + `AdminFormCard`
- Acción "Dar créditos" → modal encapsulado

### MP-CMS-003E — Rediseño `/admin/news`

**Objetivo:** Gestión de noticias coherente con users.

Tareas:
- Cambiar cards de noticias → `AdminTable` (coherencia con users)
- Status → `StatusBadge` reutilizable
- Empty state → `EmptyState` componente
- Formulario create/edit → `AdminFormCard`

### MP-CMS-003F — Rediseño `/me` Dashboard

**Objetivo:** Integrar `/me` al sistema visual admin.

Tareas:
- Reescribir `MeDashboard.tsx` usando tokens de tema
- Conectar al mismo sistema de variables `--admin-*`
- Coherencia visual con admin (mismo lenguaje de cards, badges, botones)
- Mantener toda la lógica de API y datos intacta

### MP-CMS-003G — Normalización global

**Objetivo:** Unificar formularios, tablas, badges y modales restantes.

Tareas:
- Auditar todos los módulos: bans, permissions, badges, alerts, messages, wordfilter, logs, settings
- Aplicar componentes base uniformemente
- Eliminar inline styles residuales
- TypeCheck + visual QA light/dark en cada módulo

---

## 12. Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Flash de tema al cargar (FOUC) | Alta si no se añade script anti-flash | Script inline en `AdminLayout` antes de hidratación |
| `color-scheme: dark` global rompiendo inputs en light | Media | Scoping a `[data-theme]` wrapper, no a `:root` |
| Contraste insuficiente en dark mode tras migrar a variables | Media | Verificar WCAG 4.5:1 en ambos modos en MP-003B |
| Landing/auth hereda cambio de `color-scheme` | Baja si se hace scope correcto | Variables `--admin-*` solo dentro de `[data-theme]`, no globales |
| AdminShell split rompe notificaciones o user menu | Baja | Props bien tipadas + tests manuales antes de mergear |
| Refactor de 465 líneas introduce errores de tipos | Media | TypeCheck obligatorio al final de cada MP |

---

## 13. Validaciones de Este Microproceso

| Validación | Resultado |
|------------|-----------|
| Solo se creó documentación | ✅ Confirmado |
| No se tocó lógica funcional | ✅ Confirmado |
| No se tocó base de datos | ✅ Confirmado |
| No se tocó Prisma schema | ✅ Confirmado |
| No se tocó Arcturus | ✅ Confirmado |
| No se modificaron rutas funcionales | ✅ Confirmado |
| No se instalaron dependencias | ✅ Confirmado |
| No se tocó middleware | ✅ Confirmado |
| No se tocó SSO | ✅ Confirmado |
| AtomCMS usado solo como referencia funcional | ✅ Confirmado — cero código copiado |

---

## 14. Próximo Microproceso

**MP-CMS-003B — Theme Foundation Light/Dark + nuevo AdminShell visual global**

Primer paso de implementación real. Infraestructura de temas, split de AdminShell, componentes base. Sin tocar lógica ni DB.
