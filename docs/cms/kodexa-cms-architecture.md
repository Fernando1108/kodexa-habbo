# Arquitectura CMS — Kodexa.Hotel

## Reglas de acceso por ruta

| Ruta | Guard | Rank mínimo | Helper usado |
|------|-------|-------------|--------------|
| `/admin/*` | canAccessAdmin | 7 (ADMIN) | `canAccessAdmin()` en layout + APIs |
| `/desarrollo` | canAccessDevelopment | 9 (DEVELOPER) | `canAccessDevelopment()` en page |
| `/hotel-beta` | canAccessBeta | 10 (FOUNDER) | `isFounder()` en page |
| `/hotel` | auth | 1 (cualquier user) | middleware needsAuth |
| `/community/*` | ninguno (público) | — | — |

## Fuente de verdad de guards

```
apps/web/src/lib/guards.ts
```

**Todos los helpers de rango deben importarse desde aquí.**  
Ningún archivo debe importar desde `@/middleware`.

## APIs admin — estado de guards

Todas las API routes bajo `/api/admin/*` usan `canAccessAdmin()` de `@/lib/guards`.  
**Cero checks hardcodeados** tras MP-CMS-002E.

### Archivos migrados en MP-CMS-002E

| Archivo | Checks migrados |
|---------|----------------|
| `api/admin/alerts/route.ts` | 1 |
| `api/admin/messages/[id]/route.ts` | 1 |
| `api/admin/badges/give/route.ts` | 1 |
| `api/admin/notifications/route.ts` | 1 |
| `api/admin/stats/route.ts` | 1 |
| `api/admin/rooms/route.ts` | 1 |
| `api/admin/rooms/[id]/route.ts` | 2 (PUT + DELETE) |
| `api/admin/users/route.ts` | 1 |
| `api/admin/users/[id]/route.ts` | 2 (PUT + DELETE) |
| `api/admin/news/route.ts` | 1 (ya migrado en MP-CMS-002C) |
| `api/admin/news/[id]/route.ts` | 1 (ya migrado en MP-CMS-002C) |

Total: **11 checks** → todos reemplazados por `!canAccessAdmin(session.user.rank ?? 1)`.

## Deuda técnica pendiente

### users/[id] — Zod schema limita rank a max(7)

```typescript
// apps/web/src/app/api/admin/users/[id]/route.ts
rank: z.number().int().min(1).max(7).optional(),
```

Admin (rank 7) no puede asignar rangos 8, 9, 10 desde la API.  
Esto requiere una política definida: ¿solo HOTEL_MANAGER+ puede asignar rangos altos?  
Pendiente para MP separado.

### Navbar — condición rank >= 7 en JSX

```typescript
// apps/web/src/components/Navbar.tsx (líneas 146, 310)
{rank >= 7 && (…)}
```

Estos son condicionales de UI (no guards de acceso), condición correcta.  
No requieren cambio — muestran/ocultan links de admin según rank.

## Historial de MPs relacionados

| MP | Acción |
|----|--------|
| MP-CMS-002B | Creó `lib/guards.ts`, migró imports de hotel-beta + desarrollo, fix admin/layout |
| MP-CMS-002C | APIs de news creadas con `canAccessAdmin()` desde el inicio |
| MP-CMS-002E | Migró 9 API routes admin restantes: 11 checks hardcodeados eliminados |
