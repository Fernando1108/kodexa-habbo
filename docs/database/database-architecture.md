# Arquitectura de Bases de Datos — Kodexa Hotel

**Decisión oficial (MP-007):** Un solo contenedor MariaDB con 3 bases separadas.

---

## Resumen

| Base | Propósito | Estado |
|------|-----------|--------|
| `kodexa_hotel` | Identidad central, CMS, hotel actual | ✅ ACTIVA — todos los datos actuales |
| `arcturus_main` | Hotel principal futuro (Arcturus Main) | ✅ Creada — vacía |
| `arcturus_dev` | Laboratorio desarrollo futuro (Arcturus Dev) | ✅ Creada — vacía |

**Todas en el mismo contenedor `kodexa-db` (MariaDB 10.11, puerto 3306).**

---

## kodexa_hotel — Base Central

**Nombre físico:** `kodexa_hotel`  
**Nombre arquitectónico:** `kodexa_core` (puede renombrarse en futuro, con backup)  
**Estado:** Activa. Toda la aplicación vive aquí.

### Qué contiene
- Usuarios, rangos, SSO, autenticación (tablas Arcturus: `users`, `permissions`)
- ORM Prisma para CMS + emulador custom
- Tablas custom `kx_*` de Kodexa
- Configuración del hotel (`emulator_settings`, `website_settings`)
- Catálogo, salas, items, badges
- Audit log, moderación, mensajes

### Regla: kodexa_hotel manda sobre identidad
Esta base es la fuente de verdad para:
- Registro de usuarios
- Login / Auth / SSO
- Rangos y permisos oficiales
- Sesiones activas

Arcturus Main y Dev **NO** manejan registro propio. Recibirán usuarios via Auth Bridge futuro.

### Auth Bridge (futuro)
Cuando Arcturus esté activo, se implementará un sistema que sincroniza:
- Credenciales de `kodexa_hotel` → `arcturus_main` al conectar
- Sin duplicar registro ni contraseñas
- Un solo sistema de identidad

---

## arcturus_main — Hotel Principal

**Nombre físico:** `arcturus_main`  
**Estado:** Creada y vacía (MP-007)  
**Motor futuro:** Arcturus Morningstar  
**Puerto WS futuro:** 2096  
**Acceso:** Todos los usuarios autenticados

### Propósito
- Base de producción del hotel principal.
- Se importará ObjectRetros / Morningstar 3.5.5 cuando Diego apruebe.
- Catálogo de producción, furnis, salas oficiales.
- NO se resetea — es producción.

### Regla: arcturus_main NO maneja registro
Los usuarios de `kodexa_hotel.users` serán reflejados via Auth Bridge.
No habrá tabla `users` separada con contraseñas distintas.

### Próximos pasos para activar
1. Diego aprueba importación ObjectRetros.
2. Importar SQL de ObjectRetros en `arcturus_main`.
3. Configurar Arcturus apuntando a `arcturus_main`.
4. Implementar Auth Bridge.
5. Probar flujo completo con usuario admin.

---

## arcturus_dev — Laboratorio de Desarrollo

**Nombre físico:** `arcturus_dev`  
**Estado:** Creada y vacía (MP-007)  
**Motor futuro:** Arcturus Dev / nitro-docker  
**Puerto WS futuro:** 2098  
**Acceso:** DEVELOPER (rank ≥ 9) + FOUNDER

### Propósito
- Base de staging/testing completamente aislada.
- Puede resetearse sin afectar producción.
- Probar catálogos, furnis, precios, mecánicas antes de publicar en main.
- Base para `/desarrollo` en Next.js.

### Regla: arcturus_dev es desechable
Los datos aquí son temporales. Un reset no afecta ni `kodexa_hotel` ni `arcturus_main`.

### Próximos pasos para activar
1. Diego aprueba setup dev.
2. Importar SQL base en `arcturus_dev` (puede ser copia de arcturus_main o fresh).
3. Configurar instancia Arcturus dev apuntando a `arcturus_dev` y puerto 2098.
4. Verificar cliente Nitro conecta a ws://localhost:2098.

---

## Reglas generales

1. **No mezclar tablas entre bases.** Cada base es dominio independiente.
2. **kodexa_hotel es la única fuente de verdad para identidad.**
3. **arcturus_main y arcturus_dev no tienen sistema de registro propio.**
4. **Auth Bridge es el puente — no se implementa hasta que Arcturus esté listo.**
5. **Un reset de arcturus_dev no toca kodexa_hotel ni arcturus_main.**

---

## Usuarios de base de datos

| Usuario | Permisos actuales | Acceso a |
|---------|-------------------|----------|
| `root` | SUPERUSER | Todo |
| `kodexa` | ALL PRIVILEGES | `kodexa_hotel` únicamente |

### Permisos futuros sugeridos (no implementados todavía)

```sql
-- Cuando Arcturus Main esté listo:
GRANT ALL PRIVILEGES ON arcturus_main.* TO 'kodexa'@'%';

-- O usuario específico para Arcturus:
CREATE USER 'arcturus_user'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON arcturus_main.* TO 'arcturus_user'@'%';
GRANT ALL PRIVILEGES ON arcturus_dev.*  TO 'arcturus_user'@'%';
```

**No implementar hasta que Arcturus esté en uso.**

---

## Variables de entorno (estado actual + futuras)

### Actuales (funcionales)
```env
DATABASE_URL="mysql://kodexa:...@localhost:3306/kodexa_hotel"
```

### Futuras (cuando Arcturus esté activo)
```env
# Mantener DATABASE_URL apuntando a kodexa_hotel (identidad central)
DATABASE_URL="mysql://kodexa:...@localhost:3306/kodexa_hotel"

# Arcturus Main
ARCTURUS_MAIN_DB_HOST=localhost
ARCTURUS_MAIN_DB_PORT=3306
ARCTURUS_MAIN_DB_NAME=arcturus_main
ARCTURUS_MAIN_DB_USER=arcturus_user
ARCTURUS_MAIN_DB_PASSWORD=[secret]

# Arcturus Dev
ARCTURUS_DEV_DB_HOST=localhost
ARCTURUS_DEV_DB_PORT=3306
ARCTURUS_DEV_DB_NAME=arcturus_dev
ARCTURUS_DEV_DB_USER=arcturus_user
ARCTURUS_DEV_DB_PASSWORD=[secret]
```

No exponer secrets. Usar `.env` local + `.env.example` con placeholders.
