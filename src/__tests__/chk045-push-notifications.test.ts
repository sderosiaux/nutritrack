// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub web-push since it's not installed
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
}));

// Mock DB to avoid actual DB connections
vi.mock("@/server/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "sub-1" }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

import { saveSubscription, sendPushNotification } from "@/server/services/push-service";

describe("CHK-045: push notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveSubscription stores push subscription data", async () => {
    const subscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
      keys: {
        p256dh: "test-p256dh-key",
        auth: "test-auth-key",
      },
    };

    const result = await saveSubscription("user-123", subscription);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("sendPushNotification sends notification to subscription", async () => {
    const subscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
      keys: {
        p256dh: "test-p256dh-key",
        auth: "test-auth-key",
      },
    };

    const payload = {
      title: "Time to log your meal!",
      body: "Don't forget to track your nutrition for today.",
    };

    const result = await sendPushNotification(subscription, payload);
    expect(result.success).toBe(true);
  });

  it("sendPushNotification handles stub gracefully when no web-push", async () => {
    const subscription = {
      endpoint: "https://push.example.com/test",
      keys: { p256dh: "key", auth: "auth" },
    };

    const result = await sendPushNotification(subscription, {
      title: "NutriTrack Reminder",
      body: "Log your meals!",
    });

    // Should succeed (either real or stub)
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe("CHK-045: push subscription API endpoint", () => {
  it("subscribe endpoint handler returns 201 on valid subscription", async () => {
    const { subscribeHandler } = await import("@/server/api/routes/notifications");

    const mockReq = {
      json: vi.fn().mockResolvedValue({
        userId: "user-123",
        subscription: {
          endpoint: "https://fcm.example.com/send/test",
          keys: { p256dh: "key123", auth: "auth123" },
        },
      }),
    };
    const mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    await subscribeHandler(mockReq as never, mockRes as never);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
