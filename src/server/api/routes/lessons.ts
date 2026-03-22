/**
 * Lesson routes: browse, detail, today's queue, mark complete, progress.
 * Public: GET /lessons, GET /lessons/:slug
 * Auth required: GET /lessons/today, POST /lessons/:id/complete, GET /lessons/progress
 */
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import * as lessonService from "@/server/services/lesson-service";

type Env = {
  Variables: {
    session: { user: { id: string; email: string; name?: string } } | null;
  };
};

const router = new Hono<Env>();

// ── Public routes (no auth) ─────────────────────────────────────────────────

router.get("/", async (c) => {
  const categoryParam = c.req.query("category");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;

  if (categoryParam !== undefined && !lessonService.isValidCategory(categoryParam)) {
    return c.json(
      { error: "Invalid category", code: "validation_error" },
      422
    );
  }

  const result = await lessonService.getLessons({
    category: categoryParam as lessonService.LessonCategory | undefined,
    limit,
    offset,
  });

  return c.json(result);
});

// ── Auth-required static routes (must come before /:slug) ──────────────────

router.get("/today", requireAuth, async (c) => {
  const userId = c.get("session")!.user.id;
  const items = await lessonService.getTodayLessons(userId);
  return c.json({ lessons: items });
});

router.get("/progress", requireAuth, async (c) => {
  const userId = c.get("session")!.user.id;
  const progress = await lessonService.getLessonProgress(userId);
  return c.json(progress);
});

// ── Dynamic slug route ──────────────────────────────────────────────────────

router.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const lesson = await lessonService.getLessonBySlug(slug);
  if (!lesson) {
    return c.json({ error: "Lesson not found", code: "not_found" }, 404);
  }
  return c.json(lesson);
});

// ── Auth-required dynamic routes ────────────────────────────────────────────

router.post("/:id/complete", requireAuth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("session")!.user.id;

  // Verify lesson exists
  const lesson = await lessonService.getLessonById(id);
  if (!lesson) {
    return c.json({ error: "Lesson not found", code: "not_found" }, 404);
  }

  await lessonService.completeLesson(userId, id);
  return c.json({ success: true });
});

export { router as lessons };
