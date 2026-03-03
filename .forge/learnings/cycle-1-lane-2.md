# Learnings — Cycle 1, Lane 2: design-shell

## FRICTION

- `vitest.config.ts` `environmentMatchGlobs` is **deprecated in vitest v3** — causes deprecation warning that fails all tests when combined with `globals: false`. Fix: set `globals: true` globally and use per-file `// @vitest-environment jsdom` directives instead. (`vitest.config.ts:6`)

- `@testing-library/jest-dom` calls `expect.extend()` at import time. With `globals: false`, `expect` is not defined in node environment during setupFiles execution, crashing all 9 test suites. Fixed by `globals: true` in vitest config.

- Zustand `persist` middleware: `createJSONStorage(() => localStorage)` crashes in Node/SSR where `window` is undefined. Fixed with guard: `typeof window !== 'undefined' ? localStorage : ({} as Storage)`. (`src/lib/stores/guest-store.ts:13-15`)

- Tailwind v4 CSS variable syntax (`var(--color-primary)`) in class strings — works fine in production but is verbose. This is intentional; Tailwind v4 exposes `@theme` tokens without needing `tailwind.config.js`.

## GAP

- Spec says shadcn/ui — didn't specify whether to use CLI or manual. Chose manual (no interactive CLI in CI). Created components matching shadcn patterns but adapted to our CSS custom properties.

- Spec doesn't specify what Sonner version or if next-themes is required. Chose Sonner without next-themes (we're light-only, no theme switching in v1).

- `environmentMatchGlobs` removed warning prompted switch to per-file `// @vitest-environment jsdom` — more explicit and self-documenting.

## DECISION

- **Sidebar collapsed by default (`sidebarOpen: false`)**: spec says "collapsible sidebar with clear state indicator". Collapsed default is better UX for first load on tablet. Tests must open it explicitly to check labels.

- **Route structure**: `app/page.tsx` = landing (`/`), `app/(app)/` group = authenticated routes, `app/login/` and `app/register/` = auth screens. Route group `(app)` wraps dashboard/journal/coach/progress/profile with the app shell layout.

- **Dexie singleton via `getOfflineDB()`**: deferred instantiation prevents SSR crash since IndexedDB is browser-only. Tests use `new NutriDB()` directly with `fake-indexeddb/auto`.

- **Optimistic mutation helper takes `queryClient` as parameter** (not closure): makes it testable in isolation without needing to render a component. Tests verify cache manipulation directly. (`src/lib/query-client.ts:22`)

- **BackupBanner renders null when not guest**: no portal, no modal — a simple conditional return. Spec says "persistent non-intrusive banner, no forced signup prompts".

## SURPRISE

- `screen.getByPlaceholderText(/email/i)` does NOT match placeholder `"you@example.com"` — the string "email" does NOT appear in "you@example.com". Must use `getByLabelText(/email/i)` to match the associated `<label>Email</label>` element instead.

- RTL `getByText(/sign in|already have an account/i)` matches BOTH the `<p>` containing the text AND the `<a>` inside it when the regex matches part of the paragraph text. Use `getByRole("link", { name: ... })` to target only the anchor.

- `fake-indexeddb/auto` must be imported BEFORE importing Dexie modules that use IndexedDB. Import order matters — it installs a global `indexedDB` shim before Dexie initializes.

- Vitest v3 changed `environmentMatchGlobs` to `test.projects` as the canonical API. The deprecated API still works but triggers warnings that can mislead.

## DEBT

- `src/app/layout.tsx` uses `Inter` from `next/font/google` — this downloads font at build time. In offline/self-hosted scenarios, the font falls back to system sans-serif. Acceptable; spec requires Inter, this is the standard Next.js pattern.

- Guest migration (`src/lib/guest/migration.ts`) uses raw `fetch()` without auth headers. When called post-registration, the session cookie should be set. This needs to be verified in lane 12 (pwa-offline) where full migration flow is implemented.

- Stub page components (`/today`, `/journal`, etc.) will be replaced in lanes 5-9. They exist now only to verify routing works end-to-end.
