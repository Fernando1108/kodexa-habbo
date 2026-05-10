# MP-008 — Import ObjectRetros / Morningstar 3.5.5 → arcturus_main

> **Fecha:** 2026-05-10
> **Estado:** Completado
> **DB afectada:** `arcturus_main` (nueva, vacía antes de este MP)
> **DBs no afectadas:** `kodexa_hotel` ✅ 26 tablas (sin cambios) | `arcturus_dev` ✅ 0 tablas (sin cambios)

---

## Archivos SQL importados

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `external/arcturus/objectretros/BaseDB MS 3.5.5.sql` | ~11 MB | Schema completo + datos base |
| `external/arcturus/objectretros/catalog.sql` | ~11 MB | Datos de catálogo (no crea tablas nuevas) |

**Fuente:** ObjectRetros / Morningstar 3.5.5 (fork de Arcturus)
**Nota:** Los originales NO se modificaron — el fix de collation se aplicó in-memory via pipe.

---

## Problema resuelto — Collation incompatible

MariaDB 10.11 no soporta `utf8mb4_0900_ai_ci` (es collation exclusiva de MySQL 8.0).

**Error sin fix:**
```
ERROR 1273 (HY000): Unknown collation: 'utf8mb4_0900_ai_ci'
```

**Solución:** Pipe en-memoria sin modificar el archivo:
```bash
sed 's/utf8mb4_0900_ai_ci/utf8mb4_unicode_ci/g' "BaseDB MS 3.5.5.sql" \
  | docker exec -i kodexa-db mysql -u root -proot_password_change_me arcturus_main
```

---

## Credenciales MariaDB

| Dato | Valor |
|------|-------|
| Host | `localhost:3306` (via Docker) |
| Container | `kodexa-db` |
| Root user | `root` |
| Root password | `root_password_change_me` |
| DB user | `kodexa` |
| DB password | `kodexa_pass_change_me` |

---

## Resultado del import

### Tablas creadas en arcturus_main: 122

```
achievements              achievements_talents       bans
bot_serves                bots                       calendar_campaigns
calendar_rewards          calendar_rewards_claimed   camera_web
catalog_clothing          catalog_club_offers        catalog_featured_pages
catalog_items             catalog_items_bc           catalog_items_limited
catalog_pages             catalog_pages_bc           catalog_target_offers
chatlogs_private          chatlogs_room              commandlogs
crafting_altars_recipes   crafting_recipes           crafting_recipes_ingredients
emulator_errors           emulator_settings          emulator_texts
gift_wrappers             groups_items               guild_forum_views
guilds                    guilds_elements            guilds_forums_comments
guilds_forums_threads     guilds_members             hotelview_news
items                     items_base                 items_crackable
items_highscore_data      items_hoppers              items_presents
items_teleports           logs_hc_payday             logs_shop_purchases
marketplace_items         messenger_categories       messenger_friendrequests
messenger_friendships     messenger_offline          namechange_log
navigator_filter          navigator_flatcats         navigator_publiccats
navigator_publics         nux_gifts                  old_guilds_forums
old_guilds_forums_comments permissions              pet_actions
pet_breeding              pet_breeding_races         pet_breeds
pet_commands              pet_commands_data          pet_drinks
pet_foods                 pet_items                  pet_vocals
polls                     polls_answers              polls_questions
recycler_prizes           room_bans                  room_enter_log
room_game_scores          room_models                room_models_custom
room_mutes                room_promotions            room_rights
room_trade_log            room_trade_log_items       room_trax
room_trax_playlist        room_votes                 room_wordfilter
rooms                     sanction_levels            sanctions
soundtracks               special_enables            support_cfh_categories
support_cfh_topics        support_issue_categories   support_issue_presets
support_presets           support_tickets            trax_playlist
user_window_settings      users                      users_achievements
users_achievements_queue  users_badges               users_clothing
users_currency            users_effects              users_favorite_rooms
users_ignored             users_navigator_settings   users_pets
users_recipes             users_saved_searches       users_settings
users_subscriptions       users_target_offer_purchases users_wardrobe
voucher_history           vouchers                   wired_rewards_given
wordfilter                youtube_playlists
```

---

## Auditoría de datos críticos

### Contenido base importado

| Tabla | Filas | Descripción |
|-------|-------|-------------|
| `items_base` | 36,269 | Muebles definidos (sprites, dimensiones, interacciones) |
| `catalog_items` | 35,574 | Items del catálogo (precios, límites, etc.) |
| `catalog_pages` | 1,357 | Páginas del catálogo organizadas |
| `catalog_clothing` | 589 | Ropa disponible en catálogo |
| `achievements` | 732 | Logros del hotel |
| `room_models` | 60 | Modelos de sala con heightmaps |
| `emulator_settings` | 340 | Configuraciones del emulador |
| `emulator_texts` | 764 | Textos/strings del emulador |
| `permissions` | 7 | Rangos configurados |
| `rooms` | 7 | Salas bundle por defecto (Systemaccount) |
| `wordfilter` | 1 | Palabras filtradas (solo base) |
| `users` | 1 | Solo Systemaccount |
| `bans` | 0 | Vacío |
| `users_currency` | 1 | Solo entrada de Systemaccount |

### Usuarios por defecto

| ID | Username | Mail | Rank |
|----|----------|------|------|
| 1 | Systemaccount | mail@hoster.de | 1 |

### Rangos (tabla `permissions`)

| ID | Nombre | Nivel |
|----|--------|-------|
| 1 | Member | 1 |
| 2 | VIP | 2 |
| 3 | X | 3 |
| 4 | Support | 4 |
| 5 | Moderator | 5 |
| 6 | Super Mod | 6 |
| 7 | Administrator | 7 (badge=ADM, prefix=ADM) |

### Salas por defecto

| ID | Nombre | Modelo | Propietario |
|----|--------|--------|-------------|
| 1-7 | Bundle rooms | Varios | Systemaccount |

---

## Estructura tablas clave

### `bans`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int PK | |
| `user_id` | int | FK → users |
| `ip` | varchar(50) | |
| `machine_id` | varchar(255) | |
| `user_staff_id` | int | Admin que baneó |
| `timestamp` | int | Unix timestamp |
| `ban_expire` | int | Unix timestamp (0 = permanente) |
| `ban_reason` | varchar(200) | |
| `type` | enum | `account`, `ip`, `machine`, `super` |
| `cfh_topic` | int | |

**Nota para CMS:** `type` en arcturus es `account/ip/machine/super`. El CMS usa `ban/ipban/superban` — necesita mapeo al integrar. Los bans actuales del CMS (`/admin/bans`) no leen de arcturus_main (aún).

### `users_currency`

| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | int PK | |
| `type` | int PK | -1=credits, 0=duckets, 5=diamonds, 101=points |
| `amount` | int | |

**Tipos de moneda:**

| type | Moneda |
|------|--------|
| -1 | Créditos |
| 0 | Duckets |
| 5 | Diamonds |
| 101 | Points (GOTW) |

### `users_settings`

Tabla con 52+ campos incluyendo: `credits`, `achievement_score`, `daily_respect_points`, `can_trade`, `volume_system/furni/trax`, `home_room`, `online_time`, `club_expire_timestamp`, `login_streak`, `hof_points`, `max_rooms` (50), `max_friends` (300).

### `emulator_settings` — Columna importante

**Nota:** La columna se llama `key` (no `property`) — es palabra reservada SQL, requiere backticks:
```sql
SELECT `key`, value FROM emulator_settings WHERE `key` = 'hotel.name';
```

Configuraciones relevantes por defecto:
- `hotel.name` = "Habbo Hotel"
- `hotel.home.room` = 0

---

## Configuraciones a actualizar antes de MP-009

| Setting | Valor actual | Valor recomendado |
|---------|-------------|-------------------|
| `hotel.name` | Habbo Hotel | Kodexa Hotel |
| `hotel.home.room` | 0 | ID de sala lobby |
| `hotel.users.max` | (revisar) | Según capacidad VPS |

---

## Validaciones finales

| Verificación | Resultado |
|-------------|-----------|
| `arcturus_main` creada y poblada | ✅ 122 tablas |
| `kodexa_hotel` no modificada | ✅ 26 tablas (sin cambios) |
| `arcturus_dev` no modificada | ✅ 0 tablas (sin cambios) |
| Archivos SQL originales sin modificar | ✅ Fix aplicado solo in-memory |
| Collation compatible con MariaDB 10.11 | ✅ `utf8mb4_unicode_ci` |
| items_base poblada | ✅ 36,269 muebles |
| catalog_items poblada | ✅ 35,574 items |
| permissions poblada | ✅ 7 rangos |

---

## Restricciones cumplidas

| Restricción | Estado |
|-------------|--------|
| No modificar `kodexa_hotel` | ✅ |
| No modificar `arcturus_dev` | ✅ |
| No modificar archivos SQL originales | ✅ |
| No tocar Prisma schema del CMS | ✅ |
| No tocar código del CMS | ✅ |

---

## Próximo microproceso

**MP-009 — Conectar Nitro Client a Arcturus Main**

- Configurar `emulator_settings` con datos de Kodexa Hotel
- Conectar `apps/emulator` a `arcturus_main` (DATABASE_URL)
- Verificar handshake Nitro ↔ emulador
- Validar auth flow: CMS login → SSO → Nitro client → emulador
