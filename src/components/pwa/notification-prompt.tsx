"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

/**
 * NotificationPrompt — button shown in profile page to request push permission.
 * Handles permission request, subscription creation, and server registration.
 */
export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator;

  const handleEnable = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Register service worker and get push subscription
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
        });

        // Save subscription to server
        await fetch("/api/v1/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <BellOff className="h-5 w-5 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <Bell className="h-5 w-5 text-[var(--color-primary)]" />
        <p className="text-sm text-[var(--color-text)]">
          Push notifications are enabled.
        </p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <BellOff className="h-5 w-5 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Notifications are blocked. Enable them in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Meal reminders
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Get notified at your scheduled meal times to log your food.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-[var(--color-destructive)]">{error}</p>
      )}

      <button
        onClick={handleEnable}
        disabled={isLoading}
        className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
      >
        {isLoading ? "Enabling…" : "Enable notifications"}
      </button>
    </div>
  );
}
