# Contributing to NutriTrack

Thank you for your interest in contributing! This guide covers how to set up a development environment, run tests, and submit a pull request.

---

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose (v2+)

### 1. Clone and install

```bash
git clone https://github.com/sderosiaux/nutritrack.git
cd nutritrack
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — minimum required:
#   BETTER_AUTH_SECRET=<openssl rand -base64 32>
#   BETTER_AUTH_URL=http://localhost:3000
```

### 3. Start services

```bash
docker compose up -d
```

This starts: PostgreSQL 16, Redis 7, MinIO, and the app (with hot-reload).

### 4. Initialize database

```bash
pnpm db:migrate   # run pending migrations
pnpm db:seed      # optional: seed ~10k foods + demo user
```

### 5. Start dev server

```bash
pnpm dev
```

App is now available at http://localhost:3000.

---

## Running Tests

```bash
pnpm test           # all unit tests (Vitest, ~60 test suites)
pnpm test:watch     # watch mode
pnpm test:e2e       # Playwright E2E tests
pnpm typecheck      # TypeScript strict check
pnpm lint           # ESLint
```

### Test patterns

- Unit tests live in `src/__tests__/chk*.test.ts(x)`
- Per-file environment: add `// @vitest-environment jsdom` for DOM tests, `// @vitest-environment node` for server tests
- DB mocking: `vi.mock("@/server/db", ...)` with the `makeChain` factory (see existing test files)
- Zustand stores: reset state between tests with `useMyStore.setState({...})` in `beforeEach`
- IndexedDB: import `fake-indexeddb/auto` before any Dexie imports
- Component tests: prefer `getByRole` and `getByLabelText` over `getByText`

### Forge checkboxes

Each feature is tracked by a CHK-NNN checkbox in `.forge/checkboxes.yaml`. Each checkbox maps to:
- A test file: `src/__tests__/chkNNN-*.test.ts(x)`
- A lane (implementation group): `.forge/lanes.yaml`

---

## Project Structure

```
src/
├── app/               # Next.js pages and layouts
├── components/        # React components
│   ├── ui/            # shadcn/ui (button, card, dialog, etc.)
│   ├── shell/         # App shell (sidebar, bottom-nav, FAB)
│   └── ...
├── lib/               # Client-side utilities
│   ├── stores/        # Zustand state
│   ├── db/            # Dexie.js (offline IndexedDB)
│   └── hooks/         # Custom React hooks
└── server/
    ├── api/           # Hono routes (src/server/api/routes/)
    ├── auth/          # Better Auth config
    ├── services/      # Business logic (pure functions, testable)
    └── db/            # Drizzle schema + migrations + seed data
```

### Adding an API route

1. Create `src/server/api/routes/my-feature.ts` exporting a `Hono` instance
2. Register in `src/server/api/index.ts`: `app.route("/my-feature", myFeature)`
3. Add to OpenAPI spec in `src/server/api/routes/openapi.ts`

### Adding a page

Pages live under `src/app/(app)/` (protected routes) or `src/app/` (public).

---

## Design Principles

- **Light theme only** — no dark mode
- **CSS variables for all colors** — defined in `src/app/globals.css` under `@theme`
- **No inline hex colors** — always use `var(--color-primary)` etc.
- **Animations must respect `prefers-reduced-motion`** — use classes from `globals.css`
- **WCAG AA** — min 44×44px touch targets, aria-labels on icon-only buttons, no color-only info
- **No `@hono/zod-validator`** — use `schema.safeParse(body)` + manual 422 responses
- **No `nanoid`** — use `crypto.randomUUID()` (Node built-in)

---

## Pull Request Process

1. **Branch**: `git checkout -b feat/your-feature` or `fix/your-fix`
2. **Tests**: All existing tests must pass (`pnpm test` 100%)
3. **New tests**: add tests for any new behavior
4. **No breaking changes**: we do not maintain backward compatibility per spec
5. **Commit messages**: use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
6. **PR description**: explain what changed and why; link to relevant spec section if applicable

### Before opening a PR

```bash
pnpm test       # must pass 100%
pnpm typecheck  # no TypeScript errors
pnpm lint       # no lint errors
```

---

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- For bugs: include Node version, Docker version, and steps to reproduce
- For features: explain the use case, not just the solution

---

## License

By contributing, you agree your contributions will be licensed under the MIT License.
