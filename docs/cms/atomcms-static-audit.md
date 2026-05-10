# MP-CMS-001 — Auditoría Estática AtomCMS

> **Tipo:** Documentación / Referencia  
> **Estado:** Completado  
> **Fecha:** 2026-05-10  
> **Regla:** Solo lectura. Sin ejecución. Sin modificación de archivos AtomCMS.  
> **Ruta auditada:** `external/cms/atomcms/`

---

## 1. Resumen Ejecutivo

### Qué es AtomCMS

AtomCMS es un CMS de código abierto para hoteles retro tipo Habbo, construido sobre **Laravel 13.x** (PHP 8.5+). Diseñado específicamente para conectarse a la base de datos de **Arcturus Morningstar** — comparte tablas con el emulador en lugar de tener su propio esquema independiente.

Su panel de administración (Housekeeping) usa **Filament v5**, un framework PHP UI que requiere una suscripción privada en `packages.filamentphp.com`. Esto es la razón por la que `composer install` falla sin credenciales.

### Módulos que intenta cubrir

| Categoría | Módulos |
|-----------|---------|
| **Auth** | Login, registro, 2FA (TOTP), recuperación de contraseña, beta codes, SSO tickets |
| **Usuario** | Perfil, guestbook, configuración de cuenta, sesiones, referidos |
| **Comunidad** | Artículos/noticias, staff, equipos, aplicaciones staff, leaderboard, fotos (Camera), valores raros |
| **Juego** | Cliente Nitro (HTML5), cliente Flash (legacy), catálogo, habitaciones, logros |
| **Home** | Sistema de "habitación personal" web con items decorativos y mensajes |
| **Shop** | Tienda con PayPal, vouchers, paquetes |
| **Help Center** | Tickets de soporte, reglas del hotel |
| **Housekeeping** | Gestión usuarios, bans, permisos, artículos, catálogo, emulador settings, logs, wordfilter |
| **Seguridad** | IP whitelist/blacklist, VPN checker, Turnstile captcha, rate limiting |
| **Infraestructura** | RCON TCP, FindRetros API, multiidioma, temas |

### Qué partes son útiles para Kodexa.Hotel

- **Mapa funcional completo**: AtomCMS define exactamente qué módulos necesita un hotel retro moderno.
- **Lista de housekeeping permissions**: 28 permisos granulares bien documentados — usar como base.
- **Esquema de rutas web**: Estructura de URLs clara para replicar en Next.js.
- **RCON commands**: Referencia de comandos que el emulador Arcturus entiende (crítico para MP-011+).
- **Tablas propias del CMS** (`website_*`): Qué datos son del CMS vs. qué viene de Arcturus.
- **Lógica de SSO ticket**: Cómo genera y valida el ticket que pasa al cliente del juego.
- **Currencies**: duckets=0, diamonds=5, points=101 (tipos numéricos de Arcturus).
- **Emulator drivers**: Patrón de abstracción con `ArcturusDriver` / `SadieDriver` útil para nuestro `Auth Bridge`.

### Qué partes NO debemos copiar

| Qué | Por qué |
|-----|---------|
| Filament como panel admin | Requiere suscripción privada, acoplado a PHP/Laravel |
| Fortify para auth | Nuestro stack usa NextAuth.js v5 |
| Livewire/Blade para UI | Nuestro stack usa React 19 |
| Theme system (qirolab/laravel-themer) | Reemplazado por Tailwind + CSS variables |
| Flash client | Tecnología obsoleta, solo Nitro |
| `users` table modifications | La tabla `users` pertenece a Arcturus, solo leemos/escribimos lo mínimo necesario |
| PayPal directo | Evaluar Stripe como alternativa más moderna |

---

## 2. Mapa de Módulos Detectados

### 2.1 Autenticación (`auth`)
- **Login**: vía Laravel Fortify, ruta `/` (homepage con login), throttle 15/minuto
- **Registro**: `RegisteredUserController`, con Turnstile o reCAPTCHA, validación de beta code opcional
- **2FA**: TOTP via Fortify `TwoFactorAuthentication`, con confirmación y códigos de recuperación
- **Middleware `force.staff.2fa`**: Fuerza 2FA para cualquier usuario con rango >= `can_access_housekeeping` (6+)
- **Password reset**: Token con TTL configurable via `PASSWORD_RESET_TOKEN_TIME` (default 15 min)
- **Banned middleware**: Redirige a `/banned` si existe ban activo no expirado (`ban_expire > now()`)
- **Conversión de contraseñas**: Soporte legacy MD5→bcrypt via `CONVERT_PASSWORDS=true`

### 2.2 Registro
- Formulario con username, email, contraseña, birthday, género, código de referido
- Validación: `WebsiteWordfilterRule` (no palabras prohibidas en username), `BetaCodeRule`, `TurnstileCheck` / `GoogleRecaptchaRule`
- Al crear usuario: genera `referral_code`, crea entrada en `user_referrals`, dispara observer `UserObserver`

### 2.3 Perfil de Usuario
- Ruta `/profile/{user:username}` (pública para autenticados)
- Muestra: avatar (lookup Habbo), motto, badges, habitaciones, amigos online, guestbook
- Guestbook: crear/eliminar entradas (`/profile/{user}/guestbook`)
- `/user/me` → panel personal del usuario autenticado
- Claims: referral reward via `/user/claim/referral-reward`

### 2.4 Sesiones
- Driver de sesión: `database` (tabla `sessions`)
- Session logs: visible en `/user/settings/session-logs`
- `SessionService` registra login/logout con IP y user agent

### 2.5 Seguridad
- **VPN Checker** (`VPNCheckerMiddleware`): bloquea acceso a `/game/*` desde VPNs
- **IP Blacklist/Whitelist** (`website_ip_blacklist`, `website_ip_whitelist`)
- **FindRetros** (`FindRetrosMiddleware`): redirige a FindRetros si está habilitado
- **MaintenanceMiddleware**: redirige a `/maintenance` si el hotel está en mantenimiento
- **RealClientIpMiddleware**: detecta IP real detrás de Cloudflare
- **CSRF** y **EncryptCookies** estándar de Laravel

### 2.6 Captcha / Turnstile
- Soporte dual: Cloudflare Turnstile (preferido) o Google reCAPTCHA
- Configurado via `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` o `GOOGLE_RECAPTCHA_*`
- Aplicado en: registro, (opcionalmente login)
- Regla de validación: `TurnstileCheck`, `GoogleRecaptchaRule`

### 2.7 Noticias / Artículos
- Modelo: `WebsiteArticle` (slug único, autor, categorías via tags, soft delete)
- Tags: sistema polimórfico (`tags` + `taggables`) para artículos
- Reacciones: 29 tipos (happy, fire, crown, etc.) en `website_article_reactions`
- Comentarios: `WebsiteArticleComment` con moderación
- Rutas: `/community/articles`, `/community/article/{slug}`
- Filament: CRUD completo, gestión de tags, publicación/despublicación

### 2.8 Staff / Housekeeping
- Página pública: `/community/staff` — muestra staff por rango, con badge y descripción
- Equipos: `/community/teams` — grupos tipo "Design Team", "Support Team"
- Aplicaciones staff: `/community/staff-applications/{position}`, `/community/team-applications/{position}`
- Posiciones abiertas: `website_open_positions` — nombre, descripción, rango requerido, equipo
- Housekeeping = panel Filament en `/admin` (solo accesible con `can_access_housekeeping`)

### 2.9 Usuarios (Housekeeping)
- Lista, vista, edición, creación de usuarios
- Sub-relaciones: badges, chat logs (público y privado), settings
- Acciones: cambiar rango, reset password, ban, send currency/furniture via RCON
- Filament resource: `UserResource` con filters y sorting

### 2.10 Rangos
- Tabla `permissions` de Arcturus — AtomCMS la lee y extiende con campos de UI
- Campos agregados por migraciones de AtomCMS: `hidden_rank`, `staff_color`, `staff_background`
- Gestión via Filament `PermissionResource`
- Filament puede editar todos los `cmd_*` y `acc_*` de Arcturus

### 2.11 Permisos (Housekeeping)
- Dos sistemas paralelos:
  1. **`permissions` (Arcturus)**: `cmd_*`/`acc_*` — lo que el usuario puede hacer IN-GAME
  2. **`website_housekeeping_permissions`**: lo que el staff puede hacer EN EL HOUSEKEEPER web
- `HousekeepingPermissionsService.php` centraliza la lógica de `hasHousekeepingPermission()`
- `WebsitePermission` (`website_permissions`): key-value store de permisos configurables del sitio

### 2.12 Bans
- Tabla `bans` (Arcturus) — tipos: `account`, `ip`, `machine`, `super`
- Filtro en middleware: `ban_expire > time()` y tipo en `['account', 'super']`
- Gestión Filament: `BanResource`, `manage_bans` permission requerida (min rank 6)
- RCON: no hay comando directo de ban via RCON — se escribe en DB directamente

### 2.13 Logs
- **Activity Log** (spatie/laravel-activitylog): tabla `activity_log`, registra cambios en User (id, username, motto, rank, credits)
- **Chat logs**: tablas Arcturus `chatlog_room`, `chatlog_private`
- **Command logs**: tabla Arcturus `commandlog`
- **Session logs**: tabla `sessions` (Laravel)
- Permisos: `view_activity_logs`, `manage_room_chatlogs`, `manage_private_chatlogs`, `manage_commandlogs` (min rank 7)
- Log viewer: `opcodesio/log-viewer` integrado (acceso via `LogViewerMiddleware`)

### 2.14 Economía
- **Créditos**: campo `credits` en tabla `users` (Arcturus)
- **Pixels**: campo `pixels` en tabla `users`
- **Monedas alternativas** (`user_currencies`): duckets (type=0), diamonds (type=5), points/GOTW (type=101)
- **Website balance**: campo `website_balance` en `users` — saldo interno del sitio (para shop)
- **Vouchers**: `website_shop_vouchers` — códigos redimibles por saldo web
- **Referidos**: sistema de recompensas por referidos, configurable via settings

### 2.15 Tienda / PayPal
- Rutas: `/shop/{category:slug?}`, `/shop/purchase/{package}`, `/shop/voucher`
- PayPal SDK (`srmklive/paypal`), modo sandbox/live configurable
- Flujo: process → PayPal → successful/cancelled webhook
- Paquetes: `website_shop_articles` con features, categorías, precio en USD
- Al completar pago: acredita `website_balance`, registra en `website_paypal_transactions`
- Giftable: algunos paquetes se pueden regalar

### 2.16 RCON
- `RconService`: TCP socket (AF_INET, SOCK_STREAM, SOL_TCP)
- Conecta a `rcon_ip:rcon_port` (configurado en website settings, no .env)
- Payload: JSON `{"key": "command", "data": {...}}`
- Comandos disponibles: `sendgift`, `givecredits`, `givebadge`, `setmotto`, `updatewordfilter`, `disconnect`, `givepoints`, `setrank`, `updatecatalog`, `alertuser`, `forwarduser`, `executecommand`
- Sin respuesta: comandos son fire-and-forget (no lee response del socket)
- Configurado en `config/habbo.php` → `rcon.domain/type/protocol`

### 2.17 Configuración del Hotel
- `website_settings` (tabla key-value): nombre hotel, rutas de assets, nitro path, RCON IP/port, etc.
- Helper global `setting('key')` disponible en toda la app
- Gestión Filament: `CmsSettingResource`, `EmulatorSettingResource`, `EmulatorTextResource`
- `EmulatorSetting`/`EmulatorText`: tablas propias de Arcturus que AtomCMS edita directamente

### 2.18 Themes
- `qirolab/laravel-themer` — multiples themes con Vite
- Themes incluidos: `atom`, `dusk` (build separado por theme)
- `SetThemeMiddleware`: detecta theme activo desde settings
- CSS: Tailwind + variables CSS por theme
- Comando: `BuildTheme` artisan command

### 2.19 Multiidioma
- 12 idiomas: `br`, `da`, `de`, `en`, `es`, `fi`, `fr`, `it`, `nl`, `no`, `se`, `tr`
- `LocalizationMiddleware`: detecta locale desde sesión
- Ruta: `/language/{locale}` para cambiar idioma
- `LocaleController` guarda locale en sesión
- Archivos JSON + directorios por idioma en `lang/`

### 2.20 Cliente Nitro / Flash
- **Nitro**: `NitroController` → renderiza el cliente HTML5, path configurable via `NITRO_CLIENT_PATH`
- **Flash**: `FlashController` → cliente legacy SWF, `FLASH_CLIENT_ENABLED=false` por defecto
- Ruta: `/game/nitro`, `/game/flash` — auth requerida + `findretros.redirect` + `vpn.checker`
- SSO ticket: `$user->ssoTicket()` genera UUID único, se escribe en `users.auth_ticket`

### 2.21 Home (Perfil Web Personal)
- Sistema de "habitación decorativa" en el sitio web (no confundir con salas del juego)
- Items: stickers, backgrounds, widgets — categorizados y con precio en website_balance
- `home_categories`, `home_items`, `user_home_items`, `user_home_ratings`, `user_home_messages`
- ~25 categorías seed: Alhambra, Artists, Backgrounds, Pirates, Sports, etc.
- API JSON para: placed items, inventory, shop categories, balance
- NOTA: esto es un feature propio de AtomCMS, NO existe en Arcturus

### 2.22 Draw Badge
- Feature gamificado: compra badge aleatoria de un pool (`website_drawbadge`)
- Costo en créditos configurable
- Observer `WebsiteDrawBadgeObserver` para cleanup
- Filament resource: `WebsiteDrawBadgeResource`

### 2.23 Valores Raros (Rare Values)
- Lista pública de items raros con precio estimado
- Tablas: `website_rare_value_categories`, `website_rare_values`
- Búsqueda por nombre

### 2.24 Help Center / Tickets
- Tickets de soporte del usuario: crear, editar, responder, cambiar estado
- Categorías de tickets (`website_help_center_categories`)
- Staff puede ver todos los tickets abiertos (`/help-center/tickets/all`)
- Reglas del hotel: `website_rule_categories` + `website_rules`

---

## 3. Mapa de Modelos

| Modelo | Tabla | Responsabilidad | Relaciones clave | Utilidad para Kodexa |
|--------|-------|-----------------|------------------|----------------------|
| `User` | `users` (Arcturus) | Usuario del hotel | permission, badges, rooms, friends, currencies, ban, items, tickets, transactions | CRÍTICO — misma tabla Arcturus |
| `Permission` | `permissions` (Arcturus) | Rango + permisos in-game | users (HasMany) | CRÍTICO — define qué puede hacer in-game |
| `WebsiteHousekeepingPermission` | `website_housekeeping_permissions` | Permisos del panel admin por rango | - | ADAPTAR: mismo concepto, tabla propia kx_ |
| `WebsiteArticle` | `website_articles` | Noticias/artículos del sitio | tags, comments, reactions, author (User) | ADAPTAR: tabla `News` ya existe en kodexa_hotel |
| `Ban` | `bans` (Arcturus) | Bans de usuarios | user | LEER desde Arcturus, escribir con cuidado |
| `Room` | `rooms` (Arcturus) | Salas del juego | owner (User) | SOLO LECTURA |
| `Item` | `items` (Arcturus) | Items en inventario usuario | user, itemBase | SOLO LECTURA |
| `ItemBase` | `items_base` (Arcturus) | Definición de muebles | items | SOLO LECTURA |
| `CatalogPage` | `catalog_pages` (Arcturus) | Páginas del catálogo | catalogItems | GESTIONAR via Housekeeper |
| `CatalogItem` | `catalog_items` (Arcturus) | Items en catálogo | catalogPage | GESTIONAR via Housekeeper |
| `UserBadge` | `user_badges` (Arcturus) | Badges del usuario | user | SOLO LECTURA |
| `UserCurrency` | `user_currencies` (Arcturus) | Monedas alternativas | user | LEER, modificar via RCON |
| `UserSetting` | `user_settings` (Arcturus) | Configuración in-game | user | SOLO LECTURA |
| `UserSubscription` | `user_subscriptions` (Arcturus) | HC/VIP subscription | user | SOLO LECTURA |
| `MessengerFriendship` | `messenger_friendships` (Arcturus) | Amistades | user | SOLO LECTURA |
| `EmulatorSetting` | `emulator_settings` (Arcturus) | Config del emulador | - | GESTIONAR con cuidado |
| `EmulatorText` | `external_texts` (Arcturus) | Textos del cliente | - | GESTIONAR via Housekeeper |
| `ChatlogRoom` | `chatlog_room` (Arcturus) | Chat de sala | user | SOLO LECTURA (moderación) |
| `ChatlogPrivate` | `chatlog_private` (Arcturus) | Chat privado | user | SOLO LECTURA (moderación) |
| `CommandLog` | `commandlog` (Arcturus) | Comandos ejecutados | user | SOLO LECTURA |
| `WebsiteArticleComment` | `website_article_comments` | Comentarios en artículos | article, user | ADAPTAR |
| `WebsiteArticleReaction` | `website_article_reactions` | Reacciones en artículos | article, user | ADAPTAR |
| `WebsiteSetting` | `website_settings` | Configuración del sitio (key-value) | - | ADAPTAR como `kx_settings` |
| `WebsitePermission` | `website_permissions` | Permisos adicionales key-value | - | FUSIONAR con sistema de rangos propio |
| `WebsiteTeam` | `website_teams` | Equipos del hotel | users | ADAPTAR |
| `WebsiteStaffApplications` | `website_staff_applications` | Aplicaciones de staff | user, rank | ADAPTAR |
| `WebsiteOpenPosition` | `website_open_positions` | Posiciones abiertas | permission, team | ADAPTAR |
| `WebsiteShopArticle` | `website_shop_articles` | Paquetes en tienda | features, category | ADAPTAR |
| `WebsitePaypalTransaction` | `website_paypal_transactions` | Transacciones PayPal | user | ADAPTAR con proveedor de pago propio |
| `WebsiteShopVoucher` | `website_shop_vouchers` | Vouchers de tienda | - | ADAPTAR |
| `WebsiteHelpCenterTicket` | `website_help_center_tickets` | Tickets soporte | user, category | ADAPTAR |
| `WebsiteRuleCategory` | `website_rule_categories` | Categorías de reglas | rules | ADAPTAR |
| `WebsiteRule` | `website_rules` | Reglas del hotel | category | ADAPTAR |
| `WebsiteIpBlacklist` | `website_ip_blacklist` | IPs bloqueadas | - | ADAPTAR como `kx_ip_blocklist` |
| `WebsiteIpWhitelist` | `website_ip_whitelist` | IPs permitidas | - | ADAPTAR como `kx_ip_allowlist` |
| `WebsiteWordfilter` | `website_wordfilter` | Palabras prohibidas | - | ADAPTAR como `kx_wordfilter` |
| `WebsiteBetaCode` | `website_beta_codes` | Códigos beta de acceso | user | YA TENEMOS: auth_tickets en kodexa_hotel |
| `WebsiteLanguage` | `website_languages` | Idiomas disponibles | - | ADAPTAR si hacemos i18n |
| `Tag` | `tags` + `taggables` | Tags polimórficos | articles | ADAPTAR |
| `WebsiteAd` | `website_ads` | Anuncios del sitio | - | OPCIONAL |
| `Achievement` | `achievements` (Arcturus) | Logros del juego | - | SOLO LECTURA |
| `WebsiteBadge` | `website_badges` | Badges del sitio web | - | ADAPTAR |
| `WebsiteDrawBadge` | `website_drawbadge` | Pool de badges sorpresa | - | FEATURE OPCIONAL |
| `WebsiteRareValue` | `website_rare_values` | Valores de rares | category | FEATURE OPCIONAL |
| `CameraWeb` | `camera_web` (Arcturus) | Fotos de cámara in-game | user | SOLO LECTURA |
| `HomeCategory` | `home_categories` | Categorías del home web | homeItems | FEATURE OPCIONAL (futuro) |
| `HomeItem` | `home_items` | Items del home web | category | FEATURE OPCIONAL (futuro) |
| `WebsiteUserGuestbook` | `website_user_guestbooks` | Mensajes en perfil | user, profile | ADAPTAR |

---

## 4. Mapa de Rutas

### 4.1 Rutas Públicas (sin auth)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/` | GET | Landing/homepage con login |
| `/register` | GET/POST | Registro |
| `/register/{referral_code}` | GET | Registro con código referido |
| `/forgot-password` | GET/POST | Recuperación contraseña |
| `/reset-password/{token}` | GET/POST | Reset contraseña |
| `/community/articles` | GET | Lista de artículos (sin auth) |
| `/community/article/{slug}` | GET | Ver artículo (sin auth) |
| `/help-center/rules` | GET | Reglas del hotel (sin auth) |
| `/home/{user:username}` | GET | Home web del usuario (sin auth) |
| `/api/user/{username}` | GET | API: info usuario |
| `/api/online-users` | GET | API: usuarios online |
| `/api/online-count` | GET | API: cantidad online |
| `/language/{locale}` | GET | Cambiar idioma |
| `/installation/*` | GET/POST | Instalación inicial |
| `/maintenance` | GET | Página de mantenimiento |
| `/banned` | GET | Página de ban |

### 4.2 Rutas Privadas (auth requerida)

| Ruta | Descripción |
|------|-------------|
| `/user/me` | Panel personal |
| `/user/settings/account` | Configuración de cuenta |
| `/user/settings/password` | Cambiar contraseña |
| `/user/settings/session-logs` | Logs de sesión |
| `/user/settings/two-factor` | Configuración 2FA |
| `/profile/{username}` | Ver perfil de usuario |
| `/community/photos` | Fotos de la cámara |
| `/community/staff` | Página de staff |
| `/community/teams` | Equipos del hotel |
| `/community/staff-applications` | Aplicaciones de staff |
| `/community/team-applications` | Aplicaciones de equipos |
| `/community/article/{slug}/comment` | Comentar artículo |
| `/leaderboard` | Rankings |
| `/shop/{category?}` | Tienda |
| `/shop/purchase/{package}` | Comprar paquete |
| `/shop/voucher` | Usar voucher |
| `/paypal/*` | Flujo PayPal |
| `/help-center` | Centro de ayuda |
| `/help-center/tickets/*` | Gestión tickets |
| `/values/*` | Valores raros |
| `/game/nitro` | Cliente Nitro |
| `/game/flash` | Cliente Flash (legacy) |
| `/home/{user}/save` | Guardar home |
| `/home/{user}/buy-item` | Comprar item home |
| `/draw-badge` | Badge sorpresa |
| `/logo-generator` | Generador de logo |

### 4.3 Rutas de Housekeeping (Filament — `/admin/*`)

Acceso: `can_access_housekeeping` (min_rank 6 por default)

Recursos detectados en Filament:
- `/admin` — Dashboard con widgets (artículos chart, top stats)
- `/admin/users` — Gestión de usuarios
- `/admin/bans` — Gestión de bans
- `/admin/permissions` — Rangos/permisos (in-game)
- `/admin/housekeeping-permissions` — Permisos del HK
- `/admin/articles` — Artículos/noticias
- `/admin/tags` — Tags
- `/admin/teams` — Equipos
- `/admin/open-positions` — Posiciones abiertas
- `/admin/staff-applications` — Aplicaciones de staff
- `/admin/catalog-pages` — Páginas del catálogo
- `/admin/catalog-editors` — Editor de catálogo
- `/admin/achievements` — Logros
- `/admin/badge-uploads` — Subir badges
- `/admin/badge-text-editors` — Editar texto de badges
- `/admin/emulator-settings` — Configuración del emulador
- `/admin/emulator-texts` — Textos del cliente
- `/admin/cms-settings` — Configuración del CMS
- `/admin/word-filters` — Filtro de palabras
- `/admin/chatlog-rooms` — Chat logs de sala
- `/admin/chatlog-privates` — Chat logs privados
- `/admin/command-logs` — Logs de comandos
- `/admin/website-ads` — Anuncios
- `/admin/camera-webs` — Fotos de cámara
- `/admin/website-draw-badges` — Pool de draw badges
- `/admin/home-categories` — Categorías del home
- `/admin/home-items` — Items del home

### 4.4 Middlewares Detectados

| Middleware | Función |
|-----------|---------|
| `maintenance` | Redirige a `/maintenance` si hotel en mantenimiento |
| `check.ban` | Redirige a `/banned` si usuario baneado |
| `force.staff.2fa` | Fuerza 2FA para staff (rank >= housekeeping) |
| `auth` | Requiere autenticación |
| `guest` | Solo usuarios no autenticados |
| `throttle:{rate},{period}` | Rate limiting |
| `findretros.redirect` | Integración FindRetros antes de entrar al juego |
| `vpn.checker` | Bloquea VPNs para acceder al cliente |
| `LogViewerMiddleware` | Protege el log viewer |
| `InstallationMiddleware` | Redirige a instalación si no está configurado |
| `LocalizationMiddleware` | Detecta y aplica idioma |
| `SetThemeMiddleware` | Aplica el theme activo |
| `RealClientIpMiddleware` | IP real detrás de proxies |

---

## 5. Mapa de Migraciones

### 5.1 Tablas del CMS (propias de AtomCMS — prefijo `website_`)

| Tabla | Columnas clave | Relaciones |
|-------|---------------|------------|
| `website_settings` | `key`, `value` (text) | — |
| `website_articles` | `slug`, `title`, `content`, `user_id`, `can_comment`, `deleted_at` | user (FK users) |
| `website_article_comments` | `article_id`, `user_id`, `comment` | article, user |
| `website_article_reactions` | `article_id`, `user_id`, `reaction` | article, user |
| `website_housekeeping_permissions` | `permission` (unique), `min_rank`, `description` | — |
| `website_permissions` | `key` (unique), `value`, `comment` | — |
| `website_ip_blacklist` | `ip` | — |
| `website_ip_whitelist` | `ip` | — |
| `website_wordfilter` | `word` | — |
| `website_beta_codes` | `code`, `user_id` | user |
| `website_languages` | `code`, `name`, `flag` | — |
| `website_teams` | `name`, `description`, `badge`, `job_description`, `hidden` | users |
| `website_staff_applications` | `user_id`, `rank_id`, `message`, `team_id`, `status` | user, permission |
| `website_open_positions` | `name`, `description`, `permission_id`, `team_id`, `kind` | permission |
| `website_rare_value_categories` | `name`, `image` | values |
| `website_rare_values` | `category_id`, `name`, `value`, `image` | category |
| `website_rule_categories` | `name` | rules |
| `website_rules` | `category_id`, `title`, `description` | category |
| `website_help_center_categories` | `name`, `description` | tickets |
| `website_help_center_tickets` | `user_id`, `category_id`, `title`, `message`, `status_id` | user, category |
| `website_help_center_ticket_replies` | `ticket_id`, `user_id`, `message` | ticket, user |
| `website_paypal_transactions` | `user_id`, `transaction_id`, `amount`, `status` | user |
| `website_shop_articles` | `name`, `price`, `credits`, `diamonds`, `duckets`, `category_id`, `is_giftable`, `icon_url` | category, features |
| `website_shop_article_features` | `article_id`, `features` (json) | article |
| `website_shop_vouchers` | `code`, `balance` | — |
| `website_used_shop_vouchers` | `user_id`, `voucher_id` | user, voucher |
| `website_shop_categories` | `name`, `slug` | articles |
| `website_maintenance_tasks` | `name`, `description`, `completed` | — |
| `website_badges` | `code`, `name`, `description` | — |
| `website_ads` | `title`, `image`, `url`, `position` | — |
| `website_drawbadge` | `badge_code`, `price` | — |
| `website_user_guestbooks` | `user_id`, `profile_id`, `message` | user, profile |
| `home_categories` | `name`, `icon` | items |
| `home_items` | `category_id`, `name`, `type`, `price` | category |
| `user_home_items` | `user_id`, `item_id`, `x`, `y`, `z`, `rotation` | user, item |
| `user_home_ratings` | `user_id`, `profile_id`, `rating` | user, profile |
| `user_home_messages` | `user_id`, `profile_id`, `message` | user, profile |
| `tags` | `name`, `slug` | taggables |
| `taggables` | `tag_id`, `taggable_id`, `taggable_type` | polimórfico |
| `activity_log` | `log_name`, `description`, `subject_*`, `causer_*`, `properties` (json) | polimórfico |
| `sessions` | `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity` | user |
| `failed_jobs` | `uuid`, `connection`, `queue`, `payload`, `exception` | — |
| `personal_access_tokens` | `tokenable_*`, `name`, `token`, `abilities`, `last_used_at` | polimórfico |
| `password_reset_tokens` | `email`, `token`, `created_at` | — |
| `referrals` | `user_id`, `referrals_total` | user |
| `user_referrals` | `user_id`, `referral_code` | user |
| `claimed_referral_logs` | `user_id`, `referral_id` | user |
| `cache` | `key`, `value`, `expiration` | — |

### 5.2 Columnas agregadas a tablas de Arcturus (por migraciones AtomCMS)

| Tabla Arcturus | Columnas agregadas por AtomCMS |
|---------------|-------------------------------|
| `users` | `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed`, `two_factor_confirmed_at`, `referral_code`, `hidden_staff`, `website_balance` |
| `permissions` | `hidden_rank`, `staff_color`, `staff_background` |
| `items` | índice en `item_id` |

### 5.3 Tablas que pertenecen a Arcturus (AtomCMS NO las crea, solo las lee/escribe)

`users`, `permissions`, `rooms`, `items`, `items_base`, `catalog_pages`, `catalog_items`, `chatlog_room`, `chatlog_private`, `commandlog`, `user_badges`, `user_currencies`, `user_settings`, `user_subscriptions`, `messenger_friendships`, `guilds`, `guild_members`, `achievements`, `bans`, `camera_web`, `emulator_settings`, `external_texts`

### 5.4 Tablas que NO debemos usar directamente en Kodexa

| Tabla | Motivo |
|-------|--------|
| `home_*`, `user_home_*` | Feature AtomCMS-específico, no estándar Habbo — evaluar para futuro |
| `website_beta_codes` | Ya manejamos esto con nuestro sistema de acceso por rango |
| `website_languages` | Haremos i18n con next-intl si lo necesitamos |
| `website_maintenance_tasks` | Reemplazar con estado simple en settings |

---

## 6. Housekeeper — Funciones Administrativas

### 6.1 Dashboard
AtomCMS tiene: widget con conteo de artículos, órdenes de la tienda, gráfica de tendencias.

Para Kodexa.Hotel proponer:
- Usuarios online en tiempo real (via emulador WebSocket)
- Nuevos registros (últimas 24h/7d)
- Ingresos económicos (créditos + coins)
- Tickets abiertos pendientes
- Últimos logs de actividad
- Estado del emulador (health check)
- Gráficas de actividad (jugadores por hora)

### 6.2 Gestión de Usuarios
AtomCMS tiene: ver, editar, chat logs, settings, badges.

Para Kodexa.Hotel agregar:
- Búsqueda por username, email, IP, machine_id
- Vista de inventario del usuario
- Historial de transacciones
- Historial de bans
- Acción: enviar alerta in-game via RCON
- Acción: kick del juego via RCON
- Acción: dar créditos/duckets/diamonds/points via RCON
- Acción: dar badge via RCON
- Acción: cambiar motto via RCON
- Acción: dar gift via RCON
- Acción: forward a sala via RCON

### 6.3 Gestión de Staff
- Ver lista de staff por rango
- Gestionar posiciones abiertas
- Revisar y aprobar/rechazar aplicaciones
- Gestionar equipos (grupos internos)
- Configurar visibilidad en página pública

### 6.4 Rangos y Permisos
- CRUD de rangos (tabla `permissions` de Arcturus)
- Editor de permisos `cmd_*` y `acc_*`
- Gestión de `website_housekeeping_permissions` (qué puede hacer cada rango en el HK)
- Visualización de usuarios por rango

### 6.5 Bans
- Lista de bans activos/expirados
- Crear ban (tipo: account, ip, machine, super)
- Modificar/eliminar ban
- Integración: al banear, detectar si el usuario está online y kickear via RCON

### 6.6 Noticias/Artículos
- CRUD con editor rich text (reemplazar Blade por TipTap o Quill en React)
- Gestión de tags
- Publicar/despublicar/archivar
- Moderar comentarios y reacciones

### 6.7 Economía
- Enviar créditos/monedas a usuario individual o masivo
- Ver balance de usuarios
- Gestionar vouchers de tienda
- Ver historial de transacciones PayPal/stripe
- Configurar paquetes de tienda
- Configurar precios y recompensas

### 6.8 Catálogo
- Ver/editar páginas del catálogo (Arcturus)
- Ver/editar items del catálogo
- Actualizar catálogo en emulador via RCON (`updatecatalog`)
- NOTA: No borrar páginas sin verificar referencias

### 6.9 Salas
- Lista de salas: owner, nombre, visitantes máximos, estado
- Ver detalles de sala
- Eliminar sala (con cuidado)

### 6.10 Logs
- Activity log: qué staff cambió qué y cuándo
- Chat logs de sala (búsqueda por sala, usuario, rango de fechas)
- Chat logs privados (solo founder/admin — privacidad)
- Command logs: qué comandos ejecutó qué staff

### 6.11 Configuración
- Settings del sitio (key-value): nombre hotel, logo, colores, paths de assets
- Settings del emulador: editar `emulator_settings` directamente
- Textos del cliente: editar `external_texts`
- Wordfilter: agregar/eliminar palabras prohibidas + sincronizar con emulador via RCON

### 6.12 Pagos
- Configurar proveedor (PayPal/Stripe/otro)
- Ver historial de transacciones
- Gestionar paquetes y categorías de tienda
- Gestionar vouchers

### 6.13 Seguridad
- IP blacklist/whitelist
- Logs de intentos de acceso fallidos
- Logs de denegación beta
- Rate limiting stats
- VPN checker enable/disable

### 6.14 RCON
- Panel de estado: conectado/desconectado
- Consola de comandos libres (solo founder/developer)
- Comandos rápidos: alerta global, actualizar catálogo, actualizar wordfilter
- Historial de comandos ejecutados desde HK

### 6.15 Desarrollo
- Acceso: solo Developer (rank 9) y Founder (rank 10)
- Estado de los emuladores (main, dev, beta)
- Logs de errores del sistema
- Comandos de mantenimiento (limpieza de cache, rebuild, etc.)

---

## 7. Diseño Recomendado Preliminar para Kodexa.Hotel

> Basado en el monorepo real (`apps/web/src/`) + principios del skill ui-ux-pro-max.

### 7.1 Estructura de carpetas propuesta

```
apps/web/src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rutas públicas (no auth)
│   │   ├── page.tsx              # Landing / homepage
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── news/page.tsx
│   │   ├── news/[slug]/page.tsx
│   │   ├── staff/page.tsx
│   │   └── community/page.tsx
│   │
│   ├── (auth)/                   # Rutas que requieren auth
│   │   ├── me/
│   │   │   ├── page.tsx          # Panel personal
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   ├── wallet/page.tsx
│   │   │   ├── badges/page.tsx
│   │   │   └── rooms/page.tsx
│   │   ├── shop/page.tsx
│   │   ├── help/page.tsx
│   │   └── community/
│   │       ├── leaderboard/page.tsx
│   │       └── profiles/[username]/page.tsx
│   │
│   ├── (hotel)/                  # Entornos del juego
│   │   ├── hotel/page.tsx        # Hotel principal (Arcturus Main)
│   │   ├── desarrollo/page.tsx   # Dev lab (rank 9+)
│   │   └── hotel-beta/page.tsx   # Beta emulator (rank 10+)
│   │
│   ├── (admin)/                  # Housekeeper
│   │   └── admin/
│   │       ├── layout.tsx        # Sidebar + topbar del HK
│   │       ├── page.tsx          # Dashboard HK
│   │       ├── users/
│   │       ├── users/[id]/page.tsx
│   │       ├── ranks/page.tsx
│   │       ├── permissions/page.tsx
│   │       ├── bans/page.tsx
│   │       ├── news/page.tsx
│   │       ├── events/page.tsx
│   │       ├── catalog/page.tsx
│   │       ├── economy/page.tsx
│   │       ├── rooms/page.tsx
│   │       ├── logs/page.tsx
│   │       ├── settings/page.tsx
│   │       ├── security/page.tsx
│   │       ├── rcon/page.tsx
│   │       └── development/page.tsx
│   │
│   └── api/                      # API Routes
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/register/route.ts
│       ├── sso/route.ts
│       ├── admin/
│       │   ├── users/route.ts
│       │   ├── bans/route.ts
│       │   ├── logs/route.ts
│       │   └── rcon/route.ts
│       ├── public/
│       │   ├── online/route.ts
│       │   └── stats/route.ts
│       └── health/route.ts
│
├── components/
│   ├── cms/                      # Componentes del CMS/público
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── StaffCard.tsx
│   │   ├── UserAvatar.tsx
│   │   └── HabboFigure.tsx       # Render avatar con imager
│   ├── admin/                    # Componentes del Housekeeper
│   │   ├── Sidebar.tsx
│   │   ├── DataTable.tsx
│   │   ├── UserEditModal.tsx
│   │   ├── BanModal.tsx
│   │   ├── RconConsole.tsx
│   │   └── LogViewer.tsx
│   └── shared/                   # Componentes compartidos
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx
│       └── StatusBadge.tsx
│
├── features/                     # Lógica de negocio por feature
│   ├── auth/
│   ├── users/
│   ├── articles/
│   ├── economy/
│   ├── rcon/
│   └── permissions/
│
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── db.ts                     # Prisma client
│   ├── rcon.ts                   # RCON client (port del RconService)
│   ├── permissions.ts            # hasPermission(), canAccess()
│   └── constants.ts
│
└── server/                       # Server-only code
    ├── actions/                  # Server Actions
    │   ├── user.actions.ts
    │   ├── ban.actions.ts
    │   ├── article.actions.ts
    │   └── rcon.actions.ts
    └── queries/                  # DB queries
        ├── users.ts
        ├── rooms.ts
        └── catalog.ts
```

### 7.2 Principios de diseño (ui-ux-pro-max)

Para el Housekeeper (panel admin):
- **Estilo**: Dark gaming dashboard — acorde con paleta Kodexa (`#0F172A` bg, `#00D4AA` primary)
- **Tipografía**: Geist Mono para datos/tablas, Inter para UI
- **Componentes**: shadcn/ui como base (DataTable, Dialog, Select, Badge)
- **Accesibilidad**: focus rings visibles, aria-labels en todos los iconos, contraste 4.5:1
- **Touch targets**: mínimo 44×44px en todos los botones
- **Animaciones**: Framer Motion, 150–300ms, respetar `prefers-reduced-motion`
- **No emojis**: usar Lucide icons (consistente con shadcn)
- **Iconos de rango**: SVG custom con colores por rango

Para el CMS público:
- Dark mode gaming con acentos `#00D4AA` (emerald) y `#7C3AED` (purple)
- Cards con glass effect sutil (`bg-slate-800/80`, `border-slate-700`)
- Navbar flotante con `top-4` spacing

---

## 8. Propuesta Preliminar de Rutas para Kodexa.Hotel

### 8.1 Público

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page del hotel |
| `/login` | Login (modal o página) |
| `/register` | Registro |
| `/news` | Lista de noticias |
| `/news/[slug]` | Artículo específico |
| `/staff` | Página de staff |
| `/community` | Hub de comunidad |
| `/community/leaderboard` | Rankings |
| `/community/profiles/[username]` | Perfil público |
| `/community/values` | Valores raros |
| `/community/rules` | Reglas del hotel |
| `/unauthorized` | Acceso denegado |

### 8.2 Usuario Autenticado

| Ruta | Descripción |
|------|-------------|
| `/me` | Panel personal (stats, shortcuts) |
| `/me/profile` | Editar perfil |
| `/me/settings` | Configuración de cuenta |
| `/me/security` | Seguridad: 2FA, contraseña, sesiones |
| `/me/wallet` | Balance, transacciones, vouchers |
| `/me/badges` | Colección de badges |
| `/me/rooms` | Mis habitaciones |
| `/shop` | Tienda del hotel |
| `/shop/[category]` | Tienda por categoría |
| `/help` | Centro de ayuda |
| `/help/tickets` | Mis tickets |
| `/help/tickets/[id]` | Ver ticket |

### 8.3 Entornos del Hotel

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/hotel` | rank 1+ (todos) | Hotel principal (Arcturus Main) |
| `/desarrollo` | rank 9+ (Developer) | Laboratorio Arcturus Dev |
| `/hotel-beta` | rank 10 (Founder) | Emulador TypeScript privado |

### 8.4 Housekeeper (Admin)

| Ruta | Descripción |
|------|-------------|
| `/admin` | Dashboard principal |
| `/admin/users` | Lista de usuarios |
| `/admin/users/[id]` | Ver/editar usuario |
| `/admin/ranks` | Gestión de rangos |
| `/admin/permissions` | Permisos del HK por rango |
| `/admin/bans` | Bans activos |
| `/admin/news` | Gestión de noticias |
| `/admin/events` | Eventos programados |
| `/admin/catalog` | Catálogo del hotel |
| `/admin/economy` | Economía: transacciones, vouchers |
| `/admin/rooms` | Salas del hotel |
| `/admin/logs` | Activity logs |
| `/admin/settings` | Configuración del sitio |
| `/admin/security` | IP lists, VPN, seguridad |
| `/admin/rcon` | Consola RCON |
| `/admin/development` | Herramientas developer |

---

## 9. Propuesta Preliminar de Permisos por Rango

> Modelo provisional. Sin aplicar a base de datos todavía. Se ajustará cuando conectemos arcturus_main (MP-011).

| Rank | Nombre | HK Access | Puede ver | Puede editar | No puede |
|------|--------|-----------|-----------|--------------|----------|
| **1** | USER | ✗ | Público, propio perfil, rooms | Propio perfil, settings | Cualquier HK |
| **2** | VIP | ✗ | + features premium | Igual que USER | Cualquier HK |
| **3** | HELPER | ✗ | + tickets de soporte (públicos) | Igual que USER | Cualquier HK |
| **4** | MODERATOR | ✗ | + chat logs propios de tickets | Responder tickets | Editar usuarios, bans via HK |
| **5** | GAME_MASTER | ✗ | Community features | Gestionar eventos in-game | HK |
| **6** | MANAGER | ✓ (básico) | + usuarios, bans, artículos, settings | Editar usuarios, bans, artículos, wordfilter, catálogo, emulator settings | Eliminar usuarios, ver logs privados, permissions, delete settings |
| **7** | ADMIN | ✓ (amplio) | + activity logs, command logs, chat privados | + Eliminar usuarios, gestionar permissions, manage_achievements, camera | No tocar security settings de red, no RCON libre |
| **8** | HOTEL_MANAGER | ✓ (casi todo) | Todo excepto `/admin/development` | Todo excepto RCON libre y dev tools | RCON consola libre, dev tools |
| **9** | DEVELOPER | ✓ (todo) | Todo incluyendo `/admin/development` | Todo | Nada (excepto lo que solo puede Founder en producción) |
| **10** | FOUNDER | ✓ (todo) | Todo | Todo | Nada |

**Reglas adicionales para cada rango:**

- **MANAGER (6)**: puede `edit_user`, `manage_bans`, `write_article`, `manage_catalog_pages`, `manage_wordfilter`, `manage_emulator_settings`
- **ADMIN (7)**: + `delete_user`, `view_activity_logs`, `manage_permissions`, `manage_commandlogs`, `manage_private_chatlogs`
- **HOTEL_MANAGER (8)**: + acceso a `/admin/security`, `/admin/economy`, `/admin/rcon` (comandos predefinidos)
- **DEVELOPER (9)**: + `/admin/development`, `/admin/rcon` (consola libre), `/desarrollo`
- **FOUNDER (10)**: + `/hotel-beta`, acceso a todo sin restricciones

**En kodexa_hotel (actual):**
- Rango actual del admin: 9 (DEVELOPER)
- Pendiente: normalizar rangos entre kodexa_hotel y arcturus_main (MP-011)
- La tabla `permissions` de Arcturus define rangos 1-N; nosotros mapearemos los nuestros en ella.

---

## 10. Checklist de Implementación Futura

### Fase 1 — CMS Público Básico (tras MP-012)
- [ ] Landing page (`/`) con hero, stats online, artículos recientes
- [ ] Login con NextAuth.js v5 (credentials provider → kodexa_hotel)
- [ ] Registro con validación Zod, captcha (Turnstile), cookie de sesión
- [ ] Perfil público (`/community/profiles/[username]`)
- [ ] Panel personal básico (`/me`)
- [ ] Middleware de rutas (auth, rank guard, banned check)
- [ ] Componente `HabboFigure` con imager local
- [ ] Navbar + Footer responsive
- [ ] 404 y página `/unauthorized`

### Fase 2 — Dashboard Usuario + Noticias
- [ ] CRUD de artículos/noticias (admin) + vista pública (`/news`)
- [ ] Sistema de tags para artículos
- [ ] Comentarios y reacciones en artículos
- [ ] Panel `/me` completo: settings, seguridad (2FA), sesiones
- [ ] Página de staff (`/staff`)
- [ ] Leaderboard básico (rankings de usuarios)

### Fase 3 — Housekeeper Base
- [ ] Layout Housekeeper (`/admin`) con sidebar + topbar + auth guard
- [ ] Dashboard HK: stats en tiempo real (online count via emulador)
- [ ] Gestión de usuarios: lista, búsqueda, edición básica
- [ ] Gestión de bans: crear, listar, expirar
- [ ] Sistema de rangos: ver y editar (conectado a `permissions` de Arcturus)
- [ ] `website_housekeeping_permissions` equivalente: tabla `kx_housekeeper_permissions`
- [ ] Activity log: visualizador de cambios
- [ ] Wordfilter: gestión + sync via RCON

### Fase 4 — Economía, Eventos, Catálogo, RCON
- [ ] Tienda (`/shop`) con paquetes, categorías, pagos
- [ ] Vouchers de tienda
- [ ] RCON service (port de RconService a TypeScript)
- [ ] Panel RCON en HK: comandos predefinidos + consola developer
- [ ] Catálogo: ver y editar páginas/items del catálogo de Arcturus
- [ ] Economía: dar créditos/monedas via RCON desde HK
- [ ] Eventos: sistema básico con countdown y rewards
- [ ] Help Center: tickets de soporte

### Fase 5 — Seguridad Avanzada + Herramientas Developer
- [ ] IP blocklist/allowlist en HK
- [ ] VPN checker configurable
- [ ] Logs de seguridad: intentos fallidos, beta deny
- [ ] Chat logs (sala + privado) en HK con búsqueda
- [ ] Command logs en HK
- [ ] Panel `/admin/development`: health check, rebuild, cache clear
- [ ] Auditoría completa de acciones del staff
- [ ] 2FA obligatorio para staff (rank 6+)

---

## 11. Riesgos

### 11.1 Acoplamiento a Laravel/Filament
**Riesgo**: El Housekeeping de AtomCMS está 100% acoplado a Filament 5 (PHP). Si copiamos conceptos 1:1, podríamos diseñar para PHP en lugar de Next.js/React.

**Mitigación**: Usar AtomCMS solo como referencia funcional. Toda implementación con Next.js Server Actions + React components.

### 11.2 Tablas incompatibles con Arcturus
**Riesgo**: AtomCMS agrega columnas a tablas de Arcturus (`users.two_factor_secret`, `users.hidden_staff`, etc.). Si importamos arcturus_main limpio (MP-008) y luego queremos estas columnas, podría haber conflictos.

**Mitigación**: Nuestras columnas extras van en nuestra propia tabla `kx_users_meta` o campos separados en `kodexa_hotel.users`. No modificamos `arcturus_main.users` directamente.

### 11.3 Permisos inseguros
**Riesgo**: AtomCMS usa `min_rank` simple para permisos. Un usuario con rank 6 en un contexto podría tener más acceso del esperado si los rangos no están bien normalizados.

**Mitigación**: Diseñar sistema propio con RBAC explícito. Verificar siempre desde `kodexa_hotel` como fuente de verdad. No confiar en `rank` directamente — usar middleware que consulta `kx_housekeeper_permissions`.

### 11.4 Migraciones que chocan con Arcturus
**Riesgo**: AtomCMS tiene `RENAME_COLLIDING_TABLES=true` como feature, lo que implica que sus tablas (`website_*`) pueden colisionar con otras instalaciones.

**Mitigación**: Nuestro prefijo `kx_` evita toda colisión. Las tablas de Arcturus en `arcturus_main` permanecen intactas. Solo Prisma con schema específico por base de datos.

### 11.5 Dependencia de paquetes privados
**Riesgo**: `filament/filament ^5.0` requiere `packages.filamentphp.com` con auth. Si AtomCMS actualiza y bloquea más features detrás de ese repo privado, no podemos instalarlo como referencia.

**Mitigación**: Ya decidido: no instalamos AtomCMS. Solo auditoría estática del código fuente.

### 11.6 Lógica obsoleta de Flash
**Riesgo**: Copiar lógica del `FlashController` o configuración Flash puede introducir código muerto o inconsistencias.

**Mitigación**: Ignorar todo lo relacionado con Flash. Solo Nitro (HTML5) es relevante.

### 11.7 Problemas legales o de licenciamiento
**Riesgo**: AtomCMS es MIT license (verificado en `LICENSE`). Sin embargo, conecta con Arcturus Morningstar que puede tener restricciones propias.

**Mitigación**: AtomCMS se usa solo como referencia educativa. Nuestro código es 100% propio. Revisar license de Arcturus Morningstar antes de distribución pública.

### 11.8 SSO tickets en tabla compartida
**Riesgo**: `users.auth_ticket` es una columna de `arcturus_main.users`. Si varios procesos escriben auth_tickets simultáneamente (CMS + algún script), puede haber race conditions.

**Mitigación**: `ssoTicket()` ya tiene retry logic (5 intentos). Nuestro Auth Bridge (MP-011) debe respetar el mismo patrón con locking optimista.

### 11.9 RCON fire-and-forget
**Riesgo**: AtomCMS no lee la respuesta del socket RCON. Si un comando falla silenciosamente, el admin no se entera.

**Mitigación**: En nuestro `RconService` TypeScript, implementar response reading + logging + feedback visual en el HK. No replicar el patrón fire-and-forget sin logs.

---

## 12. Reporte Final

### Archivos revisados

| Archivo | Tipo |
|---------|------|
| `README.md` | Documentación |
| `composer.json` | Dependencias PHP |
| `package.json` | Dependencias JS |
| `.env.example` | Variables de entorno |
| `routes/web.php` | Rutas web completas |
| `routes/api.php` | Rutas API |
| `config/habbo.php` | Configuración Habbo |
| `app/Models/User.php` | Modelo User |
| `app/Models/Game/Permission.php` | Modelo Permission/Rango |
| `app/Services/RconService.php` | Servicio RCON |
| `app/Services/Emulator/Drivers/ArcturusDriver.php` | Driver Arcturus |
| `database/seeders/HousekeepingPermissionSeeder.php` | Permisos del HK |
| `database/migrations/` (listado completo) | ~45 migraciones |
| `app/Filament/` (estructura) | 30+ recursos Filament |
| `app/Http/Controllers/` (estructura) | 30+ controladores |
| `app/Models/` (estructura) | 45+ modelos |
| `app/Services/` (estructura) | 15+ servicios |
| `app/Http/Middleware/` (estructura) | 15 middlewares |
| `lang/` (estructura) | 12 idiomas |

### Módulos detectados

18 módulos funcionales: Auth, Registro, Perfil, Sesiones, Seguridad, Captcha, Noticias, Staff, Usuarios, Rangos, Permisos, Bans, Logs, Economía, Tienda/PayPal, RCON, Configuración, Themes, Multiidioma, Nitro/Flash, Home Web.

### Recomendaciones

1. **Usar la lista de housekeeping permissions** del seeder como spec para `kx_housekeeper_permissions`.
2. **Portar RconService a TypeScript** con manejo de respuesta y logging adecuado.
3. **NO agregar columnas extra** a `arcturus_main.users` — usar tabla `kx_users_meta` para datos adicionales.
4. **Los `website_*` tables** son el mapa de qué tablas propias del CMS necesitamos — adaptar con prefijo `kx_`.
5. **La lógica de SSO ticket** de `User.ssoTicket()` es la correcta — portar a TypeScript en Auth Bridge (MP-011).
6. **El patrón de currency types** (duckets=0, diamonds=5, points=101) es fijo de Arcturus — documentar en `packages/shared`.

### Próximos microprocesos sugeridos

| MP | Descripción | Dependencias |
|----|-------------|--------------|
| **MP-008** | ImportObjectRetros/Morningstar → arcturus_main | (ya planificado) |
| **MP-009** | Nitro Client → Arcturus Main | MP-008 |
| **MP-010** | Arcturus Dev / nitro-docker → arcturus_dev | MP-008 |
| **MP-011** | Auth Bridge kodexa_hotel → arcturus_main | MP-009 |
| **MP-012** | Validación acceso /hotel, /desarrollo, /hotel-beta | MP-011 |
| **MP-CMS-002** | Diseño sistema de permisos HK (`kx_housekeeper_permissions`) | MP-012 |
| **MP-CMS-003** | Implementar RconService en TypeScript | MP-011 |
| **MP-CMS-004** | Landing page + auth CMS (Fase 1) | MP-012 |
| **MP-CMS-005** | Layout Housekeeper + dashboard básico | MP-CMS-002 |
