/**
 * Food database routes: search, detail, recent, favorites, barcode, custom CRUD.
 * Search, detail, and barcode are public (guest mode). Write endpoints require auth.
 */
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import * as foodService from "@/server/services/food-service";

type Env = { Variables: { session: { user: { id: string; email: string; name?: string } } | null } };

const router = new Hono<Env>();

// Session already attached by top-level app middleware — no need to re-apply here.

// ── Static routes (must precede /:id) ──────────────────────────────────────

router.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "q param required", code: "validation_error" }, 400);

  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10) || 20, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;
  const userId = c.get("session")?.user.id; // optional — guests get no recent boost

  const result = await foodService.searchFoods({ q, limit, offset, userId });
  return c.json({ ...result, source: "local" });
});

router.get("/recent", async (c) => {
  const userId = c.get("session")!.user.id;
  const foods = await foodService.getRecentFoods(userId, 20);
  return c.json(foods);
});

router.get("/favorites", async (c) => {
  const userId = c.get("session")!.user.id;
  const foods = await foodService.getFavoriteFoods(userId);
  return c.json(foods);
});

router.get("/barcode/:barcode", async (c) => {
  const barcode = c.req.param("barcode");
  let food = await foodService.getFoodByBarcode(barcode);
  if (!food) {
    food = await foodService.fetchFoodFromOpenFoodFacts(barcode);
  }
  if (!food) {
    return c.json({ error: "Barcode not found", code: "barcode_not_found" }, 404);
  }
  return c.json(food);
});

// ── Custom food creation ───────────────────────────────────────────────────

const createFoodSchema = z.object({
  name: z.string().min(1),
  brandName: z.string().optional(),
  servingSizeLabel: z.string().min(1),
  servingSizeWeightG: z.number().positive(),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  fiberPer100g: z.number().min(0),
  sugarPer100g: z.number().min(0).optional(),
  sodiumMgPer100g: z.number().min(0).optional(),
});

router.post("/", requireAuth, async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = createFoodSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  const userId = c.get("session")!.user.id;
  const food = await foodService.createCustomFood(userId, parsed.data);
  return c.json(food, 201);
});

// ── Dynamic routes ─────────────────────────────────────────────────────────

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  const food = await foodService.getFoodById(id);
  if (!food) return c.json({ error: "Not found", code: "not_found" }, 404);
  return c.json(food);
});

router.put("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("session")!.user.id;
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }
  try {
    const food = await foodService.updateCustomFood(id, userId, body as Record<string, unknown>);
    return c.json(food);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

router.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("session")!.user.id;
  try {
    await foodService.deleteCustomFood(id, userId);
    return c.body(null, 204);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    if (e?.code === "not_found") return c.json({ error: "Not found", code: "not_found" }, 404);
    throw err;
  }
});

router.post("/:id/favorite", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("session")!.user.id;
  await foodService.addFavorite(userId, id);
  return c.body(null, 201);
});

router.delete("/:id/favorite", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("session")!.user.id;
  await foodService.removeFavorite(userId, id);
  return c.body(null, 204);
});

export { router as foods };
