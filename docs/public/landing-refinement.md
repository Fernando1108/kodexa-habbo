# Landing Refinement — MP-PUBLIC-002

> **Fecha:** 2026-05-10  
> **Estado:** Completado

---

## Objetivos

1. Corregir labels incorrectos en nav (desktop + mobile)
2. Conectar sección de noticias reales (Prisma, solo `PUBLISHED`, máx. 3)
3. Añadir `#news` anchor para navegación directa
4. Mejorar CTAs con copy más convincente

---

## Bugs corregidos

### BUG-LANDING-001 — Nav labels incorrectos

**Archivo:** `apps/web/src/components/LandingPage.tsx`

**Antes (incorrecto):**
```
Comunidad → /community/rankings   (correcto)
Noticias  → #stats                (WRONG — #stats es la sección de estadísticas)
Rankings  → #features             (WRONG — #features es la sección de features del hotel)
```

**Después (correcto):**
```
Inicio    → #hero
El Hotel  → #features             (sección con features del juego)
Noticias  → #news                 (sección de noticias reales)
Comunidad → /community/rankings
```

Fix aplicado en nav **desktop** (líneas ~146-149) y nav **mobile** (líneas ~172-175).

---

## Sección de Noticias (`#news`)

### Origen de datos

`apps/web/src/app/page.tsx` — Server Component que hace fetch antes de renderizar:

```typescript
prisma.news.findMany({
  where:   { status: 'PUBLISHED' },
  orderBy: { publishedAt: 'desc' },
  take:    3,
  select:  { id, slug, title, excerpt, imageUrl, publishedAt, createdAt },
})
```

- Solo noticias `PUBLISHED`
- Ordenadas por `publishedAt DESC` (más recientes primero)
- Máximo 3
- Mapeadas a `LandingNewsItem[]` serializable (fechas como `.toISOString()`)

### Tipos añadidos (`LandingPage.tsx`)

```typescript
export interface LandingNewsItem {
  id:       number;
  slug:     string | null;
  title:    string;
  excerpt:  string;
  imageUrl: string;
  date:     string;  // ISO string
}
```

`LandingStats` extendida con `latestNews: LandingNewsItem[]`.

### Helper

```typescript
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
```

### Links de noticias

```typescript
const href = n.slug ? `/community/news/${n.slug}` : '/community/news';
```

Slug null → fallback a `/community/news` (listing). Nunca enlace roto.

### Diseño de la sección

- Grid `md:grid-cols-3`, 1 col en mobile
- Cada card: imagen con hover-scale + overlay gradiente, fecha, título, excerpt, link "Leer más →"
- Hover: border `primary/40` + `-translate-y-1`
- Estado vacío: `<Newspaper>` icon + mensaje "Próximas noticias en camino"
- "Ver todas" → `/community/news` (desktop top-right + mobile bottom)
- Animación: `reveal` class con `data-delay="2"`

---

## Archivos revisados (solo lectura)

| Archivo | Razón |
|---------|-------|
| `apps/web/src/components/LandingPage.tsx` | Auditar nav labels y estructura existente |
| `apps/web/src/app/page.tsx` | Ver qué props pasaba al componente |
| `apps/web/src/app/globals.css` | Verificar clases `.reveal`, `.eyebrow`, `.text-gradient` disponibles |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/components/LandingPage.tsx` | Fix nav labels (desktop+mobile), añadir tipos `LandingNewsItem`/`LandingStats`, añadir `formatDate`, añadir sección `#news` |
| `apps/web/src/app/page.tsx` | Añadir query `prisma.news.findMany` + prop `latestNews` a `<LandingPage>` |

## Archivos creados

| Archivo | Razón |
|---------|-------|
| `docs/public/landing-refinement.md` | Este documento |

---

## Validaciones

| Validación | Resultado |
|------------|-----------|
| TypeCheck `tsc --noEmit` | ✅ 0 errores |
| `/home` no creado | ✅ Confirmado (no existe) |
| Auth pages no tocadas (`/login`, `/register`, `/forgot-password`) | ✅ Solo links CTA públicos hacia ellas |
| News solo `PUBLISHED` | ✅ `where: { status: 'PUBLISHED' }` en query |
| Links de noticias usan slug | ✅ `n.slug ? /community/news/${n.slug} : '/community/news'` |
| Nav desktop + mobile corregidos | ✅ Mismos labels en ambos |
| `/admin`, `/me`, `/hotel`, `/desarrollo`, `/hotel-beta` no modificados | ✅ Confirmado |
| Middleware no modificado | ✅ Confirmado |
| Prisma schema no modificado | ✅ Confirmado |

---

## Bugs pendientes (no corregidos en este MP)

| ID | Descripción | Dónde corregir |
|----|-------------|---------------|
| **BUG-LOGIN-002** | Discord login button sin `onClick` handler | MP-AUTH-001b / cuando se configure Discord OAuth |
| **BUG-LOGIN-003** | "Recordarme" checkbox sin efecto en JWT | Requiere `maxAge` dinámico en NextAuth config |
| **BUG-REGISTER-001** | IP de registro no guardada | MP-AUTH-004 (junto con Arcturus bridge) |
| **BUG-REGISTER-002** | `home_room` no asignado al registrar | MP-AUTH-004 |

---

## Próximo microproceso sugerido

**MP-PUBLIC-003 — Perfil público `/community/profiles/[username]`**
- Página pública con avatar, stats, badges, salas del usuario
- Sin tocar auth ni admin
- Requiere que `/me` esté completo (ya lo está tras MP-CMS-002D)
