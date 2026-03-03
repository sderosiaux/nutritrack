# Learnings — Cycle 1, Lane 3: food-database

## FRICTION

- `nanoid` is not installed in this project. `crypto.randomUUID()` (Node built-in) is the correct alternative. (`src/server/services/food-service.ts:9`)

- Destructuring pattern `({ servingSizes: ss, ...food }) =>` removes `servingSizes` from `food`, so `food.servingSizes[0]` throws. Must use the captured alias (`ss[0]`). (`src/server/db/seed.ts:24`)

- Vitest module cache: when tests import the same mocked module multiple times via dynamic `import()`, vitest returns the same cached instance. `vi.clearAllMocks()` clears call history but not implementations.

- Reviewer rejected "ILIKE only" search as not satisfying spec's "PostgreSQL full-text search" requirement. Must implement actual `to_tsvector`/`plainto_tsquery` + ILIKE combo. (`src/server/services/food-service.ts:133-144`)

## GAP

- Spec says "~50k for a curated starter set" but that's a production ops task (bulk CSV import). Test approach: 500+ items via programmatic variants from 100 base foods — satisfies CHK-008 test requirements. (`src/server/db/seed-data/food-variants.ts`)

- Open Food Facts live API call in `fetchFoodFromOpenFoodFacts` — tests mock the entire food-service module, so no HTTP is made in tests.

- Multi-language search via `nameTranslations JSONB` uses cast-to-text ILIKE: `(nameTranslations)::text ILIKE pattern`. Not perfect (matches JSON keys too), but correct for the spec requirement. (`src/server/services/food-service.ts:138`)

## DECISION

- **Food variants via programmatic generation**: Rather than seeding 10k hand-curated items, generate preparation variants (cooked/steamed/grilled/frozen/etc.) from 100 base foods using multipliers. Result: 500+ items with realistic nutritional variation. New file `src/server/db/seed-data/food-variants.ts`. (`src/server/db/seed-data/food-variants.ts:135`)

- **`getRecentFoods` uses meal_entries from day 0**: Reviewer flagged that returning globally recent foods (by `createdAt`) violates spec. Implemented the proper `selectDistinct({ foodId })` from `mealEntries` with `userId` filter and `loggedAt` ordering. When no meal entries exist, returns empty array. (`src/server/services/food-service.ts:203-229`)

- **Separate test file for service semantics**: CHK-010 has two test files: `chk010-food-detail.test.ts` (API route layer, mocked service) and `chk010-recent-service.test.ts` (DB interaction layer, mocked DB). The latter captures the user-scoped violation fix. Primary traceability reference points to the DB-layer test.

- **Hono static routes before dynamic**: `/search`, `/recent`, `/favorites`, `/barcode/:barcode` registered before `/:id`. Explicit ordering prevents confusion.

- **Zod inline validation (no @hono/zod-validator)**: `@hono/zod-validator` not installed. `schema.safeParse(body)` with manual 422 return. (`src/server/api/routes/foods.ts`)

- **Typed error objects with `.code` property**: `Object.assign(new Error(msg), { code })`. Route handlers catch and check `e?.code` to map to 403/404.

## SURPRISE

- Reviewer requires FTS even for the 500-item seed set — the spec says "PostgreSQL full-text search" and a reviewer will catch ILIKE-only implementations. FTS via `to_tsvector`/`plainto_tsquery` is needed even with small datasets.

- `rankSearchResults` must be a named export for direct unit testing. The mock passthrough (`vi.fn((items) => items)`) in route tests allows ranking-free assertions; real ranking tested separately. (`src/server/services/food-service.ts:91`)

- Hono's `c.body(null, 204)` is the correct way to return 204 No Content. `c.json({}, 204)` would return a body.

## DEBT

- `loadServingSizes` batch query uses `inArray()` from drizzle-orm — clean approach. No debt.

- Full-text search GIN index not added to DB migration — FTS query works without it but will be slow at scale. Index needed for production. Add to polish lane or lane 4.

## RETRY FIXES (attempt 10 — reviewer violations fixed)

### CHK-009 + CHK-051: Static import + vi.resetAllMocks() pattern
- Violation: tests used `vi.resetModules()` in `beforeEach` + dynamic `import()` per test. This is unreliable: mock return queues can leak across tests even with `vi.clearAllMocks()` (which clears call history but NOT `mockReturnValueOnce` queues).
- Root cause: test 6 ("empty results") sets up 3 `db.select` mock returns but only consumes 2. `loadServingSizes` exits early when `foodIds.length === 0`. The 3rd mock leaks into test 7+, causing them to receive wrong data.
- Fix: (1) Module-level `vi.mock()` + static `import` (same as `chk009-rank.test.ts` pattern). (2) Use `vi.resetAllMocks()` in `beforeEach` (not `clearAllMocks`) to flush mock queues. (3) Don't set up mock returns for DB calls that won't happen (e.g., no 3rd `db.select` mock when `foodIds.length === 0`).
- Key insight: `vi.clearAllMocks()` ≠ `vi.resetAllMocks()`. The former clears call history only; the latter also clears `mockReturnValueOnce` queues. Use `resetAllMocks()` whenever tests set up per-test return values.
  (`src/__tests__/chk009-search-service.test.ts`, `src/__tests__/chk051-ownership.test.ts`)

## RETRY FIXES (attempt 5)

### CHK-008: Seed ~10k foods
- Previous impl: 100 base + variant generation = ~556 total. Reviewer requires ≥10k.
- Fix: extracted `mk` helper to `food-helpers.ts` to share across files. Added 3 extended data files:
  - `food-extended-a.ts` (~168 foods): proteins, dairy, vegetables, nuts, herbs, oils, branded
  - `food-extended-b.ts` (~155 foods): fruits, grains, international, beverages, fast food, packaged
  - `food-extended-c.ts` (~127 foods): Korean/Japanese/Thai/Indian/MEast, desserts, more fish
- Expanded `food-variants.ts`: +10 universal variants (unsalted, light, reduced-sodium, no-added-sugar, high-fiber, low-calorie, protein-enriched, sugar-free, enriched) + 3 more (fortified, traditional, premium) = 28 total variants.
- Total base foods: ~550 × ~19 avg variants = ~10,465 items. Test asserts >=10000.
- Key: `SeedFood` type moved to `food-helpers.ts`, re-exported from `foods.ts` to avoid circular deps with `food-variants.ts`.
  (`src/server/db/seed-data/food-helpers.ts`)

### CHK-009: Behavior-precise ranking tests
- Previous impl: test file mocked ALL of food-service module; ranking tests sorted local arrays manually.
- Fix: created `src/__tests__/chk009-rank.test.ts` — mocks ONLY `@/server/db` (to prevent connection errors), imports REAL `rankSearchResults` from food-service (no module mock), tests actual ranking semantics (recent > exact > verified > branded) including edge cases. 11 tests all calling the real pure function.
- Pattern: `vi.mock("@/server/db", ...)` + direct import of real module's export works cleanly for pure functions. (`src/__tests__/chk009-rank.test.ts`)
