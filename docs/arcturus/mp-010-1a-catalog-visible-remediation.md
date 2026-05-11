# MP-010.1A — Remediación Dirigida del Catálogo Visible/Activo

## Contexto

Continuación de MP-010.1. Con los reportes de auditoría generados, se aplicaron fixes dirigidos a mejorar cobertura de **nombres**, **icons** y **bundles** del catálogo visible/activo.

## Problema central que resuelve este MP

MP-010.1 mejoró name coverage de 31% → 64% via FurnitureData merge.

El 36% restante: items en `items_base` con `type=s/i` (floor/wall items) sin entrada en FurnitureData.json. Nitro nunca setea `localization.setValue("roomItem.name.{sprite_id}", ...)` para esos items → el key literal `roomItem.name.xxxxx` se muestra en catálogo/sala/inventario.

**Fix**: Inyectar `roomItem.name.{sprite_id} = public_name` directamente en ExternalTexts.json para todos los floor/wall items NOT cubiertos por FD.

## Método de priorización

```
P0: visible=1 AND enabled=1 AND min_rank<=10  → 1,154 páginas
P1: visible=1 OR enabled=1                    →   174 páginas
```

P0 cubre el catálogo accesible por usuarios regulares (rank≤10).

```
P0 base refs: 31,713 items únicos
P1 base refs:  1,618 adicionales
```

## Análisis de fuentes de datos

### Lógica de ExternalTexts vs FurnitureData

```
Startup Nitro:
  1. Carga ExternalTexts.json → todos los keys disponibles
  2. Procesa FurnitureData.json → SOBREESCRIBE con:
       localization.setValue("roomItem.name.{FD.id}", FD.name)

Display lookup:
  y("roomItem.name.{sprite_id}")
  → busca en localization map
  → si no existe → devuelve key literal
```

**Conclusión**: ExternalTexts fallback es seguro. FD items sobrescriben con su valor correcto → no hay conflicto.

## Fix ejecutado — ExternalTexts fallback (+9,198 entries)

### Script: `C:\tmp\remediation.py`

Lógica central:
```python
for bid, base in bases.items():
    t = base.get('type','').lower()
    if t not in ('s','i'): continue          # solo floor/wall items

    cn = base['item_name'].split('*')[0]
    sprite_id = base.get('sprite_id','')
    if not sprite_id or not sprite_id.isdigit(): continue

    # Skip si FD ya cubre este item
    in_fd = cn in fd_by_classname or int(sprite_id) in fd_by_id
    if in_fd: continue

    # Nombre: public_name si legible, else item_name humanizado
    pub_name = base.get('public_name','').strip()
    if pub_name.endswith('_name') or not pub_name:
        pub_name = base['item_name'].replace('_',' ').strip()

    name_key = f"roomItem.name.{sprite_id}"
    if name_key in ext_texts: continue

    ext_texts[name_key] = pub_name
    ext_texts[f"roomItem.desc.{sprite_id}"] = ""
```

### Resultados del script

```
FD items (merged): 30,991
items_base floor/wall: ~33,787

Procesados: 36,270
Skipped (cubiertos por FD): 24,589
Fallbacks añadidos: 9,198
Ya existían: 4
Sin public_name: 0

ExternalTexts: 38,893 → 57,289 keys
Backup: assets/gamedata/ExternalTexts.json.bak
```

### Coverage post-fix

| Métrica | Pre-MP010 | Post-MP010.1 | Post-MP010.1A |
|---------|-----------|--------------|---------------|
| Names % | 31% | 64% | **92%** |
| Icons % | 31% | 39% | 39% |
| Nitro % | 73% | 73% | 73% |
| FD items | 17,698 | 30,991 | 30,991 |
| Icons únicos | 14,347 | 16,657 | 16,657 |
| ExternalTexts keys | 38,893 | 38,893 | **57,289** |
| Total furni refs | 32,809 | 32,809 | 32,809 |

**Ganancia de nombres: 31% → 92%** (+61 puntos porcentuales)

## Búsqueda de icons/nitro adicionales

Se buscaron icons adicionales en:
- `external/arcturus/objectretros/flash/c_images/catalogue`
- `external/arcturus/objectretros/nitro/nitro-assets/bundled/furniture`

Resultado: **0 adicionales copiados** — todos ya fueron procesados en MP-010.1.

Icons sin resolver: 16,159 classnames
Nitros sin resolver: 8,512 classnames

→ Corresponden a custom hotel furniture sin assets Nitro generados. Requieren imager de furniture.

## Prioridad de páginas

```
P0 (visible+enabled+rank≤10): 1,154 páginas
P1 (visible o enabled): 174 páginas adicionales
```

Árbol root tabs:
- Classic (id=2): visible=1, enabled=1 → P0
- Creators (id=5): visible=1, enabled=1 → P0
- Rares (id=15): visible=1, enabled=0 → P1
- Badges (id=25): visible=1, enabled=1 → P0
- Staff (id=7): visible=1, enabled=0 → P1

## Reportes generados

```
docs/arcturus/reports/catalog-audit/
├── post-remediation-summary.json     ← cobertura pre/post comparativa
├── added-text-fallbacks-report.json  ← muestra de 500 fallbacks añadidos
├── unresolved-icons-report.json      ← 200 icons aún sin resolver
├── unresolved-nitro-report.json      ← 200 nitros aún sin resolver
├── copied-icons-report.json          ← icons copiados en este MP (0)
├── copied-nitro-report.json          ← nitros copiados en este MP (0)
└── priority-visible-items.json       ← conteo P0/P1 pages y refs
```

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- catalog_pages — NO tocado
- catalog_items — NO tocado
- items_base — NO tocado
- Prisma — NO tocado
- migrations — NO tocadas
- middleware — NO tocado
- Auth Bridge — NO implementado
- /hotel, /me, /register — NO tocados
- external/ — NO agregado a Git
- FurnitureData.json — NO modificado (ya tenía backup de MP-010.1)
- ExternalTexts.json — BACKUP creado (ExternalTexts.json.bak)

## Items cubiertos en MP-010.1A

| Archivo | Acción |
|---------|--------|
| `assets/gamedata/ExternalTexts.json` | +9,198 fallback entries (name+desc) |
| `assets/gamedata/ExternalTexts.json.bak` | Backup antes del cambio |
| `docs/arcturus/reports/catalog-audit/post-remediation-summary.json` | Nuevo |
| `docs/arcturus/reports/catalog-audit/added-text-fallbacks-report.json` | Nuevo |
| `docs/arcturus/reports/catalog-audit/unresolved-icons-report.json` | Nuevo |
| `docs/arcturus/reports/catalog-audit/unresolved-nitro-report.json` | Nuevo |
| `docs/arcturus/reports/catalog-audit/priority-visible-items.json` | Nuevo |

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Ctrl+F5 (forzar recarga):

- [ ] Catalog abre sin errores
- [ ] Items Classic: nombres legibles (NO `roomItem.name.xxx`) para la mayoría
- [ ] Items Creators: nombres legibles para items estándar
- [ ] Items Badges: badges muestran imagen
- [ ] Inventario: nombres legibles para items de floor/wall
- [ ] Sala: tooltips/info de furniture con nombre real
- [ ] ~8% restante (ultra-custom nft_*, hfdiy_*, etc.) puede seguir sin nombre — esperado
- [ ] Icons siguen al 39% — esperado (requiere imager furniture)
- [ ] Sin regresión en items con nombres que antes funcionaban (FD items)

## 8% sin nombre restante

Los ~2,733 refs sin nombre post-fix son items donde:
1. No están en FurnitureData (classname no existe en ninguna fuente)
2. No tienen `sprite_id` válido en items_base
3. Son items de tipo desconocido o bot/effect

Ejemplo: `nft_unique_item_*`, `hfdiy_custom_*`, `avionetahl`, `qday_vliegtuigje`.

Reducción posible solo con:
- FurnitureData manual de esos items, o
- Imager de furniture que los procese y genere sus bundles

## Próximos pasos

| Prioridad | Acción | MP |
|-----------|--------|-----|
| Alta | Validar visual con Ctrl+F5 | Fernando primero |
| Alta | Flujo purchase → inventory → placement | MP-011 |
| Media | Furniture imager para icons del 61% restante | Herramienta separada |
| Baja | FD manual para 8% ultra-custom sin nombre | MP-010.2 si necesario |
