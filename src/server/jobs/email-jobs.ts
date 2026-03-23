/**
 * email-jobs — Job definitions and processors for email notifications.
 *
 * Uses nodemailer for real SMTP delivery when configured via env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Falls back to console logging when SMTP is not configured.
 * Uses an in-memory queue (no BullMQ) suitable for single-instance deployment.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
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

// ── SMTP configuration ───────────────────────────────────────────────────────

let smtpWarned = false;
let transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (!isSmtpConfigured()) {
    if (!smtpWarned) {
      console.warn("[email-jobs] SMTP not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS). Emails will be logged to console.");
      smtpWarned = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function getFromAddress(): string {
  return process.env.SMTP_FROM ?? "noreply@nutritrack.local";
}

// ── In-memory job queue ───────────────────────────────────────────────────────

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
  const transport = getTransporter();

  if (!transport) {
    console.log(`[email-jobs] STUB daily-reminder -> ${data.email}: ${subject}`);
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  try {
    const result = await transport.sendMail({
      from: getFromAddress(),
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
  const transport = getTransporter();

  if (!transport) {
    console.log(`[email-jobs] STUB weekly-summary -> ${data.email}: ${subject}`);
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  try {
    const result = await transport.sendMail({
      from: getFromAddress(),
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

// ── Queue processor ───────────────────────────────────────────────────────────

/** Drains the queue and processes all pending email jobs. Returns results for each job. */
export async function processQueue(): Promise<JobResult[]> {
  const results: JobResult[] = [];

  let job = jobQueue.dequeue();
  while (job) {
    let result: JobResult;
    switch (job.type) {
      case "daily-reminder":
        result = await processDailyReminder(job.data as DailyReminderData);
        break;
      case "weekly-summary":
        result = await processWeeklySummary(job.data as WeeklySummaryData);
        break;
      default:
        result = { success: false, error: `Unknown job type: ${(job as EmailJob).type}` };
    }
    results.push(result);
    job = jobQueue.dequeue();
  }

  return results;
}

// ── Scheduler functions ───────────────────────────────────────────────────────

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
