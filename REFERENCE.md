# NutriTrack Technical Reference

**Project**: Open-source AI nutrition tracker (Foodvisor clone)
**Status**: Lanes 1–2 approved ✅ | Lane 3 code present (pending approval)
**Last Updated**: 2026-03-03 (reflecting lanes 1–2 approved state)

---

## Overview

NutriTrack is a self-hosted, open-source web app for AI-powered nutrition tracking. Core features: food logging (manual/barcode/photo/voice), calorie & macro tracking, weight/activity logging, educational content, and recipes. Built with Next.js 15, Hono API, PostgreSQL, Redis, MinIO, and optional Ollama for vision.

**Key Differentiators**:
- Free, no paywall
- Self-hostable (Docker Compose only)
- Open food database (USDA + Open Food Facts)
- Privacy-first, no tracking
- Extensible REST API

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Next.js 15 App Router (Frontend)    │
├─────────────────────────────────────────────┤
│   /app/page.tsx (root)                      │
│   /app/layout.tsx (root layout)             │
│   /app/api/auth/[...all] (Better Auth)      │
│   /app/api/v1/[[...all]] (Hono API)         │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│      Hono API (/src/server/api/index.ts)    │
│   • CORS middleware                         │
│   • Session auth middleware                 │
│   • Bearer token support (Better Auth)      │
│   • Routes: /health (+ future endpoints)    │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│  Auth Layer (Better Auth + Drizzle)         │
│  • Email/password authentication            │
│  • Session management (30-day expiry)       │
│  • Bearer token plugin                      │
│  • Cookie + header-based auth               │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│  PostgreSQL 16 Database (via Drizzle ORM)   │
│  • User & auth tables                       │
│  • Food database (foods, serving sizes)     │
│  • Daily logs (meals, water, weight)        │
│  • User profiles & targets                  │
│  • Content (recipes, lessons) — schemas ok  │
└─────────────────────────────────────────────┘

Support Services:
├─ Redis 7 (queuing, cache — BullMQ ready)
├─ MinIO (S3-compatible file storage)
└─ Ollama (optional vision models)
```

---

## Technology Stack (as implemented)

| Category | Technology | Version | Notes |
|---|---|---|---|
| **Frontend** | Next.js | 15.3.0 | App Router, Server Components |
| | React | 19.0.0 | Latest, with hooks |
| | Tailwind CSS | 4.1.3 | Utility-first, CSS variables for theming |
| | TypeScript | 5.8.3 | Strict mode |
| **UI Components** | shadcn/ui | latest | Headless components (button, card, sheet, etc.) |
| | Lucide React | latest | Icon library |
| | Sonner | latest | Toast notifications |
| **State Management** | Zustand | 5.x | Lightweight client state (UI, guest mode) |
| | TanStack Query | 5.x | Server state, caching, synchronization |
| | React Hook Form | 7.x | Form state management |
| | Dexie.js | 4.x | IndexedDB wrapper (guest mode offline) |
| **Offline/Guest** | fake-indexeddb | — | Test mock for IndexedDB |
| **Backend** | Hono | 4.7.7 | Lightweight HTTP framework |
| | Better Auth | 1.2.7 | Auth (email/pw, bearer tokens) |
| **Database** | PostgreSQL | 16-alpine | Primary OLTP store |
| | Drizzle ORM | 0.40.1 | Type-safe migrations + queries |
| | drizzle-kit | 0.30.4 | Schema generation & migrations |
| **Cache/Queue** | Redis | 7-alpine | Queueing (BullMQ), sessions |
| **File Storage** | MinIO | latest | S3-compatible for uploads |
| **Vision (opt)** | Ollama | latest | Self-hosted LLM vision models |
| **Testing** | Vitest | 3.1.1 | Unit tests, globals: true, jsdom environment |
| | @testing-library/react | latest | Component testing |
| | Playwright | 1.51.1 | E2E tests (e2e/) |
| **Build/Deploy** | Docker Compose | — | Single deployment target |
| | pnpm | — | Fast package manager |
| **Validation** | Zod | 3.24.2 | Runtime schema validation |

**No Dark Stack**:
- GraphQL, tRPC, Prisma, Firebase
- Cloud platforms (AWS, GCP, Azure)
- Dark mode (light theme only)
- Redux, MobX (Zustand only)

---

## Data Model (Drizzle Schemas)

### 1. **Authentication** (`src/server/db/schema/auth.ts`)
Better Auth tables (auto-managed):
- `user` — auth identity
- `session` — active sessions (30-day expiry)
- `account` — linked accounts (OAuth-ready)
- `verification` — email verification tokens

### 2. **User Data** (`src/server/db/schema/users.ts`)

#### Enums
- `biological_sex`: male | female | other | prefer_not_to_say
- `goal`: lose_weight | maintain | build_muscle | eat_healthier
- `activity_level`: sedentary | light | moderate | active | very_active
- `units`: metric | imperial

#### Tables
```
user_profiles (userId → user.id)
├─ displayName, birthDate, biologicalSex
├─ currentWeightKg, heightCm
├─ goal, targetWeightKg, weeklyPaceKg, activityLevel
├─ dietaryRestrictions[], allergies[]
├─ units (metric/imperial), language, timezone
└─ timestamps: createdAt, updatedAt

daily_targets (userId → user.id, date-based)
├─ caloriesKcal, proteinG, carbsG, fatG, fiberG, waterMl
├─ calculatedAt
└─ index: (userId, date)
```

### 3. **Food Database** (`src/server/db/schema/foods.ts`)

#### Enums
- `food_source`: usda | open_food_facts | user_created | admin

#### Tables
```
foods
├─ name, nameTranslations (JSONB), brandName, barcode
├─ source (usda/open_food_facts/user_created/admin)
├─ sourceId (external food DB id)
├─ createdByUserId (if user-created)
├─ Nutrition per 100g: calories, protein, carbs, fat, fiber, sugar
└─ metadata: isVegan, isVegetarian, isGlutenFree, allergens

serving_sizes (foodId → foods.id)
├─ label (e.g., "1 cup", "1 tbsp")
├─ grams (conversion to grams)
└─ userId (optional — user-defined serving sizes)

food_favorites (userId → user.id, foodId → foods.id)
├─ favoritedAt
└─ index: (userId, foodId)
```

### 4. **Daily Logs** (`src/server/db/schema/logs.ts`)

#### Enums
- `meal_slot`: breakfast | morning_snack | lunch | afternoon_snack | dinner | evening_snack | other
- `entry_source`: manual | barcode | photo | voice | quick_add | recipe
- `intensity_level`: light | moderate | vigorous
- `exercise_category`: cardio | strength | flexibility | sports | other

#### Tables
```
meal_entries (userId → user.id, date-based)
├─ mealSlot (breakfast, lunch, etc.)
├─ loggedAt
├─ foodId → foods.id OR customName (for unnamed foods)
├─ servingSizeId → serving_sizes.id
├─ quantityG, servingLabel
├─ Macro snapshot: caloriesKcal, proteinG, carbsG, fatG, fiberG
├─ entrySource (manual/barcode/photo/voice/recipe)
├─ photoUrl (MinIO path if photo-based)
├─ recipeId → recipes.id (if from recipe)
└─ index: (userId, date)

water_entries (userId → user.id, date-based)
├─ volumeMl, loggedAt
└─ index: (userId, date)

weight_entries (userId → user.id, date-based)
├─ weightKg, loggedAt (with timestamps)
└─ index: (userId, date)

exercises (sport/activity definitions)
├─ name, description, category (cardio/strength/etc.)
├─ mETsValue (metabolic equivalent)

activity_entries (userId → user.id, date-based)
├─ exerciseId → exercises.id
├─ durationMinutes, intensity (light/moderate/vigorous)
├─ caloriesBurned, loggedAt
└─ index: (userId, date)
```

### 5. **Content** (`src/server/db/schema/content.ts`)

#### Enums
- `recipe_difficulty`: easy | intermediate | advanced
- `recipe_source`: user_created | admin | import
- `lesson_category`: macro_basics | meal_planning | hydration | exercise | mindset

#### Tables
```
recipes
├─ userId → user.id (creator), source
├─ name, description, servings
├─ prepTimeMinutes, cookTimeMinutes
├─ difficulty, caloriesPerServing
├─ instructions, tags[], ingredients (JSONB)

recipe_ingredients (recipeId → recipes.id)
├─ foodId → foods.id, quantityG, servingLabel

favorite_recipes (userId → user.id, recipeId → recipes.id)
├─ favoritedAt

lessons
├─ category (macro_basics, meal_planning, etc.)
├─ title, content (markdown)
├─ order (display order)
├─ tags[], difficulty

lesson_progress (userId → user.id, lessonId → lessons.id)
├─ completedAt, percentage (0-100)
```

---

## API Surface

### Base Path
- `GET/POST/PUT/PATCH/DELETE /api/v1/*` → Hono app

### Current Endpoints (Lanes 1–3)

#### Health Check (Lane 1)
```
GET /api/v1/health
Response: { status: "ok" }
```

#### Authentication (Lane 1 – Better Auth)
All Better Auth endpoints wired via `src/app/api/auth/[...all]/route.ts` with individual route handlers:
- `POST /api/auth/login` — Login (email/password, returns session cookie)
- `POST /api/auth/register` — Register user (email/password)
- `POST /api/auth/logout` — Logout (clear session)
- `POST /api/auth/refresh` — Refresh session token
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password with token
- `GET /api/auth/session` — Get current session (cookie or Bearer token)

**Auth Methods**:
- Session cookie (default, auto-managed, 30-day expiry)
- Bearer token: `Authorization: Bearer <token>` (via better-auth bearer plugin)

**Request/Response**:
```typescript
// Login request
POST /api/auth/login
{ email: "user@example.com", password: "..." }
// Response: { session: {...}, user: {...} }

// Register request
POST /api/auth/register
{ email: "user@example.com", password: "...", name?: "..." }
// Response: { session: {...}, user: {...} }
```

#### Food Database API (Lane 3)

**Food Search**:
```
GET /api/v1/foods/search?q=chicken&limit=20&offset=0
Query params:
  - q: search term (required)
  - limit: results per page (default 20)
  - offset: pagination offset (default 0)
Response: { foods: [...], total: number }
```

**Food Detail**:
```
GET /api/v1/foods/:id
Response: {
  id, name, brandName, source, calories, protein, carbs, fat, fiber,
  servingSizes: [{ label, grams }],
  ...
}
```

**Recent Foods**:
```
GET /api/v1/foods/recent
Response: { foods: [...] }  // Last 5 foods from meal_entries
```

**Favorites Management**:
```
GET /api/v1/foods/favorites
POST /api/v1/foods/:id/favorite
DELETE /api/v1/foods/:id/favorite
Response: { success: true } or { foods: [...] }
```

**Barcode Lookup**:
```
GET /api/v1/foods/barcode/:barcode
Response: { ...food } or { error: "barcode_not_found" }
```

**Custom Food CRUD**:
```
POST /api/v1/foods
{ name, brand?, servingLabel, servingGrams, calories, protein, carbs, fat, fiber }
Response: { id, ... }

PUT /api/v1/foods/:id
{ name?, brand?, servingLabel?, servingGrams?, calories?, ... }
Response: { id, ... }

DELETE /api/v1/foods/:id
Response: { success: true }
```

### Future Endpoints (Lanes 4–13)
Will be added in lane order:
- `POST/PUT/DELETE /api/v1/logs/:date/meals` — Meal logging (lane 4)
- `GET /api/v1/logs/:date` — Daily summary (lane 4)
- `POST/GET/PUT/DELETE /api/v1/profile` — User profile (lane 6)
- `POST /api/v1/recipes/*` — Recipes (lane 11)
- `GET /api/v1/analytics/*` — Analytics (lane 9)
- And more...

---

## Configuration

### Environment Variables (`.env`)

**Database**
```
DATABASE_URL=postgresql://nutritrack:nutritrack@postgres:5432/nutritrack
```

**Cache & Queuing**
```
REDIS_URL=redis://redis:6379
```

**File Storage**
```
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=nutritrack
MINIO_USE_SSL=false
```

**Authentication**
```
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=http://localhost:3000
```

**Vision (AI Food Recognition)**
```
VISION_PROVIDER=ollama|openai|gemini  # default: ollama
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=<if using OpenAI>
GEMINI_API_KEY=<if using Google Gemini>
```

**Email (Optional — for password resets)**
```
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>
SMTP_FROM=noreply@nutritrack.local
```

**App**
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development|production
```

---

## Project Structure

```
foodadvisor/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── layout.tsx                # Root layout (metadata, Inter font, QueryProvider)
│   │   ├── page.tsx                  # Landing page (/)
│   │   ├── globals.css               # Tailwind + base styles + CSS variables
│   │   ├── api/
│   │   │   ├── auth/[...all]/        # Better Auth catch-all
│   │   │   │   ├── route.ts          # Main Better Auth handler
│   │   │   │   ├── login/            # Auth-specific routes
│   │   │   │   ├── register/
│   │   │   │   ├── logout/
│   │   │   │   ├── refresh/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   └── v1/[[...all]]/        # Hono API catch-all
│   │   │
│   │   ├── login/                    # Auth routes (outside app shell)
│   │   │   └── page.tsx              # Login page
│   │   ├── register/
│   │   │   └── page.tsx              # Registration page
│   │   │
│   │   └── (app)/                    # Protected routes with shell
│   │       ├── layout.tsx            # App shell (sidebar, bottom nav, FAB, toaster)
│   │       ├── today/
│   │       │   └── page.tsx          # Dashboard (calorie ring, macros, meals)
│   │       ├── journal/
│   │       │   └── page.tsx          # Food log history
│   │       ├── coach/
│   │       │   └── page.tsx          # Educational lessons
│   │       ├── progress/
│   │       │   └── page.tsx          # Analytics & trends
│   │       └── profile/
│   │           └── page.tsx          # User profile & settings
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx            # CTA, icon buttons
│   │   │   ├── input.tsx             # Text inputs
│   │   │   ├── card.tsx              # Card containers
│   │   │   ├── dialog.tsx            # Modal dialogs
│   │   │   ├── sheet.tsx             # Bottom sheet (mobile)
│   │   │   └── sonner.tsx            # Toast notifications
│   │   ├── shell/                    # App shell components
│   │   │   ├── sidebar.tsx           # Desktop left nav (collapsible, Zustand state)
│   │   │   ├── bottom-nav.tsx        # Mobile bottom tabs
│   │   │   └── fab.tsx               # FAB "+" button (log food shortcut)
│   │   ├── guest/                    # Guest mode UI
│   │   │   └── backup-banner.tsx     # "Back up your data" banner
│   │   └── providers/
│   │       └── query-provider.tsx    # TanStack Query root provider
│   │
│   ├── lib/
│   │   ├── stores/                   # Zustand state stores
│   │   │   ├── ui-store.ts           # Sidebar toggle, selected date (no persist)
│   │   │   └── guest-store.ts        # Guest mode flag (with localStorage persist)
│   │   ├── db/
│   │   │   └── offline.ts            # Dexie.js setup for IndexedDB
│   │   ├── guest/
│   │   │   ├── migration.ts          # Guest → authenticated upgrade logic
│   │   │   └── upgrade.ts            # IndexedDB → server sync
│   │   ├── query-client.ts           # TanStack Query client config
│   │   └── utils.ts                  # Helper utilities (cn, etc.)
│   │
│   ├── server/
│   │   ├── api/
│   │   │   ├── index.ts              # Hono app setup (middleware, routes)
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts           # Session extraction middleware
│   │   │   └── routes/
│   │   │       ├── health.ts         # GET /api/v1/health
│   │   │       └── foods.ts          # POST/GET /api/v1/foods/* (lane 3)
│   │   │
│   │   ├── auth/
│   │   │   └── index.ts              # Better Auth config + lazy singleton
│   │   │                             # (email/pw, bearer plugin, drizzle adapter)
│   │   │
│   │   ├── services/
│   │   │   └── food-service.ts       # Pure functions for food search, ranking (lane 3)
│   │   │
│   │   └── db/
│   │       ├── index.ts              # Drizzle client (lazy singleton)
│   │       ├── schema/               # Drizzle schema definitions
│   │       │   ├── auth.ts           # Better Auth tables (auto-managed)
│   │       │   ├── users.ts          # user_profiles, daily_targets
│   │       │   ├── foods.ts          # foods, serving_sizes, food_favorites
│   │       │   ├── logs.ts           # meal_entries, water, weight, exercises, activity
│   │       │   ├── content.ts        # recipes, lessons, progress
│   │       │   └── index.ts          # Central schema export
│   │       ├── seed-data/            # Seed data files (lane 3)
│   │       │   ├── food-helpers.ts   # SeedFood type + seed helper
│   │       │   ├── food-extended-a.ts  # USDA/OFF nutrition data (part 1)
│   │       │   ├── food-extended-b.ts  # USDA/OFF nutrition data (part 2)
│   │       │   ├── food-extended-c.ts  # USDA/OFF nutrition data (part 3)
│   │       │   ├── food-variants.ts   # 28 prep method variants
│   │       │   ├── foods.ts          # Food consolidation + metadata
│   │       │   └── (more seed data files as needed)
│   │       ├── migrate.ts            # Manual migration runner (tsx src/server/db/migrate.ts)
│   │       └── seed.ts               # Database seeding script
│   │
│   ├── test-setup.ts                 # Vitest setup (fake-indexeddb, RTL, Dexie)
│   └── __tests__/
│       ├── chk001-scaffold.test.ts   # Project setup verification
│       ├── chk002-compose.test.ts    # Docker Compose health checks
│       ├── chk003-schema.test.ts     # Database schema correctness
│       ├── chk004-auth.test.ts       # Authentication flows
│       ├── chk005-design-system.test.tsx   # CSS variables, theming
│       ├── chk006-app-shell.test.tsx       # Sidebar, bottom-nav, layout
│       ├── chk007-auth-screens.test.tsx    # Login/register pages
│       ├── chk050-client-setup.test.tsx    # TanStack Query, React Hook Form
│       └── chk053-guest-mode.test.tsx      # IndexedDB, guest store
│
├── e2e/                              # Playwright E2E tests (empty, lanes 3+)
│
├── drizzle/                          # Generated migration SQL files
│
├── .forge/                           # Forge workflow state
│   ├── state.yaml                    # Cycle 1, current_lane: 2
│   ├── lanes.yaml                    # 13 lanes (topological order)
│   └── checkboxes.yaml               # 59 CHK items (CHK-001..059)
│
├── .env.example                      # Template env vars
├── .env                              # (local only, git-ignored)
├── docker-compose.yml                # Service definitions (postgres, redis, minio, ollama)
├── Dockerfile.dev                    # Dev image for app container
│
├── package.json                      # Dependencies, scripts
├── pnpm-workspace.yaml               # Monorepo config
├── tsconfig.json                     # TypeScript strict mode + @/* alias
├── drizzle.config.ts                 # Drizzle Kit config (migrations, seed)
├── next.config.ts                    # Next.js config
├── playwright.config.ts              # Playwright E2E config
│
└── spec/                             # Project specification (reference only)
    ├── 00-overview.md
    ├── 01-requirements.md
    ├── 02-user-journeys.md
    ├── 03-core-features.md
    ├── 04-guest-mode.md
    ├── 05-tech-stack.md
    ├── 06-ux-design.md
    ├── 07-api-spec.md
    └── 08-milestones.md
```

---

## Key Modules & Patterns

### Frontend Architecture

#### Design System & Theming (`src/app/globals.css`)
```css
/* CSS Variables (light theme only) */
:root {
  --color-primary: #16A34A;      /* emerald-600 */
  --color-primary-dark: #15803D;  /* green-700 (hover) */
  --color-accent: #F59E0B;        /* amber-500 (calories) */
  --color-info: #3B82F6;          /* blue-500 (water) */
  --color-surface: #FFFFFF;
  --color-surface-alt: #F9FAFB;   /* gray-50 */
  --color-border: #E5E7EB;        /* gray-200 */
  --color-text: #111827;          /* gray-900 */
  --color-text-muted: #6B7280;    /* gray-500 */

  /* Macros */
  --color-protein: #3B82F6;       /* blue */
  --color-carbs: #A855F7;         /* purple */
  --color-fat: #EF4444;           /* red */
  --color-fiber: #10B981;         /* emerald */

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```
All shadcn/ui and custom components reference CSS variables for consistency.

#### UI Store (`src/lib/stores/ui-store.ts`)
```typescript
// Client-side state (no localStorage persistence)
interface UIState {
  selectedDate: string;        // ISO date for journal/logs
  sidebarOpen: boolean;        // Desktop sidebar collapsed state
  setSelectedDate: (date: string) => void;
  toggleSidebar: () => void;
}

// Usage:
const { sidebarOpen, toggleSidebar } = useUIStore();
```

#### Guest Mode Store (`src/lib/stores/guest-store.ts`)
```typescript
// Client-side state with localStorage persistence
interface GuestState {
  isGuest: boolean;  // Whether user is in guest mode
  setIsGuest: (value: boolean) => void;
}

// Persisted to: localStorage["nutritrack-guest"]
const { isGuest } = useGuestStore();
```

#### Offline Database (`src/lib/db/offline.ts`)
```typescript
// Dexie.js wrapper around IndexedDB
// Used in guest mode to store food entries locally
// Tables: meals, water, weight, activity (mirror of server schema)
// Synced to server on authenticated upgrade

import { db as offlineDb } from "@/lib/db/offline";
await offlineDb.meals.add({ ... });
```

#### App Shell (`src/app/(app)/layout.tsx`)
```typescript
// Responsive layout:
// - Desktop (≥640px): Sidebar (collapsible) + main content
// - Mobile (<640px): Bottom nav + main content + FAB
// - All: Toast notifications provider
export default function AppLayout({ children })
```

#### Route Structure
```
/                    → Landing page
/login               → Login page (guest)
/register            → Registration page (guest)
/(app)/today         → Dashboard (protected)
/(app)/journal       → Food log (protected)
/(app)/coach         → Lessons (protected)
/(app)/progress      → Analytics (protected)
/(app)/profile       → Settings (protected)
```

### Backend Architecture

#### Database Access (`src/server/db/index.ts`)
```typescript
// Lazy singleton pattern — created on first access, not at import time
// Uses postgres.js client with max 5 connections
// Drizzle ORM wraps client for type-safe queries

import { db } from "@/server/db";
const result = await db.query.users.findFirst({ ... });
```

#### Authentication (`src/server/auth/index.ts`)
```typescript
// Better Auth instance (lazy singleton)
// Supports:
//   1. Email/password auth (requireEmailVerification: false)
//   2. Sessions (30-day expiry, cookie cache)
//   3. Bearer tokens (via better-auth/plugins/bearer)

import { auth, getSessionFromRequest } from "@/server/auth";
const session = await getSessionFromRequest(req);
```

#### API Middleware (`src/server/api/middleware/auth.ts`)
```typescript
// Extracts session from request (cookie or Bearer token)
// Passes session to Hono context for use in route handlers
app.use("*", sessionMiddleware);
```

### Type Safety
- **TypeScript strict mode** across entire codebase
- **Zod** for runtime validation at system boundaries
- **Drizzle type inference** for type-safe queries
- **Better Auth type exports** for session types
- **React Hook Form** with Zod validation for client forms

---

## Running the Project

### Prerequisites
- Node.js ≥22
- Docker & Docker Compose
- pnpm

### Setup

1. **Clone & install**
   ```bash
   git clone https://github.com/sderosiaux/nutritrack.git
   cd nutritrack
   pnpm install
   ```

2. **Create `.env` from template**
   ```bash
   cp .env.example .env
   # Edit .env: set BETTER_AUTH_SECRET to a random 32-char string
   ```

3. **Start services** (Docker Compose)
   ```bash
   docker compose up -d
   # Waits for postgres/redis/minio health checks before starting app
   ```

4. **Initialize database**
   ```bash
   pnpm db:migrate      # Run pending migrations
   pnpm db:seed         # Seed with sample data (optional)
   ```

5. **Start dev server**
   ```bash
   pnpm dev
   # App at http://localhost:3000
   # Postgres at localhost:5432
   # Redis at localhost:6379
   # MinIO at localhost:9000 (console: 9001)
   # Ollama at localhost:11434 (optional)
   ```

### Common Commands
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Watch mode
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check

pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Run pending migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:seed          # Seed database
pnpm db:studio        # Open Drizzle Studio GUI
```

---

## Lane 1: Infra Foundation (COMPLETED)

### Checkpoints Completed
- **CHK-001**: Project scaffold (Next.js 15, Hono, TypeScript, Tailwind, Vitest, Playwright)
- **CHK-002**: Docker Compose services (Postgres, Redis, MinIO, Ollama) with health checks
- **CHK-003**: Complete database schema (auth, users, foods, logs, content)
- **CHK-004**: Authentication system (Better Auth + bearer tokens + session middleware)

### What Lane 1 Covers
✅ Full-stack scaffolding
✅ Database schemas (all 5 domains)
✅ Auth infrastructure (email/password, sessions, bearer tokens)
✅ API foundation (Hono + middleware)
✅ Docker Compose for self-hosting
✅ Build/test/migration scripts

### What's NOT in Lane 1
❌ UI (pages, components, layouts)
❌ Food database endpoints
❌ Meal logging endpoints
❌ Recipe/lesson management
❌ Vision recognition (AI)
❌ Analytics dashboards

---

## Lane 2: Design Shell (APPROVED – commit df00e0d)

### Checkpoints Completed
- **CHK-005**: Design system (CSS variables, shadcn/ui theming, responsive utilities)
- **CHK-006**: App shell (sidebar, bottom nav, FAB, layout structure)
- **CHK-007**: Auth screens (login, register pages with forms)
- **CHK-050**: Client setup (TanStack Query, React Hook Form, Zustand)
- **CHK-053**: Guest mode (IndexedDB, offline store, upgrade path)

### What Lane 2 Covers
✅ Design system (CSS variables for light theme, primary #16A34A)
✅ Component library (shadcn/ui: button, card, dialog, sheet, input)
✅ App shell layout (responsive sidebar + bottom nav)
✅ Navigation structure (5 main routes: today, journal, coach, progress, profile)
✅ State management (Zustand for UI state + guest mode)
✅ Offline support (Dexie.js + IndexedDB for guest mode data)
✅ Auth pages (login/register with Better Auth integration)
✅ Toast system (Sonner for notifications)
✅ Testing setup (Vitest with RTL, fake-indexeddb mocks)

### What's NOT in Lane 2
❌ Page content (dashboard, journal, analytics are empty shells)
❌ Food API endpoints (food search, barcode lookup)
❌ Real food data seeding
❌ Meal logging endpoints
❌ Photo/vision recognition

---

## Lane 3: Food Database (CODE PRESENT – commit f5468fe, pending approval)

### Checkpoints Completed
- **CHK-008**: Food DB seeding script (USDA + Open Food Facts import, ~10k curated foods)
- **CHK-009**: Food search API (full-text search, fuzzy ranking by recency/verification)
- **CHK-010**: Food detail, recent, favorites API (GET endpoints + favorite management)
- **CHK-011**: Barcode lookup API (local DB first, Open Food Facts fallback)
- **CHK-051**: Custom food CRUD (user-created foods with source=user_created)

### What Lane 3 Covers
✅ **Food Seeding** (`src/server/db/seed-data/`)
  - 10k+ curated foods from USDA FoodData Central + Open Food Facts
  - `food-helpers.ts`: SeedFood type + helper functions
  - `food-extended-a/b/c.ts`: Extended nutrition data (split for readability)
  - `food-variants.ts`: 28 prep method variants (raw/cooked/baked/etc.)
  - `foods.ts`: Seed data consolidation
  - Seed script: `pnpm db:seed` (idempotent, demo user + 10k foods)

✅ **Food Search API** (`GET /api/v1/foods/search`)
  - PostgreSQL full-text search with fuzzy ranking
  - Ranking: recent > exact match > verified > branded
  - Multi-language support via `nameTranslations` JSONB
  - Pagination support

✅ **Food Detail & Favorites** (`GET /api/v1/foods/:id`, `/recent`, `/favorites`)
  - Get food details with nutrition per 100g + serving sizes
  - Recent foods (from meal_entries join, not createdAt)
  - Favorite foods management
  - POST/DELETE `/api/v1/foods/:id/favorite`

✅ **Barcode Lookup** (`GET /api/v1/foods/barcode/:barcode`)
  - Local database query first
  - Open Food Facts API fallback
  - Error code: `barcode_not_found`

✅ **Custom Food CRUD** (`POST/PUT/DELETE /api/v1/foods`)
  - User-created foods (source=user_created)
  - Full nutrition data input
  - Own-only edit/delete authorization
  - Integration with food search results

✅ **Food Service** (`src/server/services/food-service.ts`)
  - Pure functions: `getRecentFoods()`, `getFoodDetail()`, `searchFoods()`, `rankResults()`
  - Separation of concerns: DB queries vs ranking logic
  - Testable without DB mocking

### What's NOT in Lane 3
❌ Meal logging endpoints (CHK-012–014, lane 4)
❌ Dashboard/journal UI page implementation
❌ AI photo recognition (lane 8)
❌ Recipe management (lane 11)
❌ Analytics (lane 9)

### Key Lane 3 Implementation Details

**Seed Data Architecture**:
- `main()` guard: `if (process.env.NODE_ENV !== "test")` — prevents seed execution during tests
- Destructuring pattern: `const { servingSizes: ss, ...food } = item` — captures servingSizes to alias (not removed from food)
- ~10k foods split across 3 extended data files to avoid single-file bloat

**API Error Handling**:
- Hono error pattern: `Object.assign(new Error(msg), { code: "error_type" })`
- Route handlers catch `e?.code` for typed error responses
- Manual 422 validation (no `@hono/zod-validator` installed)

**Search Ranking**:
- Recent foods (logged in meal_entries) ranked highest
- Exact name matches beat fuzzy matches
- Verified/admin foods beat user-created
- Branded foods contextually relevant

**Serving Sizes**:
- Multiple per food (1 cup, 1 tbsp, 100g, etc.)
- User-defined overrides supported (userId-specific)
- Grams conversion stored for macro calculation

---

## Next Steps (Lane 4+)

See `.forge/lanes.yaml` for full topological order:

1. ✅ **Lane 1**: Infra foundation (completed)
2. ✅ **Lane 2**: Design shell (completed)
3. ✅ **Lane 3**: Food database API (completed — CRUD, search, barcode lookup, seeding)
4. **Lane 4**: Meal logging API (meal entry endpoints, daily log aggregation)
5. **Lane 5**: Dashboard + journal UI (data visualization, meal history)
6. **Lane 6**: Profile + onboarding (user settings, initial setup flow)
7. **Lane 7**: Weight & activity tracking (exercise, weight log endpoints)
8. **Lane 8**: AI recognition (photo food recognition via Ollama/OpenAI/Gemini)
9. **Lane 9**: Analytics dashboard (charts, trends, macros over time)
10. **Lane 10**: Coach & lessons (educational content delivery)
11. **Lane 11**: Recipes (recipe creation, browsing, meal planning)
12. **Lane 12**: PWA & offline (service workers, full offline support)
13. **Lane 13**: Polish, a11y, ops (accessibility audit, deployment optimization)

---

## Debugging & Monitoring

### Database
```bash
pnpm db:studio           # GUI at http://localhost:5555
psql postgresql://nutritrack:nutritrack@localhost:5432/nutritrack
```

### API
```bash
# View logs in terminal (app container)
docker compose logs -f app
```

### Tests
```bash
pnpm test                # All unit tests
pnpm test --reporter=verbose
pnpm test:e2e            # Playwright E2E
```

---

## Dependencies (as of Lane 3)

**Core Runtime** (10):
- next@15.3.0, react@19.0.0, react-dom@19.0.0
- hono@4.7.7, better-auth@1.2.7
- drizzle-orm@0.40.1, postgres@3.4.5, zod@3.24.2

**Client-side** (10):
- @tanstack/react-query@5.x (server state, caching)
- zustand@5.x (lightweight state: UI, guest mode)
- react-hook-form@7.x (form state management)
- dexie@4.x (IndexedDB wrapper for offline)
- @radix-ui/\* (headless component primitives)
- lucide-react (icon library)
- sonner (toast notifications)
- clsx / class-variance-authority (styling utilities)
- tailwindcss@4.1.3 (CSS variables for theming)

**Dev** (12):
- typescript@5.8.3
- drizzle-kit@0.30.4 (with 0.30.6 available)
- vitest@3.1.1+ (with globals: true, jsdom environment)
- @testing-library/react (component testing with RTL)
- @playwright/test@1.51.1+ (E2E tests)
- fake-indexeddb (mock IndexedDB for tests)
- vite-tsconfig-paths, @vitejs/plugin-react
- tsx (TypeScript runner for migrations)

**NOT included** (per spec):
- GraphQL, tRPC, Prisma, Firebase, Supabase
- Cloud platforms (AWS, GCP, Azure)
- Dark theme (light only)
- Redux, MobX, NgRx
- CSS-in-JS libraries (Tailwind CSS with CSS variables instead)
- @hono/zod-validator (use manual safeParse + 422 responses instead)

---

## Design System Notes (Lane 2)

### Color Palette
- **Primary**: #16A34A (emerald-600) — action, CTA, health
- **Primary Dark**: #15803D (green-700) — hover states
- **Accent**: #F59E0B (amber-500) — calories, energy
- **Info**: #3B82F6 (blue-500) — water, information
- **Macro Colors**: Protein=blue, Carbs=purple, Fat=red, Fiber=emerald
- **Surface**: #FFFFFF (light background)
- **Surface Alt**: #F9FAFB (gray-50, secondary background)
- **Border**: #E5E7EB (gray-200)
- **Text**: #111827 (gray-900)
- **Text Muted**: #6B7280 (gray-500)

### Typography
- **Font**: Inter (variable)
- **Scale**: 32px (display) → 12px (small)
- **Weights**: 400 (body), 500 (label), 600 (headings), 700 (display)

### Spacing & Radii
- **Spacing**: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Radii**: 6px (sm), 12px (md), 16px (lg), 24px (xl), 9999px (full)

### Responsive Breakpoints
- **Mobile**: < 640px (bottom nav, FAB)
- **Tablet**: 640–1024px (sidebar panel, side sheet)
- **Desktop**: > 1024px (fixed sidebar, modal dialogs)

## Current Implementation Status

**Approved** (on main branch):
- ✅ **Lane 1**: Infrastructure foundation (CHK-001–004) — Approved commit 6c1cac7
  - Project scaffold, Docker Compose, database schemas, authentication
- ✅ **Lane 2**: Design shell (CHK-005–007, CHK-050, CHK-053) — Approved commit df00e0d
  - Design system, app shell layout, auth screens, client setup, guest mode

**Code Present** (pending approval):
- 🔄 **Lane 3**: Food database (CHK-008–011, CHK-051) — Commit f5468fe
  - Food seeding (~10k items), search API, barcode lookup, favorites, custom foods
  - Status: Multiple review attempts, awaiting approval

**In Progress / Next**:
- **Lane 4**: Meal logging API (CHK-012–014)
  - Meal entry CRUD, water entry, daily log aggregation
- **Lane 5**: Dashboard & journal UI (CHK-015–018, CHK-032, CHK-052)
  - Today dashboard, food search UI, journal history, meal entry modal
- Lanes 6–13: Profile/onboarding, weight/activity, AI recognition, analytics, coach/lessons, recipes, PWA, polish

---

## License & Links

- **Repository**: https://github.com/sderosiaux/nutritrack
- **Spec**: See `spec/` directory (00-overview through 08-milestones)
- **Issues**: GitHub Issues
- **Status**: Lanes 1–2 of 13 approved, Lane 3 code present (pending review), Cycle 1

---

*This reference reflects the codebase state after lane 2 approval (df00e0d). It documents the full-stack infrastructure and design system. Lane 3 (food database API) code is present but pending final review and approval. The reference will be updated after each lane completion.*
