# MP-009.1A — Vinculación manual usuario admin Kodexa → arcturus_main

> **Fecha:** 2026-05-10
> **Estado:** Completado — vinculación temporal para prueba local
> **⚠️ TEMPORAL:** No es el Auth Bridge real. Válido solo para dev local.

---

## Objetivo

Crear copia compatible del usuario admin de Kodexa en `arcturus_main.users` para poder entrar al Nitro local sin Auth Bridge completo.

---

## Usuario origen — kodexa_hotel

| Campo | Valor |
|-------|-------|
| DB | `kodexa_hotel` |
| Tabla | `users` |
| id | 1 |
| username | `admin` |
| email | `diegomorales11082000@gmail.com` |
| rank (Kodexa) | 10 (Founder) |
| look | `hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804` |
| motto | Kodexa Hotel · Fundador |

> **kodexa_hotel** fue accedido en modo solo lectura. Sin cambios.

---

## Usuario destino — arcturus_main

| Campo | Valor |
|-------|-------|
| DB | `arcturus_main` |
| Tabla | `users` |
| id | 3 (auto-asignado) |
| username | `admin` |
| mail | `diegomorales11082000@gmail.com` |
| rank (Arcturus) | 7 (Administrator) |
| look | `hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804` (copiado de Kodexa) |
| motto | `Kodexa Hotel · Fundador` |
| credits | 99999 |
| pixels | 50000 |
| points | 10000 |
| auth_ticket | `kodexa_admin_sso_local_2026` |
| password | `not_used_sso_only` (no se copia hash de kodexa) |
| ip_register | `127.0.0.1` |
| ip_current | `127.0.0.1` |

---

## Mapeo de ranks

| Sistema | Rank | Label |
|---------|------|-------|
| Kodexa | 10 | Founder |
| Arcturus | 7 | Administrator (máximo disponible en arcturus_main) |

> Arcturus solo tiene 7 rangos (1-7). Kodexa tiene hasta rank 10.
> Rank 7 = Administrator = acceso completo en Arcturus.
> Cuando se implemente Auth Bridge (MP-011), el mapeo se formalizará.

---

## Campos NO copiados

| Campo | Razón |
|-------|-------|
| password hash | No necesario para SSO con auth_ticket |
| tokens de sesión | No aplica |
| inventario, badges, amigos | No existen en Kodexa todavía |

---

## auth_ticket temporal

```
kodexa_admin_sso_local_2026
```

Para conectar al Nitro local, usar este ticket como `?sso=kodexa_admin_sso_local_2026` o equivalente según el cliente.

**⚠️ Este ticket es para desarrollo local únicamente. En producción el Auth Bridge generará tickets dinámicamente.**

---

## Usuarios en arcturus_main

| ID | Username | Rank | Propósito |
|----|----------|------|-----------|
| 1 | Systemaccount | 1 | Default Arcturus |
| 2 | kodexa_test | 7 | Usuario de prueba genérico (MP-009) |
| 3 | admin | 7 | Usuario real Diego — para prueba Nitro local |

---

## Cómo usarlo para conectar al Nitro

1. Arcturus Main corriendo en `ws://localhost:2096`
2. Nitro renderer apuntando a `ws://localhost:2096` (renderer-config.local.json)
3. Pasar auth_ticket al cliente Nitro como: `?ticket=kodexa_admin_sso_local_2026`
4. Arcturus validará el ticket contra `arcturus_main.users.auth_ticket`
5. Login exitoso como usuario `admin`, rank 7

---

## Validaciones

| Verificación | Estado |
|-------------|--------|
| kodexa_hotel solo lectura — sin cambios | ✅ 26 tablas |
| arcturus_main.users actualizado (3 rows) | ✅ |
| arcturus_dev intacto | ✅ 0 tablas |
| Prisma no tocado | ✅ |
| Migraciones no creadas | ✅ |
| seed.ts no tocado | ✅ |
| middleware.ts no tocado | ✅ |
| SSO Kodexa no tocado | ✅ |
| Auth Bridge no implementado | ✅ |
| Password hash de Kodexa no copiado | ✅ |

---

## Advertencias

- Este usuario es una copia manual. NO se actualiza automáticamente si Diego cambia look/motto en Kodexa.
- auth_ticket `kodexa_admin_sso_local_2026` es estático. En producción, Arcturus debe generar tickets dinámicos.
- Rank 7 en Arcturus da acceso de administrador a comandos del hotel (`:kick`, `:ban`, etc.).
- No exponer este ticket en repositorios públicos.

---

## Próximo microproceso

**MP-009.1B — Test Nitro renderer local con usuario admin**

- Compilar/levantar Nitro renderer (Docker o local build)
- Navegar a `http://localhost:8081/?ticket=kodexa_admin_sso_local_2026`
- Verificar login, hotel view, catálogo básico
- Documentar estado de assets (cuáles cargan, cuáles fallan 404)

**MP-011 — Auth Bridge Kodexa → Arcturus Main**

- API endpoint: genera auth_ticket dinámico en arcturus_main para usuario autenticado en kodexa_hotel
- Sincronización automática de look, rank, motto en cada login
- Mapeo formal rank Kodexa 10 → Arcturus 7 (y rango ≤ 7 = directo)
- Reemplaza vinculación manual de este MP
