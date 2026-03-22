# Learnings — Cycle 1, Lane 13: polish-a11y-ops

## PATTERNS

- **CSS healthcheck test slice offset**: When slicing a YAML file for a specific section, the `indexOf("postgres:")` slice may include the app service's `depends_on: postgres:` line rather than the actual postgres service block. If the slice size (600 chars) doesn't reach the postgres service's `healthcheck:`, the test fails. Fix: search the whole file with `.toContain("pg_isready")` instead of searching a fixed-size slice.

- **Tailwind size mapping in tests**: The FAB component uses `h-14 w-14` (56px — larger than the 44px minimum). Test must include `h-14` alongside `h-11`/`h-12`/`44` as valid size indicators. Mapping: h-10=40px, h-11=44px, h-12=48px, h-14=56px.

- **OpenAPI spec as hand-crafted const**: No code generation package needed. A large TypeScript `const` with the spec object is sufficient. Keep under 500 lines by using terse schema definitions (skip verbose examples, use `$ref` for repeated structures). Exported from `routes/openapi.ts` as a Hono app with a single `GET /openapi.json` route.

- **Skip nav link pattern**: Use `position: absolute; top: -100%` (negative percentage, not negative pixel) to keep it off-screen. On `:focus`, move to `top: 1rem`. This avoids layout shift and is more reliable than `clip` tricks across browsers.

- **prefers-reduced-motion guard**: Apply `!important` on all animation/transition properties inside the `@media (prefers-reduced-motion: reduce)` block. This ensures the disable overrides inline styles and specificity conflicts from component-level transitions.

- **`aria-live` region placement**: The `aria-live="polite"` div must be in the DOM from initial render (not conditionally mounted) — screen readers register it on page load. Place it in the app shell layout, hidden via `.sr-only`, with `id="live-announcer"` for JS access.

- **`output: "standalone"` required for Dockerfile**: The multi-stage production Dockerfile copies `.next/standalone` to the runner stage. Without `output: "standalone"` in `next.config.ts`, the standalone directory is never created and the Docker image has no server to run.

- **docker-compose.prod.yml duplicate `environment:` key**: YAML allows duplicate keys but most parsers use the last value. When defining environment variables across two `environment:` blocks in the same service, consolidate into one block to avoid silent override bugs.

## DECISION

- **Hand-crafted OpenAPI vs generated**: Chose hand-crafted JSON spec for simplicity. No runtime dependency, no build-time code gen. The spec is maintained alongside the routes. Downside: can drift from implementation; mitigated by CI tests verifying the endpoint exists and returns valid JSON.

- **`docs/` directory for self-hosting guide**: Created `docs/self-hosting.md` as a separate file from README.md. README covers the quick start; docs covers the full production deployment with nginx, SSL, backup strategy.

- **CONTRIBUTING.md patterns section**: Explicitly documents the test patterns from previous lanes (fake-indexeddb import order, makeChain mock factory, Zustand state reset) so new contributors don't rediscover them.

- **Production compose exposes only 80/443 via nginx**: All other service ports (5432, 6379, 9000) are internal to the Docker network only. This follows the principle of minimal attack surface — no direct database access from outside.

## FRICTION

- **No `.forge/state.yaml` `current_lane` update**: Not required — the forge reviewer workflow handles state updates based on commit SHAs.

## FILES CREATED

- `src/__tests__/chk046-motion.test.ts` — CSS animation verification
- `src/__tests__/chk047-a11y.test.tsx` — WCAG AA audit tests
- `src/__tests__/chk048-docker.test.ts` — Docker prod config tests
- `src/__tests__/chk049-docs.test.ts` — Documentation completeness tests
- `src/__tests__/chk059-openapi.test.ts` — OpenAPI spec tests
- `src/server/api/routes/openapi.ts` — Hand-crafted OpenAPI 3.0 spec route
- `Dockerfile` — Multi-stage production build (deps → builder → runner)
- `docker-compose.prod.yml` — Production compose (nginx, non-root app, internal-only services)
- `CONTRIBUTING.md` — Development guide with test patterns
- `docs/self-hosting.md` — Detailed deployment guide (nginx, SSL, backup)

## FILES MODIFIED

- `src/app/globals.css` — Added animations, reduced-motion guard, skip-nav, sr-only, touch-target utilities
- `src/app/layout.tsx` — Added skip-to-main-content link
- `src/app/(app)/layout.tsx` — Added `id="main-content"` on `<main>`, aria-live announcer region
- `src/server/api/index.ts` — Registered OpenAPI route
- `.env.example` — Expanded with all env vars + descriptions
- `README.md` — Complete self-hosting guide, env table, architecture diagram, features list
- `next.config.ts` — Added `output: "standalone"` for Docker multi-stage build
