# Learnings — Cycle 1, Lane 9: analytics

## PATTERNS

- **`vi.resetAllMocks()` in `beforeEach` clears mock return values** — after calling `vi.resetAllMocks()`, all mock functions lose their return value. Fix: re-set mock via `const { fn } = await import("@/module"); vi.mocked(fn).mockResolvedValue(...)` inside the `beforeEach` after the reset. Same pattern from lane-6.

- **`queryAllByText` instead of `queryByText` for repeated text** — when text appears in multiple DOM nodes (e.g., "streak" in two card headings, "protein" in both a button and a label), RTL throws "Found multiple elements". Use `screen.queryAllByText(/streak/i).length > 0` pattern.

- **Streak service — pure functions, no mocks** — `calculateStreak`, `getLongestStreak`, `getCurrentStreak` all take `string[]` arrays. No DB deps. Can be tested directly without vi.mock. Exported from `streak-service.ts` and called by `analytics-service.ts`.

- **`calculateStreak` anchor logic** — active streak starts from today if logged, yesterday otherwise (user hasn't logged yet today = streak not broken). Returns 0 only when most recent log is >1 day ago.

- **Hono analytics route — static before dynamic** — `/foods/top`, `/meal-timing`, `/export`, `/summary`, `/nutrients`, `/weight` are all static paths. Register all before any dynamic wildcard routes.

- **SVG charts inline** — recharts not in package.json. Used `<polyline>` for line charts, `<rect>` for bar charts. Viewbox `0 0 100 60`, normalize values to [0, 56] range. `preserveAspectRatio` via `viewBox` auto-scales.

- **Export endpoint returns native `Response`** — Hono can return a `new Response(body, { headers: {...} })` directly from a route handler. Required for custom `Content-Type` and `Content-Disposition` headers on file downloads.

## DECISION

- **`getExportData` shared between both export formats** — a single service function returns structured data; the route handler converts to CSV or JSON based on query param `format`.

- **CSV escaping** — food names may contain commas. Wrap all string fields in double quotes, escape inner quotes as `""`. Standard RFC 4180.

- **Date range defaults** — when `startDate`/`endDate` query params are absent, default to last 30 days. Avoids 422 on missing params; endpoints are still useful without explicit range.

- **`getLongestStreak` vs `getCurrentStreak`** — `getLongestStreak` scans all historical dates for the longest run. `getCurrentStreak` only looks backward from today/yesterday. Both exported for separate testing.

## FRICTION

- **`vi.mock("@tanstack/react-query", async (importOriginal) => ...)` pattern** — must use async factory with `importOriginal` to spread actual exports and only override `useQuery`. Otherwise the `QueryClient`, `QueryClientProvider` etc. are undefined and tests crash on import.

- **`useQuery` called multiple times per component** — ProgressPage calls `useQuery` 3 times (summary, nutrients, weight). In tests, use `.mockReturnValueOnce()` chaining to return different data for each call in sequence.

## SURPRISE

- **Nutrient deep-dive page top-foods list shows `×` bullet** — RTL sees the `×` character in list items and `queryAllByText(/protein/i)` returns both button text AND nutrient label text, causing "multiple elements" error. Fixed by using `queryAllByText(...).length > 0` assertion.

## FILES CREATED

- `src/server/services/streak-service.ts` — pure streak functions (calculateStreak, getLongestStreak, getCurrentStreak, buildDateSet)
- `src/server/services/analytics-service.ts` — DB query functions (getSummary, getNutrientBreakdown, getWeightHistory, getTopFoods, getMealTiming, getExportData)
- `src/server/api/routes/analytics.ts` — Hono analytics router
- `src/app/(app)/progress/page.tsx` — replaced stub with full analytics UI (4 SVG charts, range selector, streak banner, empty state)
- `src/app/(app)/progress/nutrients/page.tsx` — nutrient deep-dive screen (selector, bar chart, top foods list)
