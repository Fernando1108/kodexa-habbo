# MP-010.1A.4 — Ocultar Items No Renderizables (Desarrollo/Pendientes)

## Objetivo

Mover los 148 classnames sin .nitro resolvible del catálogo público a una página interna, eliminando placeholders grises para usuarios finales.

## Reglas aplicadas

- Solo items con .nitro **ausente** en assets → movidos
- Items con .nitro presente → NO tocados (aunque classname aparezca en lista de mismatch)
- No se borró nada — solo `page_id` actualizado
- Reversible con restore SQL

## Resultado

| Categoría | Count |
|-----------|-------|
| catalog_items movidos | **149** |
| Ya en páginas internas (visible=0) | 35 |
| Tiene .nitro — mantenidos visibles | 1 |
| Total afectados evaluados | 185 |

## Página de destino

| Campo | Valor |
|-------|-------|
| id | 9965236 |
| caption | Desarrollo/Pendientes |
| visible | 0 |
| enabled | 0 |
| min_rank | 9 |
| parent_id | -1 |

Página nueva creada (no existía página interna previa con min_rank>=9).
Acceso cuando se habilite: solo rank >= 9 (Developer) y rank 10 (Founder). Staff normal (rank 7-8) no accede.

## Cobertura antes vs después

| Métrica | Pre | Post |
|---------|-----|------|
| Nitro global | 99% | **99%** (sin cambio — items movidos ya no contaban) |
| Nitro P0 (visible+enabled) | 100% | **100%** |

Cobertura no mejora porque los items movidos ya eran los "fail" — al sacarlos del conteo público, el porcentaje se mantiene o mejora.

## Classnames por categoría (148 unresolved)

| Categoría | Count | Descripción |
|-----------|-------|-------------|
| no-source | 69 | Custom hotel items sin asset en ningún external |
| name-mismatch | 79 | Classname con espacios/capitalización inusual |

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- catalog_pages (públicas) — NO modificadas
- catalog_items: solo page_id de 149 registros
- items_base — NO tocado
- FurnitureData.json — NO modificado
- ExternalTexts.json — NO modificado
- external/ — NO agregado a Git
- Assets existentes — NO borrados ni sobrescritos

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `arcturus_main.catalog_items` | 149 registros: page_id actualizado a 9965236 |
| `arcturus_main.catalog_pages` | +1 fila: id=9965236 Desarrollo/Pendientes |
| `docs/arcturus/restore-mp-010-1a-4-hidden-items.sql` | Restore SQL (149 UPDATE statements) |
| `docs/arcturus/reports/catalog-audit/mp-010-1a-4-catalog-items-backup.json` | Backup de los 185 registros evaluados |
| `docs/arcturus/reports/catalog-audit/mp-010-1a-4-public-catalog-summary.json` | Resumen de cobertura post-hide |

## Restore (revertir)

```bash
docker exec -i kodexa-db mysql -u root -proot_password_change_me arcturus_main \
  < docs/arcturus/restore-mp-010-1a-4-hidden-items.sql
```

Para borrar la página dev creada:
```sql
DELETE FROM catalog_pages WHERE id=9965236;
```

## Validacion de cobertura (post-ajuste MP-010.1A.4)

Verificado con nitro_set fresco (30,516 archivos — incluye MP-010.1A.3):

| Segmento | Broken items |
|----------|-------------|
| Publico rank 1-6 | **0** |
| Staff rank 7-8 | **0** |
| Desarrollo/Pendientes | 149 (esperado) |

Nota: check anterior con current_nitro.txt (22,152, stale) mostraba 56 falsos positivos en page 683 (Junk). Todos tenian .nitro en el set real de 30,516.

## Riesgos

1. **Items en "Waasa" (16), "HP 1" (22), "HP 2" (15)**: Páginas públicas — sus items sin .nitro ahora están ocultos. Si alguno tenía icono PNG pero no .nitro, el icono en grilla desaparece.
2. **name-mismatch pendiente review**: 79 classnames con capitalización/espacios pueden tener assets bajo nombre alternativo. Revisar manualmente si se desea recuperarlos.
3. **Página 9965236**: Creada con parent_id=-1, visible=0, enabled=0. Emulador la carga pero usuarios no la ven. Activar manualmente (visible=1, enabled=1) cuando se quiera habilitar acceso developer.

## Prueba requerida (Fernando)

```
http://localhost:8081/?sso=kodexa_admin_sso_local_2026
```

Ctrl+F5:
- [ ] Classic: ya no hay placeholders grises donde antes habia (Carpets, Flooring, Tables, etc.)
- [ ] HP 1, HP 2, Waasa: items sin render ya no aparecen
- [ ] Catalog sigue abriendo sin error
- [ ] Inventario sigue abriendo
- [ ] WebSocket activo
- [ ] Items que SI tienen .nitro no desaparecieron

## Cobertura acumulada (todos los MPs)

| Metrica | Pre-MP010 | MP-010.1A.3 | MP-010.1A.4 |
|---------|-----------|-------------|-------------|
| Names | 31% | 100% | 100% |
| Icons | 31% | 39% | 39% |
| Nitro | 73% | 99% | 99% (publico limpio) |

## Proximos pasos

| Prioridad | Accion | MP |
|-----------|--------|-----|
| Alta | Flujo purchase -> inventory -> placement | **MP-011** |
| Media | Review manual de 79 name-mismatch | MP-010.1A.5 (opcional) |
| Media | Furniture imager para icons (39%) | Herramienta separada |
