/**
 * Logging routes: meal entries, water entries, weight entries,
 * activity entries, daily log aggregate.
 * POST/PUT/DELETE /api/v1/logs/:date/meals      — meal entry CRUD
 * POST/DELETE /api/v1/logs/:date/water          — water entry CRUD
 * GET /api/v1/logs/water?date=...               — list water entries
 * POST/PUT/DELETE /api/v1/logs/:date/weight     — weight entry CRUD
 * GET /api/v1/logs/weight                       — list last 90 days weight
 * POST/PUT/DELETE /api/v1/logs/:date/activities — activity entry CRUD
 * GET /api/v1/logs/activities?date=...          — list activities by date
 * GET /api/v1/logs/:date                        — daily log aggregate
 */
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import * as logService from "@/server/services/log-service";
import { parseQuickAdd, estimateGrams } from "@/server/services/quick-add-service";
import { searchFoods } from "@/server/services/food-service";

type Env = { Variables: { session: { user: { id: string; email: string; name?: string } } | null } };

const router = new Hono<Env>();

router.use("*", requireAuth);

// ── Zod schemas ─────────────────────────────────────────────────────────

const createMealSchema = z.object({
  foodId: z.string().min(1),
  servingSizeId: z.string().min(1),
  quantity: z.number().positive(),
  mealType: z.enum([
    "breakfast", "morning_snack", "lunch",
    "afternoon_snack", "dinner", "evening_snack", "other",
  ]),
  loggedAt: z.string().optional(),
  notes: z.string().optional(),
});

const updateMealSchema = z.object({
  quantity: z.number().positive().optional(),
  mealType: z.enum([
    "breakfast", "morning_snack", "lunch",
    "afternoon_snack", "dinner", "evening_snack", "other",
  ]).optional(),
  notes: z.string().optional(),
});

const createWaterSchema = z.object({
  amountMl: z.number().positive(),
  loggedAt: z.string().optional(),
});

const createWeightSchema = z.object({
  weightKg: z.number().positive(),
  note: z.string().optional(),
});

const updateWeightSchema = z.object({
  weightKg: z.number().positive().optional(),
  note: z.string().optional(),
});

const createActivitySchema = z.object({
  exerciseId: z.string().min(1).optional(),
  customName: z.string().min(1).optional(),
  durationMinutes: z.number().int().positive(),
  caloriesBurned: z.number().positive().optional(),
  userWeightKg: z.number().positive().optional(),
  intensityLevel: z.enum(["low", "moderate", "high"]).optional(),
  loggedAt: z.string().optional(),
  notes: z.string().optional(),
});

const updateActivitySchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
  caloriesBurned: z.number().positive().optional(),
  intensityLevel: z.enum(["low", "moderate", "high"]).optional(),
  notes: z.string().optional(),
});

// ── Static routes (must precede /:date) ──────────────────────────────────

// GET /api/v1/logs/water?date=YYYY-MM-DD
router.get("/water", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.query("date");
  if (!date) return c.json({ error: "date query param required", code: "validation_error" }, 422);

  const entries = await logService.getWaterEntries(userId, date);
  return c.json(entries);
});

// PUT /api/v1/logs/meals/:id
router.put("/meals/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = updateMealSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.updateMealEntry(entryId, userId, parsed.data);
    return c.json(entry);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// DELETE /api/v1/logs/meals/:id
router.delete("/meals/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  try {
    await logService.deleteMealEntry(entryId, userId);
    return c.body(null, 204);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// DELETE /api/v1/logs/water/:id
router.delete("/water/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  try {
    await logService.deleteWaterEntry(entryId, userId);
    return c.body(null, 204);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// GET /api/v1/logs/weight — list last 90 days
router.get("/weight", async (c) => {
  const userId = c.get("session")!.user.id;
  const entries = await logService.getWeightEntries(userId);
  return c.json(entries);
});

// PUT /api/v1/logs/weight/:id
router.put("/weight/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  let body: unknown;
  try { body = await c.req.json(); } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = updateWeightSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.updateWeightEntry(entryId, userId, parsed.data);
    return c.json(entry);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// DELETE /api/v1/logs/weight/:id
router.delete("/weight/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  try {
    await logService.deleteWeightEntry(entryId, userId);
    return c.body(null, 204);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// GET /api/v1/logs/activities?date=YYYY-MM-DD
router.get("/activities", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.query("date");
  if (!date) return c.json({ error: "date query param required", code: "validation_error" }, 422);

  const entries = await logService.getActivityEntries(userId, date);
  return c.json(entries);
});

// PUT /api/v1/logs/activities/:id
router.put("/activities/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  let body: unknown;
  try { body = await c.req.json(); } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = updateActivitySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.updateActivityEntry(entryId, userId, parsed.data);
    return c.json(entry);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// DELETE /api/v1/logs/activities/:id
router.delete("/activities/:id", async (c) => {
  const entryId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  try {
    await logService.deleteActivityEntry(entryId, userId);
    return c.body(null, 204);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

// ── Date-based routes ─────────────────────────────────────────────────────

// GET /api/v1/logs/:date — daily log aggregate
router.get("/:date", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.param("date");

  const log = await logService.getDailyLog(userId, date);
  return c.json(log);
});

// POST /api/v1/logs/:date/meals
router.post("/:date/meals", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.param("date");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = createMealSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.createMealEntry(userId, date, parsed.data);
    return c.json(entry, 201);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    if (e?.code === "validation_error") return c.json({ error: "Validation error", code: "validation_error" }, 422);
    throw err;
  }
});

// POST /api/v1/logs/:date/weight
router.post("/:date/weight", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.param("date");

  let body: unknown;
  try { body = await c.req.json(); } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = createWeightSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.createWeightEntry(userId, date, parsed.data);
    return c.json(entry, 201);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "validation_error") return c.json({ error: "Validation error", code: "validation_error" }, 422);
    throw err;
  }
});

// POST /api/v1/logs/:date/activities
router.post("/:date/activities", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.param("date");

  let body: unknown;
  try { body = await c.req.json(); } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.createActivityEntry(userId, date, parsed.data);
    return c.json(entry, 201);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    if (e?.code === "validation_error") return c.json({ error: "Validation error", code: "validation_error" }, 422);
    throw err;
  }
});

// POST /api/v1/logs/:date/water
router.post("/:date/water", async (c) => {
  const userId = c.get("session")!.user.id;
  const date = c.req.param("date");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = createWaterSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  try {
    const entry = await logService.createWaterEntry(userId, date, parsed.data.amountMl);
    return c.json(entry, 201);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "validation_error") return c.json({ error: "Validation error", code: "validation_error" }, 422);
    throw err;
  }
});

// POST /api/v1/logs/quick-add — NLP free-text food logging
const quickAddSchema = z.object({
  text: z.string().min(1),
  date: z.string().min(1),
  mealType: z.enum([
    "breakfast", "morning_snack", "lunch",
    "afternoon_snack", "dinner", "evening_snack", "other",
  ]),
});

router.post("/quick-add", async (c) => {
  const userId = c.get("session")!.user.id;

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = quickAddSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation error", code: "validation_error", details: parsed.error.flatten() },
      422
    );
  }

  const { text, date, mealType } = parsed.data;
  const parsedItems = parseQuickAdd(text);

  if (parsedItems.length === 0) {
    return c.json({ matched: [], unmatched: [], total: 0 });
  }

  const matched: Array<{
    food: { id: string; name: string; caloriesPer100g: number };
    query: string;
    grams: number;
  }> = [];
  const unmatched: string[] = [];

  for (const item of parsedItems) {
    try {
      const results = await searchFoods({ query: item.query, userId, limit: 1 });
      if (results.length === 0) {
        unmatched.push(item.originalText);
        continue;
      }

      const food = results[0];
      const servingGrams = food.servingSizes[0]?.weightG ?? 100;
      const grams = estimateGrams(item, servingGrams);

      // Create meal entry
      await logService.createMealEntry(userId, date, {
        foodId: food.id,
        servingSizeId: food.servingSizes[0]?.id ?? "",
        quantity: grams / (food.servingSizes[0]?.weightG ?? 100),
        mealType,
      });

      matched.push({
        food: {
          id: food.id,
          name: food.name,
          caloriesPer100g: food.caloriesPer100g,
        },
        query: item.query,
        grams,
      });
    } catch {
      unmatched.push(item.originalText);
    }
  }

  const status = matched.length > 0 ? 201 : 200;
  return c.json({ matched, unmatched, total: parsedItems.length }, status);
});

export { router as logs };
