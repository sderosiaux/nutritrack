/**
 * Food database service: search, detail, favorites, barcode, custom CRUD.
 * Search uses PostgreSQL full-text (to_tsvector/plainto_tsquery) with
 * fuzzy fallback (ILIKE) for short queries, plus nameTranslations JSONB text match.
 * Ranking: recently logged > exact match > verified > branded.
 */
import { db, foods, servingSizes, foodFavorites, mealEntries } from "@/server/db";
import { eq, and, or, desc, sql, isNotNull, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export type FoodSearchItem = {
  id: string;
  name: string;
  brandName: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSizes: Array<{ id: string; label: string; weightG: number }>;
  source: string;
  verified?: boolean;
};

export type CreateFoodDto = {
  name: string;
  brandName?: string;
  servingSizeLabel: string;
  servingSizeWeightG: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g?: number;
  sodiumMgPer100g?: number;
};

type UpdateFoodDto = Partial<Omit<CreateFoodDto, "servingSizeLabel" | "servingSizeWeightG">>;

// ── Helpers ────────────────────────────────────────────────────────────────

function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : parseFloat(v) || 0;
}

function rowToSearchItem(
  food: typeof foods.$inferSelect,
  ssList: typeof servingSizes.$inferSelect[]
): FoodSearchItem {
  return {
    id: food.id,
    name: food.name,
    brandName: food.brandName,
    caloriesPer100g: toNumber(food.caloriesPer100g),
    proteinPer100g: toNumber(food.proteinPer100g),
    carbsPer100g: toNumber(food.carbsPer100g),
    fatPer100g: toNumber(food.fatPer100g),
    fiberPer100g: toNumber(food.fiberPer100g),
    servingSizes: ssList.map((ss) => ({
      id: ss.id,
      label: ss.label,
      weightG: toNumber(ss.weightG),
    })),
    source: food.source,
    verified: food.verified,
  };
}

async function loadServingSizes(foodIds: string[]): Promise<Map<string, typeof servingSizes.$inferSelect[]>> {
  if (foodIds.length === 0) return new Map();
  const rows = await db.select().from(servingSizes).where(
    inArray(servingSizes.foodId, foodIds)
  );
  const map = new Map<string, typeof servingSizes.$inferSelect[]>();
  for (const row of rows) {
    const list = map.get(row.foodId) ?? [];
    list.push(row);
    map.set(row.foodId, list);
  }
  return map;
}

// ── Ranking ────────────────────────────────────────────────────────────────
// Pure function: sorts search results by priority.
// Priority: recently logged > exact name match > verified (USDA) > generic > branded.

export function rankSearchResults(
  items: FoodSearchItem[],
  q: string,
  recentIds: Set<string>
): FoodSearchItem[] {
  const qLower = q.toLowerCase().trim();
  return [...items].sort((a, b) => {
    // 1. Recently logged by this user
    const aRecent = recentIds.has(a.id) ? 0 : 1;
    const bRecent = recentIds.has(b.id) ? 0 : 1;
    if (aRecent !== bRecent) return aRecent - bRecent;

    // 2. Exact name match
    const aExact = a.name.toLowerCase() === qLower ? 0 : 1;
    const bExact = b.name.toLowerCase() === qLower ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;

    // 3. Verified (USDA generic foods)
    const aVer = a.verified ? 0 : 1;
    const bVer = b.verified ? 0 : 1;
    if (aVer !== bVer) return aVer - bVer;

    // 4. Generic before branded
    const aBranded = a.brandName ? 1 : 0;
    const bBranded = b.brandName ? 1 : 0;
    return aBranded - bBranded;
  });
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function searchFoods(params: {
  q: string;
  limit: number;
  offset: number;
  userId?: string;
}): Promise<{ items: FoodSearchItem[]; total: number }> {
  const { q, limit, offset, userId } = params;
  const trimmed = q.trim();

  // Use stored search_vector (GIN index) for full-text search.
  // For short/single-word queries, add trigram similarity (pg_trgm) for typo tolerance.
  const isMultiWord = trimmed.split(/\s+/).length >= 2;

  const ftsCondition = sql`${foods}.search_vector @@ websearch_to_tsquery('english', ${trimmed})`;
  // Use % operator (GIN-indexed) instead of similarity() function (seq scan)
  const trgmCondition = sql`${foods.name} % ${trimmed}`;
  // Multi-language: match nameTranslations JSONB values
  const translationCondition = sql`(${foods.nameTranslations})::text ILIKE ${"%" + trimmed + "%"}`;

  const searchCond = isMultiWord
    ? or(ftsCondition, translationCondition)
    : or(ftsCondition, trgmCondition, translationCondition);

  // Order by relevance: ts_rank for FTS, similarity for trigram
  const rankExpr = isMultiWord
    ? sql`ts_rank(${foods}.search_vector, websearch_to_tsquery('english', ${trimmed}))`
    : sql`GREATEST(
        ts_rank(${foods}.search_vector, websearch_to_tsquery('english', ${trimmed})),
        similarity(${foods.name}, ${trimmed})
      )`;

  const rows = await db
    .select({ food: foods, total: sql<number>`count(*) OVER()` })
    .from(foods)
    .where(searchCond)
    .orderBy(sql`${rankExpr} DESC`)
    .limit(limit)
    .offset(offset);

  const total = rows.length > 0 ? Number(rows[0].total) : 0;
  const foodRows = rows.map(r => r.food);
  const ssMap = await loadServingSizes(foodRows.map((r) => r.id));

  // Get user's recently logged food IDs for ranking boost
  let recentIds = new Set<string>();
  if (userId) {
    const recentEntries = await db
      .selectDistinct({ foodId: mealEntries.foodId })
      .from(mealEntries)
      .where(and(
        eq(mealEntries.userId, userId),
        isNotNull(mealEntries.foodId)
      ))
      .orderBy(desc(mealEntries.loggedAt))
      .limit(20);
    recentIds = new Set(
      recentEntries.map(e => e.foodId).filter((id): id is string => id !== null)
    );
  }

  const items = foodRows.map((r) => rowToSearchItem(r, ssMap.get(r.id) ?? []));
  const ranked = rankSearchResults(items, q, recentIds);

  return { items: ranked, total };
}

// ── Detail ─────────────────────────────────────────────────────────────────

export async function getFoodById(id: string): Promise<(FoodSearchItem & { micronutrients: unknown; sugarPer100g: number | null; sodiumMgPer100g: number | null; verified: boolean }) | null> {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) return null;

  const ssList = await db.select().from(servingSizes).where(eq(servingSizes.foodId, id));
  return {
    ...rowToSearchItem(food, ssList),
    micronutrients: food.micronutrients,
    sugarPer100g: food.sugarPer100g ? toNumber(food.sugarPer100g) : null,
    sodiumMgPer100g: food.sodiumMgPer100g ? toNumber(food.sodiumMgPer100g) : null,
    verified: food.verified,
  };
}

// ── Recent ─────────────────────────────────────────────────────────────────
// Returns last 20 distinct foods logged by userId, ordered by most recent log.

export async function getRecentFoods(userId: string, limit: number): Promise<FoodSearchItem[]> {
  // Query meal_entries for user's recently logged food IDs (distinct, most recent first)
  const recentEntries = await db
    .selectDistinct({ foodId: mealEntries.foodId })
    .from(mealEntries)
    .where(and(
      eq(mealEntries.userId, userId),
      isNotNull(mealEntries.foodId)
    ))
    .orderBy(desc(mealEntries.loggedAt))
    .limit(limit);

  const foodIds = recentEntries
    .map(e => e.foodId)
    .filter((id): id is string => id !== null);

  if (foodIds.length === 0) return [];

  const rows = await db.select().from(foods).where(inArray(foods.id, foodIds));

  // Restore recency order (DB may return in any order)
  const orderMap = new Map(foodIds.map((id, i) => [id, i]));
  rows.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));

  const ssMap = await loadServingSizes(rows.map((r) => r.id));
  return rows.map((r) => rowToSearchItem(r, ssMap.get(r.id) ?? []));
}

// ── Favorites ─────────────────────────────────────────────────────────────

export async function getFavoriteFoods(userId: string): Promise<FoodSearchItem[]> {
  const favs = await db
    .select({ food: foods })
    .from(foodFavorites)
    .innerJoin(foods, eq(foodFavorites.foodId, foods.id))
    .where(eq(foodFavorites.userId, userId))
    .orderBy(desc(foodFavorites.createdAt));

  const rows = favs.map((r) => r.food);
  const ssMap = await loadServingSizes(rows.map((r) => r.id));
  return rows.map((r) => rowToSearchItem(r, ssMap.get(r.id) ?? []));
}

export async function addFavorite(userId: string, foodId: string): Promise<void> {
  await db.insert(foodFavorites).values({ userId, foodId }).onConflictDoNothing();
}

export async function removeFavorite(userId: string, foodId: string): Promise<void> {
  await db.delete(foodFavorites).where(
    and(eq(foodFavorites.userId, userId), eq(foodFavorites.foodId, foodId))
  );
}

// ── Barcode ────────────────────────────────────────────────────────────────

export async function getFoodByBarcode(barcode: string): Promise<FoodSearchItem | null> {
  const [food] = await db.select().from(foods).where(eq(foods.barcode, barcode));
  if (!food) return null;
  const ssList = await db.select().from(servingSizes).where(eq(servingSizes.foodId, food.id));
  return rowToSearchItem(food, ssList);
}

export async function fetchFoodFromOpenFoodFacts(barcode: string): Promise<FoodSearchItem | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,nutriments,serving_size`
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        nutriments?: Record<string, number>;
        serving_size?: string;
      };
    };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    const id = `off-${barcode}`;
    const servingSizeWeightG = parseFloat(p.serving_size ?? "100") || 100;

    return {
      id,
      name: p.product_name ?? "Unknown",
      brandName: p.brands ?? null,
      caloriesPer100g: toNumber(n["energy-kcal_100g"]),
      proteinPer100g: toNumber(n["proteins_100g"]),
      carbsPer100g: toNumber(n["carbohydrates_100g"]),
      fatPer100g: toNumber(n["fat_100g"]),
      fiberPer100g: toNumber(n["fiber_100g"]),
      servingSizes: [{ id: `${id}-ss0`, label: p.serving_size ?? "100g", weightG: servingSizeWeightG }],
      source: "open_food_facts",
    };
  } catch {
    return null;
  }
}

// ── Custom Food CRUD ───────────────────────────────────────────────────────

export async function createCustomFood(userId: string, dto: CreateFoodDto): Promise<FoodSearchItem & { source: string; createdByUserId: string }> {
  const id = randomUUID();
  const ssId = `${id}-ss0`;

  await db.insert(foods).values({
    id,
    name: dto.name,
    brandName: dto.brandName ?? null,
    source: "user_created",
    createdByUserId: userId,
    caloriesPer100g: String(dto.caloriesPer100g),
    proteinPer100g: String(dto.proteinPer100g),
    carbsPer100g: String(dto.carbsPer100g),
    fatPer100g: String(dto.fatPer100g),
    fiberPer100g: String(dto.fiberPer100g),
    sugarPer100g: dto.sugarPer100g != null ? String(dto.sugarPer100g) : null,
    sodiumMgPer100g: dto.sodiumMgPer100g != null ? String(dto.sodiumMgPer100g) : null,
    defaultServingId: ssId,
    nameTranslations: {},
    micronutrients: {},
    verified: false,
    updatedAt: new Date(),
  });

  await db.insert(servingSizes).values({
    id: ssId,
    foodId: id,
    label: dto.servingSizeLabel,
    weightG: String(dto.servingSizeWeightG),
  });

  return {
    id,
    name: dto.name,
    brandName: dto.brandName ?? null,
    caloriesPer100g: dto.caloriesPer100g,
    proteinPer100g: dto.proteinPer100g,
    carbsPer100g: dto.carbsPer100g,
    fatPer100g: dto.fatPer100g,
    fiberPer100g: dto.fiberPer100g,
    servingSizes: [{ id: ssId, label: dto.servingSizeLabel, weightG: dto.servingSizeWeightG }],
    source: "user_created",
    createdByUserId: userId,
  };
}

export async function updateCustomFood(id: string, userId: string, dto: UpdateFoodDto): Promise<FoodSearchItem> {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) throw Object.assign(new Error("Not found"), { code: "not_found" });
  if (food.createdByUserId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  const updates: Partial<typeof foods.$inferInsert> = { updatedAt: new Date() };
  if (dto.name !== undefined) updates.name = dto.name;
  if (dto.brandName !== undefined) updates.brandName = dto.brandName ?? null;
  if (dto.caloriesPer100g !== undefined) updates.caloriesPer100g = String(dto.caloriesPer100g);
  if (dto.proteinPer100g !== undefined) updates.proteinPer100g = String(dto.proteinPer100g);
  if (dto.carbsPer100g !== undefined) updates.carbsPer100g = String(dto.carbsPer100g);
  if (dto.fatPer100g !== undefined) updates.fatPer100g = String(dto.fatPer100g);
  if (dto.fiberPer100g !== undefined) updates.fiberPer100g = String(dto.fiberPer100g);

  await db.update(foods).set(updates).where(eq(foods.id, id));

  const ssList = await db.select().from(servingSizes).where(eq(servingSizes.foodId, id));
  return rowToSearchItem({ ...food, ...updates } as typeof foods.$inferSelect, ssList);
}

export async function deleteCustomFood(id: string, userId: string): Promise<void> {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) throw Object.assign(new Error("Not found"), { code: "not_found" });
  if (food.createdByUserId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });
  await db.delete(foods).where(eq(foods.id, id));
}
