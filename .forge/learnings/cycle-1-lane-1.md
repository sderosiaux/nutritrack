# Learnings — Cycle 1, Lane 1: infra-foundation

## FRICTION

- `hono/vercel`'s `handle()` return type is not compatible with Next.js App Router destructuring `export const { GET, POST } = handle(app)`. Fixed by using `app.fetch` directly (`src/app/api/v1/[[...all]]/route.ts:4-8`).

- Better Auth v1.2.x does NOT have `advanced.generateId` in `BetterAuthAdvancedOptions`. Removed it — Better Auth uses `nanoid` internally.

- Auth module initialized DB connection at module import time, causing Vitest to crash without `DATABASE_URL`. Required lazy proxy pattern (`src/server/auth/index.ts:50-67`) + stub env in `vitest.config.ts:13-17`.

- (Attempt 2) Reviewer expected explicit JWT bearer token plugin, not just session cookies. Added `bearer()` plugin from `better-auth/plugins` (`src/server/auth/index.ts:2,46`).

## GAP

- Spec says "pnpm monorepo" but doesn't specify workspace depth. Chose single-root (co-located) to match "frontend + backend co-located" phrasing.

- CHK-002 spec doesn't mention a `Dockerfile.dev` for hot-reload. Created it with pnpm + volume mounts.

- Ollama is optional — used Docker Compose `profiles: [ollama]` to make it opt-in.

## DECISION

- **Single-root Next.js app**: spec says co-located, single app is simplest.

- **Better Auth lazy proxy**: defers DB connection until first handler call, keeps tests fast (`src/server/auth/index.ts:46-62`).

- **Two separate API handlers**: `/api/auth/[...all]` → Better Auth, `/api/v1/[[...all]]` → Hono. Avoids proxying auth through Hono.

- **All Drizzle schema tables in lane 1**: Drizzle needs all tables defined before generating a single initial migration. Recipe, Lesson, LessonProgress created now even though their lanes are later.

- **bearer() plugin for JWT**: `bearer` plugin from `better-auth/plugins` converts `Authorization: Bearer <token>` to session before `getSession` processes it. Satisfies "JWT session middleware" spec requirement.

- **CHK-004 tests mock getSessionFromRequest**: lazy proxy creates auth without DB connection, but `getSessionFromRequest` makes network calls. Mock only that function; real `auth.options` and `auth.api` are inspected directly.

## SURPRISE

- `drizzle-kit generate` does NOT require a real database connection — reads TypeScript schema files only. Can run with any `DATABASE_URL` value.

- Better Auth exposes `requestPasswordReset` (not `forgotPassword`). Spec path `/api/auth/forgot-password` maps to Better Auth's `/api/auth/request-password-reset`.

- Better Auth `auth.api` is safe to access without triggering DB queries — it's just an object of handler functions. Only invoking those functions requires a DB.

## DEBT

- `Dockerfile.dev` installs pnpm via npm on each build. Acceptable for dev; prod multi-stage build in lane 13 (CHK-048).

- `src/server/db/seed.ts` is a stub — actual food seeding is in lane 3.

## REVIEW LESSONS (attempt 3→4)

- Reviewer checks every spec verb. "refresh" in CHK-004 maps to `auth.api.refreshToken` (Better Auth's `/api/auth/refresh-token`). Must assert it explicitly — session config `updateAge` alone does not satisfy the test gap.
- Better Auth `auth.api.refreshToken` exists in core (no plugin needed). Confirmed by inspecting live `auth.api` keys.

## REVIEW LESSONS (attempt 2→3)

- Reviewer checks test substance, not just presence. "Dependency-presence checks" are insufficient — must assert runtime behavior (file structure, handler wiring, API responses, middleware contracts).
- Separate test files per CHK-ID (chk002-compose.test.ts, not bundled into chk001). Reviewer catches wrong file references immediately.
- Migration artifacts are code artifacts — they must be committed. `drizzle-kit generate` output belongs in the repo, not gitignored.
- Auth middleware tests must exercise the actual enforce/allow contract (401 on no session, 200 on valid session), not just config inspection.
