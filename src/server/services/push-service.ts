/**
 * push-service — Web Push notification sender with DB persistence.
 *
 * Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY env vars for sending.
 * Without them, send operations are silently skipped.
 * Subscription CRUD always persists to the push_subscriptions table.
 */

import { db, pushSubscriptions } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

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

// ── VAPID / web-push setup ─────────────────────────────────────────────────

type WebPushModule = {
  setVapidDetails: (subject: string, pub: string, priv: string) => void;
  sendNotification: (sub: PushSubscriptionData, payload: string) => Promise<{ statusCode: number }>;
};

let webPush: WebPushModule | null = null;

const vapidPublic = process.env.VAPID_PUBLIC_KEY ?? "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@nutritrack.local";

const webPushReady: Promise<void> = (async () => {
  if (!vapidPublic || !vapidPrivate) return;
  try {
    const mod = await import("web-push");
    webPush = mod.default ?? mod;
    webPush!.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  } catch {
    // web-push not available — send operations will be skipped
  }
})();

// ── Subscription CRUD ──────────────────────────────────────────────────────

/**
 * Saves (upserts) a push subscription for a user.
 * On conflict (same user + endpoint), updates the keys.
 */
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<SavedSubscription> {
  const id = randomUUID();

  const result = await db
    .insert(pushSubscriptions)
    .values({
      id,
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
      set: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })
    .returning();

  return {
    id: result[0].id,
    userId: result[0].userId,
    endpoint: result[0].endpoint,
    createdAt: result[0].createdAt,
  };
}

/**
 * Removes a push subscription by userId + endpoint.
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}

/**
 * Returns all push subscriptions for a user.
 */
export async function getSubscriptions(
  userId: string
): Promise<SavedSubscription[]> {
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    endpoint: r.endpoint,
    createdAt: r.createdAt,
  }));
}

// ── Push sending ───────────────────────────────────────────────────────────

/**
 * Sends a Web Push notification to a subscription endpoint.
 * Returns { success: false } silently when VAPID keys are not configured.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<PushResult> {
  await webPushReady;
  if (!webPush) {
    return { success: false };
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
