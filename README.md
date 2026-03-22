<p align="center">
  <img src="public/nutritrack-banner.png" alt="NutriTrack" width="800" />
</p>

A free, open-source nutrition tracker you host yourself. Track calories, macros, hydration, weight, and activity — no subscriptions, no cloud, no data harvesting.

Built as an alternative to [Foodvisor](https://www.foodvisor.io/). Docker Compose, one command, done.

---

## What it does

- Snap a photo of your meal, AI identifies the food and estimates weights (Ollama, OpenAI, or Gemini)
- Scan barcodes via Open Food Facts
- Search 10k+ foods (USDA + Open Food Facts), log manually, or use voice input
- Track calories, macros, hydration, weight, and exercise per day
- Get personalized targets based on your profile (TDEE / Mifflin-St Jeor)
- Browse recipes and educational content
- View trends and analytics over time (7d to 1y)
- Works offline as a PWA, syncs when back online
- Guest mode — no signup required, upgrade later

---

## Architecture

```mermaid
graph TB
    subgraph Browser["Browser (PWA)"]
        SW[Service Worker + IndexedDB]
    end

    Browser -->|HTTPS| Next

    subgraph Next["Next.js 15 (port 3000)"]
        Hono[Hono REST API]
        Auth[Better Auth]
    end

    Hono --> PG[(PostgreSQL 16)]
    Hono --> Redis[(Redis 7)]
    Hono --> MinIO[(MinIO)]
    Redis -->|background jobs| Vision[Ollama / OpenAI / Gemini]
```

---

## Photo recognition flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Next.js
    participant S3 as MinIO
    participant Q as BullMQ
    participant AI as Vision provider

    U->>API: Upload photo
    API->>S3: Store image
    API->>Q: Enqueue job
    Q->>AI: Image + prompt
    AI-->>Q: [{name, weightG, confidence}]
    Q-->>API: Match against food DB
    API-->>U: Recognized foods (editable)
```

---

## Getting started

```bash
git clone https://github.com/sderosiaux/nutritrack.git
cd nutritrack

cp .env.example .env
# Set BETTER_AUTH_SECRET (openssl rand -base64 32)

docker compose up -d
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed   # optional: ~10k foods + demo user
```

App runs at http://localhost:3000. MinIO console at http://localhost:9001.

For production deployment with nginx and SSL, see [docs/self-hosting.md](docs/self-hosting.md).

---

## Configuration

All env vars are documented in `.env.example`. The required ones:

| Variable | What it does |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `BETTER_AUTH_SECRET` | Auth token secret (32+ chars) |
| `MINIO_*` | Object storage for photos |

Optional: `VISION_PROVIDER` (`ollama`/`openai`/`gemini`), SMTP settings for emails, VAPID keys for push notifications, `USDA_API_KEY` for extended food data.

---

## API

OpenAPI 3.0 spec at `/api/v1/openapi.json`. Auth via Better Auth at `/api/auth/*`. All data endpoints under `/api/v1/*` (foods, logs, analytics, profile, recipes, lessons).

---

## Stack

Next.js 15, Hono, PostgreSQL 16 (Drizzle), Redis 7 (BullMQ), MinIO, Better Auth, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query, Dexie.js, Vitest, Playwright

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

## Acknowledgments

Inspired by [Foodvisor](https://www.foodvisor.io/). Data from [Open Food Facts](https://world.openfoodfacts.org/) (CC BY-SA) and [USDA FoodData Central](https://fdc.nal.usda.gov/) (public domain).
