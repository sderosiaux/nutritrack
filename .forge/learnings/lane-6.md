# Lane 6 — profile-onboarding learnings

## ESM import patterns in Vitest

**Problem**: `require("@/server/auth")` inside `beforeEach` or test functions throws `Cannot find module` in ESM context.

**Fix**: Always use the three-part pattern:
1. `vi.mock("@/module", () => ({ fn: vi.fn().mockResolvedValue(defaultValue) }))` at module level
2. `beforeEach(() => vi.resetAllMocks())` to flush between tests
3. `const { fn } = await import("@/module"); vi.mocked(fn).mockResolvedValueOnce(...)` inside each test

**Never use**: `require()` inside `beforeEach` or test functions in ESM context.

## Route group paths in test imports

**Problem**: `require("@/app/(app)/profile/page")` fails — Vitest's module resolver can't handle parentheses in `require()`.

**Fix**: Use static top-level ESM imports instead:
```typescript
import { ProfilePage } from "@/app/(app)/profile/page";
import TodayPage from "@/app/(app)/today/page";
```
Drop `vi.resetModules()` + `require()` pattern entirely for these route group components.

## `getByText` specificity with overlapping numbers

**Problem**: `getByText(/850/)` also matches text containing `1850`, causing "multiple elements" errors.

**Fix**: Use exact string for the unique value (`getByText("850")`) and a more specific regex for the other (`getByText(/1850 kcal/)`).

## Hono route registration order matters

`POST /api/v1/profile/recalculate-targets` must be registered **before** `PUT /api/v1/profile` in the router, otherwise Hono's prefix matching treats `recalculate-targets` as a PUT body param.

## Drizzle upsert pattern

```typescript
db.insert(userProfiles)
  .values(record)
  .onConflictDoUpdate({ target: userProfiles.userId, set: record })
  .returning()
```

## TDEE default paces

- `lose_weight` with `weeklyPaceKg: null` → flat 500 kcal/day deficit (not `0.5kg × 7700/7 = 550`)
- `build_muscle` with `weeklyPaceKg: null` → flat 300 kcal/day surplus

## Profile service auto-recalc

`upsertProfile` triggers TDEE recalculation and upserts `dailyTargets` automatically whenever the profile has all required fields (`biologicalSex`, `currentWeightKg`, `heightCm`, `birthDate`, `activityLevel`, `goal`).

## Weekly check-in — localStorage only

CHK-058 is entirely client-side. No backend needed. State stored in `localStorage` under a single JSON key:
```json
{ "dismissedForever": false, "lastCheckin": 1234567890 }
```
Show condition: `!dismissedForever && (lastCheckin === null || Date.now() - lastCheckin > WEEK_MS)`.

## Named export for testability

Profile page exports both `export function ProfilePage()` (for test imports by name) and `export default ProfilePage` (for Next.js page routing). This allows tests to import by name without depending on default export resolution.
