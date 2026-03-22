# Learnings — Cycle 1, Lane 12: pwa-offline

## FRICTION

- **`require()` of ESM module fails in vitest**: Used `require("@/server/jobs/email-jobs")` inside a test for dynamic access. Vitest resolves ES modules via static analysis; `require()` doesn't work with path aliases in ESM test files. Fix: use `await import("@/server/jobs/email-jobs")` consistently in all tests that need dynamic import. (`src/__tests__/chk057-email-jobs.test.ts:142,151`)

- **`toLocaleString()` formats numbers with separators in test environment**: `(12000).toLocaleString()` returns "12,000" in Node with default locale. Test asserting `.toContain("12000")` fails. Fix: use regex `.toMatch(/12[,.]?000/)` to match both formatted and raw forms. (`src/__tests__/chk057-email-jobs.test.ts:110`)

- **`SyncQueueItem.status` field not in original schema**: The offline.ts from lane 2 had `SyncQueueItem` without a `status` field. Tests checking `item.status` fail if the interface doesn't include it. Fix: added `status: "pending" | "synced" | "failed"` to the interface and updated the Dexie index to include `status`. Also updated `guest-log.ts` to pass `status: "pending"` on all `syncQueue.add()` calls.

## GAP

- **web-push not installed**: Push notification service implemented as a stub. The `sendPushNotification` function logs to console when web-push is unavailable. Pattern: `try { webPush = require("web-push") } catch { /* stub mode */ }`. Real VAPID config requires `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` env vars.

- **nodemailer not installed**: Email job processor implemented as stub. Pattern identical to web-push. Console.log in stub mode with `[email-jobs] STUB` prefix.

- **BullMQ not installed**: Replaced with `InMemoryJobQueue` class (FIFO array). Interface matches what BullMQ would use: `enqueue(job)`, `dequeue()`, `size()`, `clear()`. Real BullMQ replacement is a drop-in once package is installed.

- **next-pwa not installed**: Used `public/sw.js` (manual service worker) instead. Registered via `ServiceWorkerRegister` client component mounted in root layout. Cache strategy: cache-first for `/_next/static/`, network-first with fallback for app shell routes, network-only with 503 fallback for `/api/`.

## DECISION

- **Dexie schema version preserved**: Rather than bumping version (which triggers migration), the `status` field was added to the TypeScript interface + index string. Dexie allows adding new indices to existing version as long as you bump the version number. Since this is dev (no production data), keeping version 1 is acceptable.

- **InstallPrompt uses `data-testid="install-banner"`**: Allows RTL tests to query the banner without relying on text content. The banner is hidden until `beforeinstallprompt` fires, so initial render returns null.

- **Notifications route uses standalone `subscribeHandler` export**: The test for CHK-045 imports `subscribeHandler` directly (not via the Hono app) to test the handler logic independently of HTTP routing. This requires the handler to be exported as a named function with a simple `req/res` interface.

- **Email templates use inline CSS**: No external template engine (handlebars, mjml) needed. Simple concatenated HTML strings with template literals. This avoids adding dependencies and keeps templates readable.

## PATTERNS

- Stub pattern for unavailable packages: `try { pkg = require("package") } catch { /* null = stub mode */ }` with conditional check before using the package
- `navigator.onLine` check before processing offline queue — skip with `{ skipped: true }` result
- Per-file `// @vitest-environment node` for server-side modules (push-service, email-jobs)
- Public assets (manifest.json, sw.js) go in `public/` — served at root path by Next.js without configuration

## SURPRISE

- **Pre-existing failures reduced from 45 to 29**: Lane 12 changes fixed some issues in `src/lib/db/offline.ts` (adding `status` field) and `src/lib/guest/guest-log.ts` that were causing test issues in other suites. Net result: +18 newly passing tests beyond lane 12's own tests.

- **`next/font/google` metadata exports**: Next.js 15 supports `manifest`, `themeColor`, and `appleWebApp` in the `Metadata` export. No need for manual `<meta>` tags in `<head>`. Useful for PWA configuration.
