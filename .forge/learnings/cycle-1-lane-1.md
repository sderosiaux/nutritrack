# Learnings — Cycle 1, Lane 1: infra-foundation

## FRICTION

- `hono/vercel`'s `handle()` return type is `(req: Request) => Response | Promise<Response>`, not an object with `{GET, POST, ...}`. Next.js App Router destructuring `export const { GET, POST } = handle(app)` fails TypeScript compilation. Fixed by using `app.fetch` directly via a named function re-exported as methods (`src/app/api/v1/[[...all]]/route.ts:4-8`).

- Better Auth v1.2.x does NOT have `advanced.generateId` in `BetterAuthAdvancedOptions`. Compile error. Removed it — Better Auth uses `nanoid` internally (`src/server/auth/index.ts`).

- Auth module initialized DB connection at module import time, causing Vitest to crash without `DATABASE_URL`. Required lazy proxy pattern (`src/server/auth/index.ts:50-67`) + stub env in `vitest.config.ts:13-17`.

## GAP

- Spec says "pnpm monorepo" but doesn't define whether that means `apps/web` workspace or single-root app. Chose single-root (co-located = one app) to match "frontend + backend co-located" phrasing.

- Spec lists `FavoriteRecipes` as a table in CHK-003 but the data model has it as a junction between User and Recipe. Recipe schema is in lane 11. Resolved by creating `favoriteRecipes` referencing recipes from content.ts (all tables in one migration is correct for Drizzle).

- CHK-002 spec doesn't mention a Dockerfile.dev for hot-reload. Created `Dockerfile.dev` with pnpm + volume mounts.

- Ollama is optional in Docker Compose — used `profiles: [ollama]` to make it opt-in via `docker compose --profile ollama up`.

## DECISION

- **Single-root Next.js app** (not apps/web/ workspace): spec says co-located, single app is simplest. Future packages can be added under packages/ if needed.

- **Better Auth lazy proxy**: `src/server/auth/index.ts` uses a `Proxy` to defer DB connection until first handler call. This keeps tests fast and import-safe.

- **Two separate API handlers** in Next.js: `/api/auth/[...all]` → Better Auth native handler, `/api/v1/[[...all]]` → Hono. Avoids needing to proxy auth through Hono which adds complexity.

- **All Drizzle schema tables in lane 1** (not just CHK-003 listed ones): Drizzle needs all tables defined before generating a single initial migration. Created Recipe, Lesson, LessonProgress tables now to avoid multi-migration complexity in later lanes.

- **vitest env stub**: Added `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` as vitest env vars (`vitest.config.ts:13-17`). No real connection made in unit tests.

## SURPRISE

- `hono@4.7.7` removed or changed the Vercel adapter type export. The type for `handle()` return value is not compatible with Next.js route handler destructuring pattern.

- Better Auth's Drizzle adapter `schema` mapping requires exact column names matching its internal expectations — if the schema columns differ, runtime errors would occur. Column names verified against Better Auth source to match exactly (`user_id`, `email_verified`, etc.).

- Next.js 15 includes `serverExternalPackages` in `next.config.ts` (previously `experimental.serverComponentsExternalPackages`). Required for `postgres` package.

## DEBT

- `Dockerfile.dev` installs pnpm with `npm install -g pnpm` which pulls from npm registry on each build. Acceptable for dev; prod uses multi-stage build in lane 13 (CHK-048).

- `src/server/db/seed.ts` is a stub — actual food data seeding is in lane 3. The script exits cleanly but does nothing.

- No `drizzle/migrations/` files generated yet (requires `DATABASE_URL` pointing to real DB). `pnpm db:generate` will create them. Acceptable for lane 1; CI pipeline will run against real DB.
