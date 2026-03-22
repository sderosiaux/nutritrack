/**
 * Lesson service — pure functions for lesson queries and progress tracking.
 * No HTTP layer; used by the lessons route handler.
 */
import { db } from "@/server/db";
import { lessons, lessonProgress } from "@/server/db/schema/content";
import { eq, and, isNotNull, sql } from "drizzle-orm";

export type LessonCategory =
  | "nutrition"
  | "sleep"
  | "stress"
  | "habits"
  | "fitness"
  | "mindfulness";

const VALID_CATEGORIES: LessonCategory[] = [
  "nutrition", "sleep", "stress", "habits", "fitness", "mindfulness",
];

export function isValidCategory(val: unknown): val is LessonCategory {
  return typeof val === "string" && (VALID_CATEGORIES as string[]).includes(val);
}

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: LessonCategory;
  tags: string[];
  readTimeMin: number;
  illustrationUrl: string | null;
  order: number;
  publishedAt: string | null;
}

export interface LessonDetail extends LessonSummary {
  bodyMarkdown: string;
}

export interface GetLessonsOptions {
  category?: LessonCategory;
  limit?: number;
  offset?: number;
}

export async function getLessons(
  opts: GetLessonsOptions
): Promise<{ lessons: LessonSummary[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  const query = db
    .select({
      id: lessons.id,
      slug: lessons.slug,
      title: lessons.title,
      summary: lessons.summary,
      category: lessons.category,
      tags: lessons.tags,
      readTimeMin: lessons.readTimeMin,
      illustrationUrl: lessons.illustrationUrl,
      order: lessons.order,
      publishedAt: lessons.publishedAt,
    })
    .from(lessons)
    .where(
      opts.category
        ? and(isNotNull(lessons.publishedAt), eq(lessons.category, opts.category))
        : isNotNull(lessons.publishedAt)
    )
    .orderBy(lessons.order)
    .limit(limit)
    .offset(offset);

  const rows = await query;

  return {
    lessons: rows as LessonSummary[],
    total: rows.length,
  };
}

export async function getLessonBySlug(slug: string): Promise<LessonDetail | null> {
  const rows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.slug, slug))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    category: row.category as LessonCategory,
    tags: row.tags,
    readTimeMin: row.readTimeMin,
    illustrationUrl: row.illustrationUrl,
    order: row.order,
    publishedAt: row.publishedAt,
  };
}

export async function getLessonById(id: string): Promise<LessonDetail | null> {
  const rows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    category: row.category as LessonCategory,
    tags: row.tags,
    readTimeMin: row.readTimeMin,
    illustrationUrl: row.illustrationUrl,
    order: row.order,
    publishedAt: row.publishedAt,
  };
}

export async function getTodayLessons(userId: string): Promise<LessonSummary[]> {
  // Get all published lesson IDs
  const allLessons = await db
    .select({ id: lessons.id, slug: lessons.slug, title: lessons.title,
      summary: lessons.summary, category: lessons.category, tags: lessons.tags,
      readTimeMin: lessons.readTimeMin, illustrationUrl: lessons.illustrationUrl,
      order: lessons.order, publishedAt: lessons.publishedAt })
    .from(lessons)
    .where(isNotNull(lessons.publishedAt))
    .orderBy(lessons.order);

  // Get completed lesson IDs for this user
  const completed = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        isNotNull(lessonProgress.completedAt)
      )
    );

  const completedIds = new Set(completed.map((r) => r.lessonId));
  const notDone = allLessons.filter((l) => !completedIds.has(l.id));

  // Return up to 3 lessons for today's queue
  return notDone.slice(0, 3) as LessonSummary[];
}

export async function completeLesson(
  userId: string,
  lessonId: string
): Promise<void> {
  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      completedAt: new Date(),
      queuedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { completedAt: new Date() },
    });
}

export interface ProgressByCategory {
  category: string;
  completed: number;
  total: number;
}

export async function getLessonProgress(
  userId: string
): Promise<{ completed: number; total: number; byCategory: ProgressByCategory[] }> {
  // Total published lessons
  const totalRows = await db
    .select({ count: sql<string>`count(*)` })
    .from(lessons)
    .where(isNotNull(lessons.publishedAt));
  const total = parseInt(totalRows[0]?.count ?? "0", 10);

  // Completed lessons by category
  const completedRows = await db
    .select({
      count: sql<string>`count(*)`,
      category: lessons.category,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        isNotNull(lessonProgress.completedAt)
      )
    );

  const completed = completedRows.reduce(
    (acc, r) => acc + parseInt(r.count ?? "0", 10),
    0
  );

  const byCategory: ProgressByCategory[] = completedRows.map((r) => ({
    category: r.category ?? "unknown",
    completed: parseInt(r.count, 10),
    total: 0, // Would need a join to get per-category total
  }));

  return { completed, total, byCategory };
}
