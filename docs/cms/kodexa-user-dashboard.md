# Dashboard de Usuario — `/me`

## Arquitectura

| Capa | Archivo |
|------|---------|
| Server Component (data fetching) | `apps/web/src/app/(main)/me/page.tsx` |
| Client Component (UI interactiva) | `apps/web/src/app/(main)/me/MeDashboard.tsx` |

## Datos cargados en `page.tsx`

| Query | Tabla | Descripción |
|-------|-------|-------------|
| `user` | `users` | Perfil completo + nivel via `userLevel` |
| `news` | `news` | 4 noticias publicadas más recientes (con `slug`) |
| `activity` | `kx_activity_log` | Últimas 5 acciones del usuario |
| `roomCount` | `rooms` | Cantidad de salas del usuario |
| `dailyRewardLog` | `kx_activity_log` | Si ya reclamó la recompensa hoy |
| `onlineUsers` | `users` | Hasta 12 usuarios online (look + username) |
| `onlineCount` | `users` | Total de usuarios online |
| `popularRooms` | `rooms` | Top 5 salas por score |
| `featuredUser` | `users` | Usuario con más créditos |
| `latestUser` | `users` | Usuario registrado más recientemente |
| `badges` | `users_badges` | Hasta 9 insignias por slotNumber asc |
| `currencies` | `users_currency` | Tipos 0 (Duckets), 5 (Diamantes), 101 (Puntos) |

### Mapeo de monedas (`CURRENCY_LABELS`)

```typescript
{ 0: 'Duckets', 5: 'Diamantes', 101: 'Puntos' }
```

Los créditos y píxeles están en la tabla `users` directamente (`credits`, `pixels`).  
Diamantes y Puntos vienen de `users_currency` y se muestran **solo si amount > 0**.

## Secciones del Dashboard

### Layout (3 columnas en desktop)

```
[Sidebar izquierdo] | [Contenido principal] | [Sidebar derecho]
```

### Sidebar izquierdo — Avatar Card

1. Banner de perfil (gradiente decorativo)
2. Avatar renderizado con `<Avatar look={} size="l" />`
3. Indicador online (punto verde/gris)
4. Username + pill de rango (color dinámico de `RANK_COLORS`)
5. Motto editable (PATCH `/api/me/motto`)
6. Stat pills: Créditos · Píxeles · [Diamantes si >0] · [Puntos si >0] · Nivel
7. Barra de XP con porcentaje hacia próximo nivel
8. **Insignias** (si tiene): pills con `badgeCode` en grid wrap
9. Botones de acción: Entrar al Hotel · Cuenta · Perfil Público
10. Fecha de registro

### Contenido principal

| Sección | Descripción |
|---------|-------------|
| Banner Hero | Saludo, conteo de online, stats resumidos |
| Últimas noticias | Noticia destacada + lista compacta. Links usan `slug` |
| Mis salas | Count de salas, link a /hotel |
| Salas populares | Top 5 por score |
| Actividad reciente | Timeline de últimas 5 acciones con iconos |

### Sidebar derecho

| Widget | Visible para |
|--------|-------------|
| **Acceso rápido** | rank ≥ 7 (admin panel), ≥ 9 (desarrollo), ≥ 10 (hotel-beta) |
| Discord Widget | Todos |
| Recompensa Diaria | Todos — POST `/api/me/daily-reward` |
| Kodexa de la semana | Todos (usuario con más créditos) |
| Nuevo jugador | Todos |
| Centro de Referidos | Todos |
| Usuarios online | Todos (grid de avatares) |
| Redes sociales | Todos |

## Acceso rápido por rango

| Rango mínimo | Link | Condición |
|-------------|------|-----------|
| 7 (ADMIN) | `/admin` | `user.rank >= 7` |
| 9 (DEVELOPER) | `/desarrollo` | `user.rank >= 9` |
| 10 (FOUNDER) | `/hotel-beta` | `user.rank >= 10` |

> Los checks de acceso real están en los layouts/pages de cada ruta via `canAccessAdmin()`, `canAccessDevelopment()`, `canAccessBeta()` de `@/lib/guards`.  
> En el dashboard, la visibilidad del widget es solo UI.

## APIs consumidas (client-side)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/me/motto` | PATCH | Actualizar motto del usuario |
| `/api/me/daily-reward` | POST | Reclamar recompensa diaria |

## Notas técnicas

- Las URLs de noticias usan `slug` cuando está disponible: `n.slug ? /community/news/${n.slug} : '/community/news'`.
- `badges` se limitan a 9 ordenados por `slotNumber ASC`.
- El "Usuario de la semana" es heurístico (el de más créditos) — no hay tabla dedicada aún.
- `dailyRewardClaimed` se calcula buscando un log de acción `daily_reward` desde el inicio del día (`setHours(0,0,0,0)`).
