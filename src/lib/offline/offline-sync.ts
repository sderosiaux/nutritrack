/**
 * offline-sync — processes the IndexedDB sync queue when network is available.
 *
 * Queue items map table names to API endpoints:
 *   mealEntries  → POST /api/v1/logs/:date/meals
 *   waterEntries → POST /api/v1/logs/:date/water
 *   weightEntries → POST /api/v1/logs/:date/weight
 */

import { getOfflineDB, type NutriDB, type SyncQueueItem } from "@/lib/db/offline";

export interface QueueStatus {
  pending: number;
  synced: number;
  failed: number;
  total: number;
}

export interface ProcessResult {
  processed: number;
  failed: number;
  skipped: boolean;
}

/** Returns current counts from the sync queue. */
export async function getQueueStatus(db: NutriDB = getOfflineDB()): Promise<QueueStatus> {
  const all = await db.syncQueue.toArray();
  const pending = all.filter((i) => i.status === "pending").length;
  const synced = all.filter((i) => i.status === "synced").length;
  const failed = all.filter((i) => i.status === "failed").length;
  return { pending, synced, failed, total: all.length };
}

/** Maps table names to API route segments. */
function getEndpoint(item: SyncQueueItem): string | null {
  const payload = JSON.parse(item.payload) as Record<string, unknown>;
  const date = (payload.date as string) ?? new Date().toISOString().slice(0, 10);

  switch (item.table) {
    case "mealEntries":
      return `/api/v1/logs/${date}/meals`;
    case "waterEntries":
      return `/api/v1/logs/${date}/water`;
    case "weightEntries":
      return `/api/v1/logs/${date}/weight`;
    default:
      return null;
  }
}

/**
 * Processes all pending items in the sync queue.
 * Skips if navigator.onLine is false.
 */
export async function processOfflineQueue(
  db: NutriDB = getOfflineDB()
): Promise<ProcessResult> {
  // Check online status
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { processed: 0, failed: 0, skipped: true };
  }

  const pending = await db.syncQueue
    .where("status")
    .equals("pending")
    .toArray();

  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    const endpoint = getEndpoint(item);
    if (!endpoint) {
      // Unknown table — mark as failed
      await db.syncQueue.update(item.id, { status: "failed", attempts: item.attempts + 1 });
      failed++;
      continue;
    }

    try {
      const payload = JSON.parse(item.payload);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await db.syncQueue.update(item.id, { status: "synced" });
        processed++;
      } else {
        await db.syncQueue.update(item.id, {
          status: item.attempts >= 2 ? "failed" : "pending",
          attempts: item.attempts + 1,
        });
        failed++;
      }
    } catch {
      await db.syncQueue.update(item.id, {
        status: item.attempts >= 2 ? "failed" : "pending",
        attempts: item.attempts + 1,
      });
      failed++;
    }
  }

  return { processed, failed, skipped: false };
}
