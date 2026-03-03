/**
 * Food database service: search, detail, favorites, barcode, custom CRUD.
 */
import { db, foods, servingSizes, foodFavorites } from "@/server/db";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
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
  };
}

async function loadServingSizes(foodIds: string[]): Promise<Map<string, typeof servingSizes.$inferSelect[]>> {
  if (foodIds.length === 0) return new Map();
  const rows = await db.select().from(servingSizes).where(
    sql`${servingSizes.foodId} = ANY(ARRAY[${sql.join(foodIds.map(id => sql`${id}`), sql`, `)}]::text[])`
  );
  const map = new Map<string, typeof servingSizes.$inferSelect[]>();
  for (const row of rows) {
    const list = map.get(row.foodId) ?? [];
    list.push(row);
    map.set(row.foodId, list);
  }
  return map;
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function searchFoods(params: {
  q: string;
  limit: number;
  offset: number;
  userId?: string;
}): Promise<{ items: FoodSearchItem[]; total: number }> {
  const { q, limit, offset } = params;
  const pattern = `%${q}%`;

  const rows = await db
    .select()
    .from(foods)
    .where(
      or(
        ilike(foods.name, pattern),
        ilike(foods.brandName, pattern)
      )
    )
    .orderBy(desc(foods.verified), desc(foods.createdAt))
    .limit(limit)
    .offset(offset);

  const countRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(foods)
    .where(or(ilike(foods.name, pattern), ilike(foods.brandName, pattern)));

  const total = Number(countRow[0]?.count ?? 0);
  const ssMap = await loadServingSizes(rows.map((r) => r.id));

  return {
    items: rows.map((r) => rowToSearchItem(r, ssMap.get(r.id) ?? [])),
    total,
  };
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

export async function getRecentFoods(userId: string, limit: number): Promise<FoodSearchItem[]> {
  // Delegate to meal_entries for recency — for now returns most recently added foods
  const rows = await db
    .select()
    .from(foods)
    .orderBy(desc(foods.createdAt))
    .limit(limit);

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
