# MP-017 — Catalog Runtime QA en Dev

## Objetivo

Auditar el comportamiento real del catálogo y furnis en `/hotel-dev` para clasificar:
- qué carga/renderiza bien
- qué compra bien
- qué falla visualmente y por qué
- qué categorías deben quedar públicas
- qué requiere FurnitureData fix o asset pipeline
- qué debe moverse a Desarrollo/Pendientes

Este MP es estático: auditoría vía DB + filesystem cross-reference. Browser QA en MP-017B.

---

## Entorno usado

| Componente | Detalle |
|-----------|---------|
| DB | arcturus_dev (ARCTURUS_DEV_DB_URL) |
| Nitro | kodexa-nitro-dev :8082 |
| WS | Arcturus Dev :2097 |
| Assets | assets/nitro/furniture/ |
| FurnitureData | assets/nitro/furniture/json/FurnitureData.json |

---

## Usuario usado

`admin` (rank 10) — identificado por sesión NextAuth, accede via `/hotel-dev` + `/api/dev/sso`.

---

## Sala Dev creada

**room_id:** 57  
**name:** Kodexa Catalog QA Lab  
**model:** model_c  
**owner_id:** 1 (Systemaccount)  
**DB:** arcturus_dev ONLY — NOT en arcturus_main  

SQL ejecutado:
```sql
INSERT INTO arcturus_dev.rooms
  (owner_id, owner_name, name, description, model, state, users_max, category)
VALUES
  (1, 'Systemaccount', 'Kodexa Catalog QA Lab',
   'Sala de pruebas QA para auditar furnis, compras, placement y render. MP-017.',
   'model_c', 'open', 50, 1);
-- Result: room_id = 57
```

---

## Metodología de auditoría

### Fase 1 — Inventario de assets

| Asset | Conteo |
|-------|--------|
| .nitro files en disk | 30,517 |
| icon PNGs en disk | 16,657 |
| FurnitureData.json entries | 14,393 |

### Fase 2 — Inventario de catálogo

| Métrica | Conteo |
|--------|--------|
| catalog_pages total | 1,358 |
| catalog_items total | 35,574 |
| items_base total | 36,269 |
| items activos (excl. Desarrollo/Pendientes) | 21,083 únicos |
| items en Desarrollo/Pendientes (page 9965236) | 7,657 |

### Fase 3 — Cross-reference

Para cada item_name en catálogo activo:
1. Check FurnitureData.json (por classname, lowercase, sin sufijo `*N`)
2. Check `furniture/nitro/{item_name}.nitro` existe en disk
3. Check `furniture/icons/{item_name}_icon.png` existe en disk
4. Clasificar status según combinación

### Clasificación de render status

| Condición | Status | Comportamiento en Nitro |
|----------|--------|------------------------|
| FD + .nitro + icon | ok | Renderiza correctamente |
| FD + .nitro, sin icon | ok_no_icon | Renderiza 3D, icono gris en catálogo |
| .nitro sin FD | placeholder | Caja gris (Nitro desconoce dimensiones/tipo) |
| Sin FD, sin .nitro | broken | No renderiza — 404 en red |

---

## Categorías auditadas

Todas las páginas de catalog_pages excepto page_id=9965236 (Desarrollo/Pendientes):
- Classic (parent_id=2): Japan, Gothic, Glass, Scifi, Habbowood, School, etc.
- Creators (parent_id=5): Custom A-M/N-Z, Seasonal, Cultural, Pop Culture, Builders Club, etc.
- Rares (parent_id=15): Casino Rares, Featured Rares, Rainbow Plasto, etc.
- Badges (parent_id=25): Pop Culture, Collectors, Animals, Duckies, etc.
- Staff (parent_id=7): Classic Rares, Limited Edition, Broken/Unused, etc.
- Otros: Exchange, Pets, Bots, Trax, Marketplace, Wired Society, etc.

---

## Resultados

### Por status de render

| Status | Items | % | Acción |
|--------|-------|---|--------|
| ok | 9,123 | 43.3% | keep_public |
| placeholder | 11,909 | 56.5% | needs_furnituredata_fix |
| ok_no_icon | 38 | 0.18% | needs_icon_generation |
| broken | 13 | 0.06% | needs_runtime_investigation |
| **TOTAL** | **21,083** | | |

### Por cobertura de páginas

| Cobertura | Páginas | Acción |
|----------|---------|--------|
| 100% OK | 363 | keep_public |
| 0% OK (todo placeholder) | 424 | move_to_dev_pending (pending FD fix) |
| Mixto (>0% y <100%) | 153 | review por item |

---

## Causa raíz del problema histórico

**FurnitureData.json solo tiene 14,393 entradas, pero el catálogo tiene 29,825 item_names únicos.**

Los retro packs de objectretros/myBoBBa importan furniture con:
- .nitro en disk ✅
- items_base en DB ✅
- FurnitureData.json ❌ (no incluido en el pack base)

Sin FurnitureData, Nitro no sabe:
- dimensiones del mueble (width, length, stackHeight)
- si es silla/cama/stacker
- nombre público y descripción
- furniline / categoria
- Resultado visual: caja gris en sala, sin icono en catálogo

**Esto NO es fallo de assets .nitro.** Los archivos existen. El pipeline de FurnitureData es el bottleneck.

---

## Items completamente rotos (13)

Items sin FurnitureData Y sin .nitro:

| item_name | Causa | Página actual |
|-----------|-------|---------------|
| a0 pet20 (Bunny Manic) | Assets de pet faltantes | Pets |
| a0 pet21 (Pigeon Wise) | Assets de pet faltantes | Pets |
| a0 pet22 (Pigeon Cunning) | Assets de pet faltantes | Pets |
| a0 pet23 (Monkey Evil) | Assets de pet faltantes | Pets |
| a0 pet25 (Terrier Puppies) | Assets de pet faltantes | Pets |
| Black Dino Egg | ID mismatch, nombre con espacio | Limited Edition |
| black_iwall | Textura de pared custom | Modifications |
| black_swall | Textura de pared custom | Modifications |
| black_corner | Textura de esquina custom | Modifications |
| grunge_wall | Sin assets | Broken/Unused (correcto) |
| Rainbow_fountain | Sin assets | Broken/Unused (correcto) |
| wf_act_givexp | Wired sin implementar | Unused Wired (correcto) |
| black11_ladyyy | Coincidencia de prefijo | Easter |

Nota: pets pueden renderizar vía `pet.asset.url` pipeline — validar en browser (MP-017B).

---

## Items sin icono (38)

Tienen FurnitureData + .nitro pero sin icon PNG.
Renderizarán en sala pero el icono del catálogo será gris.
Ver: `docs/arcturus/reports/catalog-runtime-qa-dev/needs-icon-generation.csv`

---

## Qué debe quedar público

363 páginas con 100% de items funcionando. Líneas clásicas de Habbo original:
- Japan, Gothic, Glass, Scifi, Wild Wild West, Rainy Day, Asian, University, Jungle, etc.
- Music (79 items), Artwork (76), School (76), Habbowood (80)
- Spaces (274 items — BC)
- Banzai (35), Neon (34), Pet Food (33), Lodge (20), Alhambra (16)
- Wired Society (mayoría OK)
- Classic Rares, Featured Rares, Casino Rares (items con FD)
- Badges (todas las subpáginas de badges están OK)
- Exchange (Credits, Diamonds, Duckets)

---

## Qué debe moverse a Desarrollo/Pendientes

424 páginas con 0% de items OK. Ejemplos críticos:
- **Pokemon** (1,605 items) — sin FurnitureData para ninguno
- **Classic Letters** (364 items)
- **Builders Club shapes** (14 páginas × 69 items = 966 items) — Cone, Cylinder, Sphere, etc.
- **Wall Decorations** (86 items)
- **Anna** (50 items), **Yummy** (51)
- **Japandi, Pink Sakura, Bento, Circus** y muchas líneas custom de la comunidad

Acción recomendada: `UPDATE catalog_pages SET visible=0 WHERE id IN (...)` en arcturus_dev primero, validar, luego main.

---

## Qué requiere Furniture Imager / Asset Pipeline

### FurnitureData expansion (P2 — mayor impacto)
- 11,909 items con .nitro pero sin FurnitureData
- Necesitan entrada en FurnitureData.json con: classname, id, revision, name, desc, dims, etc.
- Tool: furniture imager o script de generación desde .nitro manifests + items_base
- MP recomendado: MP-018

### Icon generation (P3)
- 38 items con FurnitureData + .nitro pero sin icono
- Herramienta: furniture imager (render icon desde .nitro)
- Lista en: `needs-icon-generation.csv`

### Asset pipeline completo (P4)
- 13 items sin .nitro — requieren conversión SWF → .nitro o descarga desde CDN oficial
- Pets: validar pipeline `pet.asset.url` antes de clasificar como roto

---

## Validación de separación main/dev

| Check | Estado |
|-------|--------|
| arcturus_main.items antes: 338, después: 338 | ✅ |
| arcturus_dev.items antes: 0, después: 0 | ✅ (no compras realizadas) |
| arcturus_main.users: 3 sin cambios | ✅ |
| arcturus_dev.users: 1 (Systemaccount) sin cambios | ✅ |
| arcturus_main.rooms: 8 sin cambios | ✅ |
| arcturus_dev.rooms: 7 → 8 (+QA Lab) | ✅ solo en dev |
| auth_ticket main: kodexa_1_a33902de... sin cambios | ✅ |
| /hotel principal: sin cambios de código | ✅ |
| /api/sso principal: sin cambios | ✅ |
| /api/hotel/wallet: sin cambios | ✅ |
| TypeScript: sin cambios de código | ✅ |
| external/: no en Git | ✅ |

---

## Archivos de reporte

```
docs/arcturus/reports/catalog-runtime-qa-dev/
├── summary.md                     ← Este resumen ejecutivo
├── tested-items.csv               ← Todos los items analizados (21,083 rows)
├── keep-public.csv                ← Items OK (9,123)
├── broken-items.csv               ← Placeholder + broken (11,922)
├── needs-furnituredata-fix.csv    ← Solo placeholder (11,909) — prioridad MP-018
├── needs-icon-generation.csv      ← OK sin icon (38)
├── needs-runtime-investigation.csv ← Broken total (13)
└── move-to-dev-pending.csv        ← Items en páginas 0%-OK (8,880 items)
```

---

## Limitaciones

1. Auditoría estática — no se probó compra/placement/render real en browser
2. Cross-reference por classname — puede haber false-mismatches en nombres con caracteres especiales
3. Icon check por convención de nombre — sufijos no estándar pueden producir falsos negativos
4. Pet assets — clasificados como broken pero pueden funcionar vía pet pipeline; requiere browser QA
5. Builders Club — puede necesitar FurnitureData pack específico de BC, no furniture imager estándar

---

## Próximo MP recomendado

**MP-018 — FurnitureData Expansion + Catalog Cleanup (mayor impacto):**
- Generar FurnitureData.json entries para 11,909 items placeholder
- Script: leer items_base + manifest de .nitro → generar JSON entries
- Generar 38 iconos faltantes con furniture imager
- Batch UPDATE: visible=0 en arcturus_dev para 424 páginas sin cobertura
- Validar en /hotel-dev → luego replicar en arcturus_main

**MP-017B — Manual Purchase/Placement QA (browser, posterior a MP-018):**
- Probar 1 compra por categoría OK en /hotel-dev
- Confirmar insert en arcturus_dev.items, no en arcturus_main.items
- Probar placement en sala 57 (Kodexa Catalog QA Lab)
- Documentar render visual real por línea
