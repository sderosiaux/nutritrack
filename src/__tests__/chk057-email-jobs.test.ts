// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Nodemailer stub — not installed, use console logger
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: "stub-id" }),
    }),
  },
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ messageId: "stub-id" }),
  }),
}));

import {
  createDailyReminderJob,
  createWeeklySummaryJob,
  processDailyReminder,
  processWeeklySummary,
} from "@/server/jobs/email-jobs";

import {
  buildDailyReminderEmail,
  buildWeeklySummaryEmail,
} from "@/server/jobs/email-templates";

describe("CHK-057: email job definitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDailyReminderJob returns job definition object", () => {
    const job = createDailyReminderJob({ userId: "user-1", email: "user@example.com" });
    expect(job).toBeDefined();
    expect(job.type).toBe("daily-reminder");
    expect(job.data.userId).toBe("user-1");
    expect(job.data.email).toBe("user@example.com");
  });

  it("createWeeklySummaryJob returns job definition object", () => {
    const job = createWeeklySummaryJob({ userId: "user-1", email: "user@example.com" });
    expect(job).toBeDefined();
    expect(job.type).toBe("weekly-summary");
    expect(job.data.userId).toBe("user-1");
  });

  it("processDailyReminder logs or sends email (stub mode)", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await processDailyReminder({
      userId: "user-1",
      email: "user@example.com",
      stats: {
        date: "2026-03-22",
        caloriesConsumed: 1500,
        caloriesTarget: 2000,
        waterMl: 1200,
      },
    });

    expect(result.success).toBe(true);
    consoleSpy.mockRestore();
  });

  it("processWeeklySummary logs or sends email (stub mode)", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await processWeeklySummary({
      userId: "user-1",
      email: "user@example.com",
      weekStats: {
        weekOf: "2026-03-16",
        totalCalories: 12000,
        avgCaloriesPerDay: 1714,
        streakDays: 5,
        topFoods: ["Chicken Breast", "Brown Rice", "Broccoli"],
      },
    });

    expect(result.success).toBe(true);
    consoleSpy.mockRestore();
  });
});

describe("CHK-057: email templates", () => {
  it("buildDailyReminderEmail returns HTML string with user data", () => {
    const html = buildDailyReminderEmail({
      date: "2026-03-22",
      caloriesConsumed: 1500,
      caloriesTarget: 2000,
      waterMl: 1200,
    });

    expect(typeof html).toBe("string");
    expect(html).toContain("1500");
    expect(html).toContain("2000");
  });

  it("buildWeeklySummaryEmail returns HTML string with week stats", () => {
    const html = buildWeeklySummaryEmail({
      weekOf: "2026-03-16",
      totalCalories: 12000,
      avgCaloriesPerDay: 1714,
      streakDays: 5,
      topFoods: ["Chicken", "Rice"],
    });

    expect(typeof html).toBe("string");
    // totalCalories may be formatted with locale separators (12,000 or 12000)
    expect(html).toMatch(/12[,.]?000/);
    expect(html).toContain("5");
  });

  it("daily reminder email contains NutriTrack branding", () => {
    const html = buildDailyReminderEmail({
      date: "2026-03-22",
      caloriesConsumed: 800,
      caloriesTarget: 2000,
      waterMl: 500,
    });

    expect(html).toContain("NutriTrack");
  });

  it("weekly summary email contains greeting and stats", () => {
    const html = buildWeeklySummaryEmail({
      weekOf: "2026-03-16",
      totalCalories: 14000,
      avgCaloriesPerDay: 2000,
      streakDays: 7,
      topFoods: [],
    });

    expect(html).toContain("NutriTrack");
    expect(html).toContain("7");
  });
});

describe("CHK-057: in-memory job queue (BullMQ stub)", () => {
  it("job queue accepts and stores jobs", async () => {
    const { jobQueue } = await import("@/server/jobs/email-jobs");

    jobQueue.enqueue({ type: "daily-reminder", data: { userId: "u1", email: "a@b.com" } });
    jobQueue.enqueue({ type: "weekly-summary", data: { userId: "u2", email: "c@d.com" } });

    expect(jobQueue.size()).toBe(2);
    jobQueue.clear();
  });

  it("job queue dequeues jobs in FIFO order", async () => {
    const { jobQueue: jq } = await import("@/server/jobs/email-jobs");

    jq.enqueue({ type: "daily-reminder", data: { userId: "u1", email: "a@b.com" } });
    jq.enqueue({ type: "weekly-summary", data: { userId: "u2", email: "c@d.com" } });

    const first = jq.dequeue();
    expect(first?.type).toBe("daily-reminder");
    const second = jq.dequeue();
    expect(second?.type).toBe("weekly-summary");
    jq.clear();
  });
});
