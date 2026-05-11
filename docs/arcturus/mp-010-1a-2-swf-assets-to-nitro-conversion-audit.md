# MP-010.1A.2 — Auditoría SWF/Assets → Nitro para Items Sin .nitro

## Objetivo

Antes de ocultar los 8,321 classnames sin .nitro, auditar si existen fuentes convertibles. Resultado: **no se requiere conversión** — los assets ya existen en .nitro format.

## Classnames analizados

- Total missing .nitro: **8,512** classnames
- Fuente de datos: `docs/arcturus/reports/catalog-audit/missing-furniture-nitro.json`

## Descubrimiento principal

**Nested bundle no sincronizado:**

```
external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture/
```

- 63,965 archivos .nitro (classname-based)
- Nunca incluido en `sync-arcturus-assets.js`
- Distinto del bundle principal (`nitro-assets/bundled/furniture/`)
- **8,364 de los 8,512 classnames faltantes están aquí**

## Clasificación de los 8,512 classnames

| Grupo | Count | % | Descripción | Acción |
|-------|-------|---|-------------|--------|
| A. ALREADY_AVAILABLE_NITRO | **8,364** | **98.3%** | .nitro en nested bundle | Copiar a assets/ |
| B. CONVERTIBLE_SWF | 0 | 0% | SWF encontrado (no aplica) | — |
| C. PARTIAL_SOURCE | 2 | 0% | Tiene icon pero no .nitro | Mantener placeholder |
| D. NO_SOURCE_FOUND | 69 | 0.8% | Custom hotel items sin fuente | Ocultar en MP-010.1A.4 |
| E. NAME_MISMATCH_CANDIDATE | 77 | 0.9% | Posible nombre diferente en bundle | Revisión manual |
| **Total** | **8,512** | 100% | | |

### Desglose Grupo D (sin fuente)

Todos son `other_custom` — items únicos del hotel sin fuente en ningún directorio externo:
- Ejemplos: `Black Dino Egg`, `Malette`, `avionetahl`, `wibbo_tardis`
- No tienen SWF, no tienen .nitro en ningún bundle conocido

### Grupo E (name mismatch)

77 classnames con espacios o capitalización inusual:
- `Black Dino Egg` (espacios)
- `Malette` (solo capital)
- Algunos pueden estar en el bundle con nombre diferente — requieren revisión manual

## Búsqueda de SWF

- Total .swf en external/: **2,374**
- Ubicaciones: gordon/PRODUCTION/ (2,372), dcr/hof_furni/icons/ (algunas SWFs)
- **Todos son clothing/effects** (acc_*, ha_*, hr_*, etc.)
- `gordon/PRODUCTION/` no contiene furniture SWF con classnames de catálogo
- `dcr/hof_furni/furniture/` → vacío
- **0 matches de SWF para classnames de furniture faltantes**

## Herramienta de conversión

`tools/converter/Compiled/Habbo Downloader.exe` (Windows .NET 8):
- **SWFCompiler**: convierte .swf → .nitro (furniture, clothes, pets, effects)
- **NitroCompiler**: compila JSON+PNG → .nitro custom
- **Input furniture**: `SWFCompiler/import/*.swf`
- **Output**: `SWFCompiler/furniture/*.nitro`

**No aplica** porque no hay .swf de furniture disponibles.

## Validación del formato del nested bundle

Archivo test: `recycler_basketplant.nitro`
```
Header magic: 0002 0019 (Nitro v2, classname len=25)
Tamaño: 6,281 bytes
HTTP: 200 OK desde kodexa-assets (puerto 8080)
```

Comparado con archivos conocidos OK:
```
shelves_norja.nitro:   magic=0002 0012 → OK
01_caterbody.nitro:    magic=0002 0011 → OK
recycler_basketplant:  magic=0002 0019 → OK (mismo formato)
```

**Formato compatible confirmado.** La copia es directa y no requiere transformación.

## Prueba controlada

Carpeta: `tmp/nitro-conversion-test/`

| Archivo | Tamaño | Formato | HTTP test | Resultado |
|---------|--------|---------|-----------|-----------|
| recycler_basketplant.nitro | 6,281 B | Nitro v2 | 200 OK | PASS |
| recycler_baskettree.nitro | 7,167 B | Nitro v2 | — | format_valid |
| recycler_bedpink.nitro | 9,994 B | Nitro v2 | — | format_valid |
| A_Militaire_city_PateeNoire.nitro | 7,692 B | Nitro v2 | — | format_valid |
| Ambulancia.nitro | 15,827 B | Nitro v2 | — | format_valid |

`recycler_basketplant.nitro` permanece en `assets/nitro/furniture/nitro/` como prueba.

## Proyección post-copia

| Métrica | Actual | Post-copia |
|---------|--------|-----------|
| Nitro coverage | 73% | ~98% |
| Items sin .nitro | 8,512 | 148 |
| P0 .nitro coverage | 74% | ~98% |

Los 148 restantes (69 sin fuente + 77 mismatch + 2 partial) serán clasificados para ocultamiento o revisión manual.

## Items no modificados en este MP

- kodexa_hotel — NO modificado
- catalog_pages — NO tocado
- catalog_items — NO tocado
- items_base — NO tocado
- FurnitureData.json — NO tocado
- ExternalTexts.json — NO tocado
- Ningún item ocultado/movido
- No hay conversión masiva

## Output del MP

**En assets/ (solo prueba):**
```
assets/nitro/furniture/nitro/recycler_basketplant.nitro  ← 1 archivo de prueba
```

**En tmp/ (temporal):**
```
tmp/nitro-conversion-test/
├── recycler_basketplant.nitro
├── recycler_baskettree.nitro
├── recycler_bedpink.nitro
├── A_Militaire_city_PateeNoire.nitro
└── Ambulancia.nitro
```

**Reportes:**
```
docs/arcturus/reports/catalog-audit/
├── nitro-conversion-candidates.json        ← clasificación completa de 8,512
├── no-source-furniture-items.json          ← 69 items sin fuente
├── name-mismatch-candidates.json           ← 77 candidatos mismatch
├── nitro-conversion-tooling-audit.md       ← auditoría de herramientas
└── swf-to-nitro-conversion-pipeline.md     ← pipeline propuesto
```

## Riesgos

1. **Nested bundle classnames distintos a items_base**: Algunos .nitro del nested bundle podrían no corresponder exactamente al classname de items_base — verificar en prueba visual post-copia
2. **77 mismatches**: Podrían tener .nitro con nombre diferente (capitalización/espacios) — no serán copiados en batch, requieren mapeo manual
3. **69 sin fuente**: Causarán placeholder gris persistente — candidatos para ocultamiento en MP-010.1A.4

## Próximos pasos recomendados

### MP-010.1A.3 — Copia por lote del nested bundle (RECOMENDADO INMEDIATO)

Scope:
1. Agregar nuevo SYNC_PAIR a `sync-arcturus-assets.js`
2. Copiar los 8,364 .nitro del nested bundle → `assets/nitro/furniture/nitro/`
3. Proyección: nitro coverage 73% → ~98%
4. Tiempo estimado: operación de copia directa

Opcional en mismo MP:
- Revisión manual de los 77 name-mismatch candidates
- Identificar qué subconjunto del nested bundle tiene los mismatches

### MP-010.1A.4 — Ocultar items sin fuente (69 classnames)

Solo ejecutar DESPUÉS de MP-010.1A.3.
69 items verdaderamente sin fuente → ocultar temporalmente de catálogo visible.
