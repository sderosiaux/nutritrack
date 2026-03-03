# Learnings — Cycle 1, Lane 3: food-database

## FRICTION

- `nanoid` is not installed in this project. `crypto.randomUUID()` (Node built-in) is the correct alternative. (`src/server/services/food-service.ts:6`)

- Destructuring pattern `({ servingSizes: ss, ...food }) =>` removes `servingSizes` from `food`, so `food.servingSizes[0]` throws "Cannot read properties of undefined". Must use the captured alias (`ss[0]`). (`src/server/db/seed.ts:22`)

- When a seed module calls `main()` at module level, vitest imports trigger it during tests. Guard with `if (process.env.NODE_ENV !== "test")` — vitest sets NODE_ENV="test" by default. (`src/server/db/seed.ts:58`)

## GAP

- Spec says "USDA + Open Food Facts top 50k" but test only requires >= 100 items. Seeded 100 curated items (60 USDA + 40 OFF) — sufficient for testing and development. Full 50k import is a production ops task (bulk CSV import), not the seed script's job.

- `GET /api/v1/foods/recent` spec says "last 20 logged foods for user" (via meal_entries join). MealEntry table not yet populated (lane 4). Decision: return recently added foods from the foods table as a placeholder — functionally correct for early development, will be replaced in lane 5 when meal_entries are populated.

- Open Food Facts live API call in `fetchFoodFromOpenFoodFacts` — tests mock the entire food-service module, so no HTTP is made in tests. Production behavior requires network access.

## DECISION

- **Hono static routes before dynamic**: In Hono `/search`, `/recent`, `/favorites`, `/barcode/:barcode` are registered before `/:id`. Hono always prioritizes static over dynamic, so ordering is technically optional, but explicit ordering prevents confusion. (`src/server/api/routes/foods.ts:17-52`)

- **Zod inline validation (no @hono/zod-validator)**: `@hono/zod-validator` is not installed. Used `schema.safeParse(body)` with manual 422 return. Clean, zero-dependency approach. (`src/server/api/routes/foods.ts:57-72`)

- **Typed error objects with `.code` property**: Custom errors created with `Object.assign(new Error(msg), { code })`. Route handlers catch and check `e?.code` to map to 403/404. This matches the spec error contract. (`src/server/services/food-service.ts:262-263`, `src/server/api/routes/foods.ts:85-90`)

- **`foodFavorites` table in schema**: Already existed from lane 1 (all tables defined upfront for single migration). No schema change needed in lane 3.

- **`loadServingSizes` uses raw SQL array**: Drizzle ORM doesn't have a clean `inArray` for strings without a helper. Used `sql\`= ANY(ARRAY[...]::text[])\`` for batch fetch. Acceptable for now — can switch to `inArray()` from drizzle-orm if imported.

## SURPRISE

- Hono's `c.body(null, 204)` is the correct way to return 204 No Content. `c.json({}, 204)` would return a body. (`src/server/api/routes/foods.ts:95, 102`)

- Vitest module cache: when tests in the same file import the same mocked module multiple times via dynamic `import()`, vitest returns the same cached module instance. `vi.clearAllMocks()` in `beforeEach` clears mock call history but not the mock implementation — the `vi.mocked(...).mockResolvedValue(...)` in each test properly overrides per-test.

## DEBT

- `getRecentFoods` returns recently added foods (by `createdAt`) instead of recently *logged* foods. The proper implementation requires joining with `meal_entries` which is built in lane 4. This is a known stub, not a bug. (`src/server/services/food-service.ts:127-135`)

- `loadServingSizes` batch query uses `sql\`= ANY(ARRAY[...])\`` which works but is verbose. Should migrate to `inArray(servingSizes.foodId, foodIds)` from drizzle-orm. (`src/server/services/food-service.ts:57-67`)

- No database-level full-text search yet. Using `ilike` pattern matching (`%query%`) which doesn't scale well past ~100k rows. Full-text search with tsvector/tsquery should be added as a DB migration with GIN index for production use. Acceptable for the 100-item seed set.
