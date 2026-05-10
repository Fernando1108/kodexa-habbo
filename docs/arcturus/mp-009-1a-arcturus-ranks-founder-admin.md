# MP-009.1A — Extensión de Rangos Arcturus + Admin Fundador

> **Fecha:** 2026-05-10
> **Estado:** Completado
> **Prerequisito:** MP-009 (Arcturus Main operativo), MP-009.1 (usuario admin creado)

---

## Objetivo

Extender `arcturus_main.permissions` de 7 a 10 rangos para alinear con el modelo de rangos de Kodexa Hotel, y actualizar el usuario `admin` al rango 10 (Founder).

---

## Motivación

Arcturus Morningstar incluye 7 rangos por defecto (1=Member hasta 7=Administrator). Kodexa Hotel usa hasta rank 10:

| Rank | Label Kodexa |
|------|-------------|
| 1 | Normal |
| 2 | VIP |
| 3 | Staff |
| 4 | Support |
| 5 | Moderator |
| 6 | Senior Mod |
| 7 | Administrator |
| 8 | Hotel Manager |
| 9 | Developer |
| 10 | Founder |

El fundador (Diego) tiene rank 10 en Kodexa. Sin la extensión, el máximo en Arcturus era rank 7.

---

## Backup

Antes de cualquier modificación, se hizo backup de la tabla `permissions`:

```
.backups/arcturus_main_permissions_20260510_082402.sql
```

Backup excluido de git vía `.gitignore` (entrada `.backups/`).

---

## Rangos creados

### Estrategia

En lugar de definir los 200+ campos manualmente, se clonaron los permisos del rank 7 (Administrator, acceso completo) para los ranks 8, 9 y 10, sobreescribiendo solo los campos de identidad visual.

```sql
INSERT INTO permissions (id, rank_name, badge, prefix, prefix_color, level, ...)
SELECT 8, 'Hotel Manager', 'HM', '[HM]', '#FF9900', 7, <rest of rank 7 columns>
FROM permissions WHERE id = 7;
```

### Resultado

| ID | rank_name | badge | prefix | prefix_color | level |
|----|-----------|-------|--------|--------------|-------|
| 1 | Member | | | | 1 |
| 2 | VIP | | | | 2 |
| 3 | X | | | | 3 |
| 4 | Support | | | | 4 |
| 5 | Moderator | | | | 5 |
| 6 | Super Mod | | | | 6 |
| 7 | Administrator | ADM | [ADM] | #A1A1A1 | 7 |
| 8 | Hotel Manager | HM | [HM] | #FF9900 | 7 |
| 9 | Developer | DEV | [DEV] | #00D4AA | 8 |
| 10 | Founder | OWN | [OWN] | #7C3AED | 9 |

**Colores de identidad Kodexa:**
- `#FF9900` — Hotel Manager (dorado/naranja)
- `#00D4AA` — Developer (verde esmeralda, color primario Kodexa)
- `#7C3AED` — Founder (púrpura, color secundario Kodexa)

---

## Usuario admin actualizado

```sql
UPDATE users SET
  rank = 10,
  auth_ticket = 'kodexa_admin_sso_local_2026',
  motto = 'Fundador de Kodexa.Hotel',
  credits = 99999,
  pixels = 50000,
  points = 10000
WHERE username = 'admin';
```

**Estado final:**

| Campo | Valor |
|-------|-------|
| id | 3 |
| username | admin |
| rank | 10 (Founder) |
| auth_ticket | `kodexa_admin_sso_local_2026` |
| motto | Fundador de Kodexa.Hotel |
| look | `hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804` |

---

## Reinicio de Arcturus

Se terminaron los procesos Java anteriores (PIDs 26752, 23128) con PowerShell:

```powershell
Stop-Process -Id 26752 -Force -ErrorAction SilentlyContinue
Stop-Process -Id 23128 -Force -ErrorAction SilentlyContinue
```

Reinicio:

```bash
cd external/arcturus/objectretros/emulator
java -Dfile.encoding=UTF8 -jar Habbo-3.5.5-jar-with-dependencies.jar
```

---

## Log de arranque (extracto)

```
08:29:52.440 Permissions Manager -> Loaded! (13 MS)
08:29:53.726 Started GameServer on 0.0.0.0:3005@Game Server
08:29:53.727 Started GameServer on 127.0.0.1:3002@RCON Server
08:29:53.787 OFFICIAL PLUGIN - Nitro Websockets has started!
```

Permissions Manager carga todos los rangos definidos en la tabla. Con 10 rows insertadas, los 10 rangos quedan operativos.

---

## Validaciones

| Verificación | Estado |
|-------------|--------|
| Backup permissions creado antes de modificar | ✅ |
| `.backups/` en `.gitignore` | ✅ |
| permissions tiene 10 rows (rangos 1-10) | ✅ |
| Ranks 8/9/10 clonados de rank 7 (acceso completo) | ✅ |
| Rank 10 badge=OWN, color=#7C3AED (Kodexa purple) | ✅ |
| Rank 9 badge=DEV, color=#00D4AA (Kodexa primary) | ✅ |
| Rank 8 badge=HM, color=#FF9900 | ✅ |
| admin.rank = 10 | ✅ |
| admin.auth_ticket = kodexa_admin_sso_local_2026 | ✅ |
| Arcturus arrancó sin errores críticos | ✅ |
| Permissions Manager → Loaded! en startup | ✅ |
| Puerto 2096 WebSocket LISTENING | ✅ |
| Puerto 3005 TCP game socket LISTENING | ✅ |
| Puerto 3002 RCON LISTENING | ✅ |
| kodexa_hotel sin modificaciones | ✅ |
| arcturus_dev sin modificaciones | ✅ |
| Prisma schema no tocado | ✅ |
| Migraciones no creadas | ✅ |

---

## Advertencias

- Ranks 8/9/10 heredan **todos** los permisos del rank 7 (Administrator). Si en el futuro se quieren diferenciar permisos entre HM/Dev/Founder, actualizar columnas específicas en cada row.
- `auth_ticket = 'kodexa_admin_sso_local_2026'` es estático para dev local. Auth Bridge (MP-011) lo reemplaza con tickets dinámicos.
- El `level` de la tabla `permissions` no corresponde directamente al `rank` en `users`. Level es un campo Arcturus interno (orden jerárquico para ciertos checks). Ranks 8-10 tienen levels 7-9 que no existían antes — no se han detectado conflictos.

---

## Próximos pasos

| MP | Tarea |
|----|-------|
| MP-009.1B | Compilar/levantar Nitro renderer y probar login con `?ticket=kodexa_admin_sso_local_2026` |
| MP-010 | Setup Arcturus Dev (port 2098 WS, 3006 TCP, 3003 RCON) |
| MP-011 | Auth Bridge Kodexa → Arcturus Main (tickets dinámicos, sync look/motto/rank) |
| — | Fix SSL: renombrar `ssl/key.pem` → `ssl/privkey.pem` para WSS real |
