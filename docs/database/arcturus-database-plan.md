# Plan de Bases de Datos Arcturus — Kodexa Hotel

**Estado:** PREPARADO — importación pendiente de aprobación de Diego  
**Bases creadas:** `arcturus_main` ✅ | `arcturus_dev` ✅ (ambas vacías)

---

## arcturus_main — Plan de Importación

### Fuente: ObjectRetros (Morningstar 3.5.5)

ObjectRetros es el SQL base estándar del ecosistema Arcturus. Incluye:
- +36,000 furnis en `items_base`
- Catálogo completo (`catalog_pages`, `catalog_items`)
- +5,000 prendas de ropa
- Room models predefinidos
- Badges base
- Configuración emulador

### Checklist de importación (NO ejecutar todavía)

- [ ] Diego aprueba importación ObjectRetros
- [ ] Descargar SQL de ObjectRetros / Morningstar 3.5.5
- [ ] Verificar compatibilidad con MariaDB 10.11 + utf8mb4
- [ ] Importar en `arcturus_main` (NO en kodexa_hotel)
- [ ] Verificar tablas críticas: `users`, `items_base`, `catalog_pages`, `room_models`
- [ ] Configurar Arcturus apuntando a `arcturus_main`
- [ ] Configurar puerto 2096
- [ ] Implementar Auth Bridge (sync de usuarios desde kodexa_hotel)
- [ ] Prueba end-to-end con cuenta admin

### Comando de importación (cuando sea el momento)

```bash
# Desde el host, con archivo SQL descargado:
docker exec -i kodexa-db mariadb -uroot -p[PASSWORD] arcturus_main < objectretros.sql
```

**No ejecutar hasta aprobación explícita de Diego.**

---

## arcturus_dev — Plan de Importación

### Fuente: Copia de arcturus_main o SQL base mínimo

La estrategia depende del momento:

**Opción A — Copia de arcturus_main** (recomendada cuando main esté importado):
```bash
# Dump de main → importar en dev
docker exec kodexa-db mariadb-dump -uroot -p[PASSWORD] arcturus_main > arcturus_main_dump.sql
docker exec -i kodexa-db mariadb -uroot -p[PASSWORD] arcturus_dev < arcturus_main_dump.sql
```

**Opción B — nitro-docker** (si se usa imagen de Docker con Arcturus pre-configurado):
- Configurar nitro-docker apuntando a `arcturus_dev`
- Puerto 2098
- Más fácil para desarrollo aislado

### Checklist (NO ejecutar todavía)

- [ ] Diego aprueba setup dev
- [ ] Decidir: Opción A (copia de main) o Opción B (nitro-docker)
- [ ] Importar SQL base en `arcturus_dev`
- [ ] Configurar instancia Arcturus dev con puerto 2098
- [ ] Verificar que cliente Nitro conecta a ws://localhost:2098
- [ ] Prueba: HotelDesarrolloClient iframe → ws://2098 → AUTH_OK

---

## Auth Bridge — Arquitectura futura

El Auth Bridge es el sistema que permite a Arcturus (main y dev) reconocer usuarios de `kodexa_hotel` sin duplicar registro.

### Principio

```
Usuario registra en kodexa_hotel.users (fuente de verdad)
         ↓
Al conectar a Arcturus WS:
  1. Cliente envía SSO ticket
  2. Arcturus consulta kodexa_hotel.users por auth_ticket
  3. Si válido: upsert en arcturus_main.users con mismo ID/username/rank
  4. Sesión activa en Arcturus
```

### Estado
- NO implementado todavía
- Requiere que Arcturus esté corriendo primero
- Puede implementarse como plugin Arcturus o como proxy WS

---

## Puntos críticos a resolver antes de Arcturus

1. **Conflicto de rangos (detectado MP-007):**
   - Código: `isFounder(rank >= 10)` pero DB max es rank 9 (Fundador)
   - Diego debe decidir: bajar threshold a 9, o crear rank 10 en permissions
   - Ver: `docs/database/current-database-audit.md` → ALERTA CRÍTICA

2. **Usuario DB para Arcturus:**
   - Actualmente `kodexa` solo tiene permisos sobre `kodexa_hotel`
   - Necesitará permisos sobre `arcturus_main` y `arcturus_dev`
   - O crear usuario dedicado `arcturus_user`

3. **Separación de kodexa_hotel vs kodexa_core:**
   - Arquitectónicamente, `kodexa_hotel` debería renombrarse a `kodexa_core` en futuro
   - Requiere: backup, actualizar DATABASE_URL, reiniciar servicios
   - No hacer todavía — es un cambio de nombre cosmético que puede esperar

---

## Próximo microproceso recomendado

**MP-008: Resolver conflicto de rangos + preparar Arcturus**

1. Diego decide: rank threshold para FOUNDER (9 o nuevo 10)
2. Actualizar middleware.ts si es necesario
3. Actualizar cuenta admin si es necesario
4. Preparar `docker-compose.yml` para futuro servicio Arcturus
5. Documentar configuración esperada de `arcturus.ini`
