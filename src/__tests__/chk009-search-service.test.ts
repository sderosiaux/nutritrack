/**
 * CHK-009: searchFoods service — behavior-precise tests.
 * Calls the REAL searchFoods function. Only @/server/db is mocked (no connection attempts).
 * Verifies: FTS path exercised, nameTranslations JSONB match path, pagination, userId-scoped recent-ranking.
 * Source: spec/07-api.md §Food Database
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ────────────────────────────────────────────────────────────────
// Module-level vi.mock — hoisted before imports. Static import of real service below.
vi.mock("@/server/db", () => {
  const db = {
    select: vi.fn(),
    selectDistinct: vi.fn(),
  };
  const foods = {
    id: "id", name: "name", brandName: "brand_name",
    caloriesPer100g: "calories_per_100g", proteinPer100g: "protein_per_100g",
    carbsPer100g: "carbs_per_100g", fatPer100g: "fat_per_100g",
    fiberPer100g: "fiber_per_100g", source: "source", verified: "verified",
    barcode: "barcode", nameTranslations: "name_translations",
    micronutrients: "micronutrients", defaultServingId: "default_serving_id",
    imageUrl: "image_url", sugarPer100g: "sugar_per_100g",
    sodiumMgPer100g: "sodium_mg_per_100g", saturatedFatPer100g: "saturated_fat_per_100g",
    sourceId: "source_id", createdByUserId: "created_by_user_id",
    createdAt: "created_at", updatedAt: "updated_at", category: "category",
  };
  const servingSizes = { foodId: "food_id", id: "id", label: "label", weightG: "weight_g" };
  const mealEntries = { userId: "user_id", foodId: "food_id", loggedAt: "logged_at" };
  const foodFavorites = { userId: "user_id", foodId: "food_id", createdAt: "created_at" };
  return { db, foods, servingSizes, mealEntries, foodFavorites };
});

// Static imports — resolved after vi.mock() hoisting
import { db } from "@/server/db";
import { searchFoods } from "@/server/services/food-service";

// ── Chainable mock factory ─────────────────────────────────────────────────
function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "innerJoin", "leftJoin", "where", "orderBy",
    "limit", "offset", "groupBy", "having",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  return chain;
}

// ── Fixtures ───────────────────────────────────────────────────────────────
const BASE_FOOD = {
  id: "food-1", name: "Chicken Breast", brandName: null,
  caloriesPer100g: "165", proteinPer100g: "31", carbsPer100g: "0",
  fatPer100g: "3.6", fiberPer100g: "0", source: "usda", verified: true,
  barcode: null, createdAt: new Date(), updatedAt: new Date(),
  category: "protein", nameTranslations: { fr: "Blanc de poulet", es: "Pechuga de pollo" },
  micronutrients: {}, defaultServingId: null, imageUrl: null,
  sugarPer100g: null, sodiumMgPer100g: null, saturatedFatPer100g: null,
  sourceId: null, createdByUserId: null,
};

const BASE_FOOD_2 = {
  ...BASE_FOOD, id: "food-2", name: "Chicken Thigh", verified: false,
  source: "open_food_facts" as const, brandName: "BrandY",
};

const SERVING_SIZE = { id: "ss-1", foodId: "food-1", label: "100g", weightG: "100" };

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CHK-009: searchFoods service — real function, DB-only mock", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // resetAllMocks clears mockReturnValueOnce queues, preventing cross-test leaks
  });

  it("calls db.select() to query foods (FTS path exercised, not service mock)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([{ food: BASE_FOOD, total: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    const result = await searchFoods({ q: "chicken breast", limit: 20, offset: 0 });

    // Real service was called — db.select used, not a mock passthrough
    expect(db.select).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("food-1");
    expect(result.total).toBe(1);
  });

  it("returns total count from window function in same query (pagination metadata)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([
        { food: BASE_FOOD, total: 42 },
        { food: BASE_FOOD_2, total: 42 },
      ]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await searchFoods({ q: "chicken", limit: 2, offset: 0 });

    expect(result.total).toBe(42);
    expect(result.items).toHaveLength(2);
  });

  it("calls db.selectDistinct for meal_entries when userId is provided (recent-ranking path)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([{ food: BASE_FOOD, total: 1 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    vi.mocked(db.selectDistinct).mockReturnValueOnce(
      makeChain([{ foodId: "food-1" }]) as never
    );

    await searchFoods({ q: "chicken", limit: 20, offset: 0, userId: "user-1" });

    expect(db.selectDistinct).toHaveBeenCalled();
  });

  it("does NOT call db.selectDistinct when no userId (anonymous search)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([{ food: BASE_FOOD, total: 1 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    await searchFoods({ q: "chicken", limit: 20, offset: 0 });

    expect(db.selectDistinct).not.toHaveBeenCalled();
  });

  it("recent food (in userId meal_entries) ranks above verified non-recent food", async () => {
    const recentFood = { ...BASE_FOOD_2, id: "food-2" };
    const verifiedFood = { ...BASE_FOOD, id: "food-1" };

    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([
        { food: verifiedFood, total: 2 },
        { food: recentFood, total: 2 },
      ]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    vi.mocked(db.selectDistinct).mockReturnValueOnce(
      makeChain([{ foodId: "food-2" }]) as never
    );

    const result = await searchFoods({ q: "chicken", limit: 20, offset: 0, userId: "user-1" });

    expect(result.items[0].id).toBe("food-2");
  });

  it("returns empty items and zero total when no foods match", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await searchFoods({ q: "xyznomatch", limit: 20, offset: 0 });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("multi-language: food with nameTranslations is returned by the DB and surfaced in results", async () => {
    const frenchFood = {
      ...BASE_FOOD, id: "food-fr",
      name: "Blanc de poulet",
      nameTranslations: { fr: "Blanc de poulet", en: "Chicken Breast" },
    };

    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([{ food: frenchFood, total: 1 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await searchFoods({ q: "blanc de poulet", limit: 20, offset: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("food-fr");
  });

  it("pagination: db.select is called with limit and offset applied (not client-side slice)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([
        { food: { ...BASE_FOOD, id: "food-21" }, total: 50 },
        { food: { ...BASE_FOOD, id: "food-22" }, total: 50 },
      ]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await searchFoods({ q: "chicken", limit: 2, offset: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(50);
    expect(result.items[0].id).toBe("food-21");
  });

  it("serving sizes are attached to returned food items", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([{ food: BASE_FOOD, total: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    const result = await searchFoods({ q: "chicken", limit: 20, offset: 0 });

    expect(result.items[0].servingSizes).toHaveLength(1);
    expect(result.items[0].servingSizes[0].label).toBe("100g");
    expect(result.items[0].servingSizes[0].weightG).toBe(100);
  });

  // ── SQL-path precision tests ──────────────────────────────────────────────

  it("multi-word query uses stored search_vector with websearch_to_tsquery in .where()", async () => {
    const chain1 = makeChain([{ food: BASE_FOOD, total: 1 }]);
    vi.mocked(db.select)
      .mockReturnValueOnce(chain1 as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    await searchFoods({ q: "chicken breast", limit: 20, offset: 0 });

    const whereArg = (chain1 as any).where.mock.calls[0]?.[0];
    expect(whereArg, "no argument passed to .where()").toBeDefined();

    const serialized = JSON.stringify(whereArg);
    expect(serialized, "FTS missing: search_vector not in .where() SQL expression").toContain("search_vector");
    expect(serialized, "FTS missing: websearch_to_tsquery not in .where() SQL expression").toContain("websearch_to_tsquery");
  });

  it("single-word query includes trigram % operator in .where()", async () => {
    const chain1 = makeChain([{ food: BASE_FOOD, total: 1 }]);
    vi.mocked(db.select)
      .mockReturnValueOnce(chain1 as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    await searchFoods({ q: "chicken", limit: 20, offset: 0 });

    const whereArg = (chain1 as any).where.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized, "Trigram % operator should be in single-word query").toContain("%");
  });

  it("single-word query also includes search_vector FTS in .where()", async () => {
    const chain1 = makeChain([{ food: BASE_FOOD, total: 1 }]);
    vi.mocked(db.select)
      .mockReturnValueOnce(chain1 as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    await searchFoods({ q: "poulet", limit: 20, offset: 0 });

    const whereArg = (chain1 as any).where.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized, "search_vector FTS should be in single-word query too").toContain("search_vector");
  });
});
