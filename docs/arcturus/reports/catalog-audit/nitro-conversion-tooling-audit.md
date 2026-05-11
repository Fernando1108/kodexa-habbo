# Nitro Conversion Tooling Audit — MP-010.1A.2

## Herramienta principal: `tools/converter`

### Descripción

**Habbo Downloader + Converter** (Windows .exe, .NET 8 + Node.js)

Ubicación: `tools/converter/Compiled/Habbo Downloader.exe`

### Funcionalidades

| Función | Estado | Notas |
|---------|--------|-------|
| Download Habbo assets originales | Disponible | Requiere internet, URLs Habbo.com |
| Download Nitro retro assets | Disponible | Config nitro_furnitureurl |
| SWF → Nitro (furniture) | Disponible | SWFCompiler, requiere .swf input |
| SWF → Nitro (clothes/effects/pets) | Disponible + usado | Clothes .nitro ya generados |
| NitroCompiler (compile JSON+PNG → .nitro) | Disponible | Para custom assets con JSON/PNG |
| NitroCompiler (decompile .nitro → JSON+PNG) | Disponible | Para inspección/edición |
| Generate SQL desde .nitro/.swf | Disponible | Para items_base + catalog_items |
| Database tools | Disponible | Fix sprite_id, offerid, sit/lay/walk |

### Input/Output para SWF → Nitro (furniture)

```
Input:  tools/converter/Compiled/SWFCompiler/import/  ← colocar .swf aquí
Output: tools/converter/Compiled/SWFCompiler/furniture/ ← .nitro generado
```

### Input/Output para NitroCompiler

```
Input:  tools/converter/Compiled/NitroCompiler/compile/  ← {classname}.json + {classname}.png
Output: tools/converter/Compiled/NitroCompiler/compiled/ ← {classname}.nitro
```

### Dependencias

- .NET SDK 8.0 (Windows)
- Node.js (latest)
- Windows OS (el .exe no corre en Linux/Mac sin Wine)

### ¿Soporta furniture? SÍ
### ¿Soporta icons? Genera icon embedded en el .nitro (el .nitro v2 incluye sprite icon)
### ¿Requiere SWF? SÍ para SWFCompiler. NitroCompiler acepta JSON+PNG directo.

## Conclusión de auditoría

**La herramienta SWF→Nitro existe y funciona**, pero:

1. **No hay .swf de furniture** para los 8,512 classnames faltantes
2. Los 2,374 .swf en `external/` son **clothing/effects** (acc_*, ha_*, hr_*, ch_*, etc.) — no furniture
3. `external/arcturus/objectretros/flash/dcr/hof_furni/furniture/` → **vacío**
4. Gordon/PRODUCTION SWFs → clothing/effects, no furniture matching

**La conversión SWF→Nitro no aplica** porque no hay SWF de furniture para convertir.

## Fuente alternativa descubierta: nested bundle

**Ubicación:** `external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture/`

- 63,965 archivos .nitro (classname-based, no numerados)
- 8,364 de los 8,512 classnames faltantes están aquí (98.3%)
- Formato: Nitro v2 binary (`0002xxxx` magic) — compatible con Nitro renderer
- Validación HTTP: 200 OK, tamaño correcto

**Esta es una operación de COPIA, no conversión.**
