/**
 * push-service — Web Push notification sender.
 *
 * web-push package is NOT installed. This module provides stub implementations
 * that log to console. Real implementation: install web-push and configure
 * VAPID keys via VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars.
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export interface PushResult {
  success: boolean;
  error?: string;
}

export interface SavedSubscription {
  id: string;
  userId: string;
  endpoint: string;
  createdAt: Date;
}

// ── Stub implementation (web-push not installed) ──────────────────────────────

let webPush: {
  setVapidDetails: (subject: string, pub: string, priv: string) => void;
  sendNotification: (sub: PushSubscriptionData, payload: string) => Promise<{ statusCode: number }>;
} | null = null;

// Attempt to load web-push if available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webPush = require("web-push");
  const vapidPublic = process.env.VAPID_PUBLIC_KEY ?? "";
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@nutritrack.local";
  if (vapidPublic && vapidPrivate) {
    webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  }
} catch {
  // web-push not installed — use stub mode
}

/**
 * Saves a push subscription for a user.
 * Returns a stub saved subscription (no DB in stub mode).
 */
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<SavedSubscription> {
  // Stub: in production, save to DB
  console.log(`[push-service] Saving subscription for user ${userId}: ${subscription.endpoint}`);

  return {
    id: `sub-${Date.now()}`,
    userId,
    endpoint: subscription.endpoint,
    createdAt: new Date(),
  };
}

/**
 * Sends a Web Push notification to a subscription endpoint.
 * Falls back to console logging if web-push is not available.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<PushResult> {
  if (!webPush) {
    // Stub mode: log to console
    console.log(
      `[push-service stub] Would send notification to ${subscription.endpoint}:`,
      JSON.stringify(payload)
    );
    return { success: true };
  }

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[push-service] Failed to send notification: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Sends a daily meal reminder notification.
 */
export async function sendDailyReminderNotification(
  subscription: PushSubscriptionData,
  data: { mealSlot: string; time: string }
): Promise<PushResult> {
  return sendPushNotification(subscription, {
    title: "Time to log your meal!",
    body: `Don't forget to log your ${data.mealSlot} — it's ${data.time}`,
    icon: "/icons/icon-192.svg",
    url: "/today",
  });
}

/**
 * Sends a weekly check-in reminder notification.
 */
export async function sendWeeklyCheckInNotification(
  subscription: PushSubscriptionData
): Promise<PushResult> {
  return sendPushNotification(subscription, {
    title: "Weekly check-in time!",
    body: "Log your weight and review last week's progress.",
    icon: "/icons/icon-192.svg",
    url: "/progress",
  });
}
