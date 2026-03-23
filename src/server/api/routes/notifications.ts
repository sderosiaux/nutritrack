/**
 * Notifications route — push subscription management.
 *
 * POST /api/v1/notifications/subscribe — save push subscription
 * DELETE /api/v1/notifications/unsubscribe — remove subscription
 */

import { Hono } from "hono";
import type { getSessionFromRequest } from "@/server/auth";

type ContextVariables = {
  session: Awaited<ReturnType<typeof getSessionFromRequest>>;
};

import {
  saveSubscription,
  removeSubscription,
  sendDailyReminderNotification,
  type PushSubscriptionData,
} from "@/server/services/push-service";

export const notificationsRouter = new Hono<{ Variables: ContextVariables }>();

/** POST /subscribe */
export async function subscribeHandler(
  req: { json: () => Promise<unknown> },
  res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }
): Promise<void> {
  const body = await req.json() as { userId?: string; subscription?: PushSubscriptionData };
  const { userId, subscription } = body;

  if (!userId || !subscription?.endpoint) {
    res.status(422).json({ error: "Missing userId or subscription" });
    return;
  }

  const saved = await saveSubscription(userId, subscription);
  res.json({ success: true, id: saved.id });
}

notificationsRouter.post("/subscribe", async (c) => {
  const body = await c.req.json<{ subscription?: PushSubscriptionData }>().catch(() => null);

  if (!body?.subscription?.endpoint) {
    return c.json({ error: "Missing subscription data" }, 422);
  }

  const session = c.get("session");
  const userId = session?.user?.id;
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const saved = await saveSubscription(userId, body.subscription);
  return c.json({ success: true, id: saved.id }, 201);
});

notificationsRouter.delete("/unsubscribe", async (c) => {
  const body = await c.req.json<{ endpoint?: string }>().catch(() => null);

  if (!body?.endpoint) {
    return c.json({ error: "Missing endpoint" }, 422);
  }

  const session = c.get("session");
  const userId = session?.user?.id;
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  await removeSubscription(userId, body.endpoint);
  return c.json({ success: true });
});

/** Test endpoint: send a test notification */
notificationsRouter.post("/test", async (c) => {
  const body = await c.req.json<{ subscription?: PushSubscriptionData }>().catch(() => null);

  if (!body?.subscription) {
    return c.json({ error: "Missing subscription" }, 422);
  }

  const result = await sendDailyReminderNotification(body.subscription, {
    mealSlot: "lunch",
    time: "12:00",
  });

  return c.json(result);
});
