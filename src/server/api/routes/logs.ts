/**
 * Logging routes: meal entries, water entries, daily log aggregate.
 * POST/PUT/DELETE /api/v1/logs/:date/meals — meal entry CRUD
 * POST/DELETE /api/v1/logs/:date/water   — water entry CRUD
 * GET /api/v1/logs/water?date=...        — list water entries
 * GET /api/v1/logs/:date                 — daily log aggregate
 */
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import * as logService from "@/server/services/log-service";

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

export { router as logs };
