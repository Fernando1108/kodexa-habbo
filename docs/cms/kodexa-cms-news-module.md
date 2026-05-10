# Módulo News — Kodexa.Hotel CMS

## Rutas creadas

### Admin (requiere rank >= 7 — canAccessAdmin)

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/admin/news` | Server Component | Lista todas las noticias con estado, slug, autor, fecha |
| `/admin/news/create` | Client Component (NewsForm) | Crear nueva noticia |
| `/admin/news/[id]/edit` | Server + Client Component | Editar noticia existente |

### Públicas (sin autenticación)

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/community/news` | Server Component | Lista noticias PUBLISHED, paginación 12/página |
| `/community/news/[slug]` | Server Component | Detalle por slug. Solo muestra PUBLISHED. notFound() si no existe o no está publicada |

### API Routes

| Endpoint | Método | Descripción |
|---------|--------|-------------|
| `/api/admin/news` | GET | Lista todas (admin) |
| `/api/admin/news` | POST | Crear noticia con auto-slug |
| `/api/admin/news/[id]` | GET | Obtener una noticia (admin) |
| `/api/admin/news/[id]` | PUT | Editar título, slug, excerpt, content, imageUrl, status |
| `/api/admin/news/[id]` | DELETE | Eliminar permanentemente |

## Modelo Prisma (kodexa_hotel · tabla `news`)

```prisma
model News {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(128)
  slug        String?   @unique @db.VarChar(256)      // nullable para migración segura
  excerpt     String    @default("") @db.VarChar(512)
  content     String    @db.Text
  imageUrl    String    @default("") @db.VarChar(256)  @map("image_url")
  status      String    @default("DRAFT") @db.VarChar(16)
  authorId    Int       @map("author_id")
  publishedAt DateTime? @map("published_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  author      User      @relation(fields: [authorId], references: [id])

  @@map("news")
}
```

## Estados de noticia

| Status | Visible en /community/news | Editable | Descripción |
|--------|---------------------------|----------|-------------|
| `DRAFT` | No | Sí | Borrador, no publicado |
| `PUBLISHED` | Sí | Sí | Visible al público |
| `ARCHIVED` | No | Sí | Retirado, conservado |

## Generación de slug

- Auto-generado desde `title` en creación
- Normalización: minúsculas, sin acentos, sin caracteres especiales, espacios → guiones
- Slug único: si ya existe `mi-noticia`, genera `mi-noticia-1`, `mi-noticia-2`, etc.
- Editable manualmente en el formulario
- Slug nullable en DB para compatibilidad con artículos sin slug (migración segura)

## publishedAt

- Se establece automáticamente al publicar (status → PUBLISHED) si no tenía fecha previa
- Se limpia al despublicar (status → DRAFT o ARCHIVED)
- Persiste si se vuelve a publicar (no resetea la fecha original)

## Permisos

| Acción | Requiere |
|--------|---------|
| Ver lista pública `/community/news` | Ninguno — público sin login |
| Ver detalle `/community/news/[slug]` | Ninguno — público sin login |
| Admin CRUD `/admin/news` | `canAccessAdmin(rank)` — rank >= 7 |
| API `/api/admin/news` | `canAccessAdmin(rank)` — rank >= 7 |

## Dependencias

### Depende de kodexa_hotel
- Tabla `news` (DB: `kodexa_hotel`)
- Tabla `users` — relación `authorId` → `users.id` (solo lectura del username)
- Prisma Client generado a partir de `apps/web/prisma/schema.prisma`

### NO depende de Arcturus
- No toca `arcturus_main`
- No toca `arcturus_dev`
- No usa tablas de Arcturus (rooms, items_base, catalog, permissions)
- No usa RCON

### NO depende de SSO ni emulador
- Las rutas públicas no requieren autenticación
- Las rutas admin usan NextAuth session (rank check via guards.ts)

## Migración requerida

```bash
# Ejecutar desde apps/web/
pnpm prisma migrate dev --name news-module-v2
```

**Cambios en DB:**
- ADD: `slug VARCHAR(256) UNIQUE NULL`
- ADD: `excerpt VARCHAR(512) NOT NULL DEFAULT ''`
- ADD: `status VARCHAR(16) NOT NULL DEFAULT 'DRAFT'`
- ADD: `published_at DATETIME NULL`
- ADD: `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- DROP: `published BOOLEAN` (reemplazado por status)
- ADD: `@@map("news")` — tabla renombrada a lowercase `news`

> **Nota:** Ejecutar en dev (kodexa_hotel). NO ejecutar en arcturus_main ni arcturus_dev.

## Archivos modificados / creados

```
apps/web/prisma/schema.prisma              → News model actualizado
apps/web/src/app/api/admin/news/route.ts   → POST con slug/excerpt/status, guard fix
apps/web/src/app/api/admin/news/[id]/route.ts → PUT/DELETE/GET, guard fix
apps/web/src/app/(dashboard)/admin/news/page.tsx        → Server component, list + links
apps/web/src/app/(dashboard)/admin/news/NewsAdminActions.tsx  → Client: delete/toggle
apps/web/src/app/(dashboard)/admin/news/NewsForm.tsx    → Client form compartido
apps/web/src/app/(dashboard)/admin/news/create/page.tsx → Crear noticia
apps/web/src/app/(dashboard)/admin/news/[id]/edit/page.tsx → Editar noticia
apps/web/src/app/(main)/community/news/page.tsx         → Actualizado a status='PUBLISHED'
apps/web/src/app/(main)/community/news/[slug]/page.tsx  → Nuevo detail por slug
apps/web/src/app/(main)/community/news/[id]/page.tsx    → ELIMINADO (reemplazado por slug)
apps/web/src/app/(main)/me/page.tsx                     → Fix: published→status
```

## Deuda técnica identificada (fuera de scope)

- Otros API routes admin (`/api/admin/rooms`, `/api/admin/users`, `/api/admin/stats`, etc.) aún usan `rank < 7` hardcodeado en lugar de `canAccessAdmin()`. Pendiente en MP-CMS-002E (limpieza de guards en todas las APIs admin).
- Slug nullable en DB: artículos sin slug no tienen URL pública accesible. Pendiente backfill al ejecutar migración.
- Contenido en texto plano: sin soporte markdown. Pendiente para fase CMS avanzada.
- Sin paginación en admin list: si hay muchas noticias, la lista crece sin límite.

## Próximos microprocesos

| MP | Objetivo |
|----|---------|
| **MP-CMS-002D** | Dashboard usuario `/me` — stats, badges, créditos, actividad reciente |
| **MP-CMS-002E** | Limpieza guards en todas las APIs admin (rank hardcodeado → canAccessAdmin) |
| **MP-CMS-003** | RCON service TypeScript (después de MP-011 Auth Bridge) |
