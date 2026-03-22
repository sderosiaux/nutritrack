# Learnings — Cycle 1, Lane 5: dashboard-journal

## FRICTION

- **`type="search"` has implicit role "searchbox" not "textbox"**: RTL's `getByRole("textbox")` throws when input has `type="search"` since that element has ARIA role "searchbox". Fix: use `queryByRole("searchbox") ?? queryByRole("textbox") ?? queryByPlaceholderText(...)` for resilient search input selection in tests.

- **Fake timers (`vi.useFakeTimers`) bleed into subsequent tests causing timeouts**: When a test uses `vi.useFakeTimers()` and the next test uses real async code (debounces, promises), the fake timer environment causes 5000ms timeouts. Fix: switch to real timers with a higher `waitFor` timeout instead (e.g., `{ timeout: 1500 }`) for debounce tests. If `vi.useRealTimers()` is needed, call it BEFORE any awaits in the cleanup.

- **`queryByText` matches multiple elements with OR regex**: `screen.getByText(/food|search|water/i)` throws "multiple elements found" if all three words appear in the DOM. Fix: use specific text matching (`/log entry/i`) or `queryAllByText` with length assertion.

- **formatDate without year**: `toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })` doesn't include the year. Tests checking for "2026" in the body will fail. Fix: either include year in format options or assert on presence of navigation buttons instead.

## GAP

- **Default calorie targets**: Dashboard uses hardcoded default targets (2000 kcal, 150g protein, etc.) since user profile/targets API isn't implemented until lane 6. These will be wired to real `DailyTargets` in CHK-023.

- **Weight logging placeholder**: Weight tab in LogEntryModal has a disabled button pointing to lane 7. The `POST /api/v1/logs/:date/weight` endpoint exists (lane 4), but the full UI + lane 7 will wire it properly.

## DECISION

- **Zustand `logModalOpen` + `logModalMealType`**: Added to `ui-store.ts` so the global FAB can open the log modal from any page. FAB now calls `openLogModal()` instead of showing a toast. The `LogEntryModal` is rendered inside the Today dashboard page and reads state from Zustand.

- **MealCard expansion with `useState`**: Meal cards on dashboard expand inline (no separate route). Clicking the card header toggles entries. Delete button is inside expanded view to avoid accidental taps.

- **Journal uses local `useState` for date (not Zustand)**: Journal page maintains its own date state rather than sharing with the dashboard's `selectedDate`. This allows independent navigation in each tab. The shared store is used for the Today dashboard.

- **Calendar strip as ±3 days from anchor**: Shows 7 days centered on selected date. Scrollable horizontally for small screens. Day buttons are 44×60px (meets accessibility tap target).

- **FoodSearch inline toast via require()**: To avoid circular imports with sonner, `FoodSearch` uses a local `toast()` wrapper with try/catch require. In production this works fine; in tests it silently ignores the import error.

- **`DailyLog` fetched via TanStack Query with key `["daily-log", date]`**: Both `TodayPage` and `LogEntryModal` invalidate this query on successful mutations, ensuring real-time UI updates without full re-fetch.

## SURPRISE

- **Pre-existing `chk040`/`chk042` failures**: Recipe API tests (lane 11) were already failing before lane 5. The `$dynamic()` Drizzle method not mocked correctly. Lane 5 does not touch recipes code — these remain as pre-existing debt from lane 11.

- **Sheet Radix `Missing Description` warning**: Radix Dialog (used by Sheet) prints a console warning when `aria-describedby` is missing. Not a test failure, just a warning. Can be silenced by adding `<SheetDescription>` to modal or passing `aria-describedby={undefined}`.

- **`type="search"` implicit ARIA role**: This is a subtle browser spec detail. Search inputs are NOT textboxes per ARIA. RTL correctly follows the spec; tests must query by `"searchbox"` role.

## PATTERNS

- All interactive client components: `"use client"` directive
- Design tokens only: `var(--color-*)` CSS variables, never hardcoded hex
- TanStack Query: `useQuery` for fetches, `useMutation` for POST/PUT/DELETE, invalidate on success
- SVG calorie ring: `strokeDasharray` + `strokeDashoffset` with `transition: stroke-dashoffset 600ms ease-out`
- Macro bars: 4 colored progress bars using `--color-macro-*` tokens
- Empty state: illustration emoji + heading + description + CTA button pattern
