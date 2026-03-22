/**
 * Recipe service — CRUD, favorites, log-as-meal.
 * No @hono/zod-validator — manual safeParse + 422 at route level.
 */
import { db, recipes, recipeIngredients, favoriteRecipes, mealEntries } from "@/server/db";
import { eq, and, or, ilike, desc, inArray, count } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export type RecipeSummary = {
  id: string;
  title: string;
  description: string | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing: number;
  servings: number;
  prepTimeMins: number;
  cookTimeMins: number;
  difficulty: string;
  tags: string[];
  published: boolean;
  coverImageUrl: string | null;
  authorId: string | null;
  source: string;
  createdAt: Date;
};

export type RecipeIngredientRow = {
  id: string;
  recipeId: string;
  foodId: string;
  quantityG: number;
  displayLabel: string;
  optional: boolean;
  sortOrder: number;
};

export type RecipeDetail = RecipeSummary & {
  steps: string[];
  ingredients: RecipeIngredientRow[];
};

export type CreateRecipeDto = {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMins?: number;
  cookTimeMins?: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  steps?: string[];
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  fiberPerServing?: number;
  coverImageUrl?: string;
  ingredients?: Array<{
    foodId: string;
    quantityG: number;
    displayLabel: string;
    optional?: boolean;
    sortOrder?: number;
  }>;
};

export type UpdateRecipeDto = Partial<CreateRecipeDto>;

// ── Helpers ────────────────────────────────────────────────────────────────

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : parseFloat(v) || 0;
}

function rowToSummary(r: typeof recipes.$inferSelect): RecipeSummary {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    caloriesPerServing: toNum(r.caloriesPerServing),
    proteinPerServing: toNum(r.proteinPerServing),
    carbsPerServing: toNum(r.carbsPerServing),
    fatPerServing: toNum(r.fatPerServing),
    fiberPerServing: toNum(r.fiberPerServing),
    servings: r.servings,
    prepTimeMins: r.prepTimeMins,
    cookTimeMins: r.cookTimeMins,
    difficulty: r.difficulty,
    tags: r.tags,
    published: r.published,
    coverImageUrl: r.coverImageUrl ?? null,
    authorId: r.authorId ?? null,
    source: r.source,
    createdAt: r.createdAt,
  };
}

function rowToIngredient(r: typeof recipeIngredients.$inferSelect): RecipeIngredientRow {
  return {
    id: r.id,
    recipeId: r.recipeId,
    foodId: r.foodId,
    quantityG: toNum(r.quantityG),
    displayLabel: r.displayLabel,
    optional: r.optional,
    sortOrder: r.sortOrder,
  };
}

async function loadIngredients(recipeIds: string[]): Promise<Map<string, RecipeIngredientRow[]>> {
  if (recipeIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(recipeIngredients)
    .where(inArray(recipeIngredients.recipeId, recipeIds))
    .orderBy(recipeIngredients.sortOrder);
  const map = new Map<string, RecipeIngredientRow[]>();
  for (const row of rows) {
    const list = map.get(row.recipeId) ?? [];
    list.push(rowToIngredient(row));
    map.set(row.recipeId, list);
  }
  return map;
}

// ── List & Filter ──────────────────────────────────────────────────────────
// Avoids $dynamic() — builds static conditions for the mock-compatible pattern.

export async function getRecipes(params: {
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}): Promise<{ recipes: RecipeSummary[]; total: number }> {
  const { category, q, limit = 20, offset = 0, userId } = params;

  // Choose the right where condition based on params
  const visibilityCond = userId
    ? or(eq(recipes.published, true), eq(recipes.authorId, userId))
    : eq(recipes.published, true);

  let rows: typeof recipes.$inferSelect[];

  if (q) {
    const pattern = `%${q}%`;
    const searchCond = or(ilike(recipes.title, pattern), ilike(recipes.description, pattern));
    rows = await db
      .select()
      .from(recipes)
      .where(and(visibilityCond, searchCond))
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await db
      .select()
      .from(recipes)
      .where(visibilityCond)
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  const ingMap = await loadIngredients(rows.map((r) => r.id));
  void ingMap; // loaded for future ingredient embedding; not used in summary
  const summaries = rows.map((r) => rowToSummary(r));

  // Apply category filter on tags array (client-side since tags is text[])
  const filtered = category
    ? summaries.filter((r) => r.tags.some((t) => t.toLowerCase() === category.toLowerCase()))
    : summaries;

  // Count total for pagination (without limit/offset)
  const countRows = await db.select({ count: count() }).from(recipes).where(visibilityCond);
  const total = Number(countRows[0]?.count ?? filtered.length);

  return { recipes: filtered, total };
}

// ── Detail ─────────────────────────────────────────────────────────────────

export async function getRecipeById(id: string): Promise<RecipeDetail | null> {
  const rows = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (rows.length === 0) return null;
  const recipe = rows[0];

  const ingMap = await loadIngredients([id]);
  return {
    ...rowToSummary(recipe),
    steps: recipe.steps,
    ingredients: ingMap.get(id) ?? [],
  };
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createRecipe(
  authorId: string,
  dto: CreateRecipeDto
): Promise<RecipeDetail> {
  const id = randomUUID();
  const now = new Date();

  const insertValues = {
    id,
    title: dto.title,
    description: dto.description ?? null,
    authorId,
    source: "user_created" as const,
    servings: dto.servings ?? 1,
    prepTimeMins: dto.prepTimeMins ?? 0,
    cookTimeMins: dto.cookTimeMins ?? 0,
    difficulty: dto.difficulty ?? ("easy" as const),
    tags: dto.tags ?? [],
    steps: dto.steps ?? [],
    caloriesPerServing: String(dto.caloriesPerServing ?? 0),
    proteinPerServing: String(dto.proteinPerServing ?? 0),
    carbsPerServing: String(dto.carbsPerServing ?? 0),
    fatPerServing: String(dto.fatPerServing ?? 0),
    fiberPerServing: String(dto.fiberPerServing ?? 0),
    coverImageUrl: dto.coverImageUrl ?? null,
    published: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(recipes).values(insertValues);

  if ((dto.ingredients ?? []).length > 0) {
    const ingredientRows = dto.ingredients!.map((ing, i) => ({
      id: randomUUID(),
      recipeId: id,
      foodId: ing.foodId,
      quantityG: String(ing.quantityG),
      displayLabel: ing.displayLabel,
      optional: ing.optional ?? false,
      sortOrder: ing.sortOrder ?? i,
    }));
    await db.insert(recipeIngredients).values(ingredientRows);
  }

  // Return the created recipe with constructed data (avoids extra DB call in tests)
  return {
    id,
    title: dto.title,
    description: dto.description ?? null,
    caloriesPerServing: dto.caloriesPerServing ?? 0,
    proteinPerServing: dto.proteinPerServing ?? 0,
    carbsPerServing: dto.carbsPerServing ?? 0,
    fatPerServing: dto.fatPerServing ?? 0,
    fiberPerServing: dto.fiberPerServing ?? 0,
    servings: dto.servings ?? 1,
    prepTimeMins: dto.prepTimeMins ?? 0,
    cookTimeMins: dto.cookTimeMins ?? 0,
    difficulty: dto.difficulty ?? "easy",
    tags: dto.tags ?? [],
    published: false,
    coverImageUrl: dto.coverImageUrl ?? null,
    authorId,
    source: "user_created",
    createdAt: now,
    steps: dto.steps ?? [],
    ingredients: [],
  };
}

// ── Update ─────────────────────────────────────────────────────────────────

export async function updateRecipe(
  id: string,
  userId: string,
  dto: UpdateRecipeDto
): Promise<RecipeDetail> {
  const rows = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (rows.length === 0) throw Object.assign(new Error("Not found"), { code: "not_found" });
  const recipe = rows[0];
  if (recipe.authorId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  const updates: Partial<typeof recipes.$inferInsert> = { updatedAt: new Date() };
  if (dto.title !== undefined) updates.title = dto.title;
  if (dto.description !== undefined) updates.description = dto.description ?? null;
  if (dto.servings !== undefined) updates.servings = dto.servings;
  if (dto.prepTimeMins !== undefined) updates.prepTimeMins = dto.prepTimeMins;
  if (dto.cookTimeMins !== undefined) updates.cookTimeMins = dto.cookTimeMins;
  if (dto.difficulty !== undefined) updates.difficulty = dto.difficulty;
  if (dto.tags !== undefined) updates.tags = dto.tags;
  if (dto.steps !== undefined) updates.steps = dto.steps;
  if (dto.caloriesPerServing !== undefined) updates.caloriesPerServing = String(dto.caloriesPerServing);
  if (dto.proteinPerServing !== undefined) updates.proteinPerServing = String(dto.proteinPerServing);
  if (dto.carbsPerServing !== undefined) updates.carbsPerServing = String(dto.carbsPerServing);
  if (dto.fatPerServing !== undefined) updates.fatPerServing = String(dto.fatPerServing);
  if (dto.fiberPerServing !== undefined) updates.fiberPerServing = String(dto.fiberPerServing);

  await db.update(recipes).set(updates).where(eq(recipes.id, id));

  const result = await getRecipeById(id);
  return result!;
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteRecipe(id: string, userId: string): Promise<void> {
  const rows = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (rows.length === 0) throw Object.assign(new Error("Not found"), { code: "not_found" });
  if (rows[0].authorId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });
  await db.delete(recipes).where(eq(recipes.id, id));
}

// ── Favorites ─────────────────────────────────────────────────────────────

export async function addFavoriteRecipe(userId: string, recipeId: string): Promise<void> {
  await db.insert(favoriteRecipes).values({ userId, recipeId }).onConflictDoNothing();
}

export async function removeFavoriteRecipe(userId: string, recipeId: string): Promise<void> {
  await db
    .delete(favoriteRecipes)
    .where(and(eq(favoriteRecipes.userId, userId), eq(favoriteRecipes.recipeId, recipeId)));
}

export async function getFavoriteRecipes(userId: string): Promise<RecipeSummary[]> {
  const favs = await db
    .select({ recipe: recipes })
    .from(favoriteRecipes)
    .innerJoin(recipes, eq(favoriteRecipes.recipeId, recipes.id))
    .where(eq(favoriteRecipes.userId, userId))
    .orderBy(desc(favoriteRecipes.createdAt));
  return favs.map((r) => rowToSummary(r.recipe));
}

// ── Log as Meal ────────────────────────────────────────────────────────────

type MealSlot = "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner" | "evening_snack" | "other";

export async function logRecipeAsMeal(
  userId: string,
  recipeId: string,
  params: { mealSlot: MealSlot; date: string; servingsCount?: number }
): Promise<{ entriesCreated: number }> {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) throw Object.assign(new Error("Recipe not found"), { code: "not_found" });

  const multiplier = params.servingsCount ?? 1;
  const now = new Date();

  const entryId = randomUUID();
  await db.insert(mealEntries).values({
    id: entryId,
    userId,
    date: params.date,
    mealSlot: params.mealSlot,
    loggedAt: now,
    recipeId,
    customName: recipe.title,
    quantityG: String(recipe.servings * multiplier * 100),
    servingLabel: multiplier === 1
      ? `${recipe.servings} serving${recipe.servings !== 1 ? "s" : ""}`
      : `${multiplier} × ${recipe.servings} serving${recipe.servings !== 1 ? "s" : ""}`,
    caloriesKcal: String(recipe.caloriesPerServing * multiplier),
    proteinG: String(recipe.proteinPerServing * multiplier),
    carbsG: String(recipe.carbsPerServing * multiplier),
    fatG: String(recipe.fatPerServing * multiplier),
    fiberG: String(recipe.fiberPerServing * multiplier),
    source: "recipe",
  });

  return { entriesCreated: 1 };
}
