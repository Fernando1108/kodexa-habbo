# MP-014 — /desarrollo Environment Gateway

## Objetivo

Crear un portal privado de entornos (`/desarrollo`) para desarrolladores y fundadores (rank >= 9).
Este MP NO conecta arcturus_dev ni el emulador custom. Solo establece el gateway seguro con:

- Guard server-side con rank fresco de DB (no JWT stale)
- Navegación clara a entornos disponibles
- Cards de estado por entorno
- Panel de diagnóstico de configuración
- Protección visible en Navbar solo para rank >= 9

---

## Mapa de rangos

| Rank | Nivel       | /hotel | /admin | /desarrollo | /hotel-beta |
|------|-------------|--------|--------|-------------|-------------|
| 1    | Normal      | ✅     | ❌     | ❌          | ❌          |
| 7    | Admin       | ✅     | ✅     | ❌          | ❌          |
| 8    | Hotel Manager | ✅   | ✅     | ❌          | ❌          |
| 9    | Developer   | ✅     | ✅     | ✅          | ❌          |
| 10   | Founder     | ✅     | ✅     | ✅          | ✅          |

---

## Arquitectura de entornos

```
/hotel          → arcturus_main + Nitro (:8081) — PRODUCCIÓN
/hotel-beta     → custom emulator (:2097)       — EXPERIMENTAL (rank 10)
/desarrollo     → gateway portal               — PRIVADO (rank 9+)
  └─ Card A: Hotel Principal   → /hotel
  └─ Card B: Arcturus Dev      → pendiente MP-015
  └─ Card C: Custom Emulator   → /hotel-beta si rank 10
  └─ Card D: Diagnóstico       → estado de entorno actual
```

---

## Guard de acceso — /desarrollo

### Mecanismo de protección (capas)

| Capa | Dónde | Qué verifica |
|------|-------|--------------|
| Middleware (Edge) | `middleware.ts` | `canAccessDevelopment(rank)` — rank del JWT |
| Server Component | `desarrollo/page.tsx` | Fresh DB read → `canAccessDevelopment(user.rank)` |
| Feature flag | Env var | `NEXT_PUBLIC_ENABLE_DEV_HOTEL !== 'false'` |

La doble verificación (middleware + server component) asegura que incluso si el JWT rank está desactualizado, el server component rechaza con redirect a `/unauthorized` antes de renderizar.

### Comportamiento por escenario

| Escenario | Resultado |
|-----------|-----------|
| Sin sesión | Redirect a `/login?callbackUrl=/desarrollo` (middleware) |
| Rank 1 | Redirect a `/unauthorized` (middleware + server) |
| Rank 8 | Redirect a `/unauthorized` (middleware + server) |
| Rank 9 | Acceso — vista DEVELOPER |
| Rank 10 | Acceso — vista FOUNDER (botón beta activo) |
| `NEXT_PUBLIC_ENABLE_DEV_HOTEL=false` | Redirect a `/unauthorized` |

---

## Rutas creadas/modificadas

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/desarrollo/page.tsx` | Reescrito — fresh DB rank, email en select, guard antes de DB read |
| `apps/web/src/components/HotelDesarrolloClient.tsx` | Reescrito — gateway con 4 cards + diagnóstico |
| `apps/web/src/components/Navbar.tsx` | + link `/desarrollo` en desktop y mobile (rank >= 9) |

---

## Estado de entornos en el gateway

### Card A — Hotel Principal

| Campo | Valor |
|-------|-------|
| DB | arcturus_main |
| Cliente | Nitro (:8081) |
| Estado | Disponible |
| Botón | Entrar al hotel → /hotel |
| Nota | Entorno estable con usuarios reales |

### Card B — Arcturus Dev

| Campo | Valor |
|-------|-------|
| DB | arcturus_dev |
| Cliente | Nitro Dev (pendiente) |
| Estado | Reservado |
| Botón | Próximamente — deshabilitado |
| Pendiente | ARCTURUS_DEV_DB_URL, /api/dev/sso, Nitro dev URL |

### Card C — Custom Emulator Beta

| Campo | Valor |
|-------|-------|
| Motor | kodexa-custom (Node.js / TypeScript / ws) |
| Puerto | :2097 |
| Estado | Experimental |
| Botón | "Entrar a beta" si rank >= 10 Y NEXT_PUBLIC_ENABLE_BETA_HOTEL=true |
| Botón | "Solo FOUNDER (rank 10)" si rank < 10 |

### Card D — Diagnóstico (panel collapsible)

Muestra en tiempo real (sin llamadas externas, solo props + env):

- Username, email, rank, nivel de acceso
- Entorno principal: arcturus_main
- Auth Bridge: configurado (/api/sso)
- Nitro URL: NEXT_PUBLIC_NITRO_URL
- Wallet endpoint: /api/hotel/wallet
- Feature flags: beta y dev

---

## Navbar — link /desarrollo

Añadido en desktop nav (entre Admin y Online pill) y en mobile drawer:

```tsx
{rank >= 9 && (
  <Link href="/desarrollo" className="kx-nav-link ...">
    <Construction size={13} style={{ color: '#F59E0B' }} />
    Dev
  </Link>
)}
```

- Visible solo para rank >= 9 — rank 1-8 no ve el link
- Rank del Navbar viene del JWT (client-side) — podría estar stale
- El server component re-verifica con fresh DB rank antes de renderizar

---

## Fix de seguridad aplicado en page.tsx

**Antes (vulnerabilidad):**
```typescript
const rank = session.user.rank ?? 1;       // ← JWT (stale posible)
if (!canAccessDevelopment(rank)) redirect('/unauthorized');
const user = await db.user.findUnique(...); // ← DB read después
```

**Después (fix):**
```typescript
const user = await db.user.findUnique({
  where: { id: Number(session.user.id) },
  select: { username: true, email: true, rank: true },  // ← fresh DB read PRIMERO
});
if (!user) redirect('/login');
if (!canAccessDevelopment(user.rank)) redirect('/unauthorized'); // ← rank de DB
```

Un usuario con rank degradado en DB pero JWT stale ya no puede acceder — el server component lo rechaza antes de renderizar.

---

## Variables de entorno actuales

| Variable | Valor actual | Propósito |
|----------|-------------|-----------|
| `ARCTURUS_DB_URL` | `mysql://...@localhost/arcturus_main` | DB del hotel principal |
| `NEXT_PUBLIC_NITRO_URL` | `http://localhost:8081` | Nitro renderer |
| `NEXT_PUBLIC_ENABLE_DEV_HOTEL` | `true` | Feature flag /desarrollo |
| `NEXT_PUBLIC_ENABLE_BETA_HOTEL` | `true` | Feature flag /hotel-beta |

## Variables de entorno pendientes (MP-015)

| Variable | Propósito |
|----------|-----------|
| `ARCTURUS_DEV_DB_URL` | DB de arcturus_dev |
| `NEXT_PUBLIC_NITRO_DEV_URL` | Nitro apuntando a arcturus_dev |
| `NEXT_PUBLIC_CUSTOM_EMULATOR_URL` | WS del emulador custom |

No se añaden todavía — solo documentadas para MP-015.

---

## Pendiente para conectar arcturus_dev (MP-015)

1. Iniciar instancia de Arcturus Dev (puerto distinto)
2. Crear `ARCTURUS_DEV_DB_URL` en .env
3. Crear `apps/web/src/lib/arcturus-dev-db.ts` (segundo cliente Prisma)
4. Crear `apps/web/src/app/api/dev/sso/route.ts` (SSO separado)
5. Crear `apps/web/src/app/api/dev/status/route.ts` (health check)
6. Actualizar Card B en gateway para habilitar botón
7. Crear launcher `/desarrollo/arcturus-dev` (similar a /hotel pero con dev Nitro URL)

---

## Pendiente para Custom Emulator Beta (MP-015 o posterior)

- Custom emulator ya accesible vía `/hotel-beta` (Founder only)
- Card C ya muestra link activo para rank 10 si `NEXT_PUBLIC_ENABLE_BETA_HOTEL=true`
- No requiere cambios adicionales para el estado actual

---

## Validaciones realizadas

- arcturus_dev — NO modificado
- arcturus_main — NO reseteado
- usuarios — NO borrados
- inventario — NO borrado
- rooms — NO tocadas
- catálogo — NO tocado
- furniture assets — NO tocados
- FurnitureData — NO tocado
- ExternalTexts — NO tocado
- Auth Bridge (/api/sso) — NO roto
- /hotel — NO roto
- /api/hotel/wallet — NO roto
- registro/login — NO roto
- /admin — NO roto
- TypeScript — `tsc --noEmit` pasa sin errores

---

## Limitaciones

1. **Navbar usa JWT rank** — link Dev visible/oculto depende del JWT. Si un usuario con rank degradado tiene sesión activa, puede ver el link pero el server component lo rechaza al intentar acceder.

2. **Diagnóstico sin live checks** — el panel muestra valores estáticos (props + env vars). No hace ping a arcturus_main ni a Nitro. Para un diagnóstico live → MP-015 `/api/dev/status`.

3. **Card B (Arcturus Dev) deshabilitada** — no conectada. Botón "Próximamente" hasta MP-015.

4. **Feature flag `NEXT_PUBLIC_ENABLE_DEV_HOTEL=false` oculta todo** — si se pone en false, nadie puede acceder aunque tenga rank 9. Útil para maintenance mode.

---

## Conclusión

El gateway `/desarrollo` queda:
- Protegido server-side con fresh DB rank (más seguro que antes)
- Visualmente claro con estado de cada entorno
- Preparado estructuralmente para MP-015 (arcturus_dev bridge)
- Integrado en Navbar para rank >= 9
- TypeScript limpio

---

## Próximo MP recomendado

**MP-015 — Development Emulator Bridge**: conectar arcturus_dev con `/api/dev/sso`, launcher dedicado, health check endpoint, y desbloquear Card B del gateway.
