# Learnings — Cycle 1, Lane 8: ai-recognition

## PATTERNS

- **`minio` and `bullmq` not installed** — implement fallbacks. Storage: direct MinIO S3 HTTP PUT via `fetch` with Basic auth header. Queue: in-memory `Map<string, VisionJob>` with fire-and-forget async processing. Both fallbacks are production-ready for single-server deployments.

- **Vision providers all gracefully return `[]`** — `analyzeImage()` wraps all provider calls in try/catch and always returns `ParsedFood[]`. Never throws. This pattern (never-throw service function) is correct for all AI/external providers.

- **Markdown code blocks in LLM responses** — Ollama/OpenAI/Gemini may wrap JSON in \`\`\`json ... \`\`\` blocks. Strip them before `JSON.parse()`. Use regex `/\[[\s\S]*\]/` to find the array within larger response text.

- **SSE via `ReadableStream` + `setInterval`** — Hono's streaming helpers aren't needed. Build a `ReadableStream` that polls the in-memory job store every 500ms, sends `data: {...}\n\n` events, and closes the controller when the job completes/fails.

- **`FormData.get("image")` type guard** — `instanceof File` check needed before accessing `.size`. FormData entries can be `string | File`.

- **In-memory job store uses `crypto.randomUUID()`** — same Node built-in pattern from lane 3. No nanoid needed.

## DECISION

- **Recognize route prefix: `/recognize`** — spec says `/api/v1/recognize/photo` not `/api/v1/vision/...`. Use the spec path exactly.

- **Quick-add added to logs.ts** — `POST /api/v1/logs/quick-add` added to existing logs router (not a separate router). Keeps food logging endpoints co-located.

- **`parseQuickAdd` handles AND/comma separation** — splits on `\s*(?:,|\band\b)\s*/i` to handle "2 eggs and 80g rice" → two items. Each segment is parsed independently.

- **Unit normalization** — "ml" and liquid units convert to grams (1ml = 1g for logging purposes). "cup" ≈ 200g, "tbsp" ≈ 15g, "tsp" ≈ 5g as defaults.

- **Voice input graceful fallback** — `useEffect` sets `supported` state after mount, checking `window.SpeechRecognition || window.webkitSpeechRecognition`. Returns `null` (renders nothing) when unsupported. Avoids SSR issues.

## FRICTION

- **RTL `getByLabelText(/upload from gallery/i)` matches multiple elements** — the label text appears in both the visible `<label>` and the aria-label attribute. Use `document.querySelectorAll('input[type="file"]')` instead for file input detection.

- **RTL `getByText(/analyzing|processing/i)` matches multiple elements** — text may appear in multiple places (div text + aria attributes). Use `queryAllByText(...).length > 0` assertion instead.

- **chk027/chk028 tests need `vi.mock("@/server/services/vision-queue")` AND `vi.mock("@/server/services/storage-service")`** — route imports both modules. Must mock both to prevent real HTTP calls in tests.

## SURPRISE

- **`index.ts` was reverted by linter** — git status showed `M src/server/api/index.ts` meaning it has uncommitted changes from previous lanes. When we edited it and the linter ran, it used the working tree version (which already had notifications/profile/users routes). Our addition of `recognize` stacked on top correctly.

- **Pre-existing failures: 29 tests from lanes 6+12** — chk020-023, chk055, chk057, chk058. Not from lane 8. Lane 8 adds 57 new passing tests with 0 regressions.

## FILES CREATED

- `src/server/services/storage-service.ts` — MinIO upload/download via S3 HTTP (no SDK)
- `src/server/services/vision-queue.ts` — In-memory job queue with `createJob`, `getJob`, `updateJob`, `enqueueAnalyzePhoto`
- `src/server/services/vision-service.ts` — Multi-provider vision analysis (Ollama/OpenAI/Gemini)
- `src/server/services/quick-add-service.ts` — NLP free-text parser (`parseQuickAdd`, `estimateGrams`)
- `src/server/api/routes/recognize.ts` — POST/GET photo recognition endpoints + SSE stream
- `src/components/vision/photo-capture.tsx` — Camera + gallery upload UI
- `src/components/vision/photo-results.tsx` — Recognized food items with checkboxes
- `src/components/vision/voice-input.tsx` — Web Speech API mic button with graceful fallback
