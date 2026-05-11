# MP-017 — Catalog Runtime QA Dev: Summary Report

**Date:** 2026-05-11
**Environment:** arcturus_dev / Nitro Dev :8082 / WS :2097
**Auditor:** Static analysis — DB cross-reference vs filesystem assets
**QA Room:** room_id=57 (Kodexa Catalog QA Lab, model_c)

---

## Asset Coverage

| Asset Type | Count | Notes |
|-----------|-------|-------|
| .nitro furniture files | 30,517 | All furniture assets on disk |
| Icon PNG files | 16,657 | Catalog item icons on disk |
| FurnitureData.json entries | 14,393 | What Nitro can actually render |
| Active catalog items (unique) | 21,083 | Excl. Desarrollo/Pendientes page |
| Desarrollo/Pendientes items | 7,657 | Hidden (rank 9+ only) |
| Total catalog_items rows | 35,574 | Full DB count |
| items_base entries | 36,269 | Full furniture definitions |

---

## Render Status (Active Catalog, 21,083 unique items)

| Status | Count | % | Meaning |
|--------|-------|---|---------|
| ok | 9,123 | 43.3% | FurnitureData + .nitro + icon — renders correctly in Nitro |
| placeholder | 11,909 | 56.5% | Has .nitro, NO FurnitureData — gray box in Nitro |
| ok_no_icon | 38 | 0.18% | FurnitureData + .nitro, missing catalog icon |
| broken | 13 | 0.06% | No FurnitureData AND no .nitro — completely broken |

---

## Page Coverage

| Category | Count |
|---------|-------|
| Pages with 100% OK items | 363 |
| Pages with 0% OK (all placeholder) | 424 |
| Pages with mixed coverage | 153 |

---

## Root Cause Analysis

**Primary issue:** FurnitureData.json has only 14,393 entries vs 29,825 unique item_names in the full catalog.

The objectretros/myBoBBa community imported thousands of furniture items that have:
- .nitro assets on disk (30,517 files)
- items_base DB entries (36,269 rows)
- **No FurnitureData.json entry**

Without FurnitureData, Nitro cannot render — shows gray placeholder box.

**This is NOT a .nitro asset problem.** The assets exist. The bottleneck is FurnitureData coverage.

---

## Pages — 100% OK (keep_public) — Top 30

| Page | Category | Items |
|------|---------|-------|
| Spaces | deep | 274 |
| Finished Craftables | deep | 135 |
| Japan | Classic | 87 |
| Music | Classic | 79 |
| School | Classic | 76 |
| Artwork | Classic | 76 |
| 2008 - Arctic | deep | 64 |
| 2011 - Winter Cabin | deep | 63 |
| 2015 - Bavarian | deep | 63 |
| 2023 - Chocolatier | deep | 62 |
| Wild Wild West | Classic | 60 |
| Rainy Day | Classic | 61 |
| Asian | Classic | 59 |
| University | Classic | 58 |
| Scifi | Classic | 58 |
| Habbo-Lympix | Classic | 57 |
| Jungle | Classic | 57 |
| Army Bootcamp | Classic | 56 |
| Paintings | Classic | 51 |
| Habbo University | Classic | 56 |
| Banzai | deep | 35 |
| Glass | Classic | 37 |
| Neon | deep | 34 |
| Gothic | Classic | 39 |
| Lost Tribe | deep | 21 |
| Lodge | deep | 20 |
| 2009 - Shalimar | deep | 19 |
| Alhambra | deep | 16 |
| Twilight | deep | 17 |
| Mode | deep | 16 |

---

## Pages — 0% OK (all placeholder) — Top 30

These pages should be moved to Desarrollo/Pendientes or disabled pending FurnitureData fix.

| Page | Category | Items |
|------|---------|-------|
| Pokemon | deep | 1,605 |
| Classic Letters | deep | 364 |
| Haaziq | deep | 174 |
| Circus | deep | 143 |
| Japandi | deep | 123 |
| Pink Sakura | deep | 120 |
| Bento | deep | 112 |
| Pillows & Blankets | deep | 102 |
| Planks & Beams | deep | 102 |
| Flexy | deep | 102 |
| Wall Decorations | Classic | 86 |
| Habboween 23 | deep | 82 |
| Anna | Classic | 50 |
| Yummy | deep | 51 |
| Cone | Builders Club | 69 |
| Cylinder | Builders Club | 69 |
| Half Cylinder | Builders Club | 69 |
| Hemisphere | Builders Club | 69 |
| Pyramid | Builders Club | 69 |
| Quarter Ring | Builders Club | 69 |
| Sphere | Builders Club | 69 |
| Standing Half Cylinder | Builders Club | 69 |
| Wedge | Builders Club | 69 |
| Triangular Prism | Builders Club | 69 |
| Glass Panel | Builders Club | 69 |
| Standing Triangular Prism | Builders Club | 69 |
| Large | Builders Club | 69 |
| Small | Builders Club | 69 |
| Round | Builders Club | 69 |
| Rollers | deep | 10 |

---

## Completely Broken Items (13 — no FurnitureData AND no .nitro)

| item_name | Page | Notes |
|-----------|------|-------|
| a0 pet20 (Bunny Manic) | Pets | Missing pet assets |
| a0 pet21 (Pigeon Wise) | Pets | Missing pet assets |
| a0 pet22 (Pigeon Cunning) | Pets | Missing pet assets |
| a0 pet23 (Monkey Evil) | Pets | Missing pet assets |
| a0 pet25 (Terrier Puppies) | Pets | Missing pet assets |
| Black Dino Egg | Limited Edition | Item ID mismatch |
| black_iwall | Modifications | Custom wall texture |
| black_swall | Modifications | Custom wall texture |
| black_corner | Modifications | Custom corner texture |
| grunge_wall | Broken/Unused | Already classified broken |
| Rainbow_fountain | Broken/Unused | Already classified broken |
| wf_act_givexp | Unused Wired | Already classified unused |
| black11_ladyyy (via "black" prefix) | Easter | Name lookup ambiguity |

Note: Last 3 are already in Broken/Unused/Unused Wired pages — correct classification.
Pet items may work via pet.asset.url pipeline (separate from furniture) — needs browser validation.

---

## Recommendations by Priority

### P1 — Keep public (no action)
- 363 catalog pages, 9,123 items render correctly
- Classic Habbo furniture lines (Japan, Gothic, Glass, Scifi, etc.) all OK

### P2 — FurnitureData expansion (biggest impact — MP-018)
- 11,909 items have .nitro but no FurnitureData entry
- Fix: generate FurnitureData.json entries from items_base + .nitro manifests
- Affects: Builders Club shapes, Wall Decorations, Anna, Yummy, Pokemon, etc.

### P3 — Icon generation (38 items)
- Have FurnitureData + .nitro but missing catalog icon PNG
- Run furniture imager icon export for these items

### P4 — Full investigation (13 items)
- Pet items: validate via pet.asset.url pipeline in browser
- black_* walls: need wall/floor texture pipeline
- Broken/Unused items: leave as-is (correctly classified)

### P5 — Catalog page cleanup (424 pages)
- Disable (visible=0) all pages where 100% items are placeholder
- Or move to Desarrollo/Pendientes
- Do NOT do this in main — only dev first, then replicate after validation

---

## Separation Validation

| Table | Before | After | Delta |
|-------|--------|-------|-------|
| arcturus_main.items | 338 | 338 | 0 |
| arcturus_dev.items | 0 | 0 | 0 |
| arcturus_main.users | 3 | 3 | 0 |
| arcturus_dev.users | 1 | 1 | 0 |
| arcturus_main.rooms | 8 | 8 | 0 |
| arcturus_dev.rooms | 7 | 8 | +1 (QA Lab) |

arcturus_main auth_ticket unchanged: `kodexa_1_a33902de...`
No purchases performed — audit was static analysis only.

---

## Limitations

1. No browser-based purchase/placement/render testing — static analysis only. Manual QA in /hotel-dev needed for MP-017B.
2. FurnitureData cross-reference by classname — items where item_name diverges from classname convention may produce false mismatches.
3. Icon check by filename convention — some icons use non-standard param suffixes not caught.
4. Pet items shown as broken — pets use separate render pipeline, may work in practice.
5. Builders Club shapes (14 pages) — may need BC-specific FurnitureData extension, not standard furni imager.

---

## Proximos MPs recomendados

**MP-018 — FurnitureData Expansion + Catalog Cleanup:**
- Generate FurnitureData.json entries for 11,909 placeholder items
- Run furniture imager for 38 missing icons
- Batch UPDATE: set visible=0 for 424 all-placeholder pages in arcturus_dev first
- Validate in /hotel-dev before applying to main

**MP-017B — Manual Purchase/Placement QA (requires browser):**
- Enter /hotel-dev, test purchase 1 item per OK category
- Confirm arcturus_dev.items insert, NO arcturus_main.items change
- Test placement in room 57 (QA Lab)
- Document visual render per category line
