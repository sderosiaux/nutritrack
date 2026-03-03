---
verdict: VIOLATIONS
lane: 3
cycle: 1
violation_count: 1
correction_count: 0
---

## Violations

- CHK-009: Test behavior does not fully verify spec-required query semantics.
  Expected (from spec): `GET /api/v1/foods/search` uses PostgreSQL full-text search, multi-language matching via `nameTranslations` JSONB, fuzzy ranking, and pagination (`spec/07-api.md §Food Database`; CHK-009 wording in `.forge/checkboxes.yaml`).
  Actual (in code/tests): implementation includes FTS and JSONB text matching in `searchFoods` (`src/server/services/food-service.ts`), but the referenced CHK-009 test (`src/__tests__/chk009-search-service.test.ts:80`) only asserts generic DB calls and returned shape; the “FTS path exercised” and “multi-language” cases do not assert that the FTS predicate or `nameTranslations` JSONB query path is actually used.
  Test gap: if FTS or JSONB matching were removed from the query while still returning mocked DB rows, current tests would still pass.

## Traceability Notes (non-blocking)
- CHK-008: `.forge/checkboxes.yaml` points to `src/__tests__/chk008-seed.test.ts:47` (accurate).
- CHK-009: `.forge/checkboxes.yaml` points to `src/__tests__/chk009-search-service.test.ts:80` (accurate).
- CHK-010: `.forge/checkboxes.yaml` points to `src/__tests__/chk010-recent-service.test.ts:60` (accurate).
- CHK-011: `.forge/checkboxes.yaml` points to `src/__tests__/chk011-barcode.test.ts:44` (accurate).
- CHK-051: `.forge/checkboxes.yaml` points to `src/__tests__/chk051-ownership.test.ts:84` (accurate).

## Code Issues (if any)
- None blocking beyond the violation above.
