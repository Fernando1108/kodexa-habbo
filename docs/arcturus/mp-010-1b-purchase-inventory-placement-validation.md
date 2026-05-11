# MP-010.1B — Validación Funcional Purchase → Inventory → Placement

## Estado inicial

### Servicios activos

| Servicio | Estado | Puerto |
|---------|--------|--------|
| kodexa-nitro-renderer | UP | 8081 |
| kodexa-assets | UP | 8080 |
| kodexa-db (MariaDB) | UP + healthy | 3306 |
| kodexa-redis | UP + healthy | 6379 |
| kodexa-imager | UP | 1338 |
| Arcturus Morningstar 3.5.5 (Java PID 40680) | RUNNING | 3005 (game), 2096 (WS via NitroWebsockets-3.1), 3002 (RCON) |

### Usuario de prueba

| Campo | Valor |
|-------|-------|
| username | admin |
| rank | 1 |
| credits | 99,999 |
| pixels | 50,000 |
| points | 10,000 |
| inventory pre-test | 2 items |
| placed pre-test | 1 item (room 57) |
| room disponible | id=57 "ssasas" (open) |

### Estado catálogo post-MP-010.1A.5

| Metrica | Valor |
|---------|-------|
| Items públicos rank 1 | 19,829 |
| Clasificacion PUBLIC_GOOD | 11,274 |
| Clasificacion ICON_MISSING_RENDER_OK | 6,240 |
| En Desarrollo/Pendientes | 10,231 |
| Paginas leaf activas | 713 |

---

## Muestra de prueba programática (35 items)

Pre-validados en disco. Runtime debe confirmar compra/inventario/sala.

### Classic — Windows (5 items PUBLIC_GOOD)

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 9659 | window_single_default | OK | OK | OK |
| 9660 | window_double_default | OK | OK | OK |
| 9661 | noob_window_double | OK | OK | OK |
| 9662 | window_chinese_wide | OK | OK | OK |
| 9663 | window_golden | OK | OK | OK |

### Creators — Minimalistic (5 items PUBLIC_GOOD)

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 11734958 | minimalistic_decke | OK | OK | OK |
| 11734959 | minimalistic_eckelement | OK | OK | OK |
| 11734961 | minimalistic_fenstertuer | OK | OK | OK |
| 11734963 | minimalistic_fernseher | OK | OK | OK |
| 11734964 | minimalistic_fernsehtisch | OK | OK | OK |

### Furni By Line — Country (5 items PUBLIC_GOOD)

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 1535 | env_bushes | OK | OK | OK |
| 1537 | env_tree1 | OK | OK | OK |
| 1538 | env_tree4 | OK | OK | OK |
| 1543 | env_tree2 | OK | OK | OK |
| 1545 | env_tree3 | OK | OK | OK |

### Christmas/Season — 2018 City Festival (5 items PUBLIC_GOOD)

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 8728 | xmas_c18_deer_comet | OK | OK | OK |
| 8729 | xmas_c18_stocking_snoopy | OK | OK | OK |
| 8730 | xmas_c18_souvenir | OK | OK | OK |
| 8731 | xmas_c18_deer_dasher | OK | OK | OK |
| 8733 | xmas_c18_snowfootball | OK | OK | OK |

### Classic Furni — Diner (5 items PUBLIC_GOOD)

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 1220 | diner_tray_4 | OK | OK | OK |
| 1222 | diner_tray_2 | OK | OK | OK |
| 1223 | diner_rug | OK | OK | OK |
| 1234 | diner_shaker | OK | OK | OK |
| 1235 | diner_tray_5 | OK | OK | OK |

### House Building — Beds (5 items PUBLIC_GOOD)

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 8361 | val_r18_bed | OK | OK | OK |
| 10491 | bed_armas_two | OK | OK | OK |
| 10492 | bed_polyfon | OK | OK | OK |
| 10493 | bed_polyfon | OK | OK | OK |
| 10495 | pixel_bed_red | OK | OK | OK |

### Icon-Gray / Render OK — Cupid alt (5 items ICON_MISSING_RENDER_OK)

Icon gris en grilla pero .nitro + FD existen → preview debe cargar al seleccionar.

| ci_id | classname | icon | nitro | FD |
|-------|-----------|------|-------|-----|
| 42622799 | cupid_apart | GRAY | OK | OK |
| 42622800 | cupid_Bitterbranch | GRAY | OK | OK |
| 42622801 | cupid_BlackKnightdesk | GRAY | OK | OK |
| 42622802 | cupid_BlackKnightplatform | GRAY | OK | OK |
| 42622803 | cupid_BlackWarriorchair | GRAY | OK | OK |

---

## Checklist de prueba manual (Fernando)

URL: `http://localhost:8081/?sso=kodexa_admin_sso_local_2026`

### Setup antes de empezar

```
F12 → Network → Preserve log ON → Disable cache ON
F12 → Console → errores visibles
Ctrl+F5
```

### Por cada item de la muestra

```
1. Abrir categoría correspondiente en catálogo.
2. Verificar nombre limpio (no _name suffix, no vacío).
3. Verificar icon (OK o cuadrado gris para ICON_MISSING esperado).
4. Seleccionar item → verificar preview derecho renderiza.
5. Comprar (1 unidad, precio 3 créditos).
6. Verificar:
   - Diálogo de compra aparece correctamente.
   - Créditos se reducen.
   - Mensaje de confirmación.
7. Abrir inventario (mochila).
8. Verificar item aparece con nombre y forma.
9. Entrar a sala id=57.
10. Arrastrar item desde inventario a sala.
11. Verificar:
    - Render real en sala (forma del furniture, no gris).
    - Rotación funciona.
    - Doble clic abre menú de opciones.
12. Anotar errores de Console y 404 de Network.
```

### Clasificación de errores si ocurren

| Código | Descripción |
|--------|-------------|
| A | Falla la compra |
| B | Compra OK pero no llega a inventario |
| C | Llega a inventario sin nombre |
| D | Llega a inventario sin preview |
| E | Se puede colocar pero no renderiza |
| F | Renderiza forma incorrecta |
| G | Falta .nitro (404 en Network) |
| H | Falta FurnitureData entry |
| I | Falta texto/nombre |
| J | Error packet/Arcturus (ver Console WS) |
| K | Error DB inventory/room_items |
| L | Error créditos/moneda |

---

## Verificación DB después de comprar

Ejecutar tras cada compra para confirmar:

```sql
-- Créditos actuales
SELECT credits FROM users WHERE id=3;

-- Items en inventario (room_id=0)
SELECT i.id, i.item_id, ib.item_name, ib.public_name
FROM items i
JOIN items_base ib ON i.item_id=ib.id
WHERE i.user_id=3 AND i.room_id=0
ORDER BY i.id DESC
LIMIT 10;

-- Items colocados en sala
SELECT i.id, i.item_id, i.room_id, i.x, i.y, i.z, ib.item_name
FROM items i
JOIN items_base ib ON i.item_id=ib.id
WHERE i.user_id=3 AND i.room_id=57
ORDER BY i.id DESC
LIMIT 10;
```

Comando Docker:
```bash
docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT i.id, i.item_id, ib.item_name FROM items i JOIN items_base ib ON i.item_id=ib.id WHERE i.user_id=3 ORDER BY i.id DESC LIMIT 10;"
```

---

## Notas técnicas

### NitroWebsockets plugin
- Arcturus corre en port 3005 (game protocol), 2096 (WebSocket via NitroWebsockets-3.1.jar).
- Plugin convierte WS → Arcturus protocol internamente.
- Si hay errores de conexión: logs en `external/arcturus/objectretros/emulator/logging/`.

### Catalog purchase protocol
- Nitro envía `CatalogPurchaseComposer` → Arcturus lo procesa.
- Arcturus valida créditos, agrega item a `items` table, envía `PurchaseOKComposer`.
- Nitro actualiza inventario.

### Room placement protocol
- Nitro envía `PlaceObjectComposer` → Arcturus valida posición, actualiza `items.room_id`, `items.x`, `items.y`, `items.z`.
- Nitro renderiza via `AddFurnitureComposer`.

### Bloqueantes conocidos pre-test

| Check | Estado |
|-------|--------|
| Arcturus running | OK (PID 40680) |
| WebSocket port 2096 | LISTENING |
| DB connection (Arcturus→MariaDB) | OK |
| Admin credits suficientes (99,999) | OK |
| Room disponible | OK (id=57) |
| catalog_items_bc | VACÍO (no hay broken catalog) |
| FurnitureData.json | OK (30,991 entries, 29,955 classnames) |

---

## Fixes permitidos durante prueba

Si ocurre error bloqueante confirmado en un item específico:

```
PERMITIDO:
- copiar .nitro puntual si existe en external/ pero falta en assets/
- agregar fallback texto puntual si quedó un caso aislado
- documentar item no resoluble

NO PERMITIDO:
- mover/ocultar items masivamente
- reemplazar FurnitureData completo
- borrar inventario
- modificar catálogo masivamente
```

---

---

## MP-010.1B.1 — Bug fix + estado de inventory/placement

### Bug detectado: *N classname FD lookup

Durante MP-010.1A.5, la clasificacion usaba:
```python
cn = item_name.split('*')[0]  # 'classic3_bench*1' -> 'classic3_bench'
in_fd = cn in fd_classnames   # FD tiene 'classic3_bench*1', no 'classic3_bench' -> False
```

Resultado: 2,574 items con FD entry (bajo classname `*N`) clasificados como REVIEW y movidos a Desarrollo/Pendientes incorrectamente.

Fix aplicado: lookup doble — full item_name Y base classname.
Restaurados: 2,574 items a sus páginas originales.
112 páginas re-habilitadas (que volvieron a tener items).

### Estado post-fix

| Metrica | Pre-fix | Post-fix |
|---------|---------|----------|
| Desarrollo/Pendientes | 10,231 | **7,657** |
| Public rank 1 items | 19,829 | **22,403** |
| Verdaderamente sin FD | — | 7,507 |
| Misclasificados restaurados | — | 2,574 |

### DB confirma compra/inventario

Admin (user_id=3) tiene en inventory:

| instance_id | item_name | status | classification |
|-------------|-----------|--------|----------------|
| 50 | darkelegant_c20_flowerpot | placed room 50 | PUBLIC_GOOD — renderiza |
| 336 | js_exe_chair | in inventory | PUBLIC_GOOD — renderiza |
| 337 | habbos_cf_roundchair | in inventory | REVIEW_NO_FD — no renderiza |
| 338 | classic3_bench*1 | in inventory | ICON_MISSING_RENDER_OK — renderiza |

Item 337 (`habbos_cf_roundchair`): comprado antes de MP-010.1A.5. Tiene .nitro pero NO tiene FD entry. Al colocar en sala: mostrara placeholder o nada. Esperado — este item deberia estar en Desarrollo/Pendientes.

### Placement test pendiente (Fernando)

Entrar room 57 (`ssasas`). Abrir inventario. Probar:

| item | Render esperado |
|------|----------------|
| js_exe_chair (336) | **Vanilla Lounge Chair** — forma completa |
| classic3_bench*1 (338) | **Classic BB bench** — forma completa |
| habbos_cf_roundchair (337) | Placeholder/invisible — sin FD entry (esperado) |

Verificar DB post-placement:
```bash
docker exec kodexa-db mysql -u root -proot_password_change_me arcturus_main -e \
  "SELECT id, item_id, room_id, x, y, z FROM items WHERE user_id=3 AND id IN (336,337,338);"
```

Item colocado debe mostrar `room_id=57` y coordenadas x/y/z reales.

### Archivos creados en MP-010.1B.1

| Archivo | Descripcion |
|---------|-------------|
| `docs/arcturus/reports/catalog-audit/mp-010-1b1-fd-bug-correction.json` | Reporte del bug y corrección |
| `docs/arcturus/reports/catalog-audit/placement-render-test-results.json` | Validacion programatica 4 items |

---

## Archivos creados (total MP-010.1B)

| Archivo | Descripcion |
|---------|-------------|
| `docs/arcturus/reports/catalog-audit/purchase-placement-test-results.json` | Matriz 35 items, runtime TODO |
| `docs/arcturus/reports/catalog-audit/placement-render-test-results.json` | 4 items con FD/asset status |
| `docs/arcturus/reports/catalog-audit/mp-010-1b1-fd-bug-correction.json` | Bug fix report |
| `docs/arcturus/mp-010-1b-purchase-inventory-placement-validation.md` | Este documento |

---

## Validaciones obligatorias

- kodexa_hotel — NO modificado
- arcturus_dev — NO modificado
- arcturus_main — NO reseteado
- catalog_pages — NO borrado
- catalog_items — NO borrado
- items_base — NO tocado
- inventario — NO borrado completamente
- Prisma — NO tocado
- migrations — NO tocadas
- middleware — NO tocado
- Auth Bridge — NO implementado
- /hotel, /me, /register — NO tocados
- diseño SWF/Nitro — NO modificado
- external/ — NO agregado a Git

---

## Entrega programática (pre-browser)

| # | Item | Estado |
|---|------|--------|
| 1 | Servicios confirmados | OK — Arcturus + Docker running |
| 2 | Usuario rank 1 + credits 99,999 | OK |
| 3 | Room disponible (id=57) | OK |
| 4 | 35 items pre-validados en disco | OK |
| 5 | 30 PUBLIC_GOOD (nitro+icon+FD) | OK |
| 6 | 5 ICON_MISSING_RENDER_OK (gray icon) | OK |
| 7 | Precios: 3 créditos c/u | OK |
| 8 | Matrix JSON creada | OK |
| 9 | DB snapshot pre-test | credits=99999, inv=2, placed=1 |
| 10 | NitroWebsockets plugin activo | OK (port 2096) |

**Pendiente:** Prueba runtime en browser (Fernando).

---

## Proximos pasos post-validacion

| Resultado | Accion |
|-----------|--------|
| Todo fluye OK | Listo para MP-010.2 (furniture imager / icons) |
| Errores puntuales | Fixes dirigidos en este mismo MP |
| Error bloqueante sistémico | Nuevo MP específico antes de MP-010.2 |

---

## MP-010.2 — Objetivo

Furniture imager: generar iconos (_icon.png) para los 6,240 items ICON_MISSING_RENDER_OK.
Esto eliminará los últimos cuadrados grises del catálogo público.
