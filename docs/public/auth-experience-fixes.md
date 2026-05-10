# Auth Experience Fixes — MP-AUTH-001

> **Fecha:** 2026-05-10  
> **Estado:** Completado

---

## Bugs corregidos

### BUG-LOGIN-001 — "¿Olvidaste tu contraseña?" apuntaba a `#`

**Archivo:** `apps/web/src/app/(auth)/login/page.tsx` línea 318

**Antes:**
```tsx
<a href="#" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</a>
```

**Después:**
```tsx
<Link href="/forgot-password" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
```

**Impacto:** Usuarios podían ver el botón pero no llegar al flujo de recuperación sin saber la URL de memoria.

---

### BUG-FORGOT-001 — Resets enviados al admin en vez del usuario

**Archivo:** `apps/web/src/app/api/auth/forgot-password/route.ts` línea 43

**Antes:**
```typescript
const recipientEmail = process.env.ADMIN_EMAIL ?? user.email;
```
Si `ADMIN_EMAIL` está definida (entornos de producción típicos), todos los emails de reset iban al administrador. El usuario real nunca recibía su enlace.

**Después:**
```typescript
// ADMIN_EMAIL es intentionally NOT used here — it would intercept user resets.
user.email,  // siempre el email real del usuario
```

**Decisión sobre ADMIN_EMAIL:**
- `ADMIN_EMAIL` puede existir en `.env` para notificaciones del sistema (alertas, logs).
- NO debe usarse como override de destinatario en flows de usuario final.
- Si se quiere notificar al admin sobre nuevos resets (audit), debe añadirse un segundo `sendEmail` separado, nunca reemplazando el destinatario real.
- El log existente `console.log([PasswordReset] user=... email_sent=...)` sirve como audit trail suficiente para desarrollo.

---

## Rediseño visual

### `/forgot-password`

**Antes:** Fondo plano `bg-bg`, clase `card` directa, sin aurora/grid/stars.  
**Después:** Layout premium alineado con `/login`:
- Aurora gradients (verde + púrpura) en `position: fixed`
- `grid-bg` + `stars twinkle`
- Header con logo + `page-toggle` + link "Volver"
- Título grande con `text-gradient`
- `.eyebrow` label
- Input con clase `.field` (coherente con login/register)
- `.auth-card` contenedor principal
- Estados: idle (form) → success (checkmark + mensaje) → permite reintentar con otro email
- Botón "Enviar instrucciones" con spinner de carga
- Footer "conexión cifrada"
- Validación inline de formato email (sin esperar respuesta API)

### `/reset-password/[token]`

**Antes:** Fondo plano, inputs con clases CSS inline, `StrengthBar` simplificada.  
**Después:**
- Mismos efectos de background que forgot-password
- Header con logo + page-toggle + link "Volver"
- `.eyebrow` + título grande por cada estado
- Inputs con clase `.field` + show/hide toggle unificado
- `StrengthBar` mejorada con label "Fuerza: X" + tip
- 3 estados visuales separados:
  - **idle / error con mensaje:** formulario completo
  - **success:** checkmark verde + auto-redirect en 3s
  - **error sin mensaje (token inválido):** estado de error con link a `/forgot-password`
- Validaciones preservadas: min 6 chars, passwords deben coincidir
- Toda la lógica de API preservada sin cambios

---

## Archivos revisados (solo lectura)

| Archivo | Razón |
|---------|-------|
| `apps/web/src/app/(auth)/login/page.tsx` | Detectar BUG-LOGIN-001 |
| `apps/web/src/app/api/auth/forgot-password/route.ts` | Detectar BUG-FORGOT-001 |
| `apps/web/src/app/(auth)/reset-password/[token]/page.tsx` | Auditoría antes de rediseño |
| `apps/web/src/app/globals.css` | Verificar clases CSS disponibles (aurora, .field, .auth-card, etc.) |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(auth)/login/page.tsx` | Fix BUG-LOGIN-001: `href="#"` → `href="/forgot-password"` |
| `apps/web/src/app/api/auth/forgot-password/route.ts` | Fix BUG-FORGOT-001: recipient siempre `user.email` |
| `apps/web/src/app/(auth)/forgot-password/page.tsx` | Rediseño completo premium |
| `apps/web/src/app/(auth)/reset-password/[token]/page.tsx` | Rediseño completo premium |

## Archivos creados

| Archivo | Razón |
|---------|-------|
| `apps/web/src/app/(auth)/layout.tsx` | Grupo auth necesita layout; actualmente pass-through (ver nota) |

> **Nota layout:** `(auth)/layout.tsx` es un pass-through (`<>{children}</>`). Login y register gestionan sus propios backgrounds internamente con valores de opacidad específicos. Extraer backgrounds al layout requeriría modificar login/register — fuera de scope de este MP. El layout existe como placeholder para el día que se unifique completamente.

---

## Rutas auth impactadas

| Ruta | Estado visual | Estado lógico |
|------|--------------|--------------|
| `/login` | Sin cambio visual | ✅ Fix link a /forgot-password |
| `/register` | Sin cambio | Sin cambio |
| `/forgot-password` | ✅ Rediseño premium | ✅ Fix recipient email |
| `/reset-password/[token]` | ✅ Rediseño premium | Sin cambio en lógica |

---

## Bugs pendientes (no corregidos en este MP)

| ID | Descripción | Dónde corregir |
|----|-------------|---------------|
| **BUG-LOGIN-002** | Discord login button sin `onClick` handler | MP-AUTH-001b o cuando se configure Discord OAuth |
| **BUG-LOGIN-003** | "Recordarme" checkbox sin efecto en JWT | Requiere `maxAge` dinámico en NextAuth config |
| **BUG-LANDING-001** | Nav labels incorrectos en LandingPage (Noticias→#stats, Rankings→#features) | MP-PUBLIC-002 |
| **BUG-REGISTER-001** | IP de registro no guardada en `users` table | MP-AUTH-004 (junto con Arcturus bridge) |
| **BUG-REGISTER-002** | `home_room` no asignado al registrar | MP-AUTH-004 |

---

## Validaciones realizadas

| Validación | Resultado |
|------------|-----------|
| TypeCheck `tsc --noEmit` | ✅ 0 errores |
| Link "¿Olvidaste?" ya no apunta a `#` | ✅ Confirmado |
| `ADMIN_EMAIL` eliminado del recipient | ✅ Confirmado |
| Sin imports desde `@/middleware` en auth pages | ✅ Confirmado |
| Arcturus/seed no tocados | ✅ Confirmado |
| `/admin`, `/me`, `/hotel`, `/desarrollo`, `/hotel-beta` no modificados | ✅ Confirmado |
| Middleware.ts no modificado | ✅ Confirmado |
| Prisma schema no modificado | ✅ Confirmado |
| SSO no tocado | ✅ Confirmado |

---

## Próximo microproceso

**MP-PUBLIC-002 — Refinement landing `/`**
- Fix nav labels incorrectos (Noticias/Rankings)
- Considerar integrar últimas noticias publicadas en sección de stats
- Sin tocar lógica de DB ni auth
