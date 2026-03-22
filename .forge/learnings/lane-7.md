# Learnings — Lane 7: weight-activity

## PATTERNS

- **Same `makeChain` factory from lanes 3/4** works for all chainable Drizzle queries. Include `"and"` in the methods list when the service uses `and()` from drizzle-orm in `.where()`. (`src/__tests__/chk024-weight-logging.test.ts:37`)

- **DB mock must include all tables accessed by the service**: `chk025` test mocks `activityEntries`, `exercises`, AND `weightEntries` (even though weight isn't tested there) because `log-service.ts` imports all three. Missing table stubs cause TypeScript errors at import time. (`src/__tests__/chk025-activity-logging.test.ts:17-34`)

- **`computeCaloriesBurned` exported as pure function**: Same pattern as `computeMacros` from lane 4 — pure function exported for direct unit testing without DB mock. Formula: `MET × weightKg × (durationMin / 60)`. (`src/server/services/log-service.ts`)

## DECISION

- **`getWeightEntries` uses 90-day cutoff via `gte()`**: Spec says "last 90 days, ordered desc". Used `gte(weightEntries.loggedAt, cutoff)` where cutoff is `new Date() - 90 days`. (`src/server/services/log-service.ts`)

- **`createActivityEntry` falls back to 70kg for MET calc when `userWeightKg` not provided**: Prevents validation error when client doesn't supply weight. Spec allows MET-based estimate even without exact user weight.

- **`intensityLevel` selects `metLow`/`metHigh`/`metValue`**: When intensity is "low" use `metLow`, "high" use `metHigh`, otherwise `metValue` (moderate). (`src/server/services/log-service.ts`)

- **Exercises route is public (no `requireAuth`)**: `GET /api/v1/exercises` serves exercise list without auth. Session middleware still attached globally but `requireAuth` not applied to this router. (`src/server/api/routes/exercises.ts`)

- **Route registration order in logs.ts**: Static routes (`/weight`, `/weight/:id`, `/activities`, `/activities/:id`) registered before `/:date` to prevent Hono routing `/weight` as `date = "weight"`. Same pattern from lane 4. (`src/server/api/routes/logs.ts`)

- **Exercise seed split into two files**: 220 exercises split across `exercise-seed-a.ts` (cardio + strength, 120 items) and `exercise-seed-b.ts` (flexibility + sports + daily_activity, 100 items). `exercises.ts` re-exports both and exposes `ALL_EXERCISES` array. All files under 500 lines. (`src/server/db/seed-data/`)

## FRICTION

- **`src/server/api/index.ts` was modified by lane 10/11 work**: Had `recipes` import added. Re-read before editing to avoid write conflict.

- **`gte` must be imported from drizzle-orm**: Extended the import line to include `gte, desc` alongside existing `eq, and, sql`. (`src/server/services/log-service.ts:1`)

## SURPRISE

- **5 pre-existing test failures remain from earlier lanes**: chk016, chk017, chk018, chk040, chk042 (UI and recipe tests). Not introduced by lane 7. Lane 7 adds 52 new passing tests.
