---
verdict: VIOLATIONS
lane: 3
cycle: 1
violation_count: 2
correction_count: 0
---

## Violations

- CHK-009: Required search semantics are not behavior-verified by tests.
  Expected (from spec): `spec/07-api.md` §Food Database requires `GET /api/v1/foods/search` with PostgreSQL full-text search, ranking (`recent > exact > verified > branded`), multi-language via `nameTranslations` JSONB, and pagination.
  Actual (in code): Search implementation includes FTS + ILIKE + `nameTranslations` text match and ranking logic in `src/server/services/food-service.ts:131-145`, `src/server/services/food-service.ts:91-118`, `src/server/services/food-service.ts:161-180`.
  Test gap: Route tests mock the entire food service (`src/__tests__/chk009-food-search.test.ts:18-31`), so they do not execute/verify FTS or `nameTranslations` query behavior; the “multi-language” test also uses mocked `searchFoods` (`src/__tests__/chk009-food-search.test.ts:304-328`). Ranking is tested in isolation (`src/__tests__/chk009-rank.test.ts`), but full search behavior required by spec is not directly tested.

- CHK-051: "Own foods only" authorization behavior is not directly verified by tests.
  Expected (from spec): `spec/07-api.md` §Food Database requires `PUT /api/v1/foods/:id` and `DELETE /api/v1/foods/:id` to allow only owner-modification of custom foods.
  Actual (in code): Ownership checks exist in service (`src/server/services/food-service.ts:353-356`, `src/server/services/food-service.ts:373-376`).
  Test gap: CHK-051 tests mock service methods at module level (`src/__tests__/chk051-custom-food.test.ts:17-29`) and assert route status mapping only; they do not exercise real ownership enforcement logic against service/DB behavior.

## Traceability Notes (non-blocking)
- CHK-008: `.forge/checkboxes.yaml` points to `src/__tests__/chk008-seed.test.ts:47` (accurate).
- CHK-009: `.forge/checkboxes.yaml` points to `src/__tests__/chk009-rank.test.ts:35` (accurate).
- CHK-010: `.forge/checkboxes.yaml` points to `src/__tests__/chk010-recent-service.test.ts:60` (accurate).
- CHK-011: `.forge/checkboxes.yaml` points to `src/__tests__/chk011-barcode.test.ts:44` (accurate).
- CHK-051: `.forge/checkboxes.yaml` points to `src/__tests__/chk051-custom-food.test.ts:51` (accurate).

## Code Issues (if any)
- None blocking beyond the test-precision violations above.

## Test Results
- Command: `npm test`
- Result: 16 test files passed, 220/220 tests passed.
