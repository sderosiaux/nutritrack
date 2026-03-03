---
verdict: VIOLATIONS
lane: 1
cycle: 1
violation_count: 1
correction_count: 0
---

## Violations

- CHK-004: Spec auth endpoint contract is not implemented, and tests do not verify it.
  Expected (from spec): `spec/07-api.md` Auth section requires concrete endpoints `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`.
  Actual (in code): Auth is mounted via catch-all handler at `src/app/api/auth/[...all]/route.ts`, which forwards to Better Auth native routes; library endpoints are `"/sign-up/email"`, `"/sign-in/email"`, `"/sign-out"`, `"/request-password-reset"`/`"/forget-password"`, `"/reset-password"`, `"/refresh-token"` (see `node_modules/.pnpm/better-auth@1.5.1*/node_modules/better-auth/dist/api/routes/sign-up.mjs`, `sign-in.mjs`, `sign-out.mjs`, `password.mjs`, `account.mjs`). Only `/api/auth/refresh` is explicitly adapted in `src/app/api/auth/refresh/route.ts`.
  Test gap: `src/__tests__/chk004-auth.test.ts` only checks that catch-all/POST handlers exist for register/login/logout/forgot/reset labels and does not send requests to assert those spec paths are actually accepted and mapped.

## Traceability Notes (non-blocking)
- CHK-001, CHK-002, CHK-003, CHK-004: test file references in `.forge/checkboxes.yaml` are accurate.
