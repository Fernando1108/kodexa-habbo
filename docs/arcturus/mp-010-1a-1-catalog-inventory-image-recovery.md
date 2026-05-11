# MP-010.1A.1 — Recuperación de Imágenes del Catálogo e Inventario

## Problema inicial

Post-MP-010.1A, el catálogo mostraba:
- Grilla con placeholders grises (icon coverage 39%)
- Previews de producto vacíos (.nitro faltante para 27% de items)
- Nombres técnicos como `habbox_sabugueiro_004_name`, `gothic_chair: ''`
- Items visibles sin assets a pesar de MP anteriores

## Contexto de capturas

Las capturas mostraron:
- **Grilla Classic/Creators**: mayoría de celdas grises — falta `_icon.png` en ~61% de items
- **Preview izquierdo**: vacío para items sin `.nitro` bundle
- **Nombres**: aún quedaban FD items con name='' o name='*_name' — corregidos en este MP
- **Icons OK**: Classic furniture estándar (gothic_*, shelves_*, etc.) renderizaban correctamente por tener icons

## Análisis de causas

| Causa | Items afectados | Solucionable |
|-------|----------------|--------------|
| FD.name = '' o '_name' | 133 items | **Sí** — patch FD |
| Sin `_icon.png` | 20,058 classnames | **No** — sin imager |
| Sin `.nitro` bundle | 8,758 classnames | **No** — sin fuente externa |
| Sin nombre (no FD, no ET) | 0 (resuelto en 010.1A) | Completo |

### ¿Por qué icons siguen en 39%?

Los 61% restantes son **custom hotel furniture** — items de Creators/Staff/Rares creados específicamente para este hotel con classnames como `nft_*`, `hfdiy_*`, `kasja_*`, `habbox_*`, `lotus_*`. No existen en ninguna fuente externa conocida.

Para generarlos se necesita un **furniture imager** (herramienta que renderiza .nitro → PNG). Ninguna herramienta disponible en el proyecto tiene esta capacidad:
- `tools/imager` → avatar-only (figuras de personajes)
- `kodexa-imager` (puerto 1338) → avatar-only
- `external/arcturus/nitro-docker/imager` → avatar-only (mismo README)

## Cobertura antes vs después

| Métrica | Pre-MP010 | MP-010.1 | MP-010.1A | **MP-010.1A.1** |
|---------|-----------|----------|-----------|-----------------|
| Names % | 31% | 64% | 92% | **100%** |
| Icons % | 31% | 39% | 39% | **39%** (sin cambio) |
| Nitro % | 73% | 73% | 73% | **73%** (sin cambio) |
| FD items | 17,698 | 30,991 | 30,991 | **30,991** |
| FD name fixes | — | — | — | **+133** |

### Cobertura P0 (catálogo público visible+enabled)

| Métrica | Valor |
|---------|-------|
| Total furni refs P0 | 30,294 |
| Icon P0 | 39% |
| Nitro P0 | 74% |
| Name P0 | **100%** |

## Cambios aplicados

### Fix 1 — FD name patch (+133 items)

**Archivo:** `assets/gamedata/FurnitureData.json`
**Backup:** `FurnitureData.json.bak` (del MP-010.1 — conservado)

Items con `name = ''` o `name.endsWith('_name')` en FurnitureData — corregidos con:
1. **ProductData.name** si disponible y limpio (ej: `sound_machine*1` → "Gray Traxmachine")
2. **items_base.public_name** si limpio
3. **Humanización de classname** como fallback (ej: `gothic_chair` → "Gothic Chair")

Ejemplos:
```
gothic_chair: '' → 'Gothic Chair'
gothic_sofa:  '' → 'Gothic Sofa'
sound_machine*1: '' → 'Gray Traxmachine'
sound_machine*3: '' → 'Gray Traxmachine'
ads_malaco_rug: 'ads_malaco_rug_name' → 'Ads Malaco Rug'
```

Script: `C:\tmp\remediation_1a1.py`

### Fix 2 — Búsqueda exhaustiva de icons adicionales

Revisados directorios no explorados en MPs anteriores:
- `external/.../catalogue/pngs/` → 33 archivos marketing, no furniture icons
- `external/.../flash/c_images/album1584/` → badge icons numerados (NT253, FI164), no furniture
- `external/.../flash/c_images/guilds/` → UI icons (group_base_icon, etc.), no furniture
- `external/.../catalogue/feature_cata/` → 386 imágenes marketing
- `external/.../dcr/hof_furni/icons/` → 64,296 icons numerados por offerid, NO mappeable a classnames

**Resultado: 0 icons adicionales encontrados.** Todas las fuentes externas agotadas.

## Rutas Nitro confirmadas

```
renderer-config.local.json:
  asset.url              = http://localhost:8080/assets
  furnidata.url          = ${asset.url}/gamedata/FurnitureData.json
  external.texts.url     = ${asset.url}/gamedata/ExternalTexts.json
  furni.asset.url        = ${asset.url}/nitro/furniture/nitro/%libname%.nitro
  furni.asset.icon.url   = ${asset.url}/nitro/furniture/icons/%libname%%param%_icon.png
```

Variante `*N` (color param): `table_plasto_4leg*1` → icon = `table_plasto_4leg_icon.png` (base sin `*N`). El `%param%` es vacío para la mayoría, `*1`, `*2`, etc. para variantes. El archivo físico esperado es siempre `{base}_icon.png`.

## Items con issues (priority list)

**Archivo:** `docs/arcturus/reports/catalog-audit/visible-catalog-image-priority.json`

```
Total records (visible pages con items faltantes): 19,552
P0 (visible+enabled+rank≤10):                     18,443
P1 (visible o enabled):                            1,109
```

## Clasificación de items no recuperables

**Archivo:** `docs/arcturus/reports/catalog-audit/catalog-items-to-hide-or-move-to-development.json`

| Clasificación | Count | Problema | Recomendación |
|--------------|-------|---------|---------------|
| A: missing-icon-only | 7,576 | Tiene .nitro pero no icon | Mantener visible con placeholder (funcional en sala) |
| B: missing-nitro | 8,321 | Sin .nitro bundle | **Ocultar temporalmente** (no puede renderizar en sala) |
| E: custom-no-source | incluido en B/A | Assets custom sin fuente | Ver A o B según caso |

**Total a ocultar temporalmente: 8,321 classnames únicos**
**Total mantener con placeholder: 7,576 classnames únicos** (tienen .nitro pero no icon)

> **IMPORTANTE**: En este MP NO se oculta ni mueve ningún item.
> Esta lista es la entrada para **MP-010.1A.2** (paso de ocultamiento/movimiento).

## Reportes generados

```
docs/arcturus/reports/catalog-audit/
├── visible-catalog-image-priority.json   ← 19,552 items con issues por tab/page
├── visible-image-recovery-summary.json   ← cobertura antes/después con P0 split
├── fd-name-fixes.json                    ← 133 FD names corregidos
├── copied-visible-icons-report.json      ← 0 icons (todas fuentes agotadas)
├── generated-visible-icons-report.json   ← generación imposible (no imager)
├── icon-generation-failures.json         ← razón + sample de 50 classnames
├── copied-visible-nitro-report.json      ← 0 nitro (todas fuentes agotadas)
├── unresolved-visible-nitro-report.json  ← count de nitros no resolubles
├── visible-text-fallbacks-added.json     ← 133 FD fixes + 0 ET fixes
├── visible-texts-unresolved.json         ← 0 items sin nombre (100% cubierto)
└── catalog-items-to-hide-or-move-to-development.json ← 15,897 classnames clasificados
```

## Validación HTTP

| Endpoint | Status | Tamaño |
|---------|--------|--------|
| `/assets/gamedata/FurnitureData.json` | 200 | 14.7MB (133 names fixed) |
| `/assets/gamedata/ExternalTexts.json` | 200 | 3.5MB (57,289 keys) |
| `/assets/nitro/furniture/icons/shelves_norja_icon.png` | 200 | — |
| `/assets/nitro/furniture/nitro/shelves_norja.nitro` | 200 | — |
| `gothic_chair` in FD | 200 | name='Gothic Chair Pink' ✓ |

## Riesgos

1. **FD name patch**: 133 items modificados con nombre humanizado/ProductData. Backup existe. Si un nombre humanizado es técnicamente incorrecto → revertiible desde backup.
2. **Icons 39%**: No es regresión — es el estado base. El 61% faltante requiere herramienta externa.
3. **8,321 items a ocultar (próximo MP)**: Items sin .nitro muestran placeholder gris en sala al intentar colocarlos — experiencia degradada pero no crash.

## Limitaciones técnicas actuales

| Limitación | Impacto | Solución futura |
|-----------|--------|----------------|
| Sin furniture imager | 20,058 icons no generables | Integrar nitro-imager o habbo-imager CLI |
| Custom assets sin fuente | 61% icons faltantes | Descargar assets del hotel original o generarlos |
| HOF icons no mappeable | 64,296 icons inutilizables | Necesita tabla offerid↔classname |

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- arcturus_main — NO reseteado
- catalog_pages — NO tocado
- catalog_items — NO tocado
- items_base — NO tocado
- Prisma — NO tocado
- migrations — NO tocadas
- middleware — NO tocado
- Auth Bridge — NO implementado
- /hotel, /me, /register — NO tocados
- external/ — NO agregado a Git
- Items ocultos/movidos — NINGUNO en este MP
- FurnitureData.json — MODIFICADO (133 names) — BACKUP existe
- ExternalTexts.json — NO modificado en este MP

## Próximos pasos

| Prioridad | Acción | MP |
|-----------|--------|-----|
| Alta | Validar visual con F5 — verificar nombres limpios en catálogo | Fernando |
| Alta | Ocultar 8,321 items sin .nitro (lista preparada) | MP-010.1A.2 |
| Alta | Flujo purchase → inventory → placement | MP-011 |
| Media | Integrar furniture imager para generar 20,058 icons | Herramienta separada |
| Baja | Mapear HOF icons offerid↔classname | Solo si hay fuente de mapping |

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Ctrl+F5 (force reload):

- [ ] Catálogo abre
- [ ] Items Classic: nombres limpios (Gothic Chair, Gothic Sofa, etc. — antes vacíos)
- [ ] Items Creators: nombres legibles (100% cobertura post-fix)
- [ ] Inventario: todos los items con nombre (no más `roomItem.name.xxxxx`)
- [ ] Gray placeholders en icons siguen → esperado (39% icon coverage)
- [ ] Previews de sala siguen en items con .nitro (73%) → OK
- [ ] Sin nuevos errores en Console
- [ ] WebSocket activo
