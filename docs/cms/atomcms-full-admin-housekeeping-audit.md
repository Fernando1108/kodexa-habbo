# MP-ATOM-AUDIT-001 — Auditoría Total AtomCMS / Housekeeping / Admin

> **Fecha:** 2026-05-10
> **Estado:** Completado — Solo documentación
> **Tipo:** Auditoría de referencia — sin cambios en Kodexa

---

## Resumen Ejecutivo

**AtomCMS** es un CMS Laravel 13 + Filament 5 diseñado específicamente para hoteles retro Habbo. Comparte tablas con **Arcturus Morningstar** y ofrece un panel de administración (Housekeeping) con ~30 recursos Filament que cubren usuarios, rangos, baneos, artículos, catálogo, economía y logs.

**Hallazgo principal:** AtomCMS demuestra el patrón exacto que necesitamos para el Housekeeping de Kodexa. Separa:
1. `permissions` — permisos in-game de Arcturus (comandos, abilities)
2. `website_housekeeping_permissions` — permisos del panel staff (28 entradas)
3. `website_*` tables — datos propios del CMS

**Stack AtomCMS:** Laravel 13 · Filament 5 · Livewire 4 · MariaDB (shared con Arcturus) · 12 idiomas · 2 themes (atom, dusk)

---

## Estructura técnica AtomCMS

```
atomcms/
├── app/
│   ├── Filament/
│   │   ├── Resources/          # 30+ recursos CRUD agrupados por dominio
│   │   │   ├── User/Users/
│   │   │   ├── Hotel/          # BadgeUploads, CatalogEditors, Chatlogs, Commands, Emulator
│   │   │   └── Atom/           # Articles, CmsSettings, Permissions, Teams, Tags
│   │   ├── Pages/              # Páginas custom Filament
│   │   └── Widgets/            # Widgets dashboard
│   ├── Http/
│   │   ├── Controllers/        # API, Articles, Community, Shop, User, Client, Help
│   │   ├── Middleware/         # 14 middlewares custom
│   │   └── Requests/
│   ├── Models/
│   │   ├── User.php            # Usuario central (shared Arcturus)
│   │   ├── Game/               # Permission, Room, Furniture, Player, Guild
│   │   ├── Articles/           # WebsiteArticle, Comment, Reaction, Tag
│   │   ├── Community/          # WebsiteTeam, StaffApplications, RareValues
│   │   ├── Shop/               # ShopArticle, ShopVoucher, PaypalTransaction
│   │   ├── Help/               # Tickets, Categories, Rules
│   │   └── Miscellaneous/      # Settings, Bans, Wordfilter, IpBlacklist, BetaCodes
│   └── Services/
│       ├── RconService.php     # TCP socket → emulador (fire-and-forget)
│       └── HousekeepingPermissionsService.php
├── routes/
│   └── web.php                 # 240 líneas, bien organizado
├── database/
│   ├── migrations/             # 82 migraciones totales
│   └── seeders/
│       └── HousekeepingPermissionSeeder.php  # 28 permisos staff
├── config/
│   └── habbo.php               # Constantes del juego, RCON, cliente, PayPal
├── resources/
│   └── themes/atom/dusk/       # CSS/JS/Views por tema
└── public/assets/
    ├── images/currencies/      # credits.gif, duckets.png, diamonds.png, points.png
    └── images/articles/        # 500+ imágenes de artículos
```

---

## Rutas admin/housekeeping detectadas

| Ruta AtomCMS | Propósito | Permiso min | Equivalente Kodexa | Estado Kodexa |
|-------------|-----------|-------------|-------------------|---------------|
| `/admin` | Dashboard housekeeping | rank ≥ 6 | `/admin` | ✅ Existe y rediseñado (003C) |
| `/admin/users` | CRUD usuarios | `edit_user` (rank 6) | `/admin/users` | ✅ Existe y rediseñado (003D) |
| `/admin/articles` | CRUD noticias | `write_article` (rank 6) | `/admin/news` | ✅ Existe y rediseñado (003E) |
| `/admin/permissions` | Rangos in-game | `manage_permissions` (rank 7) | `/admin/permissions` | ⚠️ Existe parcialmente |
| `/admin/housekeeping-permissions` | Permisos panel staff | `manage_housekeeping_perms` (rank 7) | No existe | ❌ No existe |
| `/admin/bans` | Gestión de baneos | `manage_bans` (rank 6) | `/admin/bans` | ✅ Existe y rediseñado (003G.2) |
| `/admin/wordfilter` | Filtro de palabras | `manage_wordfilter` (rank 6) | `/admin/wordfilter` | ⚠️ Existe, falta rediseño |
| `/admin/catalog-pages` | Páginas catálogo | `manage_catalog_pages` (rank 6) | No existe | ❌ Post-Arcturus |
| `/admin/catalog-editors` | Editor catálogo | `manage_catalog_pages` (rank 6) | No existe | ❌ Post-Arcturus |
| `/admin/emulator-settings` | Config emulador | `manage_emulator_settings` (rank 6) | `/admin/settings` | ⚠️ Parcial, falta rediseño |
| `/admin/emulator-texts` | Strings del cliente | `manage_emulator_texts` (rank 6) | No existe | ❌ Post-Arcturus |
| `/admin/cms-settings` | Settings del sitio | `manage_website_settings` (rank 6) | `/admin/settings` | ⚠️ Parcial |
| `/admin/chatlog-rooms` | Logs chat de salas | `manage_room_chatlogs` (rank 6) | No existe | ❌ No existe |
| `/admin/chatlog-privates` | Chat privados | `manage_private_chatlogs` (rank 6) | No existe | ❌ No existe |
| `/admin/command-logs` | Comandos in-game | `manage_commandlogs` (rank 7) | `/admin/logs` (parcial) | ⚠️ Parcial |
| `/admin/badge-uploads` | Subir badges | `view_activity_logs` (rank 7) | `/admin/badges` | ⚠️ Existe, falta rediseño |
| `/admin/achievements` | Logros del juego | `manage_achievements` (rank 7) | No existe | ❌ Post-Arcturus |
| `/admin/teams` | Equipos staff | `manage_teams` (rank 6) | No existe | ❌ No existe |
| `/admin/tags` | Tags de artículos | `manage_article_tags` (rank 6) | No existe | ❌ No existe |
| `/admin/camera-webs` | Fotos in-game | `manage_camera_web` (rank 7) | No existe | ❌ No existe |
| `/admin/draw-badges` | Loot box badges | n/a | No existe | ❌ Futuro |
| `/admin/activity-log` | Audit log staff | `view_activity_logs` (rank 7) | `/admin/logs` | ⚠️ Parcial |
| `/admin/messages` | Mensajes usuarios | n/a | `/admin/messages` | ⚠️ Existe, falta rediseño |
| `/admin/alerts` | Alertas hotel | n/a | `/admin/alerts` | ⚠️ Existe, falta rediseño |
| `/admin/rcon` | Panel RCON | rank ≥ 9 (developer) | No existe | ❌ Post-Arcturus |
| `/admin/rooms` | Gestión salas | n/a (rank check) | `/admin/rooms` | ✅ Existe y rediseñado (003G.1) |

---

## Módulos Housekeeping completos

### HOTEL
| Módulo | Descripción | Tablas Arcturus | Requiere Arcturus Live | Kodexa puede impl ahora |
|--------|-------------|-----------------|----------------------|------------------------|
| Salas | Lista, editar, moderar salas | `rooms` | No (DB compartida) | ✅ Sí |
| Catálogo | Páginas y items del catálogo | `catalog_pages`, `catalog_items` | Sí (RCON flush) | ⚠️ Solo lectura |
| Logros | Gestión de achievements | `achievements` | Sí | ❌ Post-Arcturus |
| Emulator Settings | Config del emulador | `emulator_settings` | Sí (RCON reload) | ⚠️ Solo lectura |
| Emulator Texts | Strings del cliente | `emulator_texts` | Sí | ⚠️ Solo lectura |
| Photos (CameraWeb) | Fotos publicadas in-game | `camera_web` | No | ✅ Implementable |

### COMUNIDAD
| Módulo | Descripción | Tablas | Requiere Arcturus | Kodexa puede impl |
|--------|-------------|--------|-------------------|-------------------|
| Noticias | CRUD artículos + tags + reacciones | `website_articles` | No | ✅ Ya existe |
| Tags | Categorías de artículos | `tags`, `taggables` | No | ⚠️ Falta implementar |
| Teams | Equipos staff (Support, Mod, Builder...) | `website_teams` | No | ✅ Implementable |
| Staff Applications | Solicitudes para ser staff | `website_staff_applications` | No | ✅ Implementable |
| Valores raros | Lista de valores de muebles | `website_rare_values` | No | ✅ Implementable |
| Guestbooks | Mensajes en perfiles | `website_user_guestbooks` | No | ✅ Implementable |

### MODERACIÓN
| Módulo | Descripción | Tablas | Requiere Arcturus | Kodexa puede impl |
|--------|-------------|--------|-------------------|-------------------|
| Baneos | CRUD baneos + unban + historial | `bans` | No (DB compartida) | ✅ Ya existe |
| Wordfilter | Palabras bloqueadas | `website_wordfilter` | Sí (RCON reload) | ✅ Sin reload |
| Chat logs (salas) | Historial de chat de habitaciones | `room_chat_log` | No | ✅ Implementable |
| Chat logs (privados) | Mensajes privados entre usuarios | `messenger_messages` | No | ✅ Implementable |
| Command logs | Comandos admin usados in-game | `log_commands` | No | ✅ Implementable |
| IP Blacklist | Bloqueo de IPs | `website_ip_blacklist` | No | ✅ Implementable |
| IP Whitelist | IPs permitidas explícitamente | `website_ip_whitelist` | No | ✅ Implementable |

### SISTEMA
| Módulo | Descripción | Tablas | Requiere Arcturus | Kodexa puede impl |
|--------|-------------|--------|-------------------|-------------------|
| Permisos in-game | Editor de rangos/comandos | `permissions` | No (DB compartida) | ✅ Parcialmente existe |
| Permisos Housekeeping | Editor de permisos staff | `website_housekeeping_permissions` | No | ❌ No existe aún |
| CMS Settings | Configuración del sitio web | `website_settings` | No | ⚠️ Parcial |
| Badges | Definición y upload | `website_badges`, `user_badges` | No | ⚠️ Existe, falta rediseño |
| Draw Badges | Pool de badges loot box | `website_drawbadge` | Sí | ❌ Futuro |
| Activity Log | Audit trail de acciones staff | `activity_log` (spatie) | No | ✅ kx_activity_log parcial |

### ECONOMÍA
| Módulo | Descripción | Tablas | Requiere Arcturus | Kodexa puede impl |
|--------|-------------|--------|-------------------|-------------------|
| Créditos usuarios | Ver/editar créditos | `users.credits` | No | ✅ Vía admin/users |
| Duckets usuarios | Ver/editar duckets | `user_currencies (type=0)` | No | ✅ Vía admin/users |
| Diamantes usuarios | Ver/editar diamonds | `user_currencies (type=5)` | No | ✅ Vía admin/users |
| Puntos usuarios | Ver/editar points | `user_currencies (type=101)` | No | ✅ Vía admin/users |
| Shop packages | Paquetes de tienda | `website_shop_articles` | No | ❌ Futuro |
| Vouchers | Códigos promocionales | `website_shop_vouchers` | No | ❌ Futuro |

### DESARROLLO / RCON
| Módulo | Descripción | Requiere Arcturus | Kodexa puede impl |
|--------|-------------|-------------------|-------------------|
| RCON Panel | Envío de comandos al emulador | Sí (live) | ❌ Post-Arcturus live |
| Send Credits | Dar créditos via RCON | Sí | ❌ Post-Arcturus live |
| Give Badge | Dar badge via RCON | Sí | ❌ Post-Arcturus live |
| Hotel Alert | Alertar a todos via RCON | Sí | ❌ Post-Arcturus live |
| Update Wordfilter | Recargar wordfilter via RCON | Sí | ❌ Post-Arcturus live |

---

## Sistema de permisos Housekeeping (28 permisos)

**Fuente:** `database/seeders/HousekeepingPermissionSeeder.php`

### Patrón de implementación
```php
// PHP (AtomCMS):
$this->permissions->get($permissionName) // min_rank por permiso
auth()->user()->rank >= $minRank         // check simple

// TypeScript equivalente para Kodexa:
const perm = await db.kxHousekeepingPermission.findUnique({ where: { permission: 'manage_bans' } });
if (!perm || session.user.rank < perm.minRank) throw new Error('Forbidden');
```

### Tabla completa de permisos

| Permiso | Rank mínimo | Propósito |
|---------|-------------|-----------|
| `can_access_housekeeping` | 6 | Gateway — acceso al panel staff |
| `edit_user` | 6 | Editar perfil de usuario |
| `reset_user_password` | 6 | Forzar reset de contraseña |
| `delete_user` | 7 | Eliminar usuarios permanentemente |
| `write_article` | 6 | Crear noticias |
| `edit_article` | 6 | Editar noticias |
| `delete_article` | 6 | Eliminar noticias |
| `manage_wordfilter` | 6 | Agregar/quitar palabras bloqueadas |
| `manage_bans` | 6 | Crear/modificar/revocar baneos |
| `manage_room_chatlogs` | 6 | Ver historial de chat de salas |
| `manage_private_chatlogs` | 6 | Ver mensajes privados |
| `manage_catalog_pages` | 6 | Editar páginas del catálogo |
| `delete_catalog_pages` | 6 | Eliminar páginas del catálogo |
| `manage_emulator_settings` | 6 | Configuración del emulador |
| `manage_emulator_texts` | 6 | Strings del cliente de juego |
| `manage_website_settings` | 6 | Configuración del sitio web |
| `manage_website_blacklists` | 6 | Gestión de IPs bloqueadas |
| `manage_website_whitelists` | 6 | Gestión de IPs permitidas |
| `view_activity_logs` | 7 | Ver audit trail del staff |
| `manage_staff_applications` | 7 | Revisar solicitudes de staff |
| `delete_website_settings` | 7 | Eliminar configuraciones del sitio |
| `manage_permissions` | 7 | Editar permisos de rangos |
| `delete_permissions` | 7 | Eliminar rangos |
| `manage_article_tags` | 6 | Gestionar tags de artículos |
| `manage_teams` | 6 | Gestionar equipos staff |
| `manage_achievements` | 7 | Gestionar logros del juego |
| `manage_commandlogs` | 7 | Ver logs de comandos in-game |
| `manage_camera_web` | 7 | Gestionar fotos publicadas in-game |
| `manage_housekeeping_permissions` | 7 | Editar estos permisos |

---

## Sistema de currencies

### Tipos de moneda (CurrencyTypes Enum)

| Tipo | Valor int | Tabla | Columna | Icono |
|------|-----------|-------|---------|-------|
| Credits | -1 (especial) | `users` | `credits` | `credits.gif` |
| Duckets | 0 | `user_currencies` | `amount WHERE type=0` | `duckets.png` |
| Diamonds | 5 | `user_currencies` | `amount WHERE type=5` | `diamonds.png` |
| Points | 101 | `user_currencies` | `amount WHERE type=101` | `points.png` |

### Cómo se muestra en el admin

AtomCMS UserResource tiene un tab **"Currencies"** con:
- Credits: número editable (campo en `users` table)
- Duckets: número editable (lookup `user_currencies type=0`)
- Diamonds: número editable (lookup `user_currencies type=5`)
- Points: número editable (lookup `user_currencies type=101`)

Cada campo puede incrementar/decrementar directamente. Los cambios se aplican via RCON si el emulador está activo.

### Comparación Kodexa vs AtomCMS

| Feature | AtomCMS | Kodexa actual | Brecha |
|---------|---------|---------------|--------|
| Ver créditos de usuario | ✅ Tab Currencies | ⚠️ Solo en edit modal | Mostrar currencies tab |
| Editar créditos admin | ✅ Edición directa + RCON | ⚠️ No existe | Implementar en users edit |
| Ver duckets | ✅ Vía UserCurrency | ❌ No mostrado | Requiere Arcturus DB |
| Ver diamonds | ✅ Vía UserCurrency | ❌ No mostrado | Requiere Arcturus DB |
| Ver points | ✅ Vía UserCurrency | ❌ No mostrado | Requiere Arcturus DB |
| Iconos currencies | ✅ 4 iconos disponibles | ❌ No tenemos | Crear/adaptar |

---

## RCON — Arquitectura y comandos

### Implementación AtomCMS

```typescript
// Equivalente TypeScript del RconService:
class RconService {
  private socket: net.Socket | null = null;
  
  sendCommand(command: string, data?: object): void {
    const payload = JSON.stringify({ key: command, data: data ?? {} });
    this.socket?.write(payload + '\r\n'); // Fire-and-forget
  }
  
  giveCredits(userId: number, credits: number): void {
    this.sendCommand('givecredits', { user_id: userId, credits });
  }
  
  giveBadge(userId: number, badge: string): void {
    this.sendCommand('givebadge', { user_id: userId, badge });
  }
  
  hotelAlert(message: string): void {
    this.sendCommand('hotelalert', { message });
  }
  
  updateWordFilter(): void {
    this.sendCommand('updatewordfilter', {});
  }
}
```

### Limitaciones detectadas en AtomCMS

| Limitación | Impacto | Mejora para Kodexa |
|-----------|---------|-------------------|
| Fire-and-forget (sin respuesta) | No saber si comando llegó | Agregar ACK / response handling |
| Sin retry logic | Comandos silenciosamente fallidos | Implementar retry con exponential backoff |
| Sin logging de comandos | No auditoría | Loggear cada comando con user, timestamp, resultado |
| Conexión única (no pool) | Cuello de botella en alto tráfico | Implementar connection pool |

### Comandos RCON disponibles en AtomCMS

| Comando | Payload | Cuándo usar |
|---------|---------|------------|
| `givecredits` | `{user_id, credits}` | Admin da créditos |
| `givebadge` | `{user_id, badge}` | Admin da badge |
| `setmotto` | `{user_id, motto}` | Reset motto |
| `hotelalert` | `{message}` | Alerta a todos |
| `updatewordfilter` | `{}` | Después de cambiar wordfilter |
| `sendgift` | `{user_id, item_id, message}` | Enviar regalo |

---

## Usuarios, rangos y permisos

### Estructura de rangos (Arcturus `permissions` table)

| Rank | Nombre sugerido | Acceso Housekeeping |
|------|-----------------|---------------------|
| 1 | Usuario | ❌ No |
| 2 | VIP | ❌ No |
| 3 | HC | ❌ No |
| 4 | Helper | ❌ No |
| 5 | Moderador Jr | ❌ No |
| 6 | Moderador | ✅ Sí (`can_access_housekeeping`) |
| 7 | Senior Mod | ✅ Sí + `delete_user`, `view_activity_logs` |
| 8 | Manager | ✅ Sí + permisos elevados |
| 9 | Developer | ✅ RCON access |
| 10 | Founder | ✅ Acceso total |

### Campos custom en `users` table (AtomCMS agrega)

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `two_factor_secret` | string null | TOTP 2FA |
| `two_factor_confirmed` | bool | 2FA activado |
| `hidden_staff` | bool | Staff oculto en lista pública |
| `website_balance` | int | Balance tienda web |
| `referral_code` | string | Código único de referido |

### Kodexa deuda rank 8-10

**Problema actual:** `z.number().max(7)` en API bloquea asignar ranks 8-10 desde el admin.

**Solución AtomCMS:** Usa `manage_permissions` (min_rank=7) como gate, sin max en la validación.

**Acción Kodexa:** MP-CMS-003H — remover `max(7)`, agregar guard `session.user.rank >= 9` para asignar ranks ≥ 8.

---

## Catálogo y muebles

### Lo que gestiona AtomCMS

| Módulo | Tablas | Qué hace |
|--------|--------|---------|
| Catalog Pages | `catalog_pages` | CRUD jerarquía de páginas |
| Catalog Editors | `catalog_items`, `items_base` | Editor de items por página |
| Achievements | `achievements` | Gestión de logros |
| Emulator Settings | `emulator_settings` | Config del emulador via UI |

### Estado para Kodexa

- ❌ No implementar catálogo hasta tener Arcturus Morningstar main corriendo
- ✅ Sí leer tablas en modo lectura para mostrar en stats del dashboard
- ✅ Sí implementar vista de "total de muebles" y "categorías" en dashboard admin

---

## Noticias/contenido — Comparación

### AtomCMS Articles vs Kodexa News

| Feature | AtomCMS | Kodexa actual | Brecha |
|---------|---------|---------------|--------|
| CRUD básico | ✅ | ✅ | — |
| Tags/categorías | ✅ | ❌ | Agregar tags system |
| Reacciones | ✅ 27 tipos | ❌ | Futuro |
| Comentarios | ✅ Con moderación | ❌ | Futuro |
| Imagen portada | ✅ | ✅ (imageUrl field) | — |
| Estados | PUBLISHED/DRAFT | ✅ PUBLISHED/DRAFT/ARCHIVED | Kodexa tiene más |
| Slug auto | ✅ | ✅ | — |
| Multiidioma | ✅ | ❌ | No necesario ahora |
| Editor rich text | ❌ (plain text) | ❌ (plain text) | Mejora futura |

---

## Moderación — Comparación completa

| Herramienta | AtomCMS | Kodexa actual | Prioridad |
|-------------|---------|---------------|-----------|
| Baneos CRUD | ✅ | ✅ (rediseñado) | — |
| IP Bans | ✅ | ⚠️ Parcial | P1 |
| Wordfilter | ✅ | ⚠️ Existe, falta rediseño | P1 |
| Chat logs salas | ✅ | ❌ | P2 |
| Chat privados | ✅ | ❌ | P2 |
| Command logs | ✅ | ⚠️ kx_activity_log parcial | P1 |
| IP Blacklist | ✅ | ❌ | P2 |
| Reports sistema | ❌ | ❌ | P3 |
| VPN blocking | ✅ (middleware) | ❌ | P3 |

---

## Navegación admin AtomCMS — Adaptada para Kodexa

**Propuesta de navegación definitiva `/admin`:**

```
HOTEL
├── Dashboard            /admin                    ✅ Existe
├── Usuarios             /admin/users              ✅ Existe
├── Salas                /admin/rooms              ✅ Existe
└── Catálogo             /admin/catalog            ❌ Post-Arcturus

COMUNIDAD
├── Noticias             /admin/news               ✅ Existe
├── Tags                 /admin/news/tags          ❌ Implementar
├── Mensajes             /admin/messages           ⚠️ Falta rediseño
├── Alertas              /admin/alerts             ⚠️ Falta rediseño
└── Equipos Staff        /admin/teams              ❌ Implementar

MODERACIÓN
├── Baneos               /admin/bans               ✅ Existe
├── Word Filter          /admin/wordfilter         ⚠️ Falta rediseño
├── Logs                 /admin/logs               ✅ Existe
├── Chat Logs            /admin/chatlogs           ❌ Post-Arcturus
└── IP Blocking          /admin/ips                ❌ Implementar

SISTEMA
├── Permisos in-game     /admin/permissions        ⚠️ Falta rediseño
├── Permisos Staff       /admin/housekeeping-perms ❌ No existe
├── Badges               /admin/badges             ⚠️ Falta rediseño
├── Configuración        /admin/settings           ⚠️ Falta rediseño
└── RCON                 /admin/rcon               ❌ Post-Arcturus live
```

---

## Patrones visuales AtomCMS

| Patrón visual | Descripción | Replicar | Adaptación Kodexa |
|---------------|-------------|----------|-------------------|
| Sidebar con grupos | Secciones colapsables (Hotel, Comunidad, etc.) | ✅ Sí | Grupos en AdminSidebar con section headers |
| Stats cards en dashboard | Cards con iconos y números | ✅ Sí | Ya existe `AdminStatCard` |
| Tabs en edit modal | Multiple tabs para user edit | ✅ Sí | Tabs en user edit (General, Currencies, Permisos) |
| Table filters inline | Dropdown + text input mismo row | ✅ Sí | Ya implementado en users/logs |
| Badge por tipo | Color semántico por categoría | ✅ Sí | Ya existe `badge-*` classes |
| Color picker para ranks | Input color para staff_color | ✅ Sí | Implementar en permissions page |
| Timeline en logs | Eventos cronológicos con iconos | ✅ Sí | Mejorar logs page |
| Modal de confirmación | Overlay + prompt antes de acción destructiva | ✅ Sí | Ya existe `ConfirmModal` |
| Blade full-page modals | Modal ocupa toda la pantalla | ❌ No | Kodexa usa sidepanels/modales pequeños |
| Filament table rows | Auto-generadas desde model | ❌ No | Stack PHP-specific |
| Paginación cursor | Laravel cursor pagination | ❌ No | Kodexa usa offset pagination |
| Multi-theme runtime | 2 themes en runtime | ❌ No | Kodexa usa CSS vars light/dark |

---

## Matriz de features a replicar

| Feature AtomCMS | Módulo | Requiere Arcturus | Requiere assets | Estado Kodexa | Prioridad |
|----------------|--------|-------------------|-----------------|---------------|-----------|
| Permisos Housekeeping (28 entradas) | Sistema | No | No | ❌ No existe | **P0** |
| Tabs currencies en user edit | Usuarios | No | Sí (4 iconos) | ❌ No existe | **P0** |
| Grupos de navegación sidebar | Sistema | No | No | ❌ No existe | **P0** |
| Color staff por rank | Permisos | No | No | ❌ No existe | **P0** |
| Chat logs salas | Moderación | Sí (tabla Arcturus) | No | ❌ No existe | **P1** |
| Chat logs privados | Moderación | Sí (tabla Arcturus) | No | ❌ No existe | **P1** |
| IP Blacklist/Whitelist | Moderación | No | No | ❌ No existe | **P1** |
| Tags para noticias | Contenido | No | No | ❌ No existe | **P1** |
| Teams/Staff page | Comunidad | No | No | ❌ No existe | **P1** |
| Staff Applications | Comunidad | No | No | ❌ No existe | **P1** |
| RCON panel (básico) | Desarrollo | Sí (live) | No | ❌ No existe | **P2** |
| Command logs | Moderación | Sí (tabla Arcturus) | No | ⚠️ Parcial | **P1** |
| Draw Badge | Sistema | Sí | No | ❌ No existe | **P3** |
| Camera Web (fotos) | Hotel | No | No | ❌ No existe | **P3** |
| Shop packages admin | Economía | No | No | ❌ No existe | **P2** |
| Rare Values | Comunidad | No | No | ❌ No existe | **P3** |
| Achievements admin | Hotel | Sí | No | ❌ No existe | **P2** |
| 2FA obligatorio para staff | Seguridad | No | No | ❌ No existe | **P1** |
| Emulator Settings editor | Sistema | Sí | No | ❌ No existe | **P2** |
| Catálogo admin | Hotel | Sí | No | ❌ No existe | **P2** |

### Features que NO debemos replicar

| Feature | Razón |
|---------|-------|
| Flash client support | Kodexa usa solo Nitro |
| PayPal integration | Usar Stripe si se necesita |
| Filament CRUD auto-generado | Stack PHP, no aplica |
| Laravel Blade templates | Stack diferente |
| Multi-theme runtime switching | CSS vars son suficientes |
| FindRetros API | No esencial para MVP |
| PHP Artisan commands UI | Usar scripts pnpm |
| Livewire reactive components | Usamos React |

---

## Comparación AtomCMS vs Kodexa

| Dimensión | AtomCMS | Kodexa actual | Brecha |
|-----------|---------|---------------|--------|
| Módulos admin | 30+ recursos | ~12 páginas | Faltan 18+ módulos |
| Permisos housekeeping | 28 granulares | Sólo `canAccessAdmin(rank)` | Sistema granular completo |
| Currencies en admin | 4 (credits, duckets, diamonds, points) | Solo créditos visible | 3 currencies faltantes |
| Audit trail | Spatie ActivityLog completo | kx_activity_log básico | Mejorar cobertura |
| Chat logs | 2 tipos (rooms, privates) | kx_activity_log solo acciones | Chat logs completos |
| RCON | TCP socket + 6 comandos | No existe | Post-Arcturus live |
| Tags artículos | Polimórfico (tags + taggables) | Sin tags | Implementar |
| Teams/Staff | Teams + applications | Sin teams | Implementar |
| 2FA obligatorio staff | ✅ Middleware force.staff.2fa | ❌ No existe | P1 |
| IP tools | Blacklist + Whitelist | ❌ No existe | P2 |

---

## Roadmap recomendado (nuevos MPs)

### Fase 1 — Fundación admin (P0)

| MP | Descripción | Archivos afectados |
|----|-------------|-------------------|
| **MP-CMS-003H** | Política ranks 8-10 + founder-only | `admin/users/[id]/route.ts` |
| **MP-CMS-003I** | Sidebar con section headers (HOTEL/COMUNIDAD/etc.) | `AdminSidebar.tsx` |
| **MP-CMS-003G.3** | Rediseño /admin/wordfilter | `WordfilterClient.tsx` |
| **MP-CMS-003G.4** | Rediseño /admin/settings + AdminToggle | `AdminSettingsClient.tsx` |
| **MP-CMS-003G.5** | Rediseño /admin/permissions + /admin/alerts | `PermissionsClient.tsx`, `AlertsClient.tsx` |
| **MP-CMS-003G.6** | Rediseño /admin/badges + /admin/messages | `BadgesClient.tsx`, `AdminMessagesClient.tsx` |

### Fase 2 — Permisos y sistema (P0-P1)

| MP | Descripción | Prioridad |
|----|-------------|-----------|
| **MP-CMS-PERM-001** | Sistema permisos housekeeping granular (28 permisos, tabla `kx_housekeeping_permissions`) | P0 |
| **MP-CMS-PERM-002** | UI editor permisos staff en `/admin/housekeeping-perms` | P0 |
| **MP-CMS-PERM-003** | Color staff por rank (campo `staff_color` en permissions) | P1 |
| **MP-CMS-SEC-001** | 2FA obligatorio para staff rank ≥ 6 | P1 |

### Fase 3 — Currencies y economía (P0-P1)

| MP | Descripción | Prioridad |
|----|-------------|-----------|
| **MP-ATOM-002** | Assets currencies (credits/duckets/diamonds/points iconos) | P0 |
| **MP-ATOM-003** | Dashboard con cards de economía (4 currencies en stats) | P1 |
| **MP-ATOM-004** | Tab currencies en user edit | P1 |

### Fase 4 — Moderación avanzada (P1-P2)

| MP | Descripción | Prioridad |
|----|-------------|-----------|
| **MP-MOD-001** | IP Blacklist + Whitelist admin | P2 |
| **MP-MOD-002** | Chat logs (salas + privados) — requiere Arcturus DB | P2 |
| **MP-MOD-003** | Command logs mejorado | P1 |

### Fase 5 — Comunidad (P1-P2)

| MP | Descripción | Prioridad |
|----|-------------|-----------|
| **MP-COM-001** | Tags para artículos de noticias | P1 |
| **MP-COM-002** | Teams y Staff Applications | P2 |
| **MP-COM-003** | Rare Values (collector list) | P3 |

### Fase 6 — Post Arcturus live (P2-P3)

| MP | Descripción | Prioridad |
|----|-------------|-----------|
| **MP-RCON-001** | RCON service en TypeScript + panel básico | P2 |
| **MP-ARC-001** | Catálogo admin (pages + items) | P2 |
| **MP-ARC-002** | Emulator Settings editor | P2 |
| **MP-ARC-003** | Achievements admin | P3 |
| **MP-ARC-004** | Chat logs completos | P2 |

---

## Restricciones verificadas

| Restricción | Estado |
|-------------|--------|
| Solo lectura — sin modificar AtomCMS | ✅ |
| Sin cambios en Kodexa | ✅ |
| Sin tocar Prisma schema | ✅ |
| Sin tocar Arcturus | ✅ |
| Sin tocar middleware.ts | ✅ |
| Sin tocar SSO | ✅ |
| Sin instalar dependencias | ✅ |
| Solo documentación generada | ✅ |
