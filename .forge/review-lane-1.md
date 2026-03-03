---
verdict: VIOLATIONS
lane: 1
cycle: 1
violation_count: 1
correction_count: 0
---

## Violations

- CHK-004: Refresh behavior is required by spec but not actually verified by tests.
  Expected (from spec): `spec/07-api.md` Auth section includes `POST /api/auth/refresh`, and CHK-004 requires "register, login, logout, refresh, forgot/reset password, JWT session middleware".
  Actual (in code): Better Auth is wired via [`src/app/api/auth/[...all]/route.ts`] and configured in [`src/server/auth/index.ts`], but there is no explicit assertion of refresh capability in tests.
  Test gap: [`src/__tests__/chk004-auth.test.ts`] asserts register/login/logout/forgot/reset/getSession, but has no refresh endpoint assertion (no `refresh`/`refreshToken` behavior check).

## Traceability Notes (non-blocking)
- CHK-001: test reference is accurate (`src/__tests__/chk001-scaffold.test.ts:16`).
- CHK-002: test reference is accurate (`src/__tests__/chk002-compose.test.ts:13`).
- CHK-003: test reference is accurate (`src/__tests__/chk003-schema.test.ts:15`).
- CHK-004: test reference is accurate (`src/__tests__/chk004-auth.test.ts:28`).

## Code Issues (if any)
- None found within lane-1 scoped checkboxes beyond the blocking test/spec gap above.
