# Kodexa Hotel

Hotel virtual de nueva generación construido desde cero con tecnologías web modernas. No es un clon — es una plataforma completamente reimaginada con features únicos.

**Desarrollado por [Kodexa Solutions](https://github.com/kodexa-solutions)**

---

## Lo que nos hace diferentes

- **Marketplace Real** — Compra, vende y subasta muebles entre jugadores con precios dinámicos y comisión del 5%
- **NPCs con IA** — Personajes inteligentes con diálogos vía LLM, moderación automática y asistente en-juego
- **Wired Visual** — Editor de nodos (estilo Unreal Blueprints) para crear minijuegos sin escribir código
- **PWA Mobile-First** — Instalable en celular con controles táctiles, notificaciones push y lobby offline
- **Personalización Total** — Muebles custom, themes de sala (clima, día/noche), efectos de partículas
- **Economía Avanzada** — Crafting, oficios, reputación, gremios, niveles y eventos programados con recompensas automáticas

---

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Web (CMS)** | Next.js 16.2.5, React 19, TypeScript strict, Tailwind CSS v4, NextAuth v5 beta |
| **Cliente de juego** | React 19, PixiJS 7, Vite 5, Zustand, WebSocket binario |
| **Emulador** | Node.js 20, TypeScript, ws, Prisma 6, ioredis, tsx |
| **Base de datos** | MariaDB 10.11, Redis 7, Prisma ORM |
| **Infraestructura** | Docker Compose, Turborepo, pnpm workspaces |

---

## Estructura del proyecto

```
kodexa-hotel/
├── apps/
│   ├── web/           # CMS/Web — Next.js 16 App Router
│   │   ├── src/app/   # Rutas (App Router)
│   │   │   ├── _components/     # Componentes compartidos de landing
│   │   │   ├── (auth)/          # /login  /register
│   │   │   ├── (dashboard)/     # /admin
│   │   │   ├── hotel/           # /hotel (launcher)
│   │   │   ├── marketplace/     # /marketplace
│   │   │   └── community/       # /community/profiles/[username]
│   │   ├── src/lib/   # db.ts (Prisma singleton), auth.ts
│   │   └── prisma/    # schema.prisma + seed.ts
│   ├── client/        # Cliente de juego — React + PixiJS + Vite (puerto 3001)
│   └── emulator/      # Servidor de juego — Node.js + WebSocket (puerto 2096)
├── packages/
│   ├── shared/        # Tipos TypeScript compartidos (@kodexa/shared)
│   └── protocol/      # Protocolo binario WebSocket (@kodexa/protocol)
├── designs/           # Diseños HTML de referencia por sección
│   ├── 01-landing/    # home.html → integrado en apps/web/src/app/page.tsx
│   ├── 02-auth/       # login.html + register.html
│   ├── 03-admin/      # admin.html
│   ├── 04-launcher/   # launcher.html
│   └── 05-marketplace-profile/
├── docker/            # Docker Compose (MariaDB + Redis + Adminer + RedisInsight)
└── packages/          # Librerías internas del monorepo
```

---

## Inicio rápido

### Prerrequisitos

- Node.js 20+
- pnpm 8+
- Docker y Docker Compose

### Configuración inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/YOUR_USER/kodexa-hotel.git
cd kodexa-hotel

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp docker/.env.example docker/.env
cp apps/web/.env.example apps/web/.env   # editar DATABASE_URL etc.

# 4. Levantar infraestructura (MariaDB + Redis)
pnpm infra:up

# 5. Empujar esquema a la base de datos
pnpm db:push

# 6. Sembrar datos iniciales (admin, permisos, room models, settings)
pnpm db:seed

# 7. Iniciar todos los servicios en modo desarrollo
pnpm dev
```

### Correr manualmente (ver todo el hotel)

Para levantar el hotel completo en una sola sesión de terminal:

```bash
# Terminal 1 — Infraestructura Docker
pnpm infra:up

# Terminal 2 — Todos los servicios (Turborepo los corre en paralelo)
pnpm dev
```

Para correr servicios individuales:

```bash
pnpm --filter web dev       # Solo CMS → http://localhost:3000
pnpm --filter client dev    # Solo cliente de juego → http://localhost:3001
pnpm --filter emulator dev  # Solo emulador → ws://localhost:2096
```

### Puntos de acceso

| Servicio | URL |
|----------|-----|
| Web (CMS) | http://localhost:3000 |
| Cliente de juego | http://localhost:3001 |
| Emulador (WebSocket) | ws://localhost:2096 |
| Prisma Studio | `pnpm db:studio` |
| Adminer (base de datos) | http://localhost:8080 |
| RedisInsight | http://localhost:8001 |

---

## Comandos disponibles

```bash
# Desarrollo
pnpm dev               # Inicia todo (Turborepo en paralelo)
pnpm build             # Build de producción

# Base de datos
pnpm db:push           # Empujar esquema al DB
pnpm db:migrate        # Generar y aplicar migración
pnpm db:seed           # Sembrar datos iniciales
pnpm db:studio         # Abrir Prisma Studio en el navegador

# Infraestructura
pnpm infra:up          # Levantar MariaDB + Redis (Docker)
pnpm infra:up:dev      # Levantar infra + Adminer + RedisInsight
pnpm infra:down        # Detener contenedores (alias manual: docker compose down)

# Calidad de código
pnpm lint              # ESLint
pnpm typecheck         # Verificación TypeScript
pnpm test              # Tests unitarios (Vitest)
```

---

## Base de datos

### Esquema (Prisma)

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del hotel (compatible Arcturus/myBoBBa) |
| `rooms` | Salas públicas y privadas |
| `room_models` | Mapas/heightmaps de salas (model_a → model_e) |
| `items_base` | Definición de muebles del catálogo |
| `items` | Instancias de muebles (inventario + colocados) |
| `catalog_pages` | Páginas del catálogo |
| `catalog_items` | Muebles en venta en el catálogo |
| `permissions` | Rangos y permisos (rank 1=Normal, 4=Mod, 7=Admin) |
| `emulator_settings` | Configuración dinámica del emulador |
| `users_currency` | Divisas adicionales por usuario |
| `users_badges` | Insignias del usuario |
| `kx_reputation` | Sistema de reputación (help/build/social score) |
| `kx_marketplace_listings` | Listados activos del marketplace |
| `kx_auctions` | Subastas activas con ofertas |
| `kx_crafting_recipes` | Recetas de crafteo |
| `kx_wired_scripts` | Scripts de Wired Visual por sala |
| `kx_user_levels` | Niveles y experiencia de usuarios |
| `kx_activity_log` | Log de acciones del usuario |
| `news` | Noticias del hotel |

### Usuario admin por defecto (tras `db:seed`)

| Campo | Valor |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |
| Rank | 7 (Administrador) |

---

## Protocolo WebSocket

Protocolo binario personalizado (paquete `@kodexa/protocol`):

```
[2 bytes: packetId] [4 bytes: bodyLength] [body...]
```

**Tipos de datos soportados:** `short (2B)`, `int (4B)`, `string (2B len + UTF-8)`, `boolean (1B)`

**IDs de paquetes configurados:**
- `SSO_TICKET (1)` — Autenticación del cliente
- `ROOM_CHAT (103)` — Mensajes de chat
- `ROOM_ENTER (204)` — Entrar a sala
- `ROOM_LEAVE (205)` — Salir de sala
- `USER_DATA (301)` — Datos del usuario

---

## Seguridad y despliegue a producción

### 🔒 Qué protege el `.gitignore`

El repositorio está configurado para **nunca subir** contenido sensible a Git:

| Categoría | Archivos protegidos | Riesgo que mitiga |
|---|---|---|
| **Variables de entorno** | `.env`, `.env.local`, `.env.production`, etc. | Credenciales de DB, API keys, NEXTAUTH_SECRET |
| **Claves SSL/TLS** | `*.pem`, `*.key`, `*.crt`, `*.pfx` | Certificados del Nginx/VPS — evita ataques MITM |
| **SSH keys** | `id_rsa*`, `id_ed25519*`, `*.ppk` | Acceso directo al VPS de producción |
| **Database dumps** | `*.sql`, `*.sql.gz`, `*.dump`, `*.bak` | Dumps de Arcturus/myBoBBa con datos de usuarios |
| **Service accounts** | `serviceAccountKey*.json`, `firebase-adminsdk*.json` | Llaves de servicio de GCP/Firebase |
| **Docs internos** | `CLAUDE.md`, `AGENTS.md`, `FASE-0-MICROPROCESOS.md` | Contienen credenciales de ejemplo y arquitectura interna |

> **Nota:** Los archivos `.env.example` **sí** se pueden commitear (están en whitelist) para que el equipo sepa qué variables configurar.

---

### 🚀 Despliegue a producción

#### Opción A: VPS (recomendado para empezar — ~$10-15/mes)

```bash
# 1. En el VPS, clonar el repo (solo código, sin secretos)
git clone https://github.com/YOUR_USER/kodexa-hotel.git
cd kodexa-hotel

# 2. Crear variables de entorno manualmente
cp docker/.env.example docker/.env
nano docker/.env    # ← poner credenciales REALES (passwords fuertes)

cp apps/web/.env.example apps/web/.env
nano apps/web/.env  # ← DATABASE_URL, NEXTAUTH_SECRET, API keys reales

# 3. Levantar infraestructura
docker compose -f docker/docker-compose.yml up -d

# 4. Instalar, construir y sembrar
pnpm install
pnpm build
pnpm db:push
pnpm db:seed

# 5. Iniciar con process manager
pm2 start ecosystem.config.js   # (o usar systemd)
```

#### Opción B: Vercel (solo CMS web)

1. Conectar el repositorio de GitHub en [vercel.com](https://vercel.com)
2. Ir a **Settings → Environment Variables** y configurar:
   - `DATABASE_URL` — conexión a la DB remota
   - `NEXTAUTH_SECRET` — secreto fuerte generado con `openssl rand -base64 32`
   - `NEXTAUTH_URL` — URL pública del hotel (ej: `https://hotel.kodexa.com`)
   - `NEXT_PUBLIC_ASSETS_URL`, `NEXT_PUBLIC_CLIENT_URL`, `NEXT_PUBLIC_IMAGER_URL`
3. Deploy automático en cada `git push`

> ⚠️ **Vercel NO puede correr el emulador** (es serverless). El emulador necesita un VPS con WebSocket persistente 24/7.

---

### ⚠️ Notas importantes para fases futuras

| Tema | Acción requerida | Cuándo |
|------|-----------------|--------|
| **Prisma Migrations** | Quitar `prisma/migrations/` del `.gitignore` cuando se pase de `db:push` a `prisma migrate deploy` | Antes de producción |
| **NEXTAUTH_SECRET** | Generar un secreto único con `openssl rand -base64 32` — nunca usar el de desarrollo | Al desplegar |
| **Admin default** | Cambiar la contraseña del usuario `admin` / `admin123` inmediatamente tras el primer deploy | Primer deploy |
| **SSL/HTTPS** | Configurar Cloudflare (proxy) o Certbot (Let's Encrypt) en el VPS | Antes de abrir al público |
| **DATABASE_URL** | Usar contraseñas de 32+ caracteres alfanuméricos en producción | Al configurar el VPS |
| **Backups** | Configurar `mysqldump` con cron para respaldos automáticos diarios | Primer semana en producción |
| **Rate limiting** | Activar rate limiting con Redis en las API routes | Antes de abrir al público |

---

## Roadmap

| Fase | Descripción | Estado |
|------|-------------|--------|
| **Fase 0** | Fundación — Monorepo, Docker, Prisma, protocolo, emulador | Completada |
| **Fase 1** | Landing Page + Auth (Login/Register) | En progreso |
| **Fase 2** | Panel de admin (Usuarios, Salas, Noticias, Catálogo) | Planificada |
| **Fase 3** | Hotel Launcher + integración cliente de juego | Planificada |
| **Fase 4** | Marketplace + Perfiles de usuario | Planificada |
| **Fase 5** | Features avanzados (IA, Wired Visual, Crafting, PWA) | Planificada |

---

## Equipo de desarrollo

| Rol | Quién | Responsabilidad |
|-----|-------|-----------------|
| **Supervisor/Founder** | Fernando (Kodexa Solutions) | Aprueba diseños, testea, define prioridades |
| **Arquitecto** | Claude Opus 4.6 | Arquitectura, planning, documentación, microprocesos |
| **Diseñador UI** | Claude Design | Componentes React con Tailwind + Framer Motion |
| **Coder** | Claude Code (Sonnet 4.6) | Ejecución técnica, integración backend, configs |

---

## Licencia

Proyecto privado — Todos los derechos reservados © 2025 Kodexa Solutions
