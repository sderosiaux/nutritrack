---
verdict: VIOLATIONS
lane: 1
cycle: 1
violation_count: 1
correction_count: 0
---

## Violations

- CHK-004: Auth refresh endpoint does not match spec contract, and tests do not verify the required route paths.
  Expected (from spec): `spec/07-api.md:17-22` defines `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`.
  Actual (in code): Better Auth is mounted as a generic catch-all via `src/app/api/auth/[...all]/route.ts:1-4` with no path remapping; auth config in `src/server/auth/index.ts:16-48` does not define aliases. The lane test itself states refresh is exposed as `/api/auth/refresh-token` (`src/__tests__/chk004-auth.test.ts:94-99`), which diverges from spec `/api/auth/refresh`.
  Test gap: `src/__tests__/chk004-auth.test.ts` only asserts API object properties/functions and never sends requests to assert the required concrete paths from the spec.

## Traceability Notes (non-blocking)
- CHK-001: test file:line reference is accurate.
- CHK-002: test file:line reference is accurate.
- CHK-003: test file:line reference is accurate.
- CHK-004: test file:line reference is accurate.

## Code Issues (if any)
- None beyond the blocking spec-contract mismatch above.
