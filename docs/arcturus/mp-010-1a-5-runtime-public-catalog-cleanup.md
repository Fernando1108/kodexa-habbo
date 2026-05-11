# MP-010.1A.5 — Limpieza Runtime Catálogo Público Rank 1

## Problema detectado

Prueba visual con usuario rank 1 mostró que el catálogo público tenía placeholders grises masivos.
Categorías afectadas visualmente: Ate, Subeau, Cupid, Coffee Shop, Creepy, Disco, Gryffindor, iPixxel, Jerseys y otras subcategorías de "New Furni".

## Por qué MP-010.1A.4 no fue suficiente

MP-010.1A.4 solo movió los 148 classnames del reporte de unresolved-after-nested-nitro-sync.
El reporte original fue generado con nitro_set STALE (22,152 files). Con el set real de 30,516 archivos:
- Los 148 "unresolved" eran correctos pero incompletos.
- Existían 10,081 items adicionales con .nitro en disco pero SIN entrada en FurnitureData.json.
- Sin FD entry → Nitro no puede renderizar → placeholder gris en preview y sin interacción válida.
- Además: 347 páginas visibles con 0 items después del movimiento.

## Criterios aplicados en este MP

```
PUBLIC_GOOD:          .nitro existe + FD entry + icon → funcional completo
ICON_MISSING_RENDER_OK: .nitro + FD, sin icon → preview OK, grid gris (aceptable transitoriamente)
PUBLIC_REVIEW:        .nitro existe, SIN FD entry → Nitro no puede renderizar → MOVER
PUBLIC_BAD_HIDE:      sin .nitro → sin render posible → MOVER
```

Solo se ocultaron REVIEW y BAD. ICON_MISSING se mantiene visible (renderiza en sala y preview).

## Usuario de prueba

Admin rank actual: **1** (ya estaba en rank 1 — no requirió cambio).

## Resultado de auditoría

| Metrica | Valor |
|---------|-------|
| Páginas públicas rank 1 auditadas | 1,106 |
| catalog_items públicos rank 1 | 29,912 |
| Items clasificados (con base s/i) | 27,596 |
| PUBLIC_GOOD (nitro+icon+FD) | **11,274** |
| ICON_MISSING_RENDER_OK (nitro+FD, sin icon) | **6,240** |
| PUBLIC_REVIEW (nitro, sin FD) | **10,081** |
| PUBLIC_BAD_HIDE (sin nitro) | **1** |
| Items sin render visible al público (REVIEW+BAD) | **10,082** |

## Acciones aplicadas

### Paso 1: Mover items sin render a Desarrollo/Pendientes

- 10,082 catalog_items movidos a page_id=9965236
- BAD (sin .nitro): 1
- REVIEW (sin FD entry): 10,081
- Dev page: visible=0, enabled=0, min_rank=9

### Paso 2: Deshabilitar páginas vacías

Después del movimiento: 347 leaf pages con 0 items seguían enabled=1.
Acción: `enabled='0'` en las 347 páginas vacías (no borradas, no invisible, solo desactivadas).

| Estado final | Valor |
|-------------|-------|
| Leaf pages desactivadas (vacías) | 347 |
| Leaf pages activas con items | 713 |
| Items públicos rank 1 finales | **19,829** |
| Items en Desarrollo/Pendientes (total) | **10,231** |

## Categorías mencionadas por el usuario

| Categoría | Page | Estado |
|-----------|------|--------|
| Ate | 1480 | Desactivada (0 items) |
| Subeau | 1477 | Desactivada (0 items) |
| Cupid | 1486 | Activa (1 item con render) |
| Cupid alt | 88557 | Activa (66 items, icon_gray pero render OK) |
| Coffee Shop | 1766 | Desactivada (0 items) |
| Creepy | 3502 | Desactivada (0 items) |
| Disco | 1489 | Desactivada (0 items) |
| Disco alt | 88481 | Activa (17 items) |
| Gryffindor | 3509 | Desactivada (0 items) |
| iPixxel | 3511 | Desactivada (0 items) |
| Jerseys | 1229 | Desactivada (0 items) |

## Situación de icon_gray (6,240 items)

Estos items tienen .nitro + FD entry pero sin icon. En la grilla se ven como cuadrados grises.
Al seleccionarlos: preview carga. En sala: renderizan correctamente.

Decision: **mantener visibles** — no son placeholders rotos, son items funcionales sin icono.

Si se quieren ocultar también → requiere furniture imager primero.

Categorías con muchos icon_gray:
- Cupid (88557): 66 items
- Ringplates (88580): 14 items
- Pressure Plates (88579): 40 items
- HC Classic (349): 1 item

## Cobertura antes vs después

| Metrica | Pre-MP010.1A.5 | Post |
|---------|----------------|------|
| Public rank 1 items | 29,912 | **19,829** |
| Items sin render visible | ~10,082 | **0** |
| Items icon_gray (funcional) | ~6,240 | 6,240 (pendiente imager) |
| Items con render completo | ~11,274 | **11,274** |
| Páginas vacías visible | 347 | **0** |

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- arcturus_main — NO reseteado
- catalog_pages — NO borrado (solo enabled cambiado)
- catalog_items — NO borrado (solo page_id cambiado)
- items_base — NO tocado
- inventario — NO tocado
- FurnitureData.json — NO modificado
- ExternalTexts.json — NO modificado
- external/ — NO agregado a Git
- assets — NO borrados
- Prisma/migrations — NO tocados
- middleware — NO tocado
- Auth Bridge — NO implementado
- /hotel, /me, /register — NO tocados

## Archivos creados/modificados

| Archivo | Accion |
|---------|--------|
| `docs/arcturus/reports/catalog-audit/mp-010-1a-5-runtime-hide-backup.json` | Backup 10,082 items movidos |
| `docs/arcturus/reports/catalog-audit/mp-010-1a-5-public-runtime-summary.json` | Resumen cobertura |
| `docs/arcturus/restore-mp-010-1a-5-runtime-hidden-items.sql` | Restore SQL — 10,082 items |
| `docs/arcturus/restore-mp-010-1a-5-disabled-pages.sql` | Restore SQL — 347 páginas |
| `arcturus_main.catalog_items` | 10,082 registros: page_id → 9965236 |
| `arcturus_main.catalog_pages` | 347 páginas: enabled=0 |

## Restore completo (revertir todo)

```bash
# Restaurar items a páginas originales
docker exec -i kodexa-db mysql -u root -proot_password_change_me arcturus_main \
  < docs/arcturus/restore-mp-010-1a-5-runtime-hidden-items.sql

# Restaurar páginas vacías a enabled=1
docker exec -i kodexa-db mysql -u root -proot_password_change_me arcturus_main \
  < docs/arcturus/restore-mp-010-1a-5-disabled-pages.sql
```

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Ctrl+F5:
- [ ] Catálogo abre sin error
- [ ] Classic: sin placeholders grises donde preview este vacio
- [ ] New Furni: Ate, Coffee Shop, Creepy, Disco, Gryffindor, iPixxel, Jerseys ya no aparecen
- [ ] Cupid sigue visible (1 item funcional + categoria alt con 66 items)
- [ ] Items seleccionables muestran preview real
- [ ] WebSocket activo
- [ ] Inventario abre
- [ ] Rank 1 no ve Desarrollo/Pendientes
- [ ] Si hay cuadrados grises en grilla → preview debe cargar al seleccionar (icon_gray funcional)

## Por qué persisten algunos cuadrados grises

Los 6,240 items restantes con cuadrado gris en grilla son FUNCIONALES:
- Tienen .nitro → renderizan en sala
- Tienen FD entry → preview carga al seleccionar
- Solo les falta el _icon.png para la grilla del catálogo
- Solución: furniture imager → genera iconos desde .nitro

## Próximos pasos

| Prioridad | Accion | MP |
|-----------|--------|-----|
| Alta | Flujo purchase → inventory → placement | **MP-011** |
| Alta | Furniture imager → icons para 6,240 grises | MP-010.2 |
| Media | FD sync: agregar entradas para 10,081 REVIEW items | MP-010.3 |
| Baja | Review manual de 79 name-mismatch | MP-010.1A.4b |
