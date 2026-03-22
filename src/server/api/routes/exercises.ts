/**
 * Exercises routes — public read-only endpoints.
 * GET /api/v1/exercises       ?category=cardio&q=running
 * GET /api/v1/exercises/:id
 */
import { Hono } from "hono";
import { z } from "zod";
import { db, exercises } from "@/server/db";
import { eq, like, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

type Env = { Variables: { session: { user: { id: string; email: string; name?: string } } | null } };

const router = new Hono<Env>();

const VALID_CATEGORIES = ["cardio", "strength", "flexibility", "sports", "daily_activity"] as const;

const listSchema = z.object({
  category: z.enum(VALID_CATEGORIES).optional(),
  q: z.string().optional(),
});

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

function rowToExercise(row: typeof exercises.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    metValue: toNum(row.metValue),
    metLow: toNum(row.metLow),
    metHigh: toNum(row.metHigh),
  };
}

// GET /api/v1/exercises
router.get("/", async (c) => {
  const parsed = listSchema.safeParse({
    category: c.req.query("category"),
    q: c.req.query("q"),
  });

  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  const { category, q } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(exercises.category, category));
  if (q) conditions.push(sql`LOWER(${exercises.name}) LIKE ${"%" + q.toLowerCase() + "%"}`);

  const rows = conditions.length > 0
    ? await db.select().from(exercises).where(and(...conditions)).orderBy(exercises.name)
    : await db.select().from(exercises).orderBy(exercises.name);

  const items = rows.map(rowToExercise);
  return c.json({ items, total: items.length });
});

// GET /api/v1/exercises/:id
router.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.select().from(exercises).where(eq(exercises.id, id));

  if (!row) return c.json({ error: "Exercise not found", code: "not_found" }, 404);
  return c.json(rowToExercise(row));
});

export { router as exercisesRouter };
