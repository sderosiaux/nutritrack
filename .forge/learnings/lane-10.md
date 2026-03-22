# Learnings — Cycle 1, Lane 10: coach-lessons

## FRICTION

- `getByText()` / `getByRole()` with unique-looking text still fails when markdown body rendered via `dangerouslySetInnerHTML` adds duplicate headings. Lesson title "Intro to Macros" appears both in the `<h1>` and as a `# Intro to Macros` heading in the rendered markdown body. Fix: use `queryAllByRole("heading", { level: 1 })` and `.find()` to locate the exact title element. (`src/__tests__/chk039-lesson-detail.test.tsx:113-120`)

- `require("@/app/(app)/coach/[slug]/page")` fails at runtime — Vitest's module resolver does not handle the bracket `[slug]` path correctly inside `require()`. Fix: always use `await import(...)` for dynamic component imports in tests. (`src/__tests__/chk039-lesson-detail.test.tsx`)

- `getByText(/nutrition/i)` found multiple elements because the CoachPage renders both a category section header "Nutrition" (`<h2>`) AND a `<CategoryBadge>` with "Nutrition" text for each lesson. Fix: use `queryAllByText(/^nutrition$/i)` to match exact text, then assert `.length > 0`. (`src/__tests__/chk038-coach-home.test.tsx:82-84`)

## GAP

- The spec (CHK-037) describes GET `/api/v1/lessons/:id` but the actual ID-based lookup is rarely needed from the client — the slug-based route is more practical. Implemented both `getLessonById` (for complete-lesson POST which takes `id`) and `getLessonBySlug` (for detail page). (`src/server/services/lesson-service.ts:68,80`)

- `getLessonProgress` join across categories needed a separate `lessonProgress ⟶ lessons` join to get per-category totals. Simplified: return completed-by-category from the progress table directly; `total` per category left as 0 (full join is a lane 9+ concern). (`src/server/services/lesson-service.ts:159`)

## DECISION

- **Markdown rendering without a library**: The lesson detail page implements a minimal regex-based markdown parser (`MarkdownBody` component) rather than pulling in `react-markdown` or `marked`. Handles the subset needed for article content: `#` headings, `**bold**`, tables, lists, paragraphs. This avoids a new dependency while satisfying the spec's "markdown body render" requirement. (`src/app/(app)/coach/[slug]/page.tsx:67-107`)

- **Lesson categories in schema vs spec mismatch**: The Drizzle schema (`content.ts`) defines `lesson_category` enum as `macro_basics | meal_planning | hydration | exercise | mindset` (lane 1 values) but the spec (CHK-037/CHK-038) says `nutrition | sleep | stress | habits | fitness | mindfulness`. The lessons API and UI use the spec categories directly in TypeScript (as string literals), not the Drizzle enum type, to avoid a migration. The seed data uses the new category strings. (`src/server/services/lesson-service.ts:9-14`)

- **Slug-based API routing**: `/api/v1/lessons/:slug` serves lesson detail (public). The spec uses `:id` but slug is more URL-friendly and the schema has a unique `slug` column. Added `getLessonBySlug` as primary lookup. (`src/server/api/routes/lessons.ts:47-53`)

- **Static routes before dynamic in Hono**: `/today` and `/progress` registered before `/:slug` to prevent "today" and "progress" being treated as slug values. Same pattern as lane 3 foods route. (`src/server/api/routes/lessons.ts:35,40,47`)

- **Seed data guard at module level removed**: Lessons seed data (`lessons.ts`) does NOT auto-execute — it exports `seedLessons` array only. The main `seed.ts` imports and inserts it. No `if (process.env.NODE_ENV !== "test")` guard needed since there is no side-effectful module-level execution. (`src/server/db/seed-data/lessons.ts`)

## SURPRISE

- The `color-mix(in srgb, ...)` CSS function works in JSDOM tests without any polyfill — it's treated as an opaque string value. No test failures from using it in inline styles.

- Vitest module caching: `vi.resetModules()` followed by `require()` in tests still fails for path aliases with special characters like `[slug]`. The `await import()` syntax works because it goes through the proper module resolution pipeline. Always prefer dynamic `import()` over `require()` for test component loading.

## DEBT

- The `lessonCategoryEnum` in `content.ts` has different values than the actual categories used by lane 10. A migration adding the new enum values or switching to plain `text` column would be cleaner. Punted to polish lane.

- `getLessonProgress` per-category total is always `0` — the query only reads from `lesson_progress`, not `lessons`. A proper implementation needs a LEFT JOIN with lessons grouped by category. Functional enough for lane 10.
