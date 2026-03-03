# Tech Stack

## Guiding Constraints

- Fully open-source (MIT or compatible licenses)
- Self-hostable via Docker Compose
- No vendor lock-in on any critical path
- Web-first, PWA for mobile
- Food recognition must work without paying per-request (or have a free tier path)

---

## Stack Decision

### Frontend

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR + RSC, great PWA support, large ecosystem |
| Language | **TypeScript** | Type safety, especially for nutrition math |
| Styling | **Tailwind CSS v4** | Utility-first, no runtime, good responsive |
| Component system | **shadcn/ui** (Radix primitives) | Accessible, unstyled, own the code |
| State management | **Zustand** | Lightweight, no boilerplate |
| Server state / cache | **TanStack Query** | Async data fetching, offline support |
| Charts | **Recharts** | React-native, MIT, good for health dashboards |
| Camera / barcode | **@zxing/library** (barcode) + native `getUserMedia` | Browser-native |
| Forms | **React Hook Form** + **Zod** | Performant, type-safe validation |
| Offline / PWA | **Workbox** via next-pwa | Service worker, background sync |
| Local storage | **Dexie.js** (IndexedDB wrapper) | Offline-first food log |

### Backend

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | **Node.js 22 LTS** | Stable, wide hosting support |
| Framework | **Hono** | Lightweight, edge-ready, fast, typed |
| API style | **REST + JSON** (OpenAPI spec) | Simple, widely understood |
| ORM | **Drizzle ORM** | TypeScript-first, lightweight, great migrations |
| Database | **PostgreSQL 16** | Reliable, JSONB for micronutrients, full-text search |
| Auth | **Better Auth** | Open-source, self-hosted, OAuth support |
| File/image storage | **MinIO** (S3-compatible) | Self-hostable object storage |
| Job queue | **BullMQ** (Redis-backed) | Background jobs: photo analysis, notifications |
| Email | **Nodemailer** + SMTP | Password reset, self-configured |

### AI / Food Recognition

**Tier 1 (default): LLM Vision API**
- Use OpenAI GPT-4o Vision or open-alternative (Ollama + LLaVA)
- Prompt: identify food items and estimate gram weights from photo
- Self-hosted option: Ollama with `llava` or `moondream2` model
- Structured output: JSON list of `{name, weightG, confidence}`

**Tier 2: Open Food Facts + USDA for lookup**
- All barcode / text search backed by Open Food Facts API (free, open)
- Fallback: USDA FoodData Central API (free API key)
- Local DB cache: bulk import Open Food Facts dataset (CSV, ~2GB)

**Voice logging**: Web Speech API (browser-native, no backend needed)

**NLP quick-add**: lightweight model or LLM call to parse "2 eggs and oatmeal 80g"

### Infrastructure (Self-hosted)

```yaml
# docker-compose.yml services
services:
  app:        # Next.js (frontend + API routes)
  postgres:   # PostgreSQL 16
  redis:      # BullMQ + session cache
  minio:      # Object storage (food images, user photos)
  ollama:     # Optional: local LLM for photo recognition
```

### External APIs (all free-tier or open)

| Service | Use | Cost |
|---|---|---|
| Open Food Facts | Barcode lookup, food DB | Free, CC BY-SA |
| USDA FoodData Central | Food nutritional data | Free (API key) |
| OpenAI / Anthropic | Photo recognition (optional hosted) | Pay-per-use fallback |
| Ollama (self-hosted) | Photo recognition (fully free) | Free, own hardware |

---

## Architecture Diagram

```
Browser (PWA)
  │
  ├── Service Worker (offline cache, background sync)
  ├── IndexedDB (local food log, offline entries)
  │
  └── HTTPS → Next.js App
               │
               ├── App Router (pages, layouts, RSC)
               ├── API Routes (/api/*)
               │    ├── Hono Router
               │    ├── Auth (Better Auth)
               │    └── Business logic services
               │
               ├── Drizzle ORM → PostgreSQL
               ├── BullMQ → Redis
               │    └── Jobs:
               │         ├── photo-analysis (→ Vision API / Ollama)
               │         ├── daily-reminder emails
               │         └── weekly summary
               └── MinIO (images)
```

---

## Food Database Strategy

### Phase 1 — Seeded from open datasets
1. Import Open Food Facts (openfoodfacts.org/data) — product barcodes, branded foods
2. Import USDA FoodData Central SR Legacy — generic foods, accurate nutrition
3. Merge/deduplicate into local `foods` table
4. ~600k+ items at full import, ~50k for a curated starter set

### Custom foods (v1)
- Users can create private custom foods (stored in their account)
- No community contribution pipeline in v1 (deferred — complexity not worth it yet)

---

## Photo Recognition Flow

```
User photo → Upload to MinIO (temp)
  → BullMQ job: analyze-photo
    → Option A: Ollama (local)
         POST ollama/api/generate
         model: llava / moondream2
         prompt: "List all food items visible. For each: name, estimated weight in grams."
         → parse JSON response
    → Option B: OpenAI GPT-4o Vision
         openai.chat.completions.create(...)
         → parse structured output
    → Option C: Gemini Flash (free tier)
    → Return: [{name, weightG, confidence}]
  → Look up each item in food DB
  → Return matched FoodItems to frontend
```

Admin can configure which provider to use via env var: `VISION_PROVIDER=ollama|openai|gemini`

---

## Deployment Target

Self-hosted VPS or local machine via Docker Compose. No cloud deployment targets.

---

## Developer Experience

- `pnpm` monorepo (frontend + backend co-located)
- `docker compose up` → full stack locally
- Seed command: `pnpm db:seed` — loads ~10k foods, sample recipes, demo user
- OpenAPI spec generated from routes (Hono + Zod)
- E2E tests: Playwright
- Unit tests: Vitest
