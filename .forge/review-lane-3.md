---
verdict: VIOLATIONS
lane: 3
cycle: 1
violation_count: 3
correction_count: 0
---

## Violations

- CHK-008: Seed scope is materially below spec and tests do not verify required scope.
  Expected (from spec): `spec/05-tech-stack.md:114-118` requires importing Open Food Facts + USDA and a curated starter around 50k items; lane checkbox also requires `pnpm db:seed` to load ~10k curated foods + demo user (`.forge/checkboxes.yaml:91-92`).
  Actual (in code): seed dataset is 100 items total (60 USDA + 40 OFF) in `src/server/db/seed-data/foods.ts:43-210`; seed script only inserts those foods/servings and does not create a demo user (`src/server/db/seed.ts:18-40`, `42-58`).
  Test gap: `src/__tests__/chk008-seed.test.ts:44-47` only asserts `>=100` items and never checks ~10k / ~50k scale or demo-user seeding.

- CHK-009: Search behavior does not implement required ranking/full-text/multi-language semantics; tests are route-shape only.
  Expected (from spec): lane checkbox requires PostgreSQL full-text search with fuzzy ranking `(recent > exact > verified > branded)`, multi-language via `nameTranslations` JSONB, and pagination (`.forge/checkboxes.yaml:100`); source section is `spec/07-api.md:37-73`.
  Actual (in code): search uses `ILIKE` on `name`/`brandName` and orders only by `verified` then `createdAt`; no recent-food ranking, no exact-vs-branded ordering logic, no `nameTranslations` query (`src/server/services/food-service.ts:93-104`).
  Test gap: `src/__tests__/chk009-food-search.test.ts:17-30` mocks `food-service`; assertions validate status/shape and argument passthrough only (`50-150`), not ranking/full-text/multi-language behavior.

- CHK-010: `/foods/recent` does not satisfy spec semantics; tests do not catch it.
  Expected (from spec): `GET /api/v1/foods/recent` must return last 20 **logged foods for user** (`spec/07-api.md:47`).
  Actual (in code): `getRecentFoods` ignores `userId` and returns globally most recently created foods from `foods` table (`src/server/services/food-service.ts:138-145`), while route hardcodes 20 (`src/server/api/routes/foods.ts:31-34`).
  Test gap: `src/__tests__/chk010-food-detail.test.ts:16-28` mocks service; recent-food tests only assert array response and service call signature (`79-99`), not user-scoped logged-food recency behavior.

## Traceability Notes (non-blocking)
- CHK-008: `.forge/checkboxes.yaml` test reference `src/__tests__/chk008-seed.test.ts:33` is accurate.
- CHK-009: `.forge/checkboxes.yaml` test reference `src/__tests__/chk009-food-search.test.ts:45` is accurate.
- CHK-010: `.forge/checkboxes.yaml` test reference `src/__tests__/chk010-food-detail.test.ts:47` is accurate.
- CHK-011: `.forge/checkboxes.yaml` test reference `src/__tests__/chk011-barcode.test.ts:44` is accurate.
- CHK-051: `.forge/checkboxes.yaml` test reference `src/__tests__/chk051-custom-food.test.ts:51` is accurate.

## Code Issues (if any)
- None outside the listed spec-compliance violations.

## Test Results
- Executed: `npm test` (fallback because `pnpm` is not installed in this environment).
- Result: 14 test files passed, 197/197 tests passed.
