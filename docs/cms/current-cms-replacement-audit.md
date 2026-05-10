# MP-CMS-002A — Auditoría del CMS Actual de Kodexa.Hotel

> **Tipo:** Auditoría estática + Plan de reemplazo  
> **Estado:** Completado  
> **Fecha:** 2026-05-10  
> **Regla:** Solo lectura. Sin modificar código funcional. Sin borrar nada.  
> **Ruta auditada:** `apps/web/src/`

---

## DIAGNÓSTICO CRÍTICO (leer primero)

**El CMS actual NO es legacy ni basura.** Es un sistema moderno, funcional y bien construido con Next.js 15, NextAuth v5, Prisma, Tailwind y Lucide. Tiene auth real, admin panel real con rank guards, SSO, 2FA de staff, email service y schema Prisma completo.

**El problema real no es el CMS — es el SCOPE.** Hay ~35 rutas de CMS pero muchas son stubs vacíos. El núcleo duro (auth + admin + hotel gates) funciona. Lo que falta es contenido.

**Recomendación preliminar:** No reemplazar desde cero. **Completar y expandir** lo existente.

---

## 1. Resumen Ejecutivo

### Qué CMS actual existe

CMS propio desarrollado en Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma, MariaDB (`kodexa_hotel`). Autenticación con NextAuth.js v5 (JWT strategy, Credentials provider). Sin dependencias de Laravel, Filament, Livewire ni PHP.

**Estado general**: sistema funcional con núcleo duro completo y zona de contenido parcialmente construida.

### Qué rutas pertenecen al CMS

Zona CMS: todo bajo `(main)/` — news, community, marketplace, shop, settings, me, friends, help, legal, rooms, badges, about, referral. **Muchas son stubs.**

### Qué rutas pertenecen a auth

`(auth)/login`, `(auth)/register`, `(auth)/forgot-password`, `(auth)/reset-password/[token]` + APIs bajo `/api/auth/*`. **Estas funcionan completamente.**

### Qué rutas pertenecen al hotel

`/hotel`, `/hotel-beta`, `/desarrollo` — fuera de route groups. **Todas funcionan con guards de rango.**

### Qué partes son seguras de conservar

| Área | Estado | Veredicto |
|------|--------|-----------|
| Auth completa (login, registro, 2FA staff, forgot/reset password) | Funcional | CONSERVAR |
| Middleware (rank guards, hotel gates) | Funcional y crítico | CONSERVAR |
| `lib/auth.ts` | Funcional | CONSERVAR |
| `lib/db.ts` | Funcional | CONSERVAR |
| `lib/email.ts` + `email-templates.ts` | Funcional | CONSERVAR |
| Prisma schema completo | Funcional | CONSERVAR |
| `/hotel`, `/hotel-beta`, `/desarrollo` | Funcional | CONSERVAR |
| Admin panel (`/admin` + layout + dashboard) | Funcional y completo | CONSERVAR |
| `AdminShell.tsx` | Funcional, bien construido | CONSERVAR |
| `Avatar.tsx` | Funcional, usado globalmente | CONSERVAR |
| `Providers.tsx` | Crítico (SessionProvider) | CONSERVAR |
| `Navbar.tsx` | Funcional | CONSERVAR |
| `Footer.tsx` | Funcional | CONSERVAR |
| `LandingPage.tsx` | Funcional | CONSERVAR |
| API routes `/api/admin/*` | Funcional | CONSERVAR |
| API routes `/api/auth/*` | Crítico | CONSERVAR |
| API routes `/api/sso`, `/api/me/*` | Funcional | CONSERVAR |

### Qué partes son legacy o stubs

| Área | Estado |
|------|--------|
| `(main)/about/page.tsx` | Stub probable |
| `(main)/badges/page.tsx` | Stub probable |
| `(main)/community/photos/page.tsx` | Stub probable |
| `(main)/community/rooms/page.tsx` | Stub probable |
| `(main)/community/staff/page.tsx` | Stub probable |
| `(main)/community/rankings/page.tsx` | Stub probable |
| `(main)/friends/page.tsx` | Stub probable |
| `(main)/help/page.tsx` | Stub probable |
| `(main)/legal/*` | Contenido placeholder |
| `(main)/marketplace/page.tsx` | UI stub (API existe) |
| `(main)/referral/page.tsx` | Stub probable |
| `(main)/rooms/page.tsx` | Stub probable |
| `(main)/shop/page.tsx` | Stub probable |
| `(main)/settings/page.tsx` | Parcial |
| `(main)/messages/page.tsx` | Parcial |
| `/profile/page.tsx` | Stub o redirect |
| `(dashboard)/admin/logs/page.tsx` | Parcial |
| `(dashboard)/admin/rooms/page.tsx` | Parcial |
| `(dashboard)/admin/news/page.tsx` | Parcial |

---

## 2. Mapa de Rutas Actuales

### 2.1 Rutas Públicas (sin auth)

| Ruta | Archivo | Propósito | Dependencias | Decisión |
|------|---------|-----------|--------------|----------|
| `/` | `app/page.tsx` | Landing page con stats online | `LandingPage`, `prisma` | **CONSERVAR** |
| `/unauthorized` | `app/unauthorized/page.tsx` | Acceso denegado | — | **CONSERVAR** |
| `/not-found` | `app/not-found.tsx` | 404 | — | **CONSERVAR** |

### 2.2 Rutas de Auth

| Ruta | Archivo | Propósito | Dependencias | Decisión |
|------|---------|-----------|--------------|----------|
| `/login` | `(auth)/login/page.tsx` | Login con 2FA staff, preview avatar | `signIn`, `@kodexa/shared`, Avatar preview, `/api/auth/lookup`, `/api/auth/staff-login`, `/api/auth/verify-token` | **CONSERVAR** |
| `/register` | `(auth)/register/page.tsx` | Registro | `/api/auth/register`, `/api/auth/check-username` | **CONSERVAR** |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Recuperar contraseña | `/api/auth/forgot-password`, Resend | **CONSERVAR** |
| `/reset-password/[token]` | `(auth)/reset-password/[token]/page.tsx` | Reset contraseña | `/api/auth/reset-password` | **CONSERVAR** |

**APIs de auth:**

| Ruta API | Archivo | Propósito | Decisión |
|----------|---------|-----------|----------|
| `/api/auth/[...nextauth]` | `route.ts` | NextAuth handler | **CONSERVAR — CRÍTICO** |
| `/api/auth/register` | `route.ts` | Crear usuario + KxReputation + KxUserLevel | **CONSERVAR** |
| `/api/auth/check-username` | `route.ts` | Disponibilidad username | **CONSERVAR** |
| `/api/auth/forgot-password` | `route.ts` | Generar token + email Resend | **CONSERVAR** |
| `/api/auth/reset-password` | `route.ts` | Validar token + cambiar password | **CONSERVAR** |
| `/api/auth/lookup` | `route.ts` | Preview usuario por username | **CONSERVAR** |
| `/api/auth/staff-login` | `route.ts` | Generar KxStaffToken (2FA) | **CONSERVAR** |
| `/api/auth/verify-token` | `route.ts` | Verificar KxStaffToken | **CONSERVAR** |
| `/api/auth/session-transfer` | `route.ts` | Transfer de sesión | **REVISAR** |
| `/api/auth/intrusion-report` | `route.ts` | Log de intentos inválidos | **CONSERVAR** |

### 2.3 Rutas de Usuario (auth requerida)

| Ruta | Archivo | Propósito | Dependencias | Decisión |
|------|---------|-----------|--------------|----------|
| `/me` | `(main)/me/page.tsx` | Dashboard personal del usuario | `prisma` (user, news, rooms, activity, levels), `MeDashboard` | **CONSERVAR — completar** |
| `/settings` | `(main)/settings/page.tsx` + `SettingsClient.tsx` | Config. cuenta | `/api/me/*` | **CONSERVAR — completar** |
| `/messages` | `(main)/messages/page.tsx` + `MessagesClient.tsx` | Mensajes internos | `/api/messages/*` | **CONSERVAR — completar** |
| `/marketplace` | `(main)/marketplace/page.tsx` | Marketplace UI | `/api/marketplace/*` | **COMPLETAR** |
| `/community/profiles/[username]` | `page.tsx` + `ProfileClient.tsx` | Perfil público | `prisma` | **CONSERVAR — completar** |
| `/community/news/[id]` | `page.tsx` | Ver artículo | `prisma.News` | **CONSERVAR — completar** |
| `/community/news` | `page.tsx` | Lista noticias | `prisma.News` | **CONSERVAR — completar** |
| `/community/rankings` | `page.tsx` | Rankings | `prisma` | **COMPLETAR** |
| `/community/photos` | `page.tsx` | Fotos de cámara | — | **STUB — implementar después** |
| `/community/staff` | `page.tsx` | Página de staff | — | **STUB — implementar después** |
| `/community/rooms` | `page.tsx` | Salas públicas | — | **STUB — implementar después** |
| `/friends` | `page.tsx` | Amigos | — | **STUB — implementar después** |
| `/help` | `page.tsx` | Centro de ayuda | — | **STUB — implementar después** |
| `/shop` | `page.tsx` | Tienda | — | **STUB — implementar después** |
| `/rooms` | `page.tsx` | Mis salas | — | **STUB — implementar después** |
| `/badges` | `page.tsx` | Mis badges | — | **STUB — implementar después** |
| `/referral` | `page.tsx` | Sistema referidos | — | **STUB — implementar después** |
| `/about` | `page.tsx` | Acerca del hotel | — | **STUB — baja prioridad** |
| `/legal/*` | `page.tsx` (3) | Privacy, Rules, Terms | — | **CONTENIDO — rellenar** |
| `/profile` | `app/profile/page.tsx` | Redirect o alias de perfil | — | **REVISAR** |

**APIs de usuario:**

| Ruta API | Propósito | Decisión |
|----------|-----------|----------|
| `/api/me/daily-reward` | Recompensa diaria | **CONSERVAR** |
| `/api/me/reward-status` | Estado reward | **CONSERVAR** |
| `/api/me/motto` | Cambiar motto | **CONSERVAR** |
| `/api/me/email` | Cambiar email | **CONSERVAR** |
| `/api/me/password` | Cambiar password | **CONSERVAR** |
| `/api/me/privacy` | Config. privacidad | **CONSERVAR** |
| `/api/messages/*` | CRUD mensajes | **CONSERVAR** |
| `/api/marketplace/*` | Marketplace completo | **CONSERVAR** |
| `/api/sso` | Generar SSO ticket | **CONSERVAR — CRÍTICO** |
| `/api/stats/online` | Usuarios online | **CONSERVAR** |
| `/api/rooms/popular` | Salas populares | **CONSERVAR** |
| `/api/users/featured` | Usuario destacado | **CONSERVAR** |
| `/api/users/latest` | Últimos registros | **CONSERVAR** |
| `/api/users/online-count` | Count online | **CONSERVAR** |
| `/api/health` | Health check | **CONSERVAR** |
| `/api/help/contact` | Formulario contacto | **CONSERVAR** |

### 2.4 Rutas Admin/CMS (`/admin/*`)

| Ruta | Archivo | Propósito | Funcional? | Decisión |
|------|---------|-----------|-----------|----------|
| `/admin` | `page.tsx` | Dashboard con stats, activity, chart | Sí | **CONSERVAR** |
| `/admin/users` | `page.tsx` + (client) | CRUD usuarios con búsqueda, edición, send credits | Sí | **CONSERVAR** |
| `/admin/bans` | `page.tsx` + `BansClient.tsx` | Gestión bans | Sí | **CONSERVAR** |
| `/admin/permissions` | `page.tsx` + `PermissionsClient.tsx` | Rangos/permisos | Sí | **CONSERVAR** |
| `/admin/news` | `page.tsx` | Gestión noticias | Parcial | **COMPLETAR** |
| `/admin/settings` | `page.tsx` + `AdminSettingsClient.tsx` | Config. del hotel | Sí | **CONSERVAR** |
| `/admin/logs` | `page.tsx` | Activity logs | Parcial | **COMPLETAR** |
| `/admin/rooms` | `page.tsx` | Gestión salas | Parcial | **COMPLETAR** |
| `/admin/wordfilter` | `page.tsx` + `WordfilterClient.tsx` | Filtro de palabras | Sí | **CONSERVAR** |
| `/admin/badges` | `page.tsx` + `BadgesClient.tsx` | Dar badges | Sí | **CONSERVAR** |
| `/admin/alerts` | `page.tsx` + `AlertsClient.tsx` | Alertas masivas | Sí | **CONSERVAR** |
| `/admin/messages` | `page.tsx` + `AdminMessagesClient.tsx` | Ver mensajes admin | Sí | **CONSERVAR** |

**APIs de admin:**

| Ruta API | Funcional? | Decisión |
|----------|-----------|----------|
| `/api/admin/stats` | Sí | CONSERVAR |
| `/api/admin/users` + `[id]` | Sí | CONSERVAR |
| `/api/admin/bans` + `[id]` | Sí | CONSERVAR |
| `/api/admin/news` + `[id]` | Sí | CONSERVAR |
| `/api/admin/rooms` + `[id]` | Sí | CONSERVAR |
| `/api/admin/settings` | Sí | CONSERVAR |
| `/api/admin/permissions` | Sí | CONSERVAR |
| `/api/admin/wordfilter` + `[id]` | Sí | CONSERVAR |
| `/api/admin/badges/give` | Sí | CONSERVAR |
| `/api/admin/alerts` | Sí | CONSERVAR |
| `/api/admin/messages/[id]` | Sí | CONSERVAR |
| `/api/admin/notifications` | Sí | CONSERVAR |

### 2.5 Rutas del Hotel

| Ruta | Archivo | Propósito | Guard | Funcional? | Decisión |
|------|---------|-----------|-------|-----------|----------|
| `/hotel` | `app/hotel/page.tsx` | Hotel principal (Arcturus Main futuro) | auth | Sí (pantalla espera) | **CONSERVAR** |
| `/hotel-beta` | `app/hotel-beta/page.tsx` | Emulador TypeScript privado | Founder (rank 10) | Sí | **CONSERVAR** |
| `/desarrollo` | `app/desarrollo/page.tsx` | Lab Arcturus Dev | Developer (rank 9+) | Sí | **CONSERVAR** |

---

## 3. Mapa de Componentes Actuales

### 3.1 Componentes Globales (conservar sin cambios)

| Componente | Archivo | Función | Importado por | Decisión |
|-----------|---------|---------|---------------|----------|
| `Providers` | `Providers.tsx` | SessionProvider wrapper | `layout.tsx` | **NO TOCAR — CRÍTICO** |
| `Avatar` / `AvatarHead` | `Avatar.tsx` | Render avatar via imager | `AdminShell`, `Navbar`, múltiples | **NO TOCAR — CRÍTICO** |
| `Navbar` | `Navbar.tsx` | Nav principal con session, ranks | `(main)/layout.tsx` | **CONSERVAR** |
| `Footer` | `Footer.tsx` | Footer global | `(main)/layout.tsx`, `LandingPage` | **CONSERVAR** |

### 3.2 Componentes de Auth

| Componente | Función | Decisión |
|-----------|---------|----------|
| `(auth)/login/page.tsx` | Login completo con 2FA staff, avatar preview | **CONSERVAR** |
| `(auth)/register/page.tsx` | Registro | **CONSERVAR** |
| `(auth)/forgot-password/page.tsx` | Forgot | **CONSERVAR** |
| `(auth)/reset-password/[token]/page.tsx` | Reset | **CONSERVAR** |

### 3.3 Componentes de Hotel

| Componente | Función | Dependencias | Decisión |
|-----------|---------|--------------|----------|
| `HotelClient.tsx` | Launcher hotel principal, carga Nitro/WS | `@kodexa/shared` (getAvatarUrl) | **CONSERVAR** |
| `HotelBetaClient.tsx` | Launcher beta privado | `@kodexa/shared` | **CONSERVAR** |
| `HotelDesarrolloClient.tsx` | Launcher lab desarrollo | `@kodexa/shared` | **CONSERVAR** |

### 3.4 Componentes Admin

| Componente | Función | Dependencias | Decisión |
|-----------|---------|--------------|----------|
| `AdminShell.tsx` | Layout admin completo: sidebar colapable, topbar, notifs, user menu | `Avatar`, `@kodexa/shared`, `next-auth/react`, Lucide | **CONSERVAR — bien construido** |

Páginas admin con Client components separados (patrón correcto):
- `BadgesClient.tsx`, `BansClient.tsx`, `PermissionsClient.tsx`, `WordfilterClient.tsx`, `AdminSettingsClient.tsx`, `AlertsClient.tsx`, `AdminMessagesClient.tsx`

Todas usan `@kodexa/shared` para `RANK_LABELS`, `rankBadgeClass`. **CONSERVAR.**

### 3.5 Componentes CMS/Público

| Componente | Función | Decisión |
|-----------|---------|----------|
| `LandingPage.tsx` | Landing con hero, stats, CountUp, features | **CONSERVAR** |
| `MeDashboard.tsx` | Panel usuario personal | **CONSERVAR — completar** |
| `SettingsClient.tsx` | Settings del usuario | **CONSERVAR — completar** |
| `MessagesClient.tsx` | Mensajes cliente | **CONSERVAR — completar** |
| `ProfileClient.tsx` | Perfil público | **CONSERVAR — completar** |

### 3.6 Componentes Legacy / Stub

Páginas sin Client component propio (server components puros sin datos reales o con UI placeholder): `about`, `badges`, `community/photos`, `community/staff`, `community/rankings`, `community/rooms`, `friends`, `help`, `legal/*`, `marketplace`, `referral`, `rooms`, `shop`.

**Estas son STUBS — no son legacy roto, son features pendientes de implementar.**

---

## 4. Mapa de Lógica Crítica

### 4.1 Autenticación (NO ROMPER)

```
lib/auth.ts
  ├── NextAuth Credentials provider
  ├── Consulta: prisma.user.findFirst (OR username/email)
  ├── Verifica: bcrypt.compare
  ├── JWT callback: guarda username, rank, credits, look
  ├── Session callback: expone id, username, rank, credits, look
  └── Pages: { signIn: '/login' }
```

**Importado por:** `middleware.ts`, todas las pages con server-side auth, todas las API routes con guard.

### 4.2 Middleware (NO ROMPER — exporta helpers usados por pages)

```
middleware.ts
  ├── Exporta: isStaff(4+), isAdmin(7+), isDeveloper(9+), isFounder(10+), canAccessDevelopment(9+)
  ├── Guards por path:
  │   ├── needsAuth: /hotel, /desarrollo, /me, /settings, /admin, /marketplace, /profile
  │   ├── needsBeta: /hotel-beta → isFounder + ENABLE_BETA_HOTEL
  │   ├── needsDev: /desarrollo → canAccessDevelopment + ENABLE_DEV_HOTEL
  │   └── needsAdmin: /admin → isAdmin (rank >= 7)
  └── Matcher: todos los paths excepto api, _next/static, _next/image, favicon
```

**RIESGO CRÍTICO:** `isFounder` y `canAccessDevelopment` son importados directamente por:
- `app/hotel-beta/page.tsx` → `import { isFounder } from '@/middleware'`
- `app/desarrollo/page.tsx` → `import { canAccessDevelopment } from '@/middleware'`

Si se mueve o renombra `middleware.ts`, estos imports se rompen.

### 4.3 Base de Datos Prisma (NO ROMPER)

```
lib/db.ts → prisma singleton
prisma/schema.prisma → kodexa_hotel database
  ├── Arcturus tables: users, users_currency, users_badges, rooms, room_models,
  │                    items_base, items, catalog_pages, catalog_items,
  │                    permissions, emulator_settings
  └── Custom kx_ tables: kx_reputation, kx_marketplace_listings, kx_auctions,
                          kx_crafting_recipes, kx_wired_scripts, kx_user_levels,
                          kx_activity_log, kx_staff_tokens
      CMS tables: News, PasswordReset, WebsiteSetting, Wordfilter, Ban, Message
```

El schema usa `kodexa_hotel` como única base de datos. **Pendiente: Auth Bridge a `arcturus_main` (MP-011).**

### 4.4 SSO Ticket (NO ROMPER)

```
/api/sso/route.ts
  ├── Auth check via auth()
  ├── Genera crypto.randomUUID()
  ├── Escribe en users.auth_ticket (campo Arcturus)
  └── Retorna { ticket }
```

Consumido por `HotelClient.tsx` y `HotelBetaClient.tsx` para lanzar el juego. **Crítico para cuando Arcturus esté conectado.**

### 4.5 Email Service

```
lib/email.ts → Resend client (RESEND_API_KEY env var)
lib/email-templates.ts → templates HTML
```

Usado por: `/api/auth/forgot-password`, `/api/auth/reset-password`. Si `RESEND_API_KEY` no está configurado, falla silenciosamente (con log).

### 4.6 Package `@kodexa/shared`

```
packages/shared → importado por componentes web
  ├── RANK_LABELS — diccionario rank→nombre
  ├── RANK_COLORS — colores por rango
  ├── rankBadgeClass — clase CSS para badge de rango
  └── getAvatarUrl — URL del imager (construye URL del avatar)
```

Importado por: `Avatar.tsx`, `Navbar.tsx`, `AdminShell.tsx`, múltiples pages admin, `login/page.tsx`. **Si cambia, afecta toda la UI.**

### 4.7 Rank Guard Pattern

Doble validación (correcta):
1. **Middleware**: redirige antes de cargar la página
2. **Page server component**: valida sesión + rango nuevamente antes de renderizar

Ejemplo en `hotel-beta/page.tsx`:
```tsx
const session = await auth();
if (!session?.user?.id) redirect('/login');
const rank = session.user.rank ?? 1;
if (!betaEnabled || !isFounder(rank)) redirect('/unauthorized');
```

**Este patrón está bien diseñado. No cambiar.**

---

## 5. Riesgos de Borrar/Reemplazar el CMS Actual

### RIESGO CRÍTICO — middleware.ts exporta helpers usados por pages

```
hotel-beta/page.tsx  → import { isFounder } from '@/middleware'
desarrollo/page.tsx  → import { canAccessDevelopment } from '@/middleware'
```

Si `middleware.ts` se mueve a `lib/middleware.ts` o se renombra, `/hotel-beta` y `/desarrollo` rompen con error de build. **Solución: reubicar helpers en `lib/guards.ts` y actualizar imports.**

### RIESGO ALTO — `@kodexa/shared` como dependencia transversal

`getAvatarUrl`, `RANK_LABELS`, `RANK_COLORS`, `rankBadgeClass` usados en 6+ componentes. Si se refactoriza este package sin backward compatibility, todo falla.

### RIESGO ALTO — Prisma schema acoplado a kodexa_hotel

El schema actual mezcla tablas Arcturus (que luego irán en `arcturus_main`) con tablas kx_ y CMS. Cuando MP-008 importe Arcturus real, habrá conflicto de mapeo. **Solución: dos datasources o Prisma multi-schema (pendiente MP-011).**

### RIESGO MEDIO — Layout `(main)/layout.tsx` compartido

`Navbar` y `Footer` en `(main)/layout.tsx` son compartidos por ~18 rutas. Si se cambia el layout, todas las páginas de (main) se ven afectadas.

### RIESGO MEDIO — Admin layout protege por rango pero con condición simple

```tsx
// admin/layout.tsx
if (session.user.rank < 7) redirect('/hotel');
```

Hardcodeado en `< 7`. Si el sistema de rangos cambia (MP-CMS-002), este número necesita actualizarse. **Solución futura: centralizar en helper `isAdmin()` del middleware.**

### RIESGO BAJO — Rutas /marketplace y /shop tienen APIs funcionales pero UI stub

Las APIs `/api/marketplace/*` existen y funcionan. La UI de `/marketplace/page.tsx` es stub. Si alguien llama las APIs directamente, datos reales son accesibles. No es riesgo de seguridad (auth requerida) pero puede confundir.

### RIESGO BAJO — `/profile/page.tsx` al root

La ruta `/profile` al nivel raíz (fuera de `(main)/`) y `/community/profiles/[username]` en `(main)/`. Posible duplicación o redirect. Verificar antes de borrar.

### RIESGO BAJO — `AdminShell.tsx` usa `localStorage`

```tsx
const [collapsed, setCollapsed] = useState(() => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_sb_collapsed') === 'true';
});
```

Correcto para CSR. Solo riesgo si se convierte en server component.

---

## 6. Propuesta de Arquitectura Objetivo (CMS Nuevo)

El CMS actual ya tiene la arquitectura correcta. Lo que falta es completar features y reorganizar algunas cosas.

### 6.1 Capas del sistema

```
┌─────────────────────────────────────────────────────┐
│                    CAPA PÚBLICA                      │
│  / landing | /news | /community | /staff | /legal   │
│  Acceso: todos (autenticados o no)                  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                 CAPA USUARIO (auth)                  │
│  /me | /settings | /messages | /shop | /marketplace │
│  /friends | /badges | /rooms | /referral | /help    │
│  Acceso: rank >= 1 (cualquier usuario registrado)   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                  CAPA HOTEL (auth)                   │
│  /hotel (Arcturus Main) | /desarrollo (Arcturus Dev)│
│  /hotel-beta (Emulador TS)                          │
│  Acceso: rank >= 1 | rank >= 9 | rank >= 10         │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              CAPA STAFF / HOUSEKEEPER (rank 6+)     │
│  /admin + todas las sub-rutas                       │
│  Actualmente bloqueado en rank >= 7                 │
│  Futuro: granular por kx_housekeeper_permissions    │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                 PERMISSION LAYER                     │
│  middleware.ts → guards por path + rango            │
│  lib/guards.ts → helpers isAdmin, isDeveloper, etc. │
│  kx_housekeeper_permissions → permisos granulares   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                   AUDIT LAYER                       │
│  kx_activity_log → acciones del staff               │
│  KxStaffToken → 2FA para rank >= 7                  │
│  api/auth/intrusion-report → intentos fallidos      │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              FUTURE: AUTH BRIDGE (MP-011)            │
│  kodexa_hotel ← bridge → arcturus_main              │
│  Prisma multi-datasource o schema split             │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              FUTURE: RCON LAYER (MP-CMS-003)        │
│  lib/rcon.ts → TCP socket → Arcturus RCON           │
│  /api/admin/rcon → comandos predefinidos            │
│  /admin/rcon → consola (solo rank >= 9)             │
└─────────────────────────────────────────────────────┘
```

---

## 7. Plan de Reemplazo Seguro

### CONCLUSIÓN: No hay que "reemplazar" — hay que completar y reorganizar.

El "reemplazo desde cero" aplica solo a las páginas stub vacías. El núcleo (auth, middleware, Prisma, admin panel, hotel gates) es production-ready y NO debe tocarse.

### Fase A — Auditoría y documentación (COMPLETADO)
- [x] Auditar CMS actual
- [x] Identificar qué funciona, qué es stub, qué está acoplado
- [x] Documentar dependencias críticas
- [x] Crear este documento

### Fase B — Refactorización segura sin borrar nada
- [ ] Crear `apps/web/src/lib/guards.ts` con los helpers de rango (mover de middleware.ts)
- [ ] Actualizar imports en `hotel-beta/page.tsx` y `desarrollo/page.tsx` a `@/lib/guards`
- [ ] Mantener helpers en `middleware.ts` también (re-exportar para backward compat)
- [ ] Crear `kx_housekeeper_permissions` en schema Prisma (MP-CMS-002)
- [ ] Actualizar guard de admin layout para usar helper en lugar de `< 7` hardcodeado

### Fase C — Completar features del CMS

Prioridad alta (bloquean UX):
- [ ] `/community/news` — lista + detalle de noticias (datos: `News` de Prisma)
- [ ] `/community/profiles/[username]` — completar perfil público
- [ ] `/me` — completar dashboard personal
- [ ] `/settings` — completar configuración de cuenta
- [ ] `/messages` — completar sistema de mensajes

Prioridad media (CMS completo):
- [ ] `/community/staff` — página de staff por rango
- [ ] `/community/rankings` — leaderboard
- [ ] `/shop` — tienda básica
- [ ] `/help` — centro de ayuda
- [ ] `/admin/news` — completar editor de noticias

Prioridad baja (features avanzadas):
- [ ] `/marketplace` — conectar UI con API existente
- [ ] `/community/photos` — cámara
- [ ] `/friends` — lista de amigos
- [ ] `/badges` — colección de badges
- [ ] `/referral` — sistema de referidos
- [ ] `/rooms` — lista de salas del usuario

### Fase D — Eliminar stubs cuando tengan reemplazo

Solo eliminar cuando:
1. El nuevo componente está en producción
2. No hay imports activos hacia el stub
3. Se verifica con `grep -r "import.*ruta"` que nadie lo usa

### Fase E — Conectar datos seguros de kodexa_hotel

Ya funcional. Lo que falta:
- [ ] Seed de `WebsiteSetting` con valores del hotel
- [ ] Poblado de `Wordfilter` con palabras iniciales
- [ ] Verificar que `News` tiene datos de prueba
- [ ] Configurar Resend correctamente (RESEND_API_KEY)

### Fase F — Conectar Arcturus solo después de MP-008 a MP-012

**NO tocar** hasta completar:
- MP-008: Arcturus Morningstar importado en arcturus_main
- MP-009: Nitro Client conectado
- MP-010: Arcturus Dev en arcturus_dev
- MP-011: Auth Bridge kodexa_hotel → arcturus_main
- MP-012: Validación real de acceso

Entonces:
- [ ] Agregar segundo datasource Prisma para `arcturus_main`
- [ ] Migrar modelos Arcturus a datasource correcto
- [ ] Actualizar SSO ticket para escribir en `arcturus_main.users.auth_ticket`
- [ ] `/hotel` page conectará el Nitro client real

---

## 8. Archivos Candidatos a Eliminar (NO eliminar ahora)

| Archivo/Carpeta | Razón | Riesgo | Dependencia detectada | Recomendación |
|----------------|-------|--------|----------------------|---------------|
| `(main)/about/page.tsx` | Probablemente stub sin contenido real | Bajo | Navbar link probable | Reemplazar con contenido real |
| `app/profile/page.tsx` | Posible duplicación de `/community/profiles/[username]` | Medio | Verificar si Navbar lo linkea | Auditar antes de eliminar |
| `(main)/badges/page.tsx` | Stub sin datos ni UI | Bajo | Navbar link | Reemplazar cuando se implemente |
| `(main)/community/photos/page.tsx` | Stub sin datos | Bajo | — | Reemplazar cuando se implemente |
| `(main)/community/rooms/page.tsx` | Stub — existe `/api/rooms/popular` | Bajo | — | Reemplazar con UI real |
| `(main)/referral/page.tsx` | Stub | Bajo | — | Reemplazar cuando se implemente |
| `(main)/rooms/page.tsx` | Stub | Bajo | — | Reemplazar cuando se implemente |

**REGLA:** No eliminar ningún archivo hasta que su reemplazo esté funcionando en producción y verificado que no hay imports activos.

---

## 9. Archivos Candidatos a Conservar

| Archivo/Carpeta | Razón | Dependencia | Recomendación |
|----------------|-------|-------------|---------------|
| `src/middleware.ts` | Guard de auth y rango, exports usados | `hotel-beta/page`, `desarrollo/page` | CONSERVAR + refactorizar helpers a `lib/guards.ts` |
| `src/lib/auth.ts` | Auth core de toda la app | Todo el sistema | NO TOCAR |
| `src/lib/db.ts` | Prisma singleton | Todo el sistema | NO TOCAR |
| `src/lib/email.ts` | Email service Resend | Auth reset, registro | CONSERVAR |
| `src/lib/email-templates.ts` | Templates HTML email | email.ts | CONSERVAR |
| `src/app/layout.tsx` | Root layout + fonts + Providers | Todo | NO TOCAR |
| `src/app/page.tsx` | Landing con datos reales | LandingPage, prisma | CONSERVAR |
| `src/components/Providers.tsx` | SessionProvider global | layout.tsx | NO TOCAR |
| `src/components/Avatar.tsx` | Avatar renderer, usado globalmente | AdminShell, Navbar, Login | NO TOCAR |
| `src/components/Navbar.tsx` | Nav global con auth | (main)/layout | CONSERVAR |
| `src/components/Footer.tsx` | Footer global | (main)/layout, LandingPage | CONSERVAR |
| `src/components/LandingPage.tsx` | Landing completa | page.tsx | CONSERVAR |
| `src/components/AdminShell.tsx` | Admin layout completo con sidebar | admin/layout | CONSERVAR |
| `src/components/HotelClient.tsx` | Hotel launcher | hotel/page | CONSERVAR |
| `src/components/HotelBetaClient.tsx` | Beta launcher | hotel-beta/page | CONSERVAR |
| `src/components/HotelDesarrolloClient.tsx` | Dev launcher | desarrollo/page | CONSERVAR |
| `prisma/schema.prisma` | Schema completo | Todo el backend | CONSERVAR + ampliar |
| `app/(auth)/*` | Auth completa | — | NO TOCAR |
| `app/hotel/page.tsx` | Hotel gate | — | CONSERVAR |
| `app/hotel-beta/page.tsx` | Beta gate | — | CONSERVAR |
| `app/desarrollo/page.tsx` | Dev gate | — | CONSERVAR |
| `app/unauthorized/page.tsx` | Error page guards | middleware | CONSERVAR |
| `app/not-found.tsx` | 404 | — | CONSERVAR |
| `app/api/auth/*` | Auth APIs | — | NO TOCAR |
| `app/api/sso/route.ts` | SSO para juego | HotelClient | NO TOCAR |
| `app/api/admin/*` | Admin CRUD APIs | admin pages | CONSERVAR |
| `app/api/me/*` | User self-service APIs | me/settings pages | CONSERVAR |
| `app/(dashboard)/admin/layout.tsx` | Admin guard + AdminShell | — | CONSERVAR |
| `app/(dashboard)/admin/page.tsx` | Dashboard admin completo | prisma, KxActivityLog | CONSERVAR |
| `app/(dashboard)/admin/users/*` | User management | — | CONSERVAR |
| `app/(dashboard)/admin/bans/*` | Ban management | — | CONSERVAR |
| `app/(dashboard)/admin/permissions/*` | Permissions | — | CONSERVAR |
| `app/(dashboard)/admin/settings/*` | Settings | — | CONSERVAR |
| `app/(dashboard)/admin/wordfilter/*` | Wordfilter | — | CONSERVAR |
| `app/(dashboard)/admin/badges/*` | Badge management | — | CONSERVAR |
| `app/(dashboard)/admin/alerts/*` | Alertas | — | CONSERVAR |
| `app/(dashboard)/admin/messages/*` | Mensajes | — | CONSERVAR |

---

## 10. Próximo Microproceso Sugerido

### MP-CMS-002B: Plan de reemplazo y limpieza controlada del CMS legacy

**Objetivo:** Ejecutar las acciones seguras identificadas en esta auditoría.

**Tareas concretas:**

1. Crear `apps/web/src/lib/guards.ts` con helpers de rango (extraer de middleware.ts, sin borrar middleware.ts)
2. Actualizar `hotel-beta/page.tsx` y `desarrollo/page.tsx` para importar desde `@/lib/guards`
3. Actualizar `admin/layout.tsx` para usar helper `isAdmin()` en lugar de `rank < 7` hardcodeado
4. Crear `kx_housekeeper_permissions` en Prisma schema (granular, no destructivo)
5. Seed inicial de `WebsiteSetting` con valores del hotel
6. Completar `/admin/news` (editor de noticias funcional)
7. Completar `/community/news` (lista + detalle públicos)
8. Completar `/me` dashboard con todos los datos
9. Verificar y limpiar `/profile/page.tsx` raíz (redirect o eliminar)

**No hace:**
- No elimina ninguna ruta stub todavía
- No toca auth, middleware guard, Prisma schema base
- No conecta Arcturus (espera MP-008 a MP-012)
- No implementa RCON (espera MP-CMS-003)

---

## Reporte Final

### Rutas revisadas: 47 rutas (páginas + APIs)

**Funcionales:** login, register, forgot-password, reset-password, `/hotel`, `/hotel-beta`, `/desarrollo`, `/admin` + 11 sub-rutas, `/me`, todas las APIs admin y auth

**Stubs/pendientes:** about, badges, community/photos, community/staff, community/rooms, friends, help, legal/*, marketplace UI, referral, rooms, shop

### Componentes revisados: 16 componentes

**Críticos (no tocar):** Providers, Avatar, middleware.ts, lib/auth.ts, lib/db.ts  
**Bien construidos (conservar):** AdminShell, Navbar, Footer, LandingPage, todos los HotelClient*  
**Pendientes de completar:** MeDashboard, SettingsClient, MessagesClient, ProfileClient

### Archivos legacy detectados: 0

No hay código legacy real. Todo es Next.js 15 moderno. Los "problemas" son stubs vacíos, no código obsoleto.

### Archivos críticos que NO deben tocarse

1. `src/middleware.ts` — guard de toda la app
2. `src/lib/auth.ts` — NextAuth, JWT, sesión
3. `src/lib/db.ts` — Prisma singleton
4. `src/app/layout.tsx` — root layout global
5. `src/components/Providers.tsx` — SessionProvider
6. `src/components/Avatar.tsx` — usado globalmente
7. `prisma/schema.prisma` — schema completo
8. `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
9. `src/app/api/sso/route.ts` — SSO para el juego

### Recomendación final

**NO reemplazar el CMS desde cero.** El núcleo está bien construido y funcional. Sería desperdiciar trabajo hecho correctamente.

**Lo correcto:** completar los stubs siguiendo la arquitectura existente, refactorizar los 2-3 puntos de acoplamiento identificados (helpers en middleware, guard hardcodeado), y agregar features nuevas (RCON, staff management, catalog editor) en fases ordenadas.

**Es seguro continuar sobre el CMS actual** siempre que:
1. No se toque `middleware.ts` sin actualizar los imports que lo usan
2. No se cambie `@kodexa/shared` sin backward compatibility
3. No se modifique el Prisma schema sin migración controlada
4. No se conecte `arcturus_main` hasta completar MP-008 a MP-012
