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
      .mockReturnValueOnce(makeChain([BASE_FOOD]) as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    const result = await searchFoods({ q: "chicken breast", limit: 20, offset: 0 });

    // Real service was called — db.select used, not a mock passthrough
    expect(db.select).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("food-1");
    expect(result.total).toBe(1);
  });

  it("returns total count from second db.select() call (pagination metadata)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([BASE_FOOD, BASE_FOOD_2]) as never)
      .mockReturnValueOnce(makeChain([{ count: 42 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await searchFoods({ q: "chicken", limit: 2, offset: 0 });

    expect(result.total).toBe(42);
    expect(result.items).toHaveLength(2);
  });

  it("calls db.selectDistinct for meal_entries when userId is provided (recent-ranking path)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([BASE_FOOD]) as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    vi.mocked(db.selectDistinct).mockReturnValueOnce(
      makeChain([{ foodId: "food-1" }]) as never
    );

    await searchFoods({ q: "chicken", limit: 20, offset: 0, userId: "user-1" });

    // selectDistinct must be called to fetch recently-logged food IDs for ranking
    expect(db.selectDistinct).toHaveBeenCalled();
  });

  it("does NOT call db.selectDistinct when no userId (anonymous search)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([BASE_FOOD]) as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    await searchFoods({ q: "chicken", limit: 20, offset: 0 }); // no userId

    expect(db.selectDistinct).not.toHaveBeenCalled();
  });

  it("recent food (in userId meal_entries) ranks above verified non-recent food", async () => {
    // food-2 is less verified (branded), but is in user's recent meal_entries
    const recentFood = { ...BASE_FOOD_2, id: "food-2" };
    const verifiedFood = { ...BASE_FOOD, id: "food-1" };

    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([verifiedFood, recentFood]) as never)
      .mockReturnValueOnce(makeChain([{ count: 2 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    // food-2 is in the user's recent entries
    vi.mocked(db.selectDistinct).mockReturnValueOnce(
      makeChain([{ foodId: "food-2" }]) as never
    );

    const result = await searchFoods({ q: "chicken", limit: 20, offset: 0, userId: "user-1" });

    // Recent food should rank first even over verified food
    expect(result.items[0].id).toBe("food-2");
  });

  it("returns empty items and zero total when no foods match", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([]) as never)              // foods query: empty
      .mockReturnValueOnce(makeChain([{ count: 0 }]) as never); // count query: 0
    // No 3rd mock: loadServingSizes returns early when foodIds is empty

    const result = await searchFoods({ q: "xyznomatch", limit: 20, offset: 0 });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("multi-language: food with nameTranslations is returned by the DB and surfaced in results", async () => {
    // nameTranslations JSONB query happens at DB level; we verify the service
    // correctly surfaces a food that was returned by the DB for a non-English query.
    const frenchFood = {
      ...BASE_FOOD, id: "food-fr",
      name: "Blanc de poulet",
      nameTranslations: { fr: "Blanc de poulet", en: "Chicken Breast" },
    };

    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([frenchFood]) as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    // Query in French — DB (mocked) returns the food via nameTranslations JSONB match
    const result = await searchFoods({ q: "blanc de poulet", limit: 20, offset: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("food-fr");
  });

  it("pagination: db.select is called with limit and offset applied (not client-side slice)", async () => {
    // Return only a partial page — verifies pagination is DB-level
    const page2Foods = [
      { ...BASE_FOOD, id: "food-21" },
      { ...BASE_FOOD, id: "food-22" },
    ];

    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(page2Foods) as never)
      .mockReturnValueOnce(makeChain([{ count: 50 }]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await searchFoods({ q: "chicken", limit: 2, offset: 20 });

    // DB returns page 2 directly — service returned those items, not 50
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(50);
    expect(result.items[0].id).toBe("food-21");
  });

  it("serving sizes are attached to returned food items", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([BASE_FOOD]) as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    const result = await searchFoods({ q: "chicken", limit: 20, offset: 0 });

    expect(result.items[0].servingSizes).toHaveLength(1);
    expect(result.items[0].servingSizes[0].label).toBe("100g");
    expect(result.items[0].servingSizes[0].weightG).toBe(100);
  });

  // ── SQL-path precision tests ──────────────────────────────────────────────
  // These tests inspect the SQL expression passed to .where() to verify that
  // FTS and nameTranslations JSONB conditions are present in the generated query.
  // Without these tests, removing FTS/JSONB from the service wouldn't cause any failure.

  it("multi-word query passes FTS condition (to_tsvector/plainto_tsquery) to .where()", async () => {
    const chain1 = makeChain([BASE_FOOD]);
    vi.mocked(db.select)
      .mockReturnValueOnce(chain1 as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    await searchFoods({ q: "chicken breast", limit: 20, offset: 0 }); // 2 words → FTS path

    // chain1.where is a vi.fn() — first call receives the searchCond SQL expression
    const whereArg = (chain1 as any).where.mock.calls[0]?.[0];
    expect(whereArg, "no argument passed to .where()").toBeDefined();

    // Drizzle SQL objects serialize their queryChunks (StringChunk.value arrays + Param.value)
    const serialized = JSON.stringify(whereArg);
    expect(serialized, "FTS missing: to_tsvector not in .where() SQL expression").toContain("to_tsvector");
    expect(serialized, "FTS missing: plainto_tsquery not in .where() SQL expression").toContain("plainto_tsquery");
  });

  it("single-word query does NOT include FTS in .where() (ILIKE-only path)", async () => {
    const chain1 = makeChain([BASE_FOOD]);
    vi.mocked(db.select)
      .mockReturnValueOnce(chain1 as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    await searchFoods({ q: "chicken", limit: 20, offset: 0 }); // 1 word → ILIKE only

    const whereArg = (chain1 as any).where.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized, "Single-word query should not use FTS").not.toContain("to_tsvector");
  });

  it("nameTranslations JSONB cast condition is always present in .where() SQL", async () => {
    const chain1 = makeChain([BASE_FOOD]);
    vi.mocked(db.select)
      .mockReturnValueOnce(chain1 as never)
      .mockReturnValueOnce(makeChain([{ count: 1 }]) as never)
      .mockReturnValueOnce(makeChain([SERVING_SIZE]) as never);

    // French query — single word, so only ILIKE path, but nameTranslations must always be there
    await searchFoods({ q: "poulet", limit: 20, offset: 0 });

    const whereArg = (chain1 as any).where.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    // The JSONB cast expression `::text ILIKE` must appear in the SQL string chunks
    expect(serialized, "nameTranslations JSONB search condition missing from .where() SQL").toContain("::text ILIKE");
  });
});
