/**
 * email-jobs — Job definitions and processors for email notifications.
 *
 * nodemailer is NOT installed. Email sends fall back to console logging.
 * BullMQ is NOT installed. Uses an in-memory queue stub.
 *
 * When real packages are available:
 *   - Replace jobQueue with BullMQ Queue
 *   - Replace transporter stub with nodemailer.createTransport(...)
 */

import { buildDailyReminderEmail, buildWeeklySummaryEmail } from "./email-templates";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyReminderData {
  userId: string;
  email: string;
  stats?: {
    date: string;
    caloriesConsumed: number;
    caloriesTarget: number;
    waterMl: number;
  };
}

export interface WeeklySummaryData {
  userId: string;
  email: string;
  weekStats?: {
    weekOf: string;
    totalCalories: number;
    avgCaloriesPerDay: number;
    streakDays: number;
    topFoods: string[];
  };
}

export type JobType = "daily-reminder" | "weekly-summary";

export interface EmailJob<T = DailyReminderData | WeeklySummaryData> {
  type: JobType;
  data: T;
}

export interface JobResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Email transporter (stub — nodemailer not installed) ───────────────────────

let nodemailerTransport: {
  sendMail: (opts: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) => Promise<{ messageId: string }>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer");
  nodemailerTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} catch {
  // nodemailer not installed — stub mode
}

// ── In-memory job queue (BullMQ stub) ─────────────────────────────────────────

class InMemoryJobQueue {
  private queue: EmailJob[] = [];

  enqueue(job: EmailJob): void {
    this.queue.push(job);
  }

  dequeue(): EmailJob | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  toArray(): EmailJob[] {
    return [...this.queue];
  }
}

export const jobQueue = new InMemoryJobQueue();

// ── Job factory functions ─────────────────────────────────────────────────────

export function createDailyReminderJob(data: DailyReminderData): EmailJob<DailyReminderData> {
  return { type: "daily-reminder", data };
}

export function createWeeklySummaryJob(data: WeeklySummaryData): EmailJob<WeeklySummaryData> {
  return { type: "weekly-summary", data };
}

// ── Job processors ────────────────────────────────────────────────────────────

export async function processDailyReminder(data: DailyReminderData): Promise<JobResult> {
  const stats = data.stats ?? {
    date: new Date().toISOString().slice(0, 10),
    caloriesConsumed: 0,
    caloriesTarget: 2000,
    waterMl: 0,
  };

  const html = buildDailyReminderEmail(stats);
  const subject = `NutriTrack — Your daily summary for ${stats.date}`;

  if (!nodemailerTransport) {
    console.log(`[email-jobs] STUB daily-reminder → ${data.email}: ${subject}`);
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  try {
    const result = await nodemailerTransport.sendMail({
      from: process.env.SMTP_FROM ?? "noreply@nutritrack.local",
      to: data.email,
      subject,
      html,
    });
    return { success: true, messageId: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email-jobs] Failed to send daily reminder: ${message}`);
    return { success: false, error: message };
  }
}

export async function processWeeklySummary(data: WeeklySummaryData): Promise<JobResult> {
  const weekStats = data.weekStats ?? {
    weekOf: new Date().toISOString().slice(0, 10),
    totalCalories: 0,
    avgCaloriesPerDay: 0,
    streakDays: 0,
    topFoods: [],
  };

  const html = buildWeeklySummaryEmail(weekStats);
  const subject = `NutriTrack — Your weekly summary`;

  if (!nodemailerTransport) {
    console.log(`[email-jobs] STUB weekly-summary → ${data.email}: ${subject}`);
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  try {
    const result = await nodemailerTransport.sendMail({
      from: process.env.SMTP_FROM ?? "noreply@nutritrack.local",
      to: data.email,
      subject,
      html,
    });
    return { success: true, messageId: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email-jobs] Failed to send weekly summary: ${message}`);
    return { success: false, error: message };
  }
}

/** Schedules a daily reminder for a user (adds to in-memory queue). */
export function scheduleDailyReminder(data: DailyReminderData): void {
  const job = createDailyReminderJob(data);
  jobQueue.enqueue(job);
  console.log(`[email-jobs] Scheduled daily-reminder for ${data.email}`);
}

/** Schedules a weekly summary for a user (adds to in-memory queue). */
export function scheduleWeeklySummary(data: WeeklySummaryData): void {
  const job = createWeeklySummaryJob(data);
  jobQueue.enqueue(job);
  console.log(`[email-jobs] Scheduled weekly-summary for ${data.email}`);
}
