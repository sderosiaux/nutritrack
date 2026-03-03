import { getOfflineDB } from "@/lib/db/offline";
import { migrateGuestData } from "@/lib/guest/migration";
import { useGuestStore } from "@/lib/stores/guest-store";

/**
 * upgradeGuestAccount — migrates IndexedDB guest data to the server for the
 * newly-registered userId, then clears the guest flag.
 *
 * No-op when the user is not in guest mode.
 */
export async function upgradeGuestAccount(
  userId: string
): Promise<{ migrated: number; errors: number }> {
  const { isGuest, setIsGuest } = useGuestStore.getState();
  if (!isGuest) return { migrated: 0, errors: 0 };

  const db = getOfflineDB();
  const result = await migrateGuestData(db, userId);

  // Always clear guest flag regardless of migration errors to avoid
  // leaving user stuck in guest mode after registration
  setIsGuest(false);

  return result;
}
