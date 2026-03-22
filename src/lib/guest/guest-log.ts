/**
 * guest-log — IndexedDB-first write functions for guest mode.
 *
 * When a user is in guest mode (isGuest=true), all meal/water/weight entries
 * are persisted locally via Dexie.js. Each write also adds to the syncQueue
 * so the data can be migrated to the server upon account creation.
 */
import { getOfflineDB, type NutriDB } from "@/lib/db/offline";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GuestMealInput = {
  date: string;        // YYYY-MM-DD
  foodId: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
};

export type GuestWaterInput = {
  date: string;
  ml: number;
};

export type GuestWeightInput = {
  date: string;
  kg: number;
};

// ── Write functions ───────────────────────────────────────────────────────────

/** Writes a meal entry to IndexedDB and queues it for sync. */
export async function addGuestMealEntry(
  entry: GuestMealInput,
  db: NutriDB = getOfflineDB()
): Promise<number> {
  const createdAt = Date.now();
  const id = await db.mealEntries.add({ ...entry, createdAt });
  await db.syncQueue.add({
    action: "add",
    table: "mealEntries",
    payload: JSON.stringify({ ...entry, id, createdAt }),
    createdAt,
    attempts: 0,
    status: "pending" as const,
  });
  return id;
}

/** Writes a water entry to IndexedDB and queues it for sync. */
export async function addGuestWaterEntry(
  entry: GuestWaterInput,
  db: NutriDB = getOfflineDB()
): Promise<number> {
  const createdAt = Date.now();
  const id = await db.waterEntries.add({ ...entry, createdAt });
  await db.syncQueue.add({
    action: "add",
    table: "waterEntries",
    payload: JSON.stringify({ ...entry, id, createdAt }),
    createdAt,
    attempts: 0,
    status: "pending" as const,
  });
  return id;
}

/** Writes a weight entry to IndexedDB and queues it for sync. */
export async function addGuestWeightEntry(
  entry: GuestWeightInput,
  db: NutriDB = getOfflineDB()
): Promise<number> {
  const createdAt = Date.now();
  const id = await db.weightEntries.add({ ...entry, createdAt });
  await db.syncQueue.add({
    action: "add",
    table: "weightEntries",
    payload: JSON.stringify({ ...entry, id, createdAt }),
    createdAt,
    attempts: 0,
    status: "pending" as const,
  });
  return id;
}
