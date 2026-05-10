# Auditoría de Experiencia Pública y Auth — MP-PUBLIC-001

> **Tipo:** Solo lectura + documentación  
> **Fecha:** 2026-05-10  
> **Estado:** Completado — sin modificaciones de código

---

## Resumen Ejecutivo

La experiencia pública de Kodexa.Hotel tiene una base **sólida y moderna**. La landing `/` y las páginas de `/login` y `/register` están bien construidas y visualmente consistentes. Sin embargo, existen **5 bugs críticos** y **2 inconsistencias de diseño** que deben corregirse antes del rediseño. No existe ruta `/home` duplicada — la landing oficial ya es `/`.

**Diagnóstico global:**
| Ruta | Estado visual | Estado lógico | Prioridad de rediseño |
|------|--------------|--------------|----------------------|
| `/` | ✅ Premium | ✅ Funcional | Media — mejorar nav labels |
| `/login` | ✅ Premium | ⚠️ 1 bug crítico | Baja — fix bug + mejoras menores |
| `/register` | ✅ Premium | ✅ Funcional | Baja — ya tiene avatar wizard |
| `/forgot-password` | ❌ Inconsistente | ✅ Funcional | Alta — rediseño visual |
| `/reset-password/[token]` | ❌ Inconsistente | ✅ Funcional | Alta — rediseño visual |

---

## 1. Mapa de Rutas Públicas

### Rutas auditadas

| URL | Archivo | Layout | Propósito | Decisión |
|-----|---------|--------|-----------|---------|
| `/` | `app/page.tsx` → `components/LandingPage.tsx` | Root only | Landing oficial | **Conservar — es la landing oficial** |
| `/home` | — | — | No existe | **No crear — no es necesaria** |
| `/login` | `app/(auth)/login/page.tsx` | Root only (auto-gestionado) | Autenticación | **Conservar + fix bugs** |
| `/register` | `app/(auth)/register/page.tsx` | Root only (auto-gestionado) | Registro con avatar wizard | **Conservar + extender** |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Root only | Solicitar reset de contraseña | **Conservar + rediseño visual** |
| `/reset-password/[token]` | `app/(auth)/reset-password/[token]/page.tsx` | Root only | Establecer nueva contraseña | **Conservar + rediseño visual** |
| `/profile` | `app/profile/page.tsx` | Root only | Redirect → `/community/profiles/[username]` | **Conservar (redirect helper)** |

### Decisión sobre `/` vs `/home`

**No existe `/home`.** La landing oficial es `/`. Esta es la arquitectura correcta.  
No se debe crear `/home` — añadiría duplicación sin beneficio.  
Si en el futuro se quiere `/home` como alias → redirigir con `redirect('/')` desde `app/home/page.tsx`.

### Grupos de rutas en App Router

```
app/
├── page.tsx                    ← Landing (/) — sin layout de grupo
├── layout.tsx                  ← Root layout (Sora + JetBrains_Mono + Providers)
├── (auth)/                     ← Sin layout.tsx propio — PROBLEMA (ver §5)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/[token]/page.tsx
├── (main)/                     ← layout.tsx con Navbar + Footer
│   └── me, community, etc.
└── (dashboard)/                ← layout.tsx admin
    └── admin/*
```

---

## 2. Auditoría Landing (`/`)

**Archivo:** `apps/web/src/components/LandingPage.tsx` (535 líneas)  
**Data fetching:** `app/page.tsx` — Server Component con 4 queries Prisma en paralelo

### Estructura visual

| Sección | Contenido | Estado |
|---------|-----------|--------|
| Navbar fijo | Logo · Links · Login/Register CTA | ✅ Bien |
| Hero | Título grande · copy · CTA "Entrar al Hotel" + "Crear Cuenta" · scene mock isométrico | ✅ Premium |
| Marquee | Características en ticker horizontal | ✅ Bien |
| Features (6 cards) | Marketplace, IA, Wired, Mobile, Custom, Economía | ✅ Bien |
| Stats en tiempo real | CountUp animado con 4 métricas de DB | ✅ Bien |
| CTA final | Bloque de conversión con gradiente | ✅ Premium |
| Footer | Importado de `components/Footer` | ✅ |

### Fortalezas

- Estilo visual gaming/premium: aurora gradients, grid-bg, stars, iso-tile mock
- Fonts: Sora + JetBrains Mono — pairing correcto para hotel virtual
- Copy en español, tono correcto: "el hotel virtual de nueva generación"
- CTAs claros: registro gratuito, entrada al hotel
- Stats en tiempo real con data real de DB (no mock)
- `CountUp` con IntersectionObserver — carga correcta
- `FeatCard` con mouse-tracking glow effect — UX premium
- Totalmente responsive con mobile menu

### Bugs y problemas

**BUG-LANDING-001 — Nav links con labels incorrectos:**
```tsx
// LandingPage.tsx líneas 129–133
<a className="nav-link active" href="#hero">Inicio</a>
<a className="nav-link" href="/community/rankings">Comunidad</a>
<a className="nav-link" href="#stats">Noticias</a>      // ← label dice "Noticias" pero apunta a #stats
<a className="nav-link" href="#features">Rankings</a>    // ← label dice "Rankings" pero apunta a #features
```
Los labels no corresponden a los destinos. "Noticias" → `#stats` (sección de estadísticas) y "Rankings" → `#features` (features del hotel). Estos son restos de copy incompleto.

**NO-BUG-001 — Stats mock en scene card:**  
Los datos del mock de la sala hero (12,840 créditos, 42 diamantes, Lv 24) son decorativos. Correcto — es un preview visual, no datos reales. No es un bug.

### Partes reutilizables para futuro rediseño

- `CountUp` component — reutilizable
- `FeatCard` component — reutilizable
- Aurora + grid-bg + stars backgrounds — ya son CSS global
- Patrón de navbar scrolled (`nav-blur`) — reutilizable
- Mobile menu pattern — reutilizable

---

## 3. Auditoría Login (`/login`)

**Archivo:** `apps/web/src/app/(auth)/login/page.tsx` (413 líneas)  
**Tipo:** Client Component (`'use client'`)

### Funcionalidades implementadas

- Login con username o email (`identifier`)
- Debounced avatar preview (`/api/auth/lookup`) — 800ms delay, IntersectionObserver-style
- Validación inline con mensajes de error
- Flujo 2FA para staff: `/api/auth/staff-login` → `/api/auth/verify-token`
- "Recordarme" checkbox (UI presente pero no tiene efecto real — JWT siempre dura lo mismo)
- Redirect post-login a `callbackUrl` o `/me`
- Botón Discord (UI presente, no funcional)
- Password show/hide toggle
- Estado loading/success con spinner y checkmark animado

### Fortalezas visuales

- Mismos efectos de background que register (aurora, grid-bg, stars)
- Avatar preview animado al escribir username — excelente UX
- 2FA flow con step visual separado
- `page-toggle` entre Login/Register en header
- Texto de seguridad: "conexión cifrada · auth.kodexahotel.com"

### Bugs

**BUG-LOGIN-001 — CRÍTICO: Enlace "¿Olvidaste tu contraseña?" apunta a `#`:**
```tsx
// login/page.tsx línea 318
<a href="#" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</a>
```
El enlace está roto. Debe apuntar a `/forgot-password`. El usuario no puede acceder al flujo de recuperación desde la UI de login.

**BUG-LOGIN-002 — Discord login button sin handler:**
```tsx
// login/page.tsx líneas 341–345
<button type="button" className="btn btn-outline w-full">
  {/* Discord SVG */}
  Continuar con Discord
</button>
```
No tiene `onClick` ni `signIn('discord', ...)`. Es un botón muerto. No hay provider Discord configurado en `auth.ts`. Riesgo de confusión UX.

**BUG-LOGIN-003 — "Recordarme" sin efecto real:**
El checkbox existe pero no pasa ningún parámetro a `signIn`. JWT strategy con duración fija. Si se implementa "recordarme", requiere control de `maxAge` en la sesión.

**INFO — No redirect cuando ya está autenticado:**
Visitar `/login` siendo ya usuario autenticado NO redirige a `/me`. Es comportamiento aceptable actualmente pero debería mejorar en MP-AUTH-001.

### APIs consumidas por login

| Endpoint | Propósito | Estado |
|----------|-----------|--------|
| `GET /api/auth/lookup?q=` | Avatar preview debounced | ✅ Funcional |
| `POST /api/auth/staff-login` | Check si usuario necesita 2FA | ✅ Funcional |
| `POST /api/auth/verify-token` | Verificar token 2FA de 6 dígitos | ✅ Funcional |
| `POST /api/auth/[...nextauth]` (via `signIn`) | Auth final con credentials | ✅ Funcional |

### Riesgo al tocar login

**ALTO.** El flujo 2FA es un sistema de 3 pasos encadenados. Cualquier cambio visual debe preservar:
1. `loginStep` state (`credentials` | `token`)
2. El order de llamadas API (staff-login → verify-token → signIn)
3. `callbackUrl` handling post-login

---

## 4. Auditoría Register (`/register`)

**Archivo:** `apps/web/src/app/(auth)/register/page.tsx` (672 líneas)  
**Tipo:** Client Component  
**API:** `apps/web/src/app/api/auth/register/route.ts`

### Wizard implementado (3 pasos)

**Paso 1 — Avatar selector (YA IMPLEMENTADO):**
- Selector de género (M/F) con mini-preview
- 26 tonos de piel (paleta Habbo oficial)
- 6 outfits por género (M/F) con preview
- Preview central del avatar en tiempo real via `getAvatarUrl()`
- `buildLook()` genera el look string para Arcturus/Nitro

**Paso 2 — Datos de cuenta:**
- Username: regex `[A-Za-z0-9_.]{3,20}`, debounce de disponibilidad 500ms
- Email, Password (con strength bar de 4 segmentos), Confirm password
- Términos y condiciones con links a `/legal/terms` y `/legal/privacy`
- Validación completa cliente + servidor

**Paso 3 — Éxito:**
- Confetti animado (22 piezas de colores del theme)
- Avatar renderizado con glow effect
- Stats iniciales mostrados (5,000 créditos / 10,000 pixels)
- CTAs: "Entrar al Hotel" → `/hotel` y "Ir a mi dashboard" → `/me`
- Auto sign-in tras crear cuenta (credentials provider)

### API register — análisis

```typescript
// /api/auth/register/route.ts
const user = await prisma.user.create({
  data: {
    rank: 1, credits: 5000, pixels: 10000,
    look: look ?? 'hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92',
    motto: 'Soy nuevo en Kodexa Hotel',
    authTicket: crypto.randomUUID(),
    userLevel: { create: { level: 1, experience: 0 } },
    reputation: { create: { score: 0, ... } },
  },
});
```

| Campo | Valor | Estado |
|-------|-------|--------|
| `rank` | 1 (USER) | ✅ Correcto |
| `credits` | 5000 | ✅ Correcto |
| `pixels` | 10000 | ✅ Correcto |
| `look` | Enviado por wizard | ✅ Correcto |
| `motto` | Hardcoded | ✅ Aceptable |
| `authTicket` | `crypto.randomUUID()` | ✅ Correcto |
| `password` | `bcrypt(10)` | ✅ Correcto |
| `ip_register` / `ip_current` | **NO guardado** | ⚠️ Missing vs AtomCMS |
| `home_room` | **NO asignado** | ⚠️ Pendiente Arcturus |
| `userLevel` | Creado (level:1, xp:0) | ✅ Correcto |
| `reputation` | Creado (score:0) | ✅ Correcto |

### Fortalezas

- **El wizard de avatar ya existe** — no hay que construirlo desde cero para MP-AUTH-002
- Wizard multi-step con progress indicator visual
- Username availability check en tiempo real
- Password strength meter 4-segmentos
- Confetti en success — UX delightful
- Look string real enviado y guardado

### Bugs / gaps

**BUG-REGISTER-001 — IP no guardada:**
```typescript
// Falta en prisma.user.create:
ip_register: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '',
ip_current: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '',
```
AtomCMS guarda IP en registro para anti-abuse. Kodexa no lo hace aún.

**BUG-REGISTER-002 — `home_room` no asignado:**
Campo existe en schema Arcturus (`home_room` en tabla `users`). Kodexa no lo asigna. Sin impacto actual (Arcturus no integrado), pero bloqueante para MP-AUTH-004.

**INFO — Selección de sala NO existe aún:**
El wizard actual tiene solo 2 pasos funcionales (avatar + cuenta). El paso de "sala inicial" mencionado en el roadmap no está implementado — correcto según instrucciones.

### Dónde puede entrar el onboarding futuro

```
Paso 1: Avatar (✅ implementado)
Paso 2: Cuenta (✅ implementado)
Paso 3: Sala inicial (→ MP-AUTH-003 — agregar aquí, antes del paso de éxito)
Paso 4: ¡Listo! (actualmente Paso 3 — desplazar al paso 4)
```

### Riesgo al tocar register

**MEDIO.** El `step` state (1|2|3) está hardcodeado. Añadir Paso 3 de sala requiere cambiar a (1|2|3|4) y desplazar el step de éxito. No toca la lógica de API.

---

## 5. Auditoría Forgot Password (`/forgot-password`)

**Archivo:** `apps/web/src/app/(auth)/forgot-password/page.tsx` (91 líneas)  
**API:** `apps/web/src/app/api/auth/forgot-password/route.ts`  
**API Reset:** `apps/web/src/app/api/auth/reset-password/route.ts`

### Flujo completo

```
Usuario → /forgot-password → POST /api/auth/forgot-password
                          → prisma.passwordReset.create (token 48 bytes, expira 1h)
                          → sendEmail (Resend/email library)
                          → Email con link: /reset-password/{token}

Usuario → /reset-password/[token] → POST /api/auth/reset-password
                                  → Valida token + expiry
                                  → bcrypt.hash(newPassword, 12)
                                  → prisma.$transaction([update user, delete token])
                                  → redirect /login (setTimeout 3s)
```

### Estado lógico — ✅ Completo

- Token de 48 bytes hex (seguro)
- Expiración 1 hora
- Invalidación de tokens anteriores al solicitar nuevo
- Anti-enumeration: siempre devuelve `{ ok: true }` aunque email no exista
- Transacción atómica: update password + delete token
- Token consumed = no reutilizable
- Strength bar en reset-password page

### BUG CRÍTICO de seguridad/configuración

**BUG-FORGOT-001 — `ADMIN_EMAIL` override envía todos los resets al admin:**
```typescript
// /api/auth/forgot-password/route.ts línea 43
const recipientEmail = process.env.ADMIN_EMAIL ?? user.email;
```
Si `ADMIN_EMAIL` está definida en producción (probable), **TODOS** los emails de reset de contraseña van al admin, no al usuario real. El usuario nunca recibe su link.

Esto es un bug de seguridad/privacidad. Debe documentarse como fix prioritario aunque no se corrija ahora.

### Estado visual — ❌ Inconsistente

**`/forgot-password`:** Fondo plano `bg-bg`, sin aurora, sin grid-bg, sin stars. Usa clase `card` directa. Completamente diferente al estilo premium de login/register.

**`/reset-password/[token]`:** Mismo problema. Fondo `bg-bg`, sin efectos. Inputs con clases CSS inline diferentes a los de login/register (usa `px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155]` en lugar de la clase `.field`).

Estas 2 páginas parecen de otro hotel. No usan las clases compartidas de auth (`.auth-card`, `.field`, `.aurora`, `.grid-bg`, `.stars`).

### No existe `(auth)/layout.tsx`

El grupo `(auth)` no tiene layout propio. Login y register gestionan sus propios fondos internamente. Forgot y reset no lo hacen — de ahí la inconsistencia.

**Recomendación:** Crear `(auth)/layout.tsx` con los efectos de background compartidos para tener consistencia sin duplicar código en cada página.

---

## 6. Middleware — Lectura

**Archivo:** `apps/web/src/middleware.ts`

### Estado actual

```typescript
export const config = {
  matcher: [
    '/hotel/:path*',
    '/hotel-beta/:path*',
    '/desarrollo/:path*',
    '/me/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/marketplace/:path*',
    '/profile',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',  // ← corre en TODO
  ],
};
```

### Riesgos identificados

**RIESGO-MW-001 — Matcher ultra-broad:**
El último matcher `/((?!api|...))` ejecuta el middleware en `/`, `/login`, `/register`, `/forgot-password`, etc. No causa errores porque la lógica `needsAuth` no aplica a esas rutas, pero es innecesario overhead para páginas públicas.

**RIESGO-MW-002 — Helpers duplicados en middleware.ts:**
```typescript
// middleware.ts (duplicado de guards.ts):
export function isStaff(rank: number)  { return rank >= 4; }
export function isAdmin(rank: number)  { return rank >= 7; }
// ...
```
`guards.ts` es la fuente de verdad según arquitectura documentada (MP-CMS-002B). `middleware.ts` tiene sus propias implementaciones. No causa errores actualmente porque los valores coinciden, pero es deuda técnica.

**RIESGO-MW-003 — No redirect cuando ya autenticado:**
`/login` y `/register` no tienen guard de "ya logueado → redirigir a /me". El middleware no lo cubre y las pages tampoco lo hacen. Puede causar que un usuario logueado vea el formulario de login.

---

## 7. Referencia AtomCMS — Ideas Funcionales Adaptables

> Solo ideas. No código Blade/Laravel. No instalar.

### Register
| Feature AtomCMS | Adaptación React/Next.js |
|----------------|--------------------------|
| `requires_beta_code` setting | Env var `NEXT_PUBLIC_REQUIRE_BETA_CODE` + campo en wizard paso 2 |
| `max_accounts_per_ip` | Verificar IP en `/api/auth/register` antes de crear user |
| `hotel_home_room` setting | Guardar `home_room` preferida en DB al registrar (MP-AUTH-003) |
| Discord webhook en registro | POST a webhook URL desde `/api/auth/register` |
| Wordfilter en username | Reutilizar `wordfilter` table existente en schema |
| Referral code en URL `register/{code}` | `?ref=code` ya existe en sistema de referidos de `/me` |

### Forgot/Reset
| Feature AtomCMS | Estado en Kodexa |
|----------------|-----------------|
| Token hash 64 chars | ✅ Kodexa usa 96 chars hex (más seguro) |
| Expiración 1 hora | ✅ Idéntico |
| Anti-enumeration | ✅ Kodexa lo implementa |
| Reutilización de token | ❌ AtomCMS no invalida; Kodexa sí — mejor |

### Home profile (AtomCMS `/home/{username}`)
Concepto interesante para futuro: página pública de usuario con widgets drag-and-drop (badges, fotos, guestbook, amigos, salas). Diferente del `/me` dashboard privado. Podría ser una evolución del `/community/profiles/[username]`.

---

## 8. Arquitectura Pública Objetivo

### Decisión: `/` es la landing oficial

```
/           → LandingPage (conservar, mejorar)
/home       → NO crear
/login      → (auth)/login — fix bugs
/register   → (auth)/register — conservar + extender pasos
/forgot-password → (auth)/forgot-password — rediseño visual
/reset-password/[token] → (auth)/reset-password/[token] — rediseño visual
```

### Layout público recomendado

```
(auth)/
├── layout.tsx          ← CREAR: background effects compartidos (aurora, grid-bg, stars)
├── login/page.tsx      ← Conservar
├── register/page.tsx   ← Conservar + extender
├── forgot-password/page.tsx  ← Rediseñar usando .auth-card + .field
└── reset-password/[token]/page.tsx ← Rediseñar
```

### Componentes reutilizables a extraer

| Componente | Dónde extraer | Beneficio |
|------------|--------------|-----------|
| `AuthBackground` | `(auth)/layout.tsx` | Evita duplicar aurora/grid-bg/stars en cada page |
| `AuthHeader` (logo + page-toggle) | `components/AuthHeader.tsx` | Logo + tabs Login/Register compartidos |
| `PasswordStrengthBar` | `components/ui/PasswordStrengthBar.tsx` | Existe en register + reset-password (duplicado) |
| `CountUp` | `components/ui/CountUp.tsx` | Actualmente solo en LandingPage |

---

## 9. Bugs y Riesgos — Resumen

### Bugs críticos (bloquean UX)

| ID | Ubicación | Descripción | Impacto |
|----|-----------|-------------|---------|
| **BUG-LOGIN-001** | `(auth)/login/page.tsx:318` | `href="#"` en "¿Olvidaste tu contraseña?" | CRÍTICO — usuario no puede recuperar contraseña desde UI |
| **BUG-FORGOT-001** | `api/auth/forgot-password/route.ts:43` | `ADMIN_EMAIL ?? user.email` envía reset al admin, no al usuario | CRÍTICO — funcionalidad rota en producción con ADMIN_EMAIL seteado |

### Bugs de calidad/UX

| ID | Ubicación | Descripción | Impacto |
|----|-----------|-------------|---------|
| **BUG-LOGIN-002** | `(auth)/login/page.tsx:341` | Discord login button sin handler | MEDIO — botón muerto confunde usuarios |
| **BUG-LOGIN-003** | `(auth)/login/page.tsx:313` | "Recordarme" sin efecto real en JWT | BAJO — deceptive UI |
| **BUG-LANDING-001** | `components/LandingPage.tsx:130-133` | Nav labels incorrectos (#stats="Noticias", #features="Rankings") | BAJO — confusión de navegación |
| **BUG-REGISTER-001** | `api/auth/register/route.ts` | IP no guardada en registro | BAJO — missing anti-abuse |
| **BUG-REGISTER-002** | `api/auth/register/route.ts` | `home_room` no asignado | INFO — bloqueante para MP-AUTH-004 |

### Inconsistencias de diseño

| ID | Descripción | Fix |
|----|-------------|-----|
| **DESIGN-001** | `/forgot-password` y `/reset-password` sin efectos de background premium | Crear `(auth)/layout.tsx` con shared background |
| **DESIGN-002** | Inputs en reset/forgot usan clases inline diferentes a `.field` de login/register | Unificar a clase `.field` y `.auth-card` |
| **DESIGN-003** | `PasswordStrengthBar` duplicada en register + reset-password | Extraer a componente shared |

### Riesgos de rotura al implementar cambios

| Riesgo | Qué podría romper | Prevención |
|--------|------------------|------------|
| Tocar login sin respetar 2FA flow | Staff no puede loguearse | Preservar `loginStep` state + 3 API calls encadenados |
| Modificar register sin respetar auto-signIn | Usuario creado pero no logueado | Preservar `signIn` call en `handleSubmit` |
| Tocar middleware matcher | Rutas protegidas accesibles sin auth | Test completo de rutas protegidas tras cambio |
| Cambiar lógica de `callbackUrl` | Usuarios van a /me en vez de la ruta que querían | Preservar `new URLSearchParams(window.location.search).get('callbackUrl')` |

---

## 10. Roadmap por Fases

### MP-PUBLIC-002 — Landing `/` refinement
**Scope:** Solo visual/copy, sin tocar lógica  
- Corregir labels de nav (`Noticias` y `Rankings` apuntan a secciones incorrectas)
- Considerar añadir sección de noticias reales (últimas 3 noticias publicadas)
- Mejorar copy del hero si es necesario
- Sin tocar lógica de DB, middleware, auth

### MP-AUTH-001 — Rediseño visual forgot + reset + fix bugs críticos
**Scope:** Visual + 2 bug fixes críticos  
- Crear `apps/web/src/app/(auth)/layout.tsx` con efectos de background compartidos
- Rediseñar `/forgot-password` con `.auth-card` + `.field` + aurora/grid/stars
- Rediseñar `/reset-password/[token]` con mismo estilo
- Extraer `PasswordStrengthBar` a componente compartido
- **Fix BUG-LOGIN-001:** cambiar `href="#"` a `href="/forgot-password"`
- **Fix BUG-FORGOT-001:** cambiar `ADMIN_EMAIL ?? user.email` → `user.email`
- Quitar o conectar botón Discord (decidir)
- Agregar redirect "ya autenticado → /me" en login y register
- Sin tocar lógica de auth, tokens, bcrypt, ni API routes

### MP-AUTH-002 — Register onboarding visual mejorado
**Scope:** UI del wizard de registro  
- El wizard de avatar (Paso 1) ya existe — evaluar si mejorarlo
- Añadir feedback visual más rico en éxito (Paso 3)
- No tocar API de register
- No implementar sala todavía

### MP-AUTH-003 — Register: selección de sala inicial
**Scope:** Nuevo paso 3 en wizard + guardar preferencia en DB  
- Añadir Paso 3 al wizard: selector de "tipo de sala inicial" (opciones visuales)
- Guardar preferencia en tabla (nueva columna o tabla `kx_user_preferences`)
- NO crear sala real todavía (depende de Arcturus)
- Paso de éxito se convierte en Paso 4
- Requiere: cambio de `step: 1|2|3` a `step: 1|2|3|4`

### MP-AUTH-004 — Auth Bridge: crear sala real al registrar
**Prerequisito: MP-011 Arcturus Auth Bridge debe estar completo**  
- Al crear usuario, enviar WebSocket message al emulador
- Emulador crea sala según preferencia de MP-AUTH-003
- Guardar `home_room` en DB
- Guardar `ip_register` + `ip_current` en `/api/auth/register`
- Considerar Discord webhook en registro

### MP-AI-FOUNDERS-001 — IA en cliente
**Prerequisito: Hotel funcionando con Arcturus completo**  
**Scope:** Fase Founder/Experimental — NO implementar antes  
- Arquitectura de IA para el cliente del juego
- NPCs con LLM, auto-moderación, asistente `/ask`
- Diseño aislado de auth, CMS y flujo principal

---

## 11. Verificación de Reglas del MP

| Regla | Estado |
|-------|--------|
| NO se modificó código funcional | ✅ |
| NO se ejecutaron migraciones | ✅ |
| NO se tocaron bases de datos | ✅ |
| NO se tocó Arcturus/arcturus_main/arcturus_dev | ✅ |
| NO se tocó middleware.ts | ✅ |
| NO se tocó SSO | ✅ |
| NO se tocó /admin ni /me | ✅ |
| NO se tocó News module | ✅ |
| NO se implementó IA | ✅ |
| NO se implementó selección de avatar (ya existe, solo auditada) | ✅ |
| NO se implementó selección de sala | ✅ |
| Solo se creó documentación | ✅ |

---

## 12. Archivos Revisados

| Archivo | Tipo | Acción |
|---------|------|--------|
| `apps/web/src/app/page.tsx` | Landing SC | Leído |
| `apps/web/src/components/LandingPage.tsx` | Landing CC | Leído |
| `apps/web/src/app/(auth)/login/page.tsx` | Auth CC | Leído |
| `apps/web/src/app/(auth)/register/page.tsx` | Auth CC | Leído |
| `apps/web/src/app/(auth)/forgot-password/page.tsx` | Auth CC | Leído |
| `apps/web/src/app/(auth)/reset-password/[token]/page.tsx` | Auth CC | Leído |
| `apps/web/src/app/api/auth/register/route.ts` | API | Leído |
| `apps/web/src/app/api/auth/forgot-password/route.ts` | API | Leído |
| `apps/web/src/app/api/auth/reset-password/route.ts` | API | Leído |
| `apps/web/src/app/api/auth/lookup/route.ts` | API | Leído |
| `apps/web/src/app/(main)/layout.tsx` | Layout | Leído |
| `apps/web/src/app/layout.tsx` | Root layout | Leído |
| `apps/web/src/app/profile/page.tsx` | Redirect helper | Leído |
| `apps/web/src/middleware.ts` | Middleware | Leído (solo lectura) |
| `apps/web/src/lib/auth.ts` | Auth config | Leído |
| `apps/web/src/components/Navbar.tsx` | Component | Leído (parcial) |
| `external/cms/atomcms/routes/web.php` | AtomCMS ref | Leído |
| `external/cms/atomcms/app/Actions/Fortify/CreateNewUser.php` | AtomCMS ref | Leído |

**Documento creado:** `docs/public/public-auth-experience-audit.md`
