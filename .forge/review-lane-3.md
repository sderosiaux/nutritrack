---
verdict: VIOLATIONS
lane: 3
cycle: 1
violation_count: 2
correction_count: 0
---

## Violations

- CHK-008: Seed scope is below the checkbox/spec target, and the test does not validate the required scale.
  Expected (from spec): `.forge/checkboxes.yaml:91` requires `pnpm db:seed` to load `~10k curated foods + demo user`; `spec/05-tech-stack.md:115-118` defines OFF + USDA import strategy with a curated starter set scale.
  Actual (in code): seed dataset is 556 items (`npx tsx ... SEED_FOODS.length`), built from 100 base foods + generated variants (`src/server/db/seed-data/foods.ts:220-223`), then seeded via `seedAll` (`src/server/db/seed.ts:55-73`).
  Test gap: `src/__tests__/chk008-seed.test.ts:47-50` only asserts `>=500`, so it does not verify the checkbox’s `~10k` requirement.

- CHK-009: Tests are not behavior-precise for the required search semantics.
  Expected (from spec): `.forge/checkboxes.yaml:100` requires PostgreSQL full-text search, ranking `(recent > exact > verified > branded)`, multi-language via `nameTranslations` JSONB, and pagination behavior.
  Actual (in code): service implements FTS/ILIKE + `nameTranslations` matching and ranking (`src/server/services/food-service.ts:131-145`, `91-118`, `161-180`).
  Test gap: route tests mock the entire service (`src/__tests__/chk009-food-search.test.ts:18-31`) and primarily assert status/shape/passthrough (`52-153`); ranking tests sort local arrays instead of calling the real service ranking/query logic (`235-302`), so required behavior is not directly verified.

## Traceability Notes (non-blocking)
- CHK-008: `.forge/checkboxes.yaml` points to `src/__tests__/chk008-seed.test.ts:34` (accurate).
- CHK-009: `.forge/checkboxes.yaml` points to `src/__tests__/chk009-food-search.test.ts:47` (accurate).
- CHK-010: `.forge/checkboxes.yaml` points to `src/__tests__/chk010-recent-service.test.ts:60` (accurate).
- CHK-011: `.forge/checkboxes.yaml` points to `src/__tests__/chk011-barcode.test.ts:44` (accurate).
- CHK-051: `.forge/checkboxes.yaml` points to `src/__tests__/chk051-custom-food.test.ts:51` (accurate).

## Code Issues (if any)
- None outside the listed spec/test violations.

## Test Results
- `pnpm test` could not run in this environment (`pnpm: command not found`).
- Fallback run: `npm test`.
- Result: 15 test files passed, 209/209 tests passed.
