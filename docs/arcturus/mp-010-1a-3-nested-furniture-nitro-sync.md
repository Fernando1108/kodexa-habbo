# MP-010.1A.3 — Sincronización del Nested Furniture Bundle

## Hallazgo

Fuente descubierta en MP-010.1A.2 no incluida en sync previo:

```
external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture/
```

63,965 archivos .nitro (classname-based). **Distinto** del bundle principal:
```
external/arcturus/objectretros/nitro/nitro-assets/bundled/furniture/   ← ya sincronizado
external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture/  ← NUEVO (este MP)
```

## Resultado

| Métrica | Valor |
|---------|-------|
| .nitro en nested bundle | 63,965 |
| .nitro copiados | **8,263** |
| Ya existían (duplicados) | 101 |
| Sin resolver | 148 |
| Total .nitro en assets post-copia | **30,516** |

## Cobertura antes vs después

| Métrica | Pre | **Post** |
|---------|-----|---------|
| Nitro global | 73% | **99%** |
| Nitro P0 (visible+enabled) | 74% | **100%** |

### Por tab

| Tab | Pre | **Post** |
|-----|-----|---------|
| Classic | ~91% | **99%** |
| Creators | ~65% | **100%** |
| Rares | ~75% | **100%** |
| Badges | ~69% | **90%** |
| Staff | ~69% | **99%** |

**Proyectado:** ~98%. **Real:** 99% global, 100% P0.

## Items no resueltos (148)

| Categoría | Count | Razón |
|-----------|-------|-------|
| no-source | 69 | Custom hotel items sin asset en ningún external |
| name-mismatch | 77 | Classname con espacios/capitalización inusual |
| partial-source | 2 | Solo icon, sin .nitro |

Candidatos para **MP-010.1A.4** (ocultar temporalmente + revisión manual de mismatches).

## Método de copia

Script: `C:\tmp\copy_nested_full.py`

```
Modo: additive (solo copia si destino no existe)
Sin overwrite
Sin borrar existentes
Tamaño validado > 0 para cada archivo
0 errores
```

## sync-arcturus-assets.js actualizado

Nuevo SYNC_PAIR agregado:

```javascript
{
  // MP-010.1A.3: nested bundle — 63,965 additional .nitro
  src:  'external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture',
  dest: 'assets/nitro/furniture/nitro',
  desc: 'Furniture .nitro bundles — nested bundle (additional 63K classname-based bundles)',
  filter: (f) => f.endsWith('.nitro'),
},
```

Posición: después del SYNC_PAIR del bundle principal.
Rutas anteriores: conservadas sin cambio.

## Validación HTTP

| Archivo | Status | Size |
|---------|--------|------|
| shelves_norja.nitro (pre-existing) | 200 | OK |
| recycler_basketplant.nitro (prueba MP-010.1A.2) | 200 | 6,281 B |
| avionetahl.nitro (nuevo — Creators) | 200 | 28,956 B |
| snta_globe.nitro (nuevo — Creators) | 200 | 10,212 B |
| Ambulancia.nitro (nuevo — Creators) | 200 | 15,827 B |
| habbox_blue_plane.nitro (nuevo — habbox_ prefix) | 200 | 8,255 B |
| kasja_sghibli_bathtoken.nitro (nuevo — kasja_ prefix) | 200 | 1,171 B |
| FurnitureData.json | 200 | — |
| ExternalTexts.json | 200 | — |

Todos 200 OK. CORS heredado de nginx config existente.

## Cobertura acumulada (todos los MPs)

| Métrica | Pre-MP010 | MP-010.1 | MP-010.1A | MP-010.1A.1 | MP-010.1A.3 |
|---------|-----------|----------|-----------|-------------|-------------|
| Names | 31% | 64% | 92% | **100%** | 100% |
| Icons | 31% | 39% | 39% | 39% | **39%** |
| Nitro | 73% | 73% | 73% | 73% | **99%** |

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- catalog_pages — NO tocado
- catalog_items — NO tocado
- items_base — NO tocado
- FurnitureData.json — NO modificado en este MP
- ExternalTexts.json — NO modificado en este MP
- external/ — NO agregado a Git
- Items hidden/moved — NINGUNO
- Assets existentes — NO borrados ni sobrescritos

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `scripts/sync-arcturus-assets.js` | +1 SYNC_PAIR para nested bundle |
| `assets/nitro/furniture/nitro/` | +8,263 archivos .nitro |
| `docs/arcturus/reports/catalog-audit/copied-nested-nitro-report.json` | Nuevo |
| `docs/arcturus/reports/catalog-audit/unresolved-after-nested-nitro-sync.json` | Nuevo |
| `docs/arcturus/reports/catalog-audit/post-nested-nitro-sync-summary.json` | Nuevo |

## Riesgos

1. **Nitro v2 format compatibility**: Todos archivos copiados son `0002xxxx` magic — mismo formato que assets existentes y validados. Riesgo bajo.
2. **Classnames con capitalización**: `Ambulancia.nitro` (capital A) — si items_base.item_name usa `ambulancia` (minúscula), el URL generado no matcheará. Revisar en prueba visual.
3. **148 no resueltos**: Persisten como placeholder. Candidatos para ocultar en MP-010.1A.4.
4. **Icons**: Este MP no mejora icons (39%). Previews en sala sí mejorarán. Grilla del catálogo puede seguir gris para muchos items.

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Ctrl+F5:
- [ ] Classic: más previews renderizando (objetivo 99%)
- [ ] Creators: previews casi completos (era 65%, ahora 100%)
- [ ] Rares: previews completos (era 75%, ahora 100%)
- [ ] Staff: más previews (era 69%, ahora 99%)
- [ ] Items que antes mostraban placeholder gris ahora muestran forma del furniture
- [ ] Catalog sigue abriendo
- [ ] Inventario sigue abriendo
- [ ] WebSocket activo
- [ ] Sonidos OK
- [ ] Icons grilla pueden seguir grises → esperado (39% icons, sin cambio)

## Próximos pasos

| Prioridad | Acción | MP |
|-----------|--------|-----|
| Media | Ocultar 148 items no resolvibles | MP-010.1A.4 |
| Alta | Flujo purchase → inventory → placement | **MP-011** |
| Media | Furniture imager para icons (39%) | Herramienta separada |
