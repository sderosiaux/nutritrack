import type { NutriDB } from "@/lib/db/offline";

/**
 * migrateGuestData — copies all local IndexedDB data to the server for userId.
 * Called after guest-to-account upgrade. Clears IndexedDB after successful sync.
 */
export async function migrateGuestData(
  db: NutriDB,
  userId: string
): Promise<{ migrated: number; errors: number }> {
  let migrated = 0;
  let errors = 0;

  const [meals, waters, weights] = await Promise.all([
    db.mealEntries.toArray(),
    db.waterEntries.toArray(),
    db.weightEntries.toArray(),
  ]);

  const allItems = [
    ...meals.map((m) => ({ type: "meal" as const, data: m })),
    ...waters.map((w) => ({ type: "water" as const, data: w })),
    ...weights.map((w) => ({ type: "weight" as const, data: w })),
  ];

  for (const item of allItems) {
    try {
      const endpoint =
        item.type === "meal"
          ? `/api/v1/logs/${item.data.date}/meals`
          : item.type === "water"
          ? `/api/v1/logs/${item.data.date}/water`
          : `/api/v1/logs/${item.data.date}/weight`;

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item.data, userId }),
      });
      migrated++;
    } catch {
      errors++;
    }
  }

  // Clear local store after migration
  if (errors === 0) {
    await Promise.all([
      db.mealEntries.clear(),
      db.waterEntries.clear(),
      db.weightEntries.clear(),
    ]);
  }

  return { migrated, errors };
}
