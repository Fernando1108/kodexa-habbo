# 🏨 Kodexa Hotel

A next-generation virtual hotel built from scratch with modern web technologies. Not a clone — a completely reimagined platform with unique features that don't exist anywhere else.

**Built by [Kodexa Solutions](https://github.com/kodexa-solutions)**

---

## ✨ What Makes It Different

- **🏪 Real Marketplace** — Buy, sell, and auction furniture with dynamic pricing and a 5% commission system
- **🧠 AI-Powered NPCs** — Intelligent characters with LLM-driven dialogue, auto-moderation, and an in-game assistant
- **🔧 Visual Wired Scripting** — Node-based editor (Unreal Blueprints style) to create complex minigames without code
- **📱 Mobile-First PWA** — Installable on phones with touch controls, push notifications, and offline lobby
- **🎨 Full Customization** — Custom furniture, room themes (weather, day/night), particle effects
- **⚡ Advanced Economy** — Crafting system, jobs, reputation, guilds, leveling, and scheduled events with auto-rewards

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **CMS** | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, NextAuth v5 |
| **Game Client** | React 19, PixiJS 7, Vite 5, Zustand, Howler.js, WebSocket |
| **Emulator** | Node.js 20, TypeScript, ws, Prisma, ioredis |
| **Database** | MariaDB 10.11, Redis 7, Prisma ORM |
| **Infra** | Docker Compose, Nginx, Cloudflare CDN, Turborepo, pnpm |

---

## 📁 Project Structure

```
kodexa-hotel/
├── apps/
│   ├── web/           # CMS — Next.js 15 (App Router)
│   ├── client/        # Game Client — React + PixiJS + Vite
│   └── emulator/      # Game Server — Node.js + WebSocket
├── packages/
│   ├── shared/        # Shared TypeScript types (@kodexa/shared)
│   └── protocol/      # WebSocket binary protocol (@kodexa/protocol)
├── database/seed/     # Base SQL (Arcturus/myBoBBa — 36K+ furniture items)
├── docker/            # Docker Compose configs (MariaDB + Redis)
├── tools/             # Asset converter (SWF → .nitro) + Avatar imager
└── assets/            # Game assets (gitignored — downloaded/generated)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USER/kodexa-hotel.git
cd kodexa-hotel

# Install dependencies
pnpm install

# Start infrastructure (MariaDB + Redis)
pnpm infra:up

# Push database schema
pnpm db:push

# Seed initial data (admin user, permissions, room models)
pnpm db:seed

# Start all apps in development mode
pnpm dev
```

### Access Points

| Service | URL |
|---------|-----|
| CMS | http://localhost:3000 |
| Game Client | http://localhost:3001 |
| Emulator (WebSocket) | ws://localhost:2096 |
| Prisma Studio | `pnpm db:studio` |
| Adminer (dev) | http://localhost:8080 |

---

## 📜 Available Commands

```bash
# Development
pnpm dev              # Start everything (Turborepo)
pnpm dev:web          # CMS only
pnpm dev:client       # Game client only
pnpm dev:emulator     # Emulator only

# Build
pnpm build            # Production build

# Database
pnpm db:push          # Push schema to DB
pnpm db:migrate       # Generate migration
pnpm db:seed          # Seed initial data
pnpm db:studio        # Open Prisma Studio

# Infrastructure
pnpm infra:up         # Start MariaDB + Redis (Docker)
pnpm infra:down       # Stop containers
pnpm infra:logs       # View container logs

# Quality
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
```

---

## 🗺️ Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 0** | Foundation — Monorepo, Docker, Prisma, protocol, emulator | ⚙️ In Progress |
| **Phase 1** | Landing Page + Auth (Login/Register) | 🔜 Next |
| **Phase 2** | Admin Panel (Users, Rooms, News, Catalog) | ⏳ Planned |
| **Phase 3** | Hotel Launcher + Game Client integration | ⏳ Planned |
| **Phase 4** | Marketplace + User Profiles | ⏳ Planned |
| **Phase 5** | Advanced Features (AI, Wired Visual, Crafting, PWA) | ⏳ Planned |

---

## 🤝 Development Team

| Role | Who | Responsibility |
|------|-----|---------------|
| **Supervisor** | Kodexa Solutions (Founder) | Approves designs, tests, decides priorities |
| **Architect** | Claude Opus 4.6 | Architecture, planning, documentation, microprocesses |
| **UI Designer** | Claude Design | React components with Tailwind + Framer Motion |
| **Coder** | Claude Code 4.7 | Technical execution, backend integration, configs |

---

## 📄 License

Private project — All rights reserved © 2025 Kodexa Solutions
