/**
 * Recipe routes: browse, detail, CRUD, favorites, log-as-meal.
 * Public: GET /recipes, GET /recipes/:id
 * Auth required: POST /recipes, PUT /:id, DELETE /:id, POST /:id/favorite,
 *               DELETE /:id/favorite, POST /:id/log
 */
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import * as recipeService from "@/server/services/recipe-service";

type Env = {
  Variables: {
    session: { user: { id: string; email: string; name?: string } } | null;
  };
};

const router = new Hono<Env>();

// ── Public: List ─────────────────────────────────────────────────────────────

router.get("/", async (c) => {
  const category = c.req.query("category") ?? undefined;
  const q = c.req.query("q") ?? undefined;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10) || 20, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;
  const session = c.get("session");

  const result = await recipeService.getRecipes({
    category,
    q,
    limit,
    offset,
    userId: session?.user.id,
  });

  return c.json(result);
});

// ── Auth-required static routes (before /:id) ─────────────────────────────

router.get("/favorites", requireAuth, async (c) => {
  const userId = c.get("session")!.user.id;
  const recipes = await recipeService.getFavoriteRecipes(userId);
  return c.json({ recipes });
});

// ── Public: Detail ────────────────────────────────────────────────────────

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  const recipe = await recipeService.getRecipeById(id);
  if (!recipe) {
    return c.json({ error: "Recipe not found", code: "not_found" }, 404);
  }
  return c.json(recipe);
});

// ── Auth-required: Create ─────────────────────────────────────────────────

const CreateRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  servings: z.number().int().positive().optional(),
  prepTimeMins: z.number().int().min(0).optional(),
  cookTimeMins: z.number().int().min(0).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tags: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  caloriesPerServing: z.number().min(0).optional(),
  proteinPerServing: z.number().min(0).optional(),
  carbsPerServing: z.number().min(0).optional(),
  fatPerServing: z.number().min(0).optional(),
  fiberPerServing: z.number().min(0).optional(),
  coverImageUrl: z.string().url().optional(),
  ingredients: z.array(z.object({
    foodId: z.string(),
    quantityG: z.number().positive(),
    displayLabel: z.string(),
    optional: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
});

router.post("/", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);

  const parsed = CreateRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", code: "validation_error", issues: parsed.error.issues }, 422);
  }

  const userId = c.get("session")!.user.id;
  const recipe = await recipeService.createRecipe(userId, parsed.data);
  return c.json(recipe, 201);
});

// ── Auth-required: Update ─────────────────────────────────────────────────

router.put("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);

  const userId = c.get("session")!.user.id;

  try {
    const recipe = await recipeService.updateRecipe(id, userId, body);
    return c.json(recipe);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "not_found") return c.json({ error: "Recipe not found", code: "not_found" }, 404);
    if (err?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    throw e;
  }
});

// ── Auth-required: Delete ─────────────────────────────────────────────────

router.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("session")!.user.id;

  try {
    await recipeService.deleteRecipe(id, userId);
    return c.json({ success: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "not_found") return c.json({ error: "Recipe not found", code: "not_found" }, 404);
    if (err?.code === "forbidden") return c.json({ error: "Forbidden", code: "forbidden" }, 403);
    throw e;
  }
});

// ── Auth-required: Favorite ───────────────────────────────────────────────

router.post("/:id/favorite", requireAuth, async (c) => {
  const recipeId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  // Verify recipe exists
  const recipe = await recipeService.getRecipeById(recipeId);
  if (!recipe) return c.json({ error: "Recipe not found", code: "not_found" }, 404);

  await recipeService.addFavoriteRecipe(userId, recipeId);
  return c.json({ success: true });
});

router.delete("/:id/favorite", requireAuth, async (c) => {
  const recipeId = c.req.param("id");
  const userId = c.get("session")!.user.id;

  await recipeService.removeFavoriteRecipe(userId, recipeId);
  return c.json({ success: true });
});

// ── Auth-required: Log as meal ────────────────────────────────────────────

const LogSchema = z.object({
  mealSlot: z.enum([
    "breakfast", "morning_snack", "lunch", "afternoon_snack",
    "dinner", "evening_snack", "other",
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  servingsCount: z.number().positive().optional(),
});

router.post("/:id/log", requireAuth, async (c) => {
  const recipeId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);

  const parsed = LogSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", code: "validation_error", issues: parsed.error.issues }, 422);
  }

  const userId = c.get("session")!.user.id;

  try {
    const result = await recipeService.logRecipeAsMeal(userId, recipeId, parsed.data);
    return c.json(result);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "not_found") return c.json({ error: "Recipe not found", code: "not_found" }, 404);
    throw e;
  }
});

export { router as recipes };
