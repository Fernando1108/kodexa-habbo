# MP-CMS-003E.1 — Auditoría Visual Completa /admin + Referencia AtomCMS

> **Fecha:** 2026-05-10
> **Estado:** Completado (solo documentación — sin cambios de código)
> **Próximo paso:** MP-CMS-003G — Normalización módulos restantes

---

## Resumen Ejecutivo

Se auditaron **12 archivos** del área `/admin`. De ellos, **5 ya están migrados** a tokens (003C–E). Los **9 restantes** usan colores hardcodeados (hex/Tailwind arbitrary) sin excepción, ninguno usa `AdminPageHeader`, y varios tienen modales y tablas custom que duplican componentes existentes.

El estado actual es de **migración parcial (~35%)** del sistema admin.

---

## Rutas auditadas

| Ruta | Archivo principal | Estado |
|------|-------------------|--------|
| `/admin` | `admin/page.tsx` | ✅ Migrado (003C) |
| `/admin/users` | `admin/users/page.tsx` | ✅ Migrado (003D) |
| `/admin/news` | `admin/news/page.tsx` + `NewsForm.tsx` + `NewsAdminActions.tsx` | ✅ Migrado (003E) |
| `/admin/rooms` | `admin/rooms/page.tsx` | ❌ Sin migrar |
| `/admin/logs` | `admin/logs/page.tsx` | ❌ Sin migrar |
| `/admin/bans` | `admin/bans/page.tsx` + `BansClient.tsx` | ❌ Sin migrar |
| `/admin/settings` | `AdminSettingsClient.tsx` | ❌ Sin migrar |
| `/admin/permissions` | `PermissionsClient.tsx` | ❌ Sin migrar |
| `/admin/alerts` | `AlertsClient.tsx` | ❌ Sin migrar |
| `/admin/wordfilter` | `WordfilterClient.tsx` | ❌ Sin migrar |
| `/admin/badges` | `BadgesClient.tsx` | ❌ Sin migrar |
| `/admin/messages` | `AdminMessagesClient.tsx` | ❌ Sin migrar |

---

## Hallazgos — Colores hardcodeados por módulo

### `/admin/rooms` — `rooms/page.tsx` (274 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `color: '#94A3B8'` | Hex inline | Crítico |
| `color: '#64748B'` | Hex inline | Crítico |
| `borderColor: '#334155'` / `background: '#334155'` | Hex inline | Crítico |
| `rgba(15,23,42,.7)` — overlay custom | Rgba inline | Crítico |
| `color: '#F8FAFC'` | Hex inline | Crítico |
| `color: '#f87171'` | Hex inline | Crítico |
| `border: '1px solid #1f2b41'` | Hex inline | Crítico |
| `color: '#00D4AA'` | Hex inline | Crítico |
| `color: '#F59E0B'` / `color: '#334155'` en `<Stars>` | Hex inline | Crítico |
| Modal delete custom inline (no usa `ConfirmModal`) | Patrón legacy | Crítico |
| No usa `AdminPageHeader` | Componente faltante | Alto |

---

### `/admin/logs` — `logs/page.tsx` (160 líneas, Server Component)

El módulo de **mayor deuda** — no usa ni un solo token.

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `text-[#F8FAFC]` | Tailwind arbitrary | Crítico |
| `text-[#94A3B8]` | Tailwind arbitrary | Crítico |
| `bg-[#0a1224]` | Tailwind arbitrary | Crítico |
| `border-[#1f2b41]` | Tailwind arbitrary | Crítico |
| `bg-[#0e1627]` — filas de tabla alternas | Tailwind arbitrary | Crítico |
| `text-[#475569]` | Tailwind arbitrary | Crítico |
| `bg-[#0F172A] border border-[#334155] text-[#F8FAFC]` — inputs custom | Tailwind arbitrary | Crítico |
| Tabla custom sin clase `.kx` | Patrón legacy | Alto |
| No usa `AdminPageHeader` | Componente faltante | Alto |

---

### `/admin/bans` — `BansClient.tsx` (231 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `text-[#F8FAFC]` / `text-[#94A3B8]` en `page.tsx` header | Tailwind arbitrary | Crítico |
| `bg-[#0F172A] border border-[#334155] text-[#F8FAFC]` — inputs | Tailwind arbitrary | Crítico |
| `bg-[#0a1224]` / `bg-[#0e1627]` — tabla | Tailwind arbitrary | Crítico |
| `divide-[#1f2b41]` / `border-[#1f2b41]` | Tailwind arbitrary | Crítico |
| `background: '#EF4444', borderColor: '#EF4444'` — botón ban | Hex inline | Crítico |
| Tabla custom sin clase `.kx` | Patrón legacy | Alto |
| No usa `AdminPageHeader` | Componente faltante | Alto |

---

### `/admin/settings` — `AdminSettingsClient.tsx` (132 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `text-[#F8FAFC]` / `bg-[#0F172A]` | Tailwind arbitrary | Crítico |
| `border-[#334155]` / `bg-[#0a1224]` / `border-[#1f2b41]` | Tailwind arbitrary | Crítico |
| Toggle custom: `background: isOn ? '#00D4AA' : '#1E293B'` | Hex inline | Crítico |
| Títulos sección: `style={{ color: '#00D4AA' }}` | Hex inline | Alto |
| Save bar: `background: '#0a1224', border: '1px solid #1f2b41'` | Hex inline | Crítico |
| No usa `AdminPageHeader` | Componente faltante | Alto |

**Nota:** El toggle custom es candidato a componente reutilizable `<AdminToggle />`.

---

### `/admin/permissions` — `PermissionsClient.tsx` (167 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `bg-[#0F172A]` / `border-[#334155]` / `text-[#F8FAFC]` / `text-[#94A3B8]` | Tailwind arbitrary | Crítico |
| `text-[#475569]` | Tailwind arbitrary | Crítico |
| Rank list activo: `background: 'rgba(0,212,170,.1)'`, `color: '#00D4AA'` | Hex inline | Crítico |
| Rank list inactivo: `color: '#94A3B8'` | Hex inline | Crítico |
| `accent-[#00D4AA]` — checkboxes | Tailwind arbitrary | Alto |
| No usa `AdminPageHeader` | Componente faltante | Alto |

**Nota:** El patrón rank-list con active/inactive es el mismo de `NewsForm.tsx` status buttons — usar mismo enfoque: `var(--admin-primary)` + `var(--admin-primary-bg)`.

---

### `/admin/alerts` — `AlertsClient.tsx` (149 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `text-[#F8FAFC]` / `bg-[#0F172A]` / `border-[#334155]` | Tailwind arbitrary | Crítico |
| `text-[#94A3B8]` / `bg-[#0a1224]` / `border-[#1f2b41]` | Tailwind arbitrary | Crítico |
| Tabs target activo: `background: 'rgba(0,212,170,.12)'`, `borderColor: '#00D4AA40'` | Hex inline | Crítico |
| Tabs target inactivo: `background: '#0F172A'`, `borderColor: '#334155'` | Hex inline | Crítico |
| No usa `AdminPageHeader` | Componente faltante | Alto |

**Nota:** Tabs activo/inactivo → mismo patrón que rooms/permissions. Tokens: `var(--admin-primary-bg)` / `var(--admin-primary)` / `var(--admin-border)`.

---

### `/admin/wordfilter` — `WordfilterClient.tsx` (155 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `bg-[#0F172A] border border-[#334155] text-[#F8FAFC]` — todos los inputs | Tailwind arbitrary | Crítico |
| `bg-[#0a1224]` / `bg-[#0e1627]` / `divide-[#1f2b41]` — tabla | Tailwind arbitrary | Crítico |
| `border-[#1f2b41]` — filas | Tailwind arbitrary | Crítico |
| Tabla custom sin clase `.kx` | Patrón legacy | Alto |
| No usa `AdminPageHeader` | Componente faltante | Alto |

---

### `/admin/badges` — `BadgesClient.tsx` (177 líneas, `'use client'`)

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `bg-[#0F172A]` / `border-[#334155]` — inputs | Tailwind arbitrary | Crítico |
| `bg-surface` — alias Tailwind color (no token admin) | Semi-crítico | Medio |
| Dropdown sugerencias: `background: '#0e1627'`, `border-[#334155]` | Hex/arbitrary mixto | Crítico |
| No usa `AdminPageHeader` | Componente faltante | Alto |

---

### `/admin/messages` — `AdminMessagesClient.tsx` (313 líneas, `'use client'`)

El archivo más largo. Dos modales custom incrustados (`ThreadModal`, `AdminSendModal`).

| Patrón detectado | Tipo | Severidad |
|-----------------|------|-----------|
| `background: '#0e1627'`, `border: '1px solid #1f2b41'` — modales | Hex inline | Crítico |
| `bg-[#0F172A]` / `bg-[#1E293B]` / `border-[#334155]` | Tailwind arbitrary | Crítico |
| `background: 'rgba(0,0,0,.7)'` — overlay modal | Rgba inline | Crítico |
| `divide-[#1f2b41]` / `bg-[#0a1224]` | Tailwind arbitrary | Crítico |
| `text-[#475569]` / `text-[#334155]` | Tailwind arbitrary | Crítico |
| `borderLeft: '2px solid #1f2b41'` inline | Hex inline | Crítico |
| `background: 'linear-gradient(135deg,#00D4AA,#7C3AED)'` — avatar | Hex inline | Aceptable* |
| `ThreadModal` — no usa `ConfirmModal` | Patrón legacy | Alto |
| `AdminSendModal` — modal custom completo | Patrón legacy | Alto |
| No usa `AdminPageHeader` | Componente faltante | Alto |

*Aceptable: gradiente de avatar es decorativo fijo, no tema-sensible.

---

## Clasificación global de colores hardcodeados

### Crítico — rompen light mode, deben ser tokens

| Color hardcoded | Token correcto |
|----------------|----------------|
| `#94A3B8` | `var(--admin-text-muted)` |
| `#64748B` / `#475569` | `var(--admin-text-subtle)` |
| `#F8FAFC` | `var(--admin-text)` |
| `#0F172A` / `#0a1224` | `var(--admin-bg)` |
| `#1E293B` / `#0e1627` | `var(--admin-surface)` |
| `#334155` / `#1f2b41` | `var(--admin-border)` |
| `rgba(15,23,42,.7)` / `rgba(0,0,0,.7)` | clase `.overlay` |
| `#10B981` | `var(--admin-success)` |
| `#F59E0B` | `var(--admin-warning)` |
| `#EF4444` / `#f87171` | `var(--admin-danger)` |
| `#00D4AA` | `var(--admin-primary)` |
| `rgba(0,212,170,.1)` / `rgba(0,212,170,.12)` | `var(--admin-primary-bg)` |
| `#00D4AA40` (border activo) | `var(--admin-primary)` |

### Aceptable — colores semánticos fijos (no tema-sensibles)

| Color | Dónde | Razón |
|-------|-------|-------|
| `#7C3AED` — Newspaper icon | `NewsForm.tsx` | Acento editorial fijo del módulo |
| `${opt.color}18` / `opt.color` — status buttons activos | `NewsForm.tsx` | Semántica por status (verde/amber/gris) |
| `rgba(239,68,68,.1)` / `rgba(239,68,68,.3)` — error block | `NewsForm.tsx` | Neutro en ambos temas |
| `linear-gradient(135deg,#00D4AA,#7C3AED)` — avatar initials | Messages | Decorativo fijo |
| `#F59E0B` / `#334155` — stars rating | Rooms | Por revisar si conviene tokén `--admin-warning` |

---

## Componentes legacy detectados (duplicados a eliminar)

| Patrón legacy | Aparece en | Reemplazo |
|--------------|-----------|-----------|
| Modal delete custom (overlay + div + header + botones) | `rooms/page.tsx` | `<ConfirmModal variant="danger" />` |
| `ThreadModal` custom | `AdminMessagesClient.tsx` | Modal dedicado o `<ConfirmModal>` |
| `AdminSendModal` custom | `AdminMessagesClient.tsx` | Modal dedicado |
| Toggle custom con `background: isOn ? '#00D4AA' : '#1E293B'` | `AdminSettingsClient.tsx` | Nuevo `<AdminToggle />` |
| Tabla sin `.kx` + filas `bg-[#0e1627]` / `bg-[#0a1224]` | Logs, Bans, Wordfilter, Messages | Clase `.kx` + tokens |
| Inputs `bg-[#0F172A] border border-[#334155] text-[#F8FAFC]` | Todos los no-migrados | Clase `.inp` |
| `<Stars>` local con hex | `rooms/page.tsx` | Revisar si existe o crear `<StarRating />` |

---

## Referencia visual AtomCMS — Patrones a adaptar

*Fuente: `docs/cms/atomcms-static-audit.md` (971 líneas)*

### Adaptar (patrón tiene sentido en Kodexa)

| Patrón AtomCMS | Adaptación para Kodexa |
|---------------|----------------------|
| Navegación admin agrupada en secciones | Sí — ver propuesta de nav abajo |
| `HousekeepingPermissions` — permisos por funcionalidad, no solo por rango | Sí — `/admin/permissions` puede tener granularidad por módulo |
| RCON panel para emulador (enviar comandos al servidor de juego) | Sí — nuevo módulo futuro `/admin/rcon` |
| Chatlog viewer separado rooms vs privados | Sí — `/admin/logs` puede dividirse en sub-tabs |
| Command logs (log de comandos in-game por usuario) | Sí — añadir a backlog como `/admin/logs?type=commands` |
| Editor de textos del emulador (strings de protocolo) | Sí — sub-tab en `/admin/settings` |
| Badge uploader con preview | Sí — mejorar `/admin/badges` con preview real |

### No adaptar

| Patrón AtomCMS | Razón |
|---------------|-------|
| Filament CRUD — tablas auto-generadas PHP | Stack diferente (Next.js/React) |
| Modales full-page para todo | UX moderna prefiere sidepanels/drawers o modales pequeños |
| Laravel Blade templates | No aplica |
| PayPal integration (catalog purchases) | Usar Stripe si se necesita |
| Flash client support / SWF headers | Kodexa usa .nitro, no Flash |
| Artisan commands UI | Usar scripts pnpm directos |

---

## Propuesta final — Navegación /admin

Basada en AtomCMS + módulos actuales de Kodexa:

```
HOTEL
├── Dashboard          /admin
├── Usuarios           /admin/users
├── Salas              /admin/rooms
└── Catálogo           /admin/catalog        [futuro]

COMUNIDAD
├── Noticias           /admin/news
├── Mensajes           /admin/messages
└── Alertas            /admin/alerts

MODERACIÓN
├── Bans               /admin/bans
├── Word Filter        /admin/wordfilter
└── Logs               /admin/logs

SISTEMA
├── Permisos           /admin/permissions
├── Badges             /admin/badges
├── Configuración      /admin/settings
├── RCON               /admin/rcon           [futuro, rank 9+]
└── Desarrollo         /admin/dev            [futuro, rank 9+]
```

**Cambios vs nav actual:**
- Añadir sección headers ("HOTEL", "COMUNIDAD", etc.) en sidebar
- Mover "Alertas" a COMUNIDAD (hoy está suelta)
- "Logs" → MODERACIÓN (más lógico)
- RCON y Desarrollo como módulos futuros protegidos por rank ≥ 9

---

## Propuesta final — Estructura visual por módulo

### Patrón estándar (todos los módulos pendientes deben seguirlo)

```
<AdminPageHeader eyebrow="[Sección]" title="[Nombre]" subtitle="[Conteo]" actions={<CTA />} />

[Filtros/búsqueda — inputs con clase .inp]

[Tabla con clase .kx]
  <thead> — columnas con --admin-text-subtle
  <tbody> — filas con tokens, sin filas alternadas hardcodeadas
  [EmptyState si vacío]

[Paginación — patrón de /admin/users]

[ConfirmModal para acciones destructivas]
```

### Componentes nuevos propuestos (a crear en MPs futuros)

| Componente | Propósito | Usado en |
|-----------|-----------|----------|
| `<AdminToggle />` | Switch on/off con tokens | Settings |
| `<AdminTabBar />` | Tabs de filtro reutilizables (activo/inactivo) | Logs, Alerts, Bans |
| `<StarRating />` | Rating 1-5 estrellas | Rooms |
| `<AdminDrawer />` | Panel lateral para edición inline | Messages, futuro |

---

## Backlog priorizado

### Prioridad 1 — Crítico (rompe light mode / duplicación grave)

| ID | Módulo | Motivo | Archivos |
|----|--------|--------|---------|
| A | `/admin/logs` | 100% hardcoded, Server Component, más fácil de migrar | `logs/page.tsx` |
| B | `/admin/rooms` | Modal custom + stars component + `rgba` overlay | `rooms/page.tsx` |
| C | `/admin/bans` | Botón ban con hex inline, tabla sin `.kx` | `bans/page.tsx`, `BansClient.tsx` |

### Prioridad 2 — Alto (UX inconsistente)

| ID | Módulo | Motivo | Archivos |
|----|--------|--------|---------|
| D | `/admin/wordfilter` | Todos inputs y tabla sin tokens | `WordfilterClient.tsx` |
| E | `/admin/settings` | Toggle custom candidato a componente | `AdminSettingsClient.tsx` |
| F | `/admin/permissions` | Patrón rank list reutilizable | `PermissionsClient.tsx` |

### Prioridad 3 — Medio (largo pero manejable)

| ID | Módulo | Motivo | Archivos |
|----|--------|--------|---------|
| G | `/admin/alerts` | Patrón tabs igual a permissions | `AlertsClient.tsx` |
| H | `/admin/badges` | Dropdown hardcoded + preview | `BadgesClient.tsx` |
| I | `/admin/messages` | Más grande (313 líneas), 2 modales custom | `AdminMessagesClient.tsx` |

---

## Próximos microprocesos recomendados

### MP-CMS-003F — Rediseño /me dashboard
*(ya definido en 003E como siguiente)*
- Detectar layout propio vs `AdminShell`
- Definir tokens `--me-*` si identidad visual distinta

### MP-CMS-003G — Normalización módulos admin restantes
Ejecutar grupos por prioridad. Sugerido dividir en sub-MPs:

- **MP-CMS-003G.1:** `/admin/logs` + `/admin/rooms` (Prioridad 1A + 1B)
- **MP-CMS-003G.2:** `/admin/bans` + `/admin/wordfilter` (Prioridad 1C + 2D)
- **MP-CMS-003G.3:** `/admin/settings` + crear `<AdminToggle />` (Prioridad 2E)
- **MP-CMS-003G.4:** `/admin/permissions` + `/admin/alerts` (Prioridad 2F + 3G)
- **MP-CMS-003G.5:** `/admin/badges` + `/admin/messages` (Prioridad 3H + 3I)

### MP-CMS-003H — Política ranks 8-10 (founder-only)
*(ya documentado en admin-users-redesign.md)*
- Remover `z.number().max(7)` en `[id]/route.ts`
- Añadir guard `currentUserRank >= 9` para asignar ranks ≥ 8
- UI: mostrar ranks 8-10 en selector pero disabled si rank < 9

### MP-CMS-003I — Sidebar nav agrupada
- Añadir sección headers a `AdminShell` sidebar
- Implementar propuesta de nav (HOTEL / COMUNIDAD / MODERACIÓN / SISTEMA)
- Requiere cambios en `AdminShell.tsx`

---

## Restricciones para todos los MPs futuros de admin

*(Las mismas que 003C–E)*

| Restricción | Estado |
|-------------|--------|
| No Arcturus | Aplica |
| No DB / schema / migrations / seed | Aplica |
| No middleware.ts / guards.ts | Aplica |
| No SSO / auth | Aplica |
| No landing / rutas públicas | Aplica |
| No lógica funcional de módulos modificada | Aplica |
| TypeCheck 0 errores | Aplica |
| Inline hex hardcodeados eliminados | Objetivo |
| Tailwind arbitrary `bg-[#...]` eliminados | Objetivo |
