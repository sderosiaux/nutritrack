---
verdict: VIOLATIONS
lane: 1
cycle: 1
violation_count: 2
correction_count: 0
---

## Violations

- CHK-003: Test does not verify the spec-required JSONB behavior for `Food.nameTranslations` and `Food.micronutrients`.
  Expected (from spec): `CHK-003` requires Food with `nameTranslations JSONB + micronutrients JSONB` (source: `spec/02-data-models.md:§Core Models`, checkbox text in `.forge/checkboxes.yaml`).
  Actual (in code): Implementation uses JSONB in both schema and migration (`src/server/db/schema/foods.ts:30`, `src/server/db/schema/foods.ts:68`, `drizzle/migrations/0000_melted_betty_ross.sql:81`, `drizzle/migrations/0000_melted_betty_ross.sql:95`).
  Test gap: `src/__tests__/chk003-schema.test.ts:66` and `:70` only assert property presence, not JSONB type/SQL type, so the test can pass even if column types regress.

- CHK-004: Auth tests do not verify real Better Auth integration behavior; key checks are satisfied by a global mock.
  Expected (from spec): `CHK-004` requires Better Auth integration for register/login/logout/refresh/forgot/reset and JWT bearer session middleware (source: `spec/07-api.md:§Auth`, checkbox text in `.forge/checkboxes.yaml`).
  Actual (in code): Routes and middleware are implemented (`src/app/api/auth/register/route.ts:9`, `src/app/api/auth/login/route.ts:9`, `src/app/api/auth/logout/route.ts:9`, `src/app/api/auth/refresh/route.ts:9`, `src/app/api/auth/forgot-password/route.ts:9`, `src/app/api/auth/reset-password/route.ts:9`, `src/server/api/middleware/auth.ts:23`, `src/server/auth/index.ts:27`, `src/server/auth/index.ts:47`).
  Test gap: `src/__tests__/chk004-auth.test.ts:25` mocks `@/server/auth`; config assertions at `:64-79` and route mapping checks at `:117+` validate the mock contract rather than real auth wiring/integration behavior.

## Traceability Notes (non-blocking)
- CHK-001: `.forge/checkboxes.yaml` points to `src/__tests__/chk001-scaffold.test.ts:16` (accurate).
- CHK-002: `.forge/checkboxes.yaml` points to `src/__tests__/chk002-compose.test.ts:13` (accurate).
- CHK-003: `.forge/checkboxes.yaml` points to `src/__tests__/chk003-schema.test.ts:15` (accurate).
- CHK-004: `.forge/checkboxes.yaml` points to `src/__tests__/chk004-auth.test.ts:117` (accurate).

## Code Issues (if any)
- None identified within lane-1 scope beyond the blocking test-coverage precision issues above.
