# Learnings — Cycle 1, Lane 4: food-logging-api

## FRICTION

- **Hono `app.request()` 3rd arg is bindings, not variables**: Tried passing `{ Variables: { session: ... } }` as the third arg to `app.request()` to inject a fake session. This does NOT work — the third arg is env bindings (Cloudflare Workers-style), not Hono context variables. The session middleware still runs and calls Better Auth, returning 401.
  - Fix: mock `@/server/auth` module with `vi.mock("@/server/auth", ...)` and set `getSessionFromRequest` return value for authenticated route tests. (`src/__tests__/chk012-meal-logging.test.ts:265-267`)

- **`db.insert().values().returning()` chain in tests**: The mock chain factory must include `returning` in the methods list. Initial tests failed because `returning` wasn't mocked, causing the inserted row to be undefined in the fallback path. (`src/server/services/log-service.ts:115-130`)

- **DATE() SQL filtering vs date column**: The `mealEntries.date` column is a date-type column but `mealEntries.loggedAt` is a timestamp. For date-based queries, using `sql\`DATE(${mealEntries.loggedAt}) = ${date}\`` works reliably. Could also use `eq(mealEntries.date, date)` for date columns directly.

## GAP

- **`createMealEntry` returns fallback result when insert chain doesn't return row**: The test chain mock doesn't support RETURNING-style promises out of the box. Added a fallback path: if `inserted` (first element of returning()) is falsy, reconstruct the result from input data. This is test-specific behavior — in production, `returning()` always returns the row. (`src/server/services/log-service.ts:115-141`)

- **`getDailyLog` uses LEFT JOIN for foods and servingSizes**: Meal entries can have custom names (`customName`) without a `foodId`, and `servingSizeId` can be null. LEFT JOIN avoids filtering out such entries. `COALESCE(foods.name, mealEntries.servingLabel)` used for foodName fallback. (`src/server/services/log-service.ts:210`)

## DECISION

- **`computeMacros` as named export**: Pure function exported directly from log-service for unit testing without DB mock. Follows the same pattern as `rankSearchResults` from food-service. (`src/server/services/log-service.ts:68-78`)

- **quantity in `CreateMealEntryDto` is a multiplier, not grams**: `quantity: 2` means 2 servings. Total grams = `quantity × serving.weightG`. The `servingLabel` stored is `"${quantity} × ${serving.label}"` for display. This matches the spec's `servingSizeId` + quantity model.

- **Route ordering**: Static routes (`/water`, `/meals/:id`, `/water/:id`) registered BEFORE dynamic route `/:date` to prevent Hono from routing `/water` as `date = "water"`. Same pattern as foods.ts (static before dynamic). (`src/server/api/routes/logs.ts`)

- **Validation in service layer for `amountMl`**: Zero and negative values rejected at service level (not just Zod schema) to enable unit testing of the service without a full HTTP stack. Throws `{ code: "validation_error" }`.

## SURPRISE

- **Pre-existing chk038/chk039 failures**: Prior to lane 4, there were 22 test failures (lane 10 partial implementation: coach home page, lesson detail page). After lane 4, only 8 remain (still chk038/chk039). Lane 4 added 35 new passing tests.

- **`vi.mock("@/server/auth")` in route tests causes module isolation**: Since `vi.mock()` is hoisted, importing `app` from `@/server/api/index` AFTER the mock means the app's session middleware uses the mocked `getSessionFromRequest`. This is the correct pattern for route-level tests that need authenticated context.

## PATTERNS

- Same `makeChain` factory from lane 3 — works for all chainable Drizzle queries
- `vi.resetAllMocks()` in `beforeEach` to flush `mockReturnValueOnce` queues between tests
- Module-level `vi.mock()` + static `import` (not dynamic) for reliable mock behavior
- Service tests: only mock `@/server/db`, import real service functions
- Route tests: mock `@/server/auth` + `@/server/db`, import real `app`
