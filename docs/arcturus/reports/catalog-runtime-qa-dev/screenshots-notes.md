# MP-017 — Screenshots & Manual QA Notes

## Estado

Este archivo reservado para notas de QA manual en browser (MP-017B).

MP-017 fue auditoría estática. Browser QA pendiente.

---

## Pendiente — MP-017B

### Items a probar manualmente en /hotel-dev

Selección de 1 item por categoría 100% OK:

| Categoría | Item sugerido | page_id | base_id | Precio |
|----------|--------------|---------|---------|--------|
| Japan | japan_door | 31 | — | verificar |
| Gothic | gothic_chair | 30 | — | verificar |
| Scifi | sci_table | 36 | — | verificar |
| Music | trax_machine | 1258 | — | verificar |
| Wired | wf_trg_enter | Wired Society | — | 0c |
| Classic Rares | throne | 663 | 230 | 10000c |
| Exchange | credit_furni | 914 | — | — |
| Paintings | painting | 491 | — | verificar |

### Checklist por item

- [ ] Comprar en /hotel-dev
- [ ] Confirmar créditos descontados (arcturus_dev.users.credits)
- [ ] Confirmar INSERT en arcturus_dev.items
- [ ] Confirmar NO INSERT en arcturus_main.items
- [ ] Confirmar aparece en inventario Nitro Dev
- [ ] Colocar en sala 57 (Kodexa Catalog QA Lab)
- [ ] Confirmar UPDATE room_id en arcturus_dev.items
- [ ] Observar render visual (OK / placeholder / bloque / icono gris)
- [ ] Capturar consola del browser (errores 404 de assets)

### Sala QA

room_id=57 — "Kodexa Catalog QA Lab" — model_c — arcturus_dev ONLY
