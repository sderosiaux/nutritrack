/**
 * CHK-014: Daily log aggregate — GET /api/v1/logs/:date
 * Tests real log-service getDailyLog function (only @/server/db mocked).
 * Verifies: macro totals, water totals, meals grouped by slot, entry shape.
 * Source: spec/07-api.md §Daily Log Response
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const mealEntries = {
    id: "id", userId: "user_id", date: "date", mealSlot: "meal_slot",
    loggedAt: "logged_at", foodId: "food_id", servingSizeId: "serving_size_id",
    quantityG: "quantity_g", servingLabel: "serving_label",
    caloriesKcal: "calories_kcal", proteinG: "protein_g",
    carbsG: "carbs_g", fatG: "fat_g", fiberG: "fiber_g",
    source: "source", notes: "notes",
  };
  const waterEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at", amountMl: "amount_ml",
  };
  const foods = {
    id: "id", name: "name", caloriesPer100g: "calories_per_100g",
    proteinPer100g: "protein_per_100g", carbsPer100g: "carbs_per_100g",
    fatPer100g: "fat_per_100g", fiberPer100g: "fiber_per_100g",
    brandName: "brand_name",
  };
  const servingSizes = { id: "id", foodId: "food_id", label: "label", weightG: "weight_g" };
  return { db, mealEntries, waterEntries, foods, servingSizes };
});

import { db } from "@/server/db";
import { getDailyLog } from "@/server/services/log-service";

function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "innerJoin", "leftJoin", "orderBy",
    "limit", "offset", "set", "values", "returning", "onConflictDoNothing"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  return chain;
}

const USER_ID = "user-abc";
const DATE = "2025-03-15";

// Meal entries for 2 different slots
const MEAL_ROWS = [
  {
    id: "entry-1",
    userId: USER_ID,
    date: DATE,
    mealSlot: "breakfast",
    loggedAt: new Date(),
    foodId: "food-1",
    servingSizeId: "ss-1",
    quantityG: "100",
    servingLabel: "100g",
    caloriesKcal: "165",
    proteinG: "31",
    carbsG: "0",
    fatG: "3.6",
    fiberG: "0",
    source: "manual",
    notes: null,
    // joined food fields
    foodName: "Chicken Breast",
    foodBrandName: null,
    servingSizeLabel: "100g",
    servingSizeWeightG: "100",
  },
  {
    id: "entry-2",
    userId: USER_ID,
    date: DATE,
    mealSlot: "lunch",
    loggedAt: new Date(),
    foodId: "food-2",
    servingSizeId: "ss-2",
    quantityG: "50",
    servingLabel: "1/2 cup",
    caloriesKcal: "90",
    proteinG: "3",
    carbsG: "17",
    fatG: "1",
    fiberG: "3",
    source: "manual",
    notes: null,
    foodName: "Brown Rice",
    foodBrandName: null,
    servingSizeLabel: "1/2 cup",
    servingSizeWeightG: "50",
  },
];

const WATER_ROWS = [
  { id: "water-1", userId: USER_ID, date: DATE, loggedAt: new Date(), amountMl: 250 },
  { id: "water-2", userId: USER_ID, date: DATE, loggedAt: new Date(), amountMl: 500 },
];

describe("CHK-014: getDailyLog — aggregate computation", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns correct macro totals from meal entries", async () => {
    // 1st select: meal entries with food join
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(MEAL_ROWS) as never)
      // 2nd select: water entries
      .mockReturnValueOnce(makeChain(WATER_ROWS) as never);

    const result = await getDailyLog(USER_ID, DATE);

    // Total calories: 165 + 90 = 255
    expect(result.totalCalories).toBeCloseTo(255, 0);
    // Total protein: 31 + 3 = 34
    expect(result.totalProtein).toBeCloseTo(34, 0);
    // Total carbs: 0 + 17 = 17
    expect(result.totalCarbs).toBeCloseTo(17, 0);
    // Total fat: 3.6 + 1 = 4.6
    expect(result.totalFat).toBeCloseTo(4.6, 0);
    // Total fiber: 0 + 3 = 3
    expect(result.totalFiber).toBeCloseTo(3, 0);
  });

  it("returns correct water total", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(MEAL_ROWS) as never)
      .mockReturnValueOnce(makeChain(WATER_ROWS) as never);

    const result = await getDailyLog(USER_ID, DATE);

    // Total water: 250 + 500 = 750 ml
    expect(result.waterMl).toBe(750);
  });

  it("groups entries by mealType (slot)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(MEAL_ROWS) as never)
      .mockReturnValueOnce(makeChain(WATER_ROWS) as never);

    const result = await getDailyLog(USER_ID, DATE);

    // Two slots: breakfast and lunch
    expect(result.meals).toHaveLength(2);
    const breakfastSlot = result.meals.find(m => m.mealType === "breakfast");
    const lunchSlot = result.meals.find(m => m.mealType === "lunch");
    expect(breakfastSlot).toBeDefined();
    expect(lunchSlot).toBeDefined();
    expect(breakfastSlot!.entries).toHaveLength(1);
    expect(lunchSlot!.entries).toHaveLength(1);
  });

  it("each meal entry includes required fields (id, foodName, calories, macros, etc.)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(MEAL_ROWS) as never)
      .mockReturnValueOnce(makeChain(WATER_ROWS) as never);

    const result = await getDailyLog(USER_ID, DATE);
    const entry = result.meals[0].entries[0];

    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("foodId");
    expect(entry).toHaveProperty("foodName");
    expect(entry).toHaveProperty("calories");
    expect(entry).toHaveProperty("protein");
    expect(entry).toHaveProperty("carbs");
    expect(entry).toHaveProperty("fat");
    expect(entry).toHaveProperty("fiber");
    expect(entry).toHaveProperty("quantity");
    expect(entry).toHaveProperty("mealType");
    expect(entry).toHaveProperty("loggedAt");
  });

  it("returns empty meals and zero totals when no entries logged", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([]) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await getDailyLog(USER_ID, DATE);

    expect(result.meals).toHaveLength(0);
    expect(result.totalCalories).toBe(0);
    expect(result.totalProtein).toBe(0);
    expect(result.waterMl).toBe(0);
  });

  it("returns date in response", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(MEAL_ROWS) as never)
      .mockReturnValueOnce(makeChain(WATER_ROWS) as never);

    const result = await getDailyLog(USER_ID, DATE);
    expect(result.date).toBe(DATE);
  });

  it("single slot with multiple entries sums correctly", async () => {
    const multipleInBreakfast = [
      { ...MEAL_ROWS[0] },
      { ...MEAL_ROWS[0], id: "entry-3", caloriesKcal: "200", proteinG: "10" },
    ];

    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain(multipleInBreakfast) as never)
      .mockReturnValueOnce(makeChain([]) as never);

    const result = await getDailyLog(USER_ID, DATE);
    expect(result.meals).toHaveLength(1);
    expect(result.meals[0].entries).toHaveLength(2);
    expect(result.totalCalories).toBeCloseTo(365, 0); // 165 + 200
  });
});

// ── Route-level tests ──────────────────────────────────────────────────────

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("CHK-014: GET /api/v1/logs/:date — route auth", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/2025-03-15");
    expect(res.status).toBe(401);
  });

  it("returns 200 with DailyLog shape when authenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: USER_ID, email: "test@test.com", name: "Test" },
      session: { id: "sess-1", userId: USER_ID, expiresAt: new Date() },
    } as never);

    // Mock the DB calls that getDailyLog makes
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([]) as never)  // meal entries
      .mockReturnValueOnce(makeChain([]) as never); // water entries

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/2025-03-15");

    expect(res.status).toBe(200);
    const body = await res.json() as { date: string; totalCalories: number; meals: unknown[] };
    expect(body).toHaveProperty("date");
    expect(body).toHaveProperty("totalCalories");
    expect(body).toHaveProperty("meals");
  });
});
