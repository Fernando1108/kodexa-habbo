# Pipeline: Nitro Bundle Copy (no conversion needed)

## Descubrimiento clave

No se requiere conversión SWF→Nitro para los items faltantes.
El 98.3% ya existe como `.nitro` en el nested bundle no sincronizado.

## Fuente

```
external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture/
```

- 63,965 archivos .nitro (classname-based)
- Separado del bundle ya sincronizado (`nitro-assets/bundled/furniture/`)
- Nunca fue incluido en `scripts/sync-arcturus-assets.js`

## Pipeline propuesto: copia directa

```
Origen: external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture/
Destino: assets/nitro/furniture/nitro/
Filtro: solo classnames que están en missing-furniture-nitro.json
Modo: additive, no overwrite
Items: 8,364 archivos
```

## Comando de copia (bash)

```bash
NESTED="external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture"
DEST="assets/nitro/furniture/nitro"
for f in "$NESTED"/*.nitro; do
    name=$(basename "$f")
    if [ ! -f "$DEST/$name" ]; then
        cp "$f" "$DEST/$name"
    fi
done
```

O via Node.js script (preferido para logging):
```
node scripts/sync-arcturus-assets.js --run
```
(después de agregar el nuevo par al script)

## Validación de formato

Header magic: `0002xxxx` — Nitro v2 binary format
- Compatible con kodexa-nitro-renderer (puerto 8081)
- HTTP serving: 200 OK desde kodexa-assets (puerto 8080)
- `recycler_basketplant.nitro` (6,281 bytes): tested → 200 OK

## Para los 148 restantes no resolubles

| Grupo | Count | Acción |
|-------|-------|--------|
| E: name mismatch | 77 | Revisión manual — pueden estar en bundle con nombre distinto |
| D: no source | 69 | Custom hotel items — sin fuente disponible |
| C: partial (icon only) | 2 | Sin bundle |

### Conversion SWF (grupo sin match si apareciese SWF)

Si en el futuro aparecen .swf de furniture:
```
1. Colocar .swf en tools/converter/Compiled/SWFCompiler/import/
2. Ejecutar: tools/converter/Compiled/"Habbo Downloader.exe"
3. Seleccionar: SWF to Nitro > Furniture > Import
4. Output: tools/converter/Compiled/SWFCompiler/furniture/{classname}.nitro
5. Copiar a: assets/nitro/furniture/nitro/
```

Requiere: Windows, .NET 8 SDK, Node.js

## Próximo MP

**MP-010.1A.3 — Copia por lote del nested bundle**

Scope:
- Agregar nuevo SYNC_PAIR al script sync-arcturus-assets.js
- Filtrar solo classnames en missing-furniture-nitro.json (o copiar todos nuevos)
- Proyección: nitro coverage 73% → ~98%
- Impacto: previews de sala funcionando para 8,364 items más
