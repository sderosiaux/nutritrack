# nutritrack

An open-source, self-hostable nutrition tracker inspired by Foodvisor. Track calories, macros, and reach your health goals with zero lock-in and full privacy.

**Core Features**:

**Now Available** (Lanes 1–2):
- ✅ **Infrastructure**: Full-stack scaffolding, Docker Compose, database schema (5 domains)
- ✅ **Authentication**: Email/password signup & login, sessions, bearer tokens (Better Auth)
- ✅ **Guest Mode**: IndexedDB offline storage, "Back up your data" banner, server sync on signup
- ✅ **UI System**: Design system (CSS variables, light theme only), responsive layout (mobile/tablet/desktop)
- ✅ **Components**: shadcn/ui base set (button, card, dialog, input, sheet, toast)
- ✅ **Shell Layout**: Sidebar (collapsible), bottom navigation, FAB (floating action button)
- ✅ **Pages**: Landing, login, register, dashboard shell (today/journal/coach/progress/profile)
- ✅ **API Foundation**: Hono REST API with health check, CORS, session auth middleware

**Coming Soon** (Lanes 3–13):
- 📸 **AI Food Recognition**: Photo upload with vision models (Ollama/OpenAI/Gemini) — Lane 8
- 🏷️ **Barcode Scanning**: Quick lookup via Open Food Facts API — Lane 3
- 🍽️ **Food Database**: ~10k foods with USDA + Open Food Facts data — Lane 3
- 📊 **Calorie & Macro Tracking**: Per meal + daily totals, visual ring — Lanes 4–5
- 💧 **Hydration & Activity**: Water intake, exercise logging, calorie burn — Lanes 4, 7
- 📈 **Weight Tracking**: Daily weight entries, trend charts, progress graphs — Lane 7
- 🎓 **Coach & Lessons**: Educational content, personalized coaching, streaks — Lane 10
- 🍽️ **Recipes**: Recipe creation, browsing, meal planning, ingredient tracking — Lane 11
- 📉 **Analytics**: Trend reports, weekly/monthly insights, macro breakdowns — Lane 9
- 🔐 **Full Offline**: PWA service worker, background sync, full offline access — Lane 12
- ♿ **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen readers — Lane 13

**Stack**: Next.js 15 App Router • Hono 4 • Drizzle ORM • PostgreSQL 16 • Redis 7 • MinIO • Better Auth • Tailwind CSS v4 • Zustand • TanStack Query • Playwright • Vitest • Docker Compose

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)
- pnpm (for package management)

### Via Docker (Recommended)
```bash
git clone https://github.com/sderosiaux/nutritrack.git
cd nutritrack

# Start all services
docker compose up

# In another terminal, initialize the database
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed
```

**Access the app**: http://localhost:3000

**Access services**:
- PostgreSQL: `localhost:5432` (user: `nutritrack` / password: `nutritrack`)
- Redis: `localhost:6379`
- MinIO console: http://localhost:9001 (user: `minioadmin` / password: `minioadmin`)
- Ollama API: http://localhost:11434 (if using `--profile ollama`)

### Local Development (Without Docker)
```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Initialize database (requires postgres running locally or .env pointing to remote)
pnpm db:migrate
pnpm db:seed

# Start dev server
pnpm dev
```

**Open**: http://localhost:3000

---

## Key Commands

### Build & Test
```bash
pnpm build          # Production build
pnpm start          # Start production server
pnpm test           # Run unit tests (Vitest)
pnpm test:watch     # Watch mode for tests
pnpm test:e2e       # Run E2E tests (Playwright)
pnpm lint           # Lint with Next.js ESLint
pnpm typecheck      # Full TypeScript check
```

### Database
```bash
pnpm db:generate    # Generate new migration from schema changes
pnpm db:migrate     # Run pending migrations
pnpm db:push        # Push schema changes to database (dev only)
pnpm db:studio      # Open Drizzle Studio web UI for database inspection
pnpm db:seed        # Seed sample data (users, foods, recipes)
```

### Environment Variables
Create `.env.local` or set in Docker environment:

```env
# Database
DATABASE_URL=postgresql://nutritrack:nutritrack@postgres:5432/nutritrack

# Redis (for job queue)
REDIS_URL=redis://redis:6379

# MinIO (object storage for images)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=nutritrack
MINIO_USE_SSL=false

# Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-here

# Vision provider for photo recognition (optional)
# VISION_PROVIDER=ollama|openai|gemini
# OPENAI_API_KEY=sk-...
# GEMINI_API_KEY=...
# OLLAMA_BASE_URL=http://ollama:11434
```

---

## Project Structure

```
nutritrack/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # Landing page (/)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Design system (CSS variables)
│   │   ├── login/                   # Login page
│   │   ├── register/                # Register page
│   │   ├── api/auth/[...all]/       # Better Auth routes
│   │   ├── api/v1/[[...all]]/       # Hono API catch-all
│   │   └── (app)/                   # Protected shell
│   │       ├── layout.tsx           # App shell (sidebar, bottom nav)
│   │       ├── today/               # Dashboard (empty shell)
│   │       ├── journal/             # Food log (empty shell)
│   │       ├── coach/               # Lessons (empty shell)
│   │       ├── progress/            # Analytics (empty shell)
│   │       └── profile/             # Settings (empty shell)
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── shell/                   # App layout (sidebar, nav, FAB)
│   │   ├── guest/                   # Guest mode UI
│   │   └── providers/               # React providers
│   ├── lib/
│   │   ├── stores/                  # Zustand stores (UI, guest mode)
│   │   ├── db/                      # Dexie.js (IndexedDB)
│   │   ├── query-client.ts          # TanStack Query config
│   │   └── utils.ts                 # Helpers
│   ├── server/
│   │   ├── api/                     # Hono app setup
│   │   │   ├── index.ts             # Hono app, middleware, routes
│   │   │   ├── middleware/          # Auth middleware
│   │   │   └── routes/              # Route handlers (health.ts, etc.)
│   │   ├── auth/                    # Better Auth configuration
│   │   └── db/                      # Drizzle ORM
│   │       ├── index.ts             # DB client (lazy singleton)
│   │       ├── schema/              # Schema definitions (auth, users, foods, logs, content)
│   │       ├── migrate.ts           # Manual migration runner
│   │       └── seed.ts              # Database seeding
│   ├── test-setup.ts                # Vitest configuration
│   └── __tests__/                   # Unit tests (CHK-*.test.ts*)
├── e2e/                             # Playwright E2E tests (empty)
├── drizzle/                         # Generated migration SQL files
├── spec/                            # Project specifications (reference only)
├── .forge/                          # Build automation state
│   ├── state.yaml                   # Current cycle & lane
│   ├── lanes.yaml                   # Lane definitions (topological order)
│   └── checkboxes.yaml              # 59 checkboxes (CHK-001..059)
├── docker-compose.yml               # Docker services (postgres, redis, minio, ollama)
├── Dockerfile.dev                   # Dev app image
├── .env.example                     # Environment template
├── .env                             # Environment (git-ignored)
├── package.json                     # pnpm dependencies & scripts
├── tsconfig.json                    # TypeScript (strict mode)
├── drizzle.config.ts                # Drizzle Kit config
├── next.config.ts                   # Next.js config
├── playwright.config.ts             # Playwright E2E config
└── vitest.config.ts                 # Vitest config (globals: true)
```

---

## Completed: Lane 1 (Infrastructure & Foundation) ✅

### What's Included
- **Full-stack scaffolding**: Next.js 15 App Router, Hono API, TypeScript, Tailwind CSS, Vitest, Playwright
- **Docker Compose setup** with all services (PostgreSQL, Redis, MinIO, Ollama) and health checks
- **Complete database schema** with 5 core domains:
  - `auth.*` — Better Auth tables (`user`, `session`, `account`, `verification`)
  - `users.*` — User profiles (`user_profiles`, `daily_targets`)
  - `foods.*` — Food database (`foods`, `serving_sizes`, `food_favorites`)
  - `logs.*` — Daily logging (`meal_entries`, `water_entries`, `weight_entries`, `activity_entries`, `exercises`)
  - `content.*` — Recipes & lessons (`recipes`, `lessons`, `lesson_progress`)
- **Better Auth integration** for email/password authentication, sessions (30-day expiry), and bearer tokens
- **API foundation**: Hono app with CORS middleware, session auth middleware, health check endpoint
- **Build/test/migration scripts**: `pnpm db:migrate`, `pnpm db:seed`, `pnpm build`, `pnpm test`

See `src/server/db/schema/` for full schema definitions and `REFERENCE.md` for architectural details.

## Completed: Lane 2 (Design Shell) ✅

### UI Components (shadcn/ui)
- **Button** — CTA variants (default, outline, ghost)
- **Card** — Content containers
- **Dialog** — Modal dialogs
- **Input** — Text, email, password fields
- **Sheet** — Side panels (mobile/desktop)
- **Sonner** — Toast notifications

### Layout & Shell
- **Sidebar** — Navigation menu (collapsible on mobile, controlled by `sidebarOpen` state)
- **Bottom Navigation** — Mobile-first navigation rail
- **FAB** (Floating Action Button) — Quick logging access

### Pages Built
- **Landing Page** (`/`) — Public landing with "Get Started", "Sign In", and guest mode option
- **Login** (`/login`) — Email + password authentication
- **Register** (`/register`) — Signup flow
- **App Shell** (`(app)/layout.tsx`) — Protected layout with sidebar + content
  - **Today** (`/today`) — Daily dashboard (placeholder)
  - **Journal** (`/journal`) — Food logging (placeholder)
  - **Profile** (`/profile`) — User settings (placeholder)
  - **Progress** (`/progress`) — Analytics & trends (placeholder)
  - **Coach** (`/coach`) — Educational lessons (placeholder)

### Design System
- **Color Palette**: Primary green (#16A34A), macro-specific colors (protein=blue, carbs=purple, fat=red, fiber=emerald)
- **CSS Variables**: Theme tokens in `globals.css` (colors, spacing, radii, shadows)
- **Typography**: Inter variable font, 4px base spacing unit
- **Responsive**: Mobile-first design with tablet/laptop breakpoints

### Guest Mode
- Users can continue as guests without signing up
- Data stored in **IndexedDB** (via Dexie.js) for offline-first experience
- "Back up your data" banner to encourage registration
- Syncs to server when user registers

---

## API Overview

### Base Path
All API routes are prefixed with `/api/v1/` (Hono app) or `/api/auth/` (Better Auth).

### Health Check (Lane 1)
```bash
GET /api/v1/health
Response: { status: "ok" }
```

### Authentication (Better Auth)
Available endpoints:
```bash
POST /api/auth/register          # Register user (email, password, name)
POST /api/auth/login             # Login (returns session cookie + bearer token)
POST /api/auth/logout            # Logout (clear session)
POST /api/auth/refresh           # Refresh session token
POST /api/auth/forgot-password   # Request password reset email
POST /api/auth/reset-password    # Reset password with token
GET /api/auth/session            # Get current session (auth required)
```

**Auth Methods**:
- Session cookie (default, auto-managed by Better Auth, 30-day expiry)
- Bearer token: `Authorization: Bearer <token>` (via better-auth bearer plugin)

### Coming Soon (Lanes 3–13)
- Food database CRUD & search
- Meal logging & macro tracking
- Dashboard & analytics
- Profile & onboarding
- Weight & activity tracking
- AI food recognition
- Recipes & lessons
- And more...

---

## Architecture

```
┌─ Browser (PWA) ──────────────────┐
│  IndexedDB + Service Worker      │
│  (offline-first food logging)    │
└──────────┬──────────────────────┘
           │ HTTPS
           ▼
┌─ Next.js (localhost:3000) ───────┐
│  ├─ App Router (SSR/RSC)         │
│  ├─ API Routes (Hono)            │
│  │   ├─ Health                   │
│  │   ├─ Auth (Better Auth)       │
│  │   └─ [Food/Journal/User APIs] │
│  └─ Pages & Components           │
└──────────┬──────────────────────┘
           │
  ┌────────┼────────┬────────┬──────────┐
  ▼        ▼        ▼        ▼          ▼
PostgreSQL Redis  MinIO   Ollama    (External)
 (data)   (queue)(images)(vision)   APIs
```

---

## Development Workflow

### Making Schema Changes
1. Edit `src/server/db/schema/*.ts`
2. Generate migration: `pnpm db:generate`
3. Review the migration in `drizzle/`
4. Apply: `pnpm db:migrate` (dev) or `pnpm db:push` (dev only)

### Adding API Routes
Routes live in `src/server/api/routes/`. Create a new file and export a Hono `Hono` app.

Example:
```typescript
// src/server/api/routes/foods.ts
import { Hono } from 'hono';

const app = new Hono()
  .get('/', async (c) => c.json({ foods: [] }))
  .get('/:id', async (c) => c.json({ food: null }));

export default app;
```

Register in `src/server/api/index.ts`.

### Adding UI Components
New components go in `src/components/`:

```
src/components/
├── ui/           # shadcn/ui base components (button, card, etc.)
├── shell/        # App layout (sidebar, bottom-nav, FAB)
├── guest/        # Guest mode helpers
└── providers/    # React context providers
```

To add a new shadcn component:
```bash
npx shadcn-ui@latest add <component-name>
```

Existing components use **CSS variables** for theming (defined in `src/app/globals.css`):
```css
--color-primary: #16A34A
--color-text: #111827
--color-surface: #FFFFFF
/* etc. */
```

### Running Tests
```bash
pnpm test              # Unit tests
pnpm test:watch        # Watch mode
pnpm test:e2e          # Playwright E2E
```

**Test patterns** (Lane 2):
- Use `getByLabelText(/pattern/i)` for inputs (more reliable than placeholder)
- For sidebar/shell tests: call `useUIStore.setState({sidebarOpen: true})` before render
- Import `fake-indexeddb/auto` BEFORE Dexie in tests
- Use `@vitest-environment jsdom` comment per test file for DOM access

---

## Self-Hosting

### On a VPS
```bash
git clone https://github.com/sderosiaux/nutritrack.git
cd nutritrack

# Copy and customize .env for your domain
cp .env.example .env
nano .env  # Set BETTER_AUTH_URL, secrets, etc.

# Start services with Compose
docker compose up -d

# (Optional) use nginx as reverse proxy on port 80/443
```

### Notes
- All data stays in your database (PostgreSQL)
- Food images stored in MinIO (no third-party)
- No telemetry or external API calls by default
- Ollama for vision is optional; can use OpenAI, Gemini, or manual entry

---

## Development Roadmap

Implementation is organized into 13 lanes (topological order). Each lane has concrete checkboxes tracked in `.forge/`.

| # | Lane | Status | Key Tasks |
|---|------|--------|-----------|
| 1 | Infra & Foundation | ✅ Complete | Scaffolding, DB schema, auth system, health check |
| 2 | Design Shell | ✅ Complete | UI components, layout, pages, guest mode |
| 3 | Food Database | 🔲 Pending | Food CRUD, search, filtering, ~10k seed items |
| 4 | Food Logging API | 🔲 Pending | Meal entries, macro calculation, validation |
| 5 | Dashboard & Journal | 🔲 Pending | Daily summary, calorie ring, meal history |
| 6 | Profile & Onboarding | 🔲 Pending | User goals, preferences, setup flow |
| 7 | Weight & Activity | 🔲 Pending | Weight tracking, exercise logging, calories burned |
| 8 | AI Recognition | 🔲 Pending | Photo upload, vision API (Ollama/OpenAI/Gemini) |
| 9 | Analytics | 🔲 Pending | Trends, charts, insights, weekly summaries |
| 10 | Coach & Lessons | 🔲 Pending | Educational content, lessons, streaks |
| 11 | Recipes | 🔲 Pending | Recipe search, creation, meal planning |
| 12 | PWA & Offline | 🔲 Pending | Service worker, offline sync, notifications |
| 13 | Polish & A11y | 🔲 Pending | Accessibility, performance, operations |

**Build State**: See `.forge/state.yaml` (cycle 1), `.forge/lanes.yaml` (topological order), and `.forge/checkboxes.yaml` (59 CHKs) for detailed progress.

**Architecture**: See `REFERENCE.md` for comprehensive technical documentation.

---

## License

MIT — See [LICENSE](LICENSE)

---

## Acknowledgments

Inspired by [Foodvisor](https://www.foodvisor.io/). Built on excellent open-source libraries: Next.js, Drizzle, Better Auth, Hono, and many others.

Data sources: [Open Food Facts](https://world.openfoodfacts.org/), [USDA FoodData Central](https://fdc.nal.usda.gov/)

---

**Need help?**
- 📖 [Specs & Architecture](spec/)
- 🐛 [Issues](https://github.com/sderosiaux/nutritrack/issues)
- 💬 Discussions welcome!
