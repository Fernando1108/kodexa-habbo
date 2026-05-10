# MP-ATOM-AUDIT-001 — Inventario de Assets AtomCMS

> **Fecha:** 2026-05-10
> **Estado:** Completado — Solo documentación
> **Tipo:** Inventario de referencia

---

## Assets encontrados en AtomCMS

### Currencies (encontrados — los más críticos)

**Ruta base:** `external/cms/atomcms/public/assets/images/currencies/`

| Archivo | Tipo | Uso aparente | Estado Kodexa | Recomendación |
|---------|------|--------------|---------------|---------------|
| `credits.gif` | GIF animado | Icono de créditos en UI | ❌ No tenemos | Recrear como SVG o usar el .gif directamente |
| `duckets.png` | PNG | Icono de duckets | ❌ No tenemos | Recrear como SVG |
| `diamonds.png` | PNG | Icono de diamantes | ❌ No tenemos | Recrear como SVG |
| `points.png` | PNG | Icono de puntos/GOTW | ❌ No tenemos | Recrear como SVG |

**Nota crítica:** Sin estos 4 iconos no se puede mostrar currencies en UI del hotel. Son esenciales para MP-ATOM-002.

### Article images (encontrados — 500+)

**Ruta base:** `external/cms/atomcms/public/assets/images/articles/`

| Categoría | Cantidad approx | Uso | Estado Kodexa | Recomendación |
|-----------|----------------|-----|---------------|---------------|
| Eventos Habbo (Halloween, Navidad, etc.) | ~200 | Imágenes de portada en artículos | ❌ No tenemos | Usar como stock para noticias |
| Temporadas y colecciones | ~100 | Portadas artículos temáticos | ❌ No tenemos | Usar selectivamente |
| Promocionales genéricos | ~200 | Portadas artículos varios | ❌ No tenemos | Usar como placeholder |

**Nota:** Estas imágenes son de Habbo Official. Uso libre para hotel propio, no comercializar.

---

## Assets faltantes para Kodexa.Hotel

### Prioridad P0 — Bloqueantes para MVP

| Elemento | Existe en AtomCMS | Ruta AtomCMS | Tenemos en Kodexa | Necesitamos crear | Notas |
|---------|------------------|--------------|-------------------|-------------------|-------|
| Icono créditos | ✅ `credits.gif` | `/assets/images/currencies/credits.gif` | ❌ | ✅ Sí | SVG animado preferible |
| Icono duckets | ✅ `duckets.png` | `/assets/images/currencies/duckets.png` | ❌ | ✅ Sí | Pixel art moneda amarilla |
| Icono diamantes | ✅ `diamonds.png` | `/assets/images/currencies/diamonds.png` | ❌ | ✅ Sí | Diamante azul/cyan |
| Icono puntos | ✅ `points.png` | `/assets/images/currencies/points.png` | ❌ | ✅ Sí | Estrella dorada/GOTW |

### Prioridad P1 — Importantes para beta pública

| Elemento | Existe en AtomCMS | Tenemos en Kodexa | Necesitamos crear | Notas |
|---------|------------------|-------------------|-------------------|-------|
| Avatar placeholder | ❌ | ❌ | ✅ Sí | Habbo avatar genérico para perfiles sin avatar |
| Room placeholder | ❌ | ❌ | ✅ Sí | Imagen genérica para salas sin thumbnail |
| Badge placeholder | ❌ | ❌ | ✅ Sí | Badge genérico para badges sin imagen |
| Empty state — sin usuarios | ❌ | ❌ | ✅ Sí | Ilustración para tabla vacía de usuarios |
| Empty state — sin noticias | ❌ | ❌ | ✅ Sí | Ilustración para lista vacía de noticias |
| Empty state — sin salas | ❌ | ❌ | ✅ Sí | Ya existe como componente sin imagen |
| Logo Kodexa Hotel | ❌ | ⚠️ En progress | ✅ Sí | Para navbar, meta, favicon |
| Favicon | ❌ | ⚠️ Genérico | ✅ Sí | 16×16 + 32×32 + 180×180 |

### Prioridad P2 — Para módulos específicos

| Elemento | Existe en AtomCMS | Tenemos en Kodexa | Necesitamos crear | Notas |
|---------|------------------|-------------------|-------------------|-------|
| Icono rank 1-10 | ❌ | ❌ | ✅ Sí | Badges visuales por rango |
| Icono staff color | ❌ (solo color hex) | ❌ | ✅ Sí | Indicador visual rank staff |
| Icono "hotel_alert" | ❌ | ❌ | ✅ Sí | Para admin alerts |
| Icono "banned" | ❌ | ❌ | ✅ Sí | Para página de baneo |
| Icono "maintenance" | ❌ | ❌ | ✅ Sí | Para página de mantenimiento |
| Imágenes portada noticias | ✅ 500+ disponibles | ❌ Solo imageUrl field | ✅ Usar de AtomCMS como stock | Habbo-themed |
| Imágenes catálogo (furnis) | ❌ (generado por Nitro) | ⚠️ Nitro imager | No crear manualmente | Imager lo genera |
| Thumbnails salas | ❌ (screenshot Arcturus) | ❌ | ✅ Placeholder sí | Thumbnail real: Post-Arcturus |

### Prioridad P3 — Nice to have

| Elemento | Existe en AtomCMS | Tenemos en Kodexa | Necesitamos crear |
|---------|------------------|-------------------|-------------------|
| Imágenes de categorías de catálogo | ❌ | ❌ | Posiblemente |
| Ilustración de error 404 | ❌ | ❌ | Sí |
| Ilustración de error 500 | ❌ | ❌ | Sí |
| Ilustración de "mantenimiento" | ❌ | ❌ | Sí |
| Animaciones loading (Lottie) | ❌ | ❌ | Opcional |
| Imágenes para shop packages | ❌ | ❌ | Sí (cuando se implemente shop) |

---

## Prompts para crear assets faltantes

### Credits icon (SVG animado)

```
Create a small 24x24 pixel art icon representing credits/coins for a Habbo retro hotel.
Style: isometric pixel art, similar to Habbo Hotel's original credits coin.
Colors: Gold/yellow (#F59E0B) with lighter highlight (#FCD34D) and dark shadow (#92400E).
The coin should appear 3D with a "C" or coin symbol on the face.
Format: SVG with CSS animation for subtle rotation or glow pulse.
Background: transparent.
```

### Duckets icon

```
Create a small 24x24 pixel art icon representing duckets (secondary currency) for a Habbo retro hotel.
Style: pixel art, similar to Habbo Hotel's duck/bathtub rubber duck.
Colors: Yellow (#FDE68A) rubber duck with orange beak.
Format: PNG or SVG, transparent background.
```

### Diamonds icon

```
Create a small 24x24 pixel art icon representing diamonds (premium currency) for a Habbo retro hotel.
Style: pixel art gemstone.
Colors: Cyan/teal gradient (#67E8F9 to #0E7490) with bright highlight spark.
Shape: Classic diamond/rhombus shape.
Format: PNG or SVG, transparent background.
```

### Points icon (GOTW)

```
Create a small 24x24 pixel art icon representing "points" or GOTW points for a Habbo retro hotel.
Style: pixel art star/award.
Colors: Golden star (#F59E0B) with darker outline (#B45309).
Format: PNG or SVG, transparent background.
```

### Avatar placeholder

```
Create a neutral avatar placeholder for a Habbo-style hotel user profile.
Style: Simple pixel art Habbo character silhouette.
Colors: Gray tones (#94A3B8 to #475569) for the silhouette.
Size: 128x192 pixels (Habbo avatar proportions, portrait orientation).
Format: PNG, transparent or white background.
```

### Room thumbnail placeholder

```
Create a placeholder image for a Habbo-style hotel room thumbnail.
Style: Simple pixel art room outline with isometric perspective.
Colors: Dark blue/slate tones (#1E293B, #334155) for walls, subtle grid for floor.
Size: 320x240 pixels (4:3 ratio).
Format: PNG or WebP.
```

---

## Cómo obtener assets de currencies (opciones)

### Opción A — Usar directamente de AtomCMS (recomendada para dev)
```bash
# Copiar currencies de AtomCMS a Kodexa public/
cp external/cms/atomcms/public/assets/images/currencies/*.{gif,png} \
   apps/web/public/images/currencies/
```
**Ventaja:** Disponible inmediatamente, look and feel de Habbo auténtico.
**Riesgo:** Assets propietarios de Sulake — solo para uso en hotel propio.

### Opción B — Recrear como SVG propio
Diseñar desde cero siguiendo los prompts de arriba.
**Ventaja:** Assets propios, sin riesgo legal, formato SVG escalable.
**Tiempo estimado:** 2-4 horas por icon si se hace con Figma/Inkscape.

### Opción C — Usar Lucide icons como proxy temporal
Usar `Coins`, `Gem`, `Star`, `Award` de Lucide con colores temáticos como placeholder hasta tener assets reales.
**Ventaja:** 0 tiempo, funciona inmediatamente.
**Desventaja:** No tiene el look de Habbo, pero sirve para desarrollo.

**Recomendación:** Opción C para desarrollo → Opción A para beta → Opción B para producción/release.

---

## Plan de acción para assets

### Inmediato (ahora mismo)

```tsx
// En admin/users — currencies tab placeholder con Lucide:
import { Coins, Gem, Star, Award } from 'lucide-react';

const CURRENCY_ICONS = {
  credits:  { icon: Coins,  label: 'Créditos',  color: '#F59E0B' },
  duckets:  { icon: Award,  label: 'Duckets',   color: '#FDE68A' },
  diamonds: { icon: Gem,    label: 'Diamantes', color: '#67E8F9' },
  points:   { icon: Star,   label: 'Puntos',    color: '#F59E0B' },
};
```

### Corto plazo (MP-ATOM-002)

1. Copiar `credits.gif`, `duckets.png`, `diamonds.png`, `points.png` de AtomCMS
2. Colocar en `apps/web/public/images/currencies/`
3. Crear componente `<CurrencyIcon type="credits" size={24} />` que usa los archivos

### Medio plazo

1. Diseñar SVG propios o contratar pixel artist
2. Crear set de iconos de rangos (rank 1-10)
3. Crear avatar placeholder Habbo-style
4. Crear room placeholder

---

## Inventario completo resumido

### Tenemos en Kodexa ahora

| Asset | Estado | Ubicación |
|-------|--------|-----------|
| Nitro assets (.nitro) | ✅ | `/assets/nitro/` (3122 ítems) |
| Furni images (imager) | ✅ | Generado por tools/imager |
| Avatar renders | ✅ | Generado por tools/imager |
| CSS design tokens | ✅ | `globals.css` var(--admin-*) |
| Lucide icons (SVG) | ✅ | Via npm |

### Necesitamos crear/obtener

| Asset | Prioridad | Método sugerido | Bloqueante para |
|-------|-----------|-----------------|-----------------|
| Credits icon | P0 | Copiar AtomCMS / Lucide temporal | Admin currencies tab |
| Duckets icon | P0 | Copiar AtomCMS / Lucide temporal | Admin currencies tab |
| Diamonds icon | P0 | Copiar AtomCMS / Lucide temporal | Admin currencies tab |
| Points icon | P0 | Copiar AtomCMS / Lucide temporal | Admin currencies tab |
| Avatar placeholder | P1 | Pixel art simple | /me, /community/profiles |
| Room placeholder | P1 | Imagen genérica | Admin rooms, community |
| Badge placeholder | P1 | Badge silhouette | Admin badges |
| Logo Kodexa Hotel | P1 | Diseño | Navbar, favicon, meta |
| Rank badges 1-10 | P2 | Set de iconos | Admin permisos |
| Imágenes portada noticias | P2 | Usar stock AtomCMS | Admin news |
| Empty state illustrations | P2 | Ilustraciones simples | UX general |
| Error 404/500 | P3 | Ilustraciones | Páginas de error |
