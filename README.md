# NutriTrack

An open-source, self-hostable AI nutrition tracker. Track calories, macros, and reach your health goals with zero lock-in and full data privacy.

**Self-hosted via Docker Compose. No cloud. No subscriptions. No tracking.**

---

## Features

- **AI Food Recognition** — Upload a photo; vision models (Ollama/OpenAI/Gemini) identify food and estimate weights
- **Barcode Scanning** — Quick lookup via Open Food Facts; product detail with macros
- **Food Database** — ~10k curated foods (USDA FoodData Central + Open Food Facts), fuzzy search, multi-language
- **Calorie & Macro Tracking** — Per-meal logging (manual/barcode/photo/voice), daily calorie ring, macro bars
- **Hydration & Activity** — Water intake tiles, exercise logging with MET-based calorie burn
- **Weight Tracking** — Daily entries, trend chart, goal progress
- **Personalized Targets** — TDEE engine (Mifflin-St Jeor), goal-based calorie targets, macro splits
- **Coach & Lessons** — 20+ educational articles across nutrition, sleep, stress, habits, fitness, mindfulness
- **Recipes** — Recipe browser, custom recipe builder, log-as-meal with macro auto-calculation
- **Analytics** — Calorie/macro trends (7d/30d/3m/1y), weight scatter, meal timing heatmap, streak engine
- **PWA / Offline** — Service worker cache, background sync, install to home screen, push notifications
- **Guest Mode** — Full access without signup; IndexedDB-first, "Back up your data" banner, upgrade path
- **WCAG AA Accessible** — 44px touch targets, keyboard navigation, focus rings, aria-live regions, skip nav

---

## Architecture

```
┌─ Browser (PWA) ───────────────────┐
│  Service Worker (offline cache)   │
│  IndexedDB (offline food log)     │
└──────────┬────────────────────────┘
           │ HTTPS
           ▼
┌─ Nginx (reverse proxy) ───────────┐
│  SSL termination, port 80/443     │
└──────────┬────────────────────────┘
           │
           ▼
┌─ Next.js 15 App (port 3000) ──────┐
│  App Router (SSR/RSC/API routes)  │
│  ├─ Hono REST API (/api/v1/*)     │
│  │   ├─ Better Auth (/api/auth/*) │
│  │   ├─ Foods, Logs, Profile      │
│  │   ├─ Analytics, Lessons        │
│  │   ├─ Recipes, Vision           │
│  │   └─ OpenAPI spec              │
│  └─ Pages & Components            │
└──────────┬────────────────────────┘
           │
  ┌────────┴────────┬──────────┬────────────┐
  ▼                 ▼          ▼            ▼
PostgreSQL 16     Redis 7    MinIO      Ollama (opt)
(Drizzle ORM)  (BullMQ +  (S3 photos)  (vision LLM)
               sessions)
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose (v2+)
- Node.js 22+ and pnpm (for local development only)

### 1. Clone & configure

```bash
git clone https://github.com/sderosiaux/nutritrack.git
cd nutritrack

cp .env.example .env
# Edit .env — at minimum set BETTER_AUTH_SECRET to a random 32-char string:
# openssl rand -base64 32
```

### 2. Start services

```bash
docker compose up -d
```

This starts: PostgreSQL, Redis, MinIO, and the app (with hot-reload in dev).

### 3. Initialize database

```bash
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed    # optional: loads ~10k foods + demo user
```

### 4. Open the app

- App: http://localhost:3000
- MinIO console: http://localhost:9001 (user: `minioadmin`)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string (BullMQ + sessions) |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char secret for auth tokens |
| `BETTER_AUTH_URL` | Yes | Full public URL of the app |
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL (used in client-side code) |
| `MINIO_ENDPOINT` | Yes | MinIO host (Docker service name or IP) |
| `MINIO_ACCESS_KEY` | Yes | MinIO root user |
| `MINIO_SECRET_KEY` | Yes | MinIO root password |
| `MINIO_BUCKET` | Yes | Bucket name for uploads |
| `VISION_PROVIDER` | No | `ollama` (default) \| `openai` \| `gemini` |
| `OLLAMA_URL` | No | Ollama API URL (default: `http://ollama:11434`) |
| `OPENAI_API_KEY` | No | Required when `VISION_PROVIDER=openai` |
| `GEMINI_API_KEY` | No | Required when `VISION_PROVIDER=gemini` |
| `SMTP_HOST` | No | SMTP server (for password resets, email jobs) |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender email address |
| `VAPID_PUBLIC_KEY` | No | Web Push public VAPID key |
| `VAPID_PRIVATE_KEY` | No | Web Push private VAPID key |
| `USDA_API_KEY` | No | USDA FoodData Central API key |
| `NODE_ENV` | No | `development` (default) \| `production` |

See `.env.example` for the full annotated list.

---

## Key Commands

### Build & Test

```bash
pnpm build          # Production build
pnpm start          # Start production server
pnpm test           # Run unit tests (Vitest)
pnpm test:watch     # Watch mode
pnpm test:e2e       # E2E tests (Playwright)
pnpm lint           # ESLint
pnpm typecheck      # TypeScript check
```

### Database

```bash
pnpm db:generate    # Generate migration from schema changes
pnpm db:migrate     # Apply pending migrations
pnpm db:push        # Push schema directly (dev only)
pnpm db:seed        # Seed database (~10k foods, demo user)
pnpm db:studio      # Drizzle Studio GUI at http://localhost:5555
```

---

## Project Structure

```
nutritrack/
├── src/
│   ├── app/                         # Next.js 15 App Router
│   │   ├── layout.tsx               # Root layout (skip nav, font, providers)
│   │   ├── page.tsx                 # Landing page
│   │   ├── globals.css              # Design tokens + animations + a11y utils
│   │   ├── api/auth/[...all]/       # Better Auth routes
│   │   ├── api/v1/[[...all]]/       # Hono API catch-all
│   │   └── (app)/                   # Protected shell
│   │       ├── layout.tsx           # App shell (sidebar, bottom nav, aria-live)
│   │       ├── today/               # Dashboard (calorie ring, macros, meals)
│   │       ├── journal/             # Food log history
│   │       ├── coach/               # Lessons + recipes
│   │       ├── progress/            # Analytics & trends
│   │       └── profile/             # Settings & onboarding
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── shell/                   # Sidebar, bottom nav, FAB
│   │   ├── guest/                   # Guest mode (backup banner)
│   │   ├── pwa/                     # Service worker, install prompt
│   │   └── providers/               # TanStack Query provider
│   ├── lib/
│   │   ├── stores/                  # Zustand (ui-store, guest-store)
│   │   ├── db/                      # Dexie.js (offline IndexedDB)
│   │   ├── guest/                   # Guest mode logic
│   │   ├── hooks/                   # Custom React hooks
│   │   └── forms.ts                 # Shared Zod validation schemas
│   └── server/
│       ├── api/
│       │   ├── index.ts             # Hono app + middleware + route registration
│       │   ├── middleware/auth.ts   # Session extraction
│       │   └── routes/              # foods, logs, analytics, profile, lessons,
│       │                            #   recipes, exercises, recognize, openapi, ...
│       ├── auth/index.ts            # Better Auth config
│       ├── services/                # Business logic (food, analytics, streak, ...)
│       └── db/
│           ├── schema/              # Drizzle schemas (auth, users, foods, logs, content)
│           ├── seed-data/           # ~10k foods + exercises + recipes + lessons
│           ├── migrate.ts           # Migration runner
│           └── seed.ts              # Seeding script
├── docs/
│   └── self-hosting.md              # Detailed deployment guide
├── spec/                            # Project specifications (reference)
├── e2e/                             # Playwright E2E tests
├── drizzle/                         # Generated SQL migrations
├── docker-compose.yml               # Dev stack
├── docker-compose.prod.yml          # Production stack (nginx + non-root app)
├── Dockerfile                       # Multi-stage production build
├── Dockerfile.dev                   # Dev image (hot-reload)
├── .env.example                     # Annotated environment template
└── CONTRIBUTING.md                  # Development guide
```

---

## Self-Hosting

For a detailed production deployment guide including nginx configuration, SSL setup, database backup, and monitoring, see **[docs/self-hosting.md](docs/self-hosting.md)**.

**Quick production deploy:**

```bash
# 1. Set all required env vars in .env (especially BETTER_AUTH_SECRET)
# 2. Create nginx/nginx.conf (see docs/self-hosting.md)
# 3. Deploy
docker compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker compose -f docker-compose.prod.yml exec app pnpm db:migrate
```

---

## API

The REST API is documented as an OpenAPI 3.0 spec:

```bash
# View spec
curl http://localhost:3000/api/v1/openapi.json | jq .
```

Key endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Register |
| `GET` | `/api/v1/foods/search?q=...` | Search foods |
| `GET` | `/api/v1/logs/:date` | Daily summary |
| `POST` | `/api/v1/logs/:date/meals` | Log a meal |
| `GET` | `/api/v1/analytics/summary` | Calorie trends |
| `GET` | `/api/v1/profile` | User profile |

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for development setup, test patterns, and PR process.

---

## Stack

Next.js 15 App Router • Hono 4 • PostgreSQL 16 (Drizzle ORM) • Redis 7 (BullMQ) • MinIO • Better Auth • Tailwind CSS v4 • shadcn/ui • Zustand • TanStack Query • React Hook Form • Zod • Recharts • Dexie.js • Vitest • Playwright • Docker Compose

---

## License

MIT — See [LICENSE](LICENSE)

---

## Acknowledgments

Inspired by [Foodvisor](https://www.foodvisor.io/). Built on excellent open-source libraries.

Data sources: [Open Food Facts](https://world.openfoodfacts.org/) (CC BY-SA), [USDA FoodData Central](https://fdc.nal.usda.gov/) (public domain)
