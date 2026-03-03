---
verdict: VIOLATIONS
lane: 1
cycle: 1
violation_count: 4
correction_count: 0
---

## Violations

- CHK-001: Test does not fully verify required scaffold behavior.
  Expected (from spec): `spec/05-tech-stack.md:§Stack Decision` + checkbox require scaffold with Next.js 15 **App Router**, TypeScript, Tailwind v4, Hono API routes, Vitest, Playwright.
  Actual (in code): `src/__tests__/chk001-scaffold.test.ts` checks package dependencies/scripts and tsconfig, but does not assert App Router structure (`src/app` route layout behavior) or Hono API route wiring.
  Test gap: Assertions are dependency-presence checks; they do not verify all required scaffolded runtime pieces from wording.

- CHK-002: No test actually covers Docker Compose dev stack requirements.
  Expected (from spec): `spec/05-tech-stack.md:§Infrastructure (Self-hosted)` + checkbox require compose dev config with PostgreSQL 16, Redis, MinIO, optional Ollama, and app hot-reload service.
  Actual (in code): `docker-compose.yml` contains these services, but referenced test `src/__tests__/chk001-scaffold.test.ts:12` has no Docker Compose assertions.
  Test gap: Missing test for compose service definitions and hot-reload behavior; CHK-002 is effectively untested.

- CHK-003: Initial migration requirement is not implemented.
  Expected (from spec): checkbox requires Drizzle setup **and initial migration** for listed tables.
  Actual (in code): `drizzle/migrations/` is empty (no SQL migration files); only schema TS files exist.
  Test gap: `src/__tests__/chk003-schema.test.ts` only checks exported schema objects/fields and does not verify migration artifacts exist or apply.

- CHK-004: Auth implementation and tests do not verify required endpoint/middleware contract.
  Expected (from spec): `spec/07-api.md:§Auth` + checkbox require register/login/logout/refresh/forgot/reset flows and JWT session middleware.
  Actual (in code): `src/server/auth/index.ts` enables `emailAndPassword` and `src/server/api/middleware/auth.ts` attaches session via `getSession`; there is no explicit JWT bearer middleware path, and no endpoint-level verification for refresh/forgot/reset behavior.
  Test gap: `src/__tests__/chk004-auth.test.ts` checks only auth object presence/options and `/api/v1/health`; it does not exercise register/login/logout/refresh/forgot/reset endpoints or JWT session enforcement.

## Traceability Notes (non-blocking)

- CHK-001: checkboxes reference `src/__tests__/chk001-scaffold.test.ts:12`, but line 12 is a helper; first test starts at line 16.
- CHK-002: checkboxes reference `src/__tests__/chk001-scaffold.test.ts:12`, but no CHK-002-specific test exists in that file.

## Code Issues (if any)

- `drizzle/migrations`: directory exists but is empty, creating a deployment/runtime risk for any environment expecting migration-based schema bootstrap.
