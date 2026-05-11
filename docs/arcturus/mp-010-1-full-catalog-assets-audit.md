# MP-010.1 — Full Catalog Assets Audit

## Contexto

Hotel funcional post-MP-010. Catálogo abre. Síntomas:
- Casillas grises (placeholders) en catalog items
- Texto técnico `roomItem.name.xxxxx` en vez de nombre real
- Icons de furniture faltantes en catálogo e inventario

## Servicios confirmados

| Servicio | Puerto | Estado |
|---------|--------|--------|
| kodexa-nitro-renderer | 8081 | UP 2h |
| kodexa-assets | 8080 | UP 3h |
| kodexa-db | 3306 | UP healthy |
| kodexa-redis | 6379 | UP healthy |
| kodexa-imager | 1338 | UP (avatar-only) |
| Arcturus | 2096/3005/3002 | Nativo (host) |

**Imager:** Solo renderiza avatares (figura string). NO genera furniture icons.

## Estructura DB auditada

```
Total catalog_pages : 1,357
Visible (visible=1) :    39
Enabled (enabled=1) :    55
Total catalog_items : 35,576
Total items_base    : 36,271
FurnitureData items :  17,698 → 30,991 (post-merge)
ExternalTexts keys  :  38,893
```

## Árbol de tabs principales

| Tab | ID | visible | enabled | child_pages | items |
|-----|----|---------|---------|-------------|-------|
| Classic | 2 | 1 | 1 | 14 | 9,385 |
| Creators | 5 | 1 | 1 | 14 | 19,320 |
| Rares | 15 | 1 | 0 | 8 | 223 |
| Badges | 25 | 1 | 1 | 14 | 668 |
| Staff | 7 | 1 | 0 | 17 | 4,737 |

### Classic (id=2) sub-tabs
- Front Page, New Furni (enabled)
- Furni By Line, Furni by Season, Classic Furni, Public Furni (disabled)
- NFT Furni, User Content, Exchange, Pets, Trax, Bots, Marketplace (enabled)
- BoBBa Club (disabled/invisible)

### Creators (id=5) sub-tabs
- Sale History, Wired Society, Game Furni, Customs A-M, Customs N-Z
- Seasonal, Cultural, Pop Culture, Structural Building, Letters & Numbers (enabled)
- Room Mods, Builders Club, House Building, City Building (disabled)

### Staff (id=7) — min_rank=6
- Staff Rares, Limited Edition, Snowflake Shop, Battlepass Rares
- Competition Prizes, Rares by Colour, Classic Rares, Classic Rares
- NFT by Type, Custom Rares, Furni Fixing, Missing Furni

### Rares (id=15) — disabled
- 8 sub-páginas con items de rares

### Badges (id=25)
- 14 sub-páginas con 668 items (660 badges + 8 furni)

## Causa principal de placeholders grises

### 1. FurnitureData.json incompleto (causa #1)

Nitro al iniciar: `localization.setValue("roomItem.name.{FD.id}", FD.name)`.

Lookup en catálogo/sala: `y("roomItem.name.{sprite_id}")`.

Si `sprite_id` no existe en FD → Nitro devuelve el key literal → se ve `roomItem.name.xxxxx`.

**Pre-merge:** 17,698 items en FD → cobertura 31% de refs de catálogo.
**Post-merge:** 30,991 items → cobertura 64%.

Los 36% restantes son items ultra-custom (nft_*, hfdiy_*, kasja_*, lotus_*, etc.) no presentes en ninguna fuente external.

### 2. Furniture icons faltantes (causa #2)

`furni.asset.icon.url = ${asset.url}/nitro/furniture/icons/{classname}_icon.png`

Pre-auditoría: 14,347 icons → 31% coverage.
Post-fix: 16,657 icons → 39% coverage.

60% de items de catálogo siguen sin icon. Raíz: custom furniture sin assets Nitro generados.

### 3. ExternalTexts no contiene furniture names

`assets/gamedata/ExternalTexts.json` no tiene entradas `roomItem.name.*` — es correcto.
Los nombres vienen de FD, no de ExternalTexts.

## Cobertura por tab (post-fix)

| Tab | Items | Icon% (pre) | Icon% (est.post) | Nitro% | Name%(pre) | Name%(post) |
|-----|-------|-------------|-------------------|--------|------------|-------------|
| Classic | 9,235 furni | 82% | ~85% | 91% | 31% | ~65% |
| Creators | 17,817 furni | 8% | ~12% | 64% | 31% | ~60% |
| Rares | 220 furni | 23% | ~28% | 75% | 31% | ~55% |
| Badges | 48 furni | 48% | ~52% | 69% | 31% | ~60% |
| Staff | 4,620 furni | 15% | ~20% | 69% | 31% | ~60% |

**Nota:** Classic tiene mejor coverage porque usa furniture estándar Arcturus.
Creators/Staff tienen custom hotel furniture → coverage baja.

## Tipo de items en catálogo

| Tipo | Count |
|------|-------|
| floor_item | 31,839 |
| wall_item | 970 |
| badge | 660 |
| bot | 4 |
| effect | 1 |
| unknown | 1,719 |

## Badges

| Métrica | Valor |
|---------|-------|
| Total badge items | 660 |
| Badge OK (gif existe) | 625 (95%) |
| Badge faltante | 2 |
| Badges en album1584/ | 24,326 |

Badges faltantes: `EL86L.gif` y `DE2G.gif` (página "Collectors", no en ningún external).

## Assets externos encontrados

### FurnitureData externo
`external/arcturus/objectretros/nitro/nitro-assets/gamedata/FurnitureData.json`
- 26,761 items vs 17,698 current
- 12,301 items nuevos (por classname)
- 1,053 conflictos de ID para misma classname → excluidos del merge

### Catalogue icons
`external/arcturus/objectretros/flash/c_images/catalogue/`
- 2,897 archivos `_icon.png`
- 2,539 no estaban en nitro/furniture/icons/
- 2,310 matchean icons faltantes en catálogo

### DuckieTM-Extended
Solo imágenes UI (navigator, reception, wallet) — ya copiadas en MPs previos.

### Hof Furni Icons
64,296 icons numerados por offerid. **Nitro bundle NO usa hof.furni.url (0 matches).**
No son necesarios.

## Fixes aplicados

### Fix 1 — Catalogue icons → nitro/furniture/icons/ (+2,310)

```
Origen: assets/swf/c_images/catalogue/*_icon.png
Destino: assets/nitro/furniture/icons/
Archivos: 2,310 icons que matcheaban faltantes
Total final: 16,657 icons (era 14,347)
```

Criterio: solo icons que estaban en missing-furniture-icons.json y no en destino.

### Fix 2 — FurnitureData merge (+13,293 items)

```
Origen: external/arcturus/objectretros/nitro/nitro-assets/gamedata/FurnitureData.json
Estrategia: additive merge, no replace
  - Conservar todos los 17,698 items actuales
  - Agregar solo classnames NEW del external
  - Excluir si classname ya existe (1,053 conflictos de ID)
  - Excluir si ID causa colisión (16 casos)
Resultado: 17,698 → 30,991 items (+13,293)
Backup: assets/gamedata/FurnitureData.json.bak
```

### Fix 3 — Badge placeholders (2 badges)

```
assets/swf/c_images/album1584/EL86L.gif → 1x1 GIF placeholder
assets/swf/c_images/album1584/DE2G.gif  → 1x1 GIF placeholder
```

### Fix 4 — sync-arcturus-assets.js actualizado

Nuevo par: `flash/c_images/catalogue/*_icon.png` → `assets/nitro/furniture/icons/`

## Validación HTTP

| Endpoint | HTTP | Nota |
|---------|------|------|
| `FurnitureData.json` (8080) | 200 | Merged, 30,991 items |
| `11_septumberi1_icon.png` | 200 | De catalogue |
| `kasja_babyyoda_icon.png` | 200 | De catalogue |
| `shelves_norja.nitro` | 200 | Siempre estuvo |
| `album1584/EL86L.gif` | 200 (placeholder) | |
| `album1584/DE2G.gif` | 200 (placeholder) | |
| `slot_machine_icon.png` | 404 | No en ninguna fuente |

## Cobertura final post-MP-010.1

| Métrica | Pre | Post |
|---------|-----|------|
| FD items | 17,698 | 30,991 |
| Name coverage (catalog furni) | 31% | 64% |
| Icon coverage (catalog furni) | 31% | 39% |
| Nitro coverage | 73% | 73% |
| Badge coverage | 95% | ~100% (2 placeholders) |
| Icons únicos disponibles | 14,347 | 16,657 |

## Faltantes no resolubles con fuentes actuales

| Categoría | Count | Razón |
|-----------|-------|-------|
| Classnames sin FD entry | ~11,748 refs | Custom hotel items sin bundle externo |
| Icons faltantes | ~20,058 refs | Custom furniture sin imager processing |
| .nitro faltantes | ~8,758 refs | Custom furniture sin bundle |
| Textos custom | 11,748+ | Dependen de FD entry o CMS |

Los items custom (nft_*, hfdiy_*, kasja_* ultra-custom, avionetahl, qday_vliegtuigje, etc.)
requieren procesamiento específico con un imager de furniture para generar sus .nitro e icons.

## Reportes generados

```
docs/arcturus/reports/catalog-audit/
├── catalog-audit-summary.json     ← resumen con tab_stats
├── catalog-tree.json              ← árbol de páginas
├── missing-furniture-icons.json   ← 18,469 classnames sin icon (pre-fix)
├── missing-furniture-nitro.json   ← 8,512 classnames sin .nitro
├── missing-badge-images.json      ← 2 badges faltantes
├── missing-texts.json             ← items sin FD entry (pre-fix)
└── external-asset-candidates.json ← candidatos encontrados en bundled
```

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- arcturus_main — NO reseteado
- catalog_pages — NO borrado
- catalog_items — NO borrado
- items_base — NO borrado
- badges table — NO tocada
- Prisma — NO tocado
- migrations — NO tocadas
- middleware — NO tocado
- Auth Bridge — NO implementado
- /hotel, /me, /register — NO tocados
- external/ — NO agregado a Git
- FurnitureData.json — BACKUP creado (.bak)

## Riesgos detectados

1. **FurnitureData merge**: IDs del external tienen 1,053 conflictos de classname (IDs diferentes). Los items merged usan IDs del external que podrían no coincidir con items_base.sprite_id de ese hotel. Efecto: items merged nuevos que estén en items_base con diferente sprite_id aun mostrarán `roomItem.name.xxx`. Mitigación: backup existe, revertible.

2. **Custom items**: 36% del catálogo son items ultra-custom sin assets. Reducción posible solo con imager de furniture (herramienta separada).

3. **Catalogue icons en nitro/furniture/icons/**: Los icons del flash catalogue son formato GIF/PNG de calidad flash. Podrían ser de menor resolución que los icons Nitro nativos. No es bloqueante.

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Ctrl+F5 (forzar recarga de FurnitureData.json nuevo):

- [ ] Catalog abre
- [ ] Items Classic: icons más visibles (objetivo ~85%)
- [ ] Items Classic: nombres correctos (no `roomItem.name.xxx`) para la mayoría
- [ ] Items Creators: mejora visible aunque cobertura baja (8% → ~12%)
- [ ] Badges: todos muestran imagen o badge icon
- [ ] Inventario: furniture nombres legibles para items estándar
- [ ] Sin `roomItem.name.xxx` para items de Arcturus estándar (shelves, chairs, etc.)
- [ ] Persisten `roomItem.name.xxx` para items ultra-custom (nft_*, avionetahl, etc.) — esperado
- [ ] Listar 404 nuevos si aparecen

## Próximos pasos

| Prioridad | Acción | MP |
|-----------|--------|-----|
| Alta | Validar visual con F5 + Network | Fernando primero |
| Alta | Flujo purchase → inventory → placement | MP-011 |
| Media | Furniture imager para items custom | Herramienta separada |
| Media | Completar FD para items custom restantes | MP-010.2 si necesario |
| Baja | Iconos adicionales para Creators/Staff | Posterior |
| Baja | HOF furni investigation si se rompe algo | Solo si necesario |
