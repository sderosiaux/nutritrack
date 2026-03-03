---
verdict: VIOLATIONS
lane: 2
cycle: 1
violation_count: 4
correction_count: 0
---

## Violations

- CHK-005: Test coverage does not match full design-system requirement.
  Expected (from spec): Design system includes tokenized palette, Inter, 4px grid/radii, shadcn/ui base components `Button`, `Input`, `Card`, `Dialog`, `Sheet`, `Toast`, and no traffic-light food classification (`spec/06-ux-design.md:16-42`, checkbox text).
  Actual (in code): Components exist (`src/components/ui/dialog.tsx:1`, `src/components/ui/sheet.tsx:1`, `src/components/ui/sonner.tsx:1`), but compliance is only partially validated by tests.
  Test gap: `src/__tests__/chk005-design-system.test.tsx` validates tokens + `Button/Input/Card` only; it does not verify `Dialog/Sheet/Toast` behavior nor the “no traffic-light food classification” constraint (`src/__tests__/chk005-design-system.test.tsx:59-108`).

- CHK-006: App-shell breakpoints do not implement the specified mobile/tablet/desktop boundaries.
  Expected (from spec): `<640` mobile bottom nav, `640–1024` tablet side panel/drawer, `>1024` desktop sidebar (`spec/04-screens.md:217-223`, checkbox text).
  Actual (in code): Shell visibility is driven by Tailwind `md` (`768px`) only (`src/components/shell/sidebar.tsx:33`, `src/components/shell/bottom-nav.tsx:22`), which leaves the 640–767 range on mobile behavior instead of tablet behavior.
  Test gap: `src/__tests__/chk006-app-shell.test.tsx` asserts links/labels but does not assert breakpoint behavior or layout switching at 640/1024 (`src/__tests__/chk006-app-shell.test.tsx:24-92`).

- CHK-006: Global FAB `'+'` is not integrated into the app shell.
  Expected (from spec): App shell includes a global FAB `'+'` button (`spec/04-screens.md:14`, checkbox text).
  Actual (in code): `FAB` component exists (`src/components/shell/fab.tsx:11`) but is not rendered in shell layout (`src/app/(app)/layout.tsx:8-25`).
  Test gap: test mounts `FAB` in isolation and passes, but does not verify shell-level presence (`src/__tests__/chk006-app-shell.test.tsx:77-92`).

- CHK-053: Guest-to-account migration is not implemented as a verified upgrade flow.
  Expected (from spec): Continue-as-guest flow with IndexedDB-first path and guest-to-account upgrade with data migration (`spec/03-user-flows.md:25-30`, checkbox text).
  Actual (in code): A migration helper exists (`src/lib/guest/migration.ts:7`) but no upgrade flow invokes it from auth/register screens (`src/app/page.tsx:13-16`, `src/app/register/page.tsx:28-37`). Additionally, migration counts entries as migrated without checking HTTP status (`src/lib/guest/migration.ts:35-41`).
  Test gap: `chk053` tests only function existence/thenable for migration, not end-to-end migration behavior or invocation during guest upgrade (`src/__tests__/chk053-guest-mode.test.tsx:154-165`).

## Traceability Notes (non-blocking)
- CHK-005, CHK-006, CHK-007, CHK-050, CHK-053: `checkboxes.yaml` test file:line pointers are accurate.

## Code Issues (if any)
- `src/lib/guest/migration.ts:35-41`: `fetch` non-2xx responses are treated as successful migrations; this can silently drop unsynced guest data when local tables are cleared.
