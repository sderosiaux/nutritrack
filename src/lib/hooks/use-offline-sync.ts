"use client";

import { useState, useEffect, useCallback } from "react";
import { getOfflineDB } from "@/lib/db/offline";
import { processOfflineQueue, getQueueStatus, type QueueStatus } from "@/lib/offline/offline-sync";

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  queueStatus: QueueStatus | null;
  sync: () => Promise<void>;
}

/**
 * useOfflineSync — monitors network status and processes the sync queue.
 *
 * - Listens to window `online`/`offline` events
 * - Automatically triggers queue processing when connection is restored
 * - Exposes isSyncing for spinner UI
 */
export function useOfflineSync(): OfflineSyncState {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const db = getOfflineDB();
      const status = await getQueueStatus(db);
      setQueueStatus(status);
    } catch {
      // IndexedDB not available (SSR or private mode)
    }
  }, []);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const db = getOfflineDB();
      await processOfflineQueue(db);
      await refreshStatus();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial status load
    refreshStatus();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sync, refreshStatus]);

  return { isOnline, isSyncing, queueStatus, sync };
}
