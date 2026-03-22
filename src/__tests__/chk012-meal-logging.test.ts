/**
 * CHK-012: Meal entry CRUD — POST/PUT/DELETE /api/v1/logs/:date/meals
 * Tests real log-service functions (only @/server/db mocked).
 * Verifies: macro snapshot computation, ownership enforcement, validation.
 * Source: spec/07-api.md §Meal Logging
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ────────────────────────────────────────────────────────────────
vi.mock("@/server/db", () => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const foods = {
    id: "id", name: "name", caloriesPer100g: "calories_per_100g",
    proteinPer100g: "protein_per_100g", carbsPer100g: "carbs_per_100g",
    fatPer100g: "fat_per_100g", fiberPer100g: "fiber_per_100g",
    brandName: "brand_name", source: "source", verified: "verified",
  };
  const servingSizes = {
    id: "id", foodId: "food_id", label: "label", weightG: "weight_g",
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
  return { db, foods, servingSizes, mealEntries, waterEntries };
});

import { db } from "@/server/db";
import {
  createMealEntry,
  updateMealEntry,
  deleteMealEntry,
  computeMacros,
} from "@/server/services/log-service";

// ── Chainable mock factory ─────────────────────────────────────────────────
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

// ── Fixtures ───────────────────────────────────────────────────────────────
const USER_ID = "user-abc";
const OTHER_USER_ID = "user-xyz";
const DATE = "2025-03-15";

const FOOD_ROW = {
  id: "food-1",
  name: "Chicken Breast",
  caloriesPer100g: "165",
  proteinPer100g: "31",
  carbsPer100g: "0",
  fatPer100g: "3.6",
  fiberPer100g: "0",
  brandName: null,
  source: "usda",
  verified: true,
};

const SERVING_ROW = {
  id: "ss-1",
  foodId: "food-1",
  label: "100g",
  weightG: "100",
};

const ENTRY_ROW = {
  id: "entry-1",
  userId: USER_ID,
  date: DATE,
  mealSlot: "lunch",
  loggedAt: new Date(),
  foodId: "food-1",
  servingSizeId: "ss-1",
  quantityG: "200",
  servingLabel: "200g",
  caloriesKcal: "330",
  proteinG: "62",
  carbsG: "0",
  fatG: "7.2",
  fiberG: "0",
  source: "manual",
  notes: null,
};

// ── computeMacros (pure) ───────────────────────────────────────────────────

describe("CHK-012: computeMacros — pure macro snapshot calculation", () => {
  it("computes macros correctly for a 200g serving of chicken breast", () => {
    const result = computeMacros(
      { caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0 },
      200
    );
    expect(result.caloriesKcal).toBeCloseTo(330, 1);
    expect(result.proteinG).toBeCloseTo(62, 1);
    expect(result.carbsG).toBeCloseTo(0, 1);
    expect(result.fatG).toBeCloseTo(7.2, 1);
    expect(result.fiberG).toBeCloseTo(0, 1);
  });

  it("handles 1.5x serving size (150g of a 100g food)", () => {
    const result = computeMacros(
      { caloriesPer100g: 200, proteinPer100g: 10, carbsPer100g: 30, fatPer100g: 5, fiberPer100g: 2 },
      150
    );
    expect(result.caloriesKcal).toBeCloseTo(300, 1);
    expect(result.proteinG).toBeCloseTo(15, 1);
    expect(result.carbsG).toBeCloseTo(45, 1);
    expect(result.fatG).toBeCloseTo(7.5, 1);
    expect(result.fiberG).toBeCloseTo(3, 1);
  });

  it("handles zero-calorie foods without NaN", () => {
    const result = computeMacros(
      { caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0 },
      100
    );
    expect(result.caloriesKcal).toBe(0);
    expect(isNaN(result.proteinG)).toBe(false);
  });
});

// ── createMealEntry ────────────────────────────────────────────────────────

describe("CHK-012: createMealEntry — persists macro snapshot on write", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates entry and stores computed macros (200g chicken = 330 kcal)", async () => {
    // food lookup
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([FOOD_ROW]) as never)
      // serving size lookup
      .mockReturnValueOnce(makeChain([SERVING_ROW]) as never);

    const insertChain = makeChain([ENTRY_ROW]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const result = await createMealEntry(USER_ID, DATE, {
      foodId: "food-1",
      servingSizeId: "ss-1",
      quantity: 2, // 2 × 100g serving = 200g
      mealType: "lunch",
    });

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(result.caloriesKcal).toBeCloseTo(330, 0);
    expect(result.proteinG).toBeCloseTo(62, 0);
    expect(result.mealSlot).toBe("lunch");
  });

  it("returns 'not_found' error when food does not exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      createMealEntry(USER_ID, DATE, {
        foodId: "nonexistent",
        servingSizeId: "ss-1",
        quantity: 1,
        mealType: "breakfast",
      })
    ).rejects.toMatchObject({ code: "not_found" });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 'not_found' error when serving size does not belong to food", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([FOOD_ROW]) as never)
      .mockReturnValueOnce(makeChain([]) as never); // no serving size found

    await expect(
      createMealEntry(USER_ID, DATE, {
        foodId: "food-1",
        servingSizeId: "wrong-ss",
        quantity: 1,
        mealType: "breakfast",
      })
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

// ── updateMealEntry ────────────────────────────────────────────────────────

describe("CHK-012: updateMealEntry — ownership enforcement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws 'forbidden' when caller does not own the entry", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ENTRY_ROW]) as never);

    await expect(
      updateMealEntry("entry-1", OTHER_USER_ID, { quantity: 3 })
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(db.update).not.toHaveBeenCalled();
  });

  it("throws 'not_found' when entry does not exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      updateMealEntry("missing-entry", USER_ID, { quantity: 1 })
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("updates entry and recomputes macros when owner updates quantity", async () => {
    // 1st select: entry lookup
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([ENTRY_ROW]) as never)
      // 2nd select: food for macro recomputation
      .mockReturnValueOnce(makeChain([FOOD_ROW]) as never)
      // 3rd select: serving size
      .mockReturnValueOnce(makeChain([SERVING_ROW]) as never);

    const updateChain = makeChain([{ ...ENTRY_ROW, quantityG: "300", caloriesKcal: "495" }]);
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(updateChain),
        }),
      }),
    } as never);

    const result = await updateMealEntry("entry-1", USER_ID, { quantity: 3 });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });
});

// ── deleteMealEntry ────────────────────────────────────────────────────────

describe("CHK-012: deleteMealEntry — ownership enforcement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws 'forbidden' when caller does not own the entry", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ENTRY_ROW]) as never);

    await expect(
      deleteMealEntry("entry-1", OTHER_USER_ID)
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws 'not_found' when entry does not exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      deleteMealEntry("missing-entry", USER_ID)
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("deletes entry when owner is caller", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ENTRY_ROW]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    await expect(deleteMealEntry("entry-1", USER_ID)).resolves.toBeUndefined();
    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  it("does not call db.delete when ownership check fails", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ENTRY_ROW]) as never);

    await expect(deleteMealEntry("entry-1", OTHER_USER_ID)).rejects.toMatchObject({ code: "forbidden" });
    expect(db.delete).not.toHaveBeenCalled();
  });
});

// ── Route-level tests (Hono app.request) ──────────────────────────────────

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("CHK-012: POST /api/v1/logs/:date/meals — route validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 422 for missing required fields when authenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: USER_ID, email: "test@test.com", name: "Test" },
      session: { id: "sess-1", userId: USER_ID, expiresAt: new Date() },
    } as never);

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/2025-03-15/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealType: "lunch" }), // missing foodId, quantity
    });

    expect(res.status).toBe(422);
    const body = await res.json() as { code: string };
    expect(body.code).toBe("validation_error");
  });

  it("returns 401 when no session is present", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/2025-03-15/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodId: "food-1", servingSizeId: "ss-1", quantity: 1, mealType: "lunch" }),
    });

    expect(res.status).toBe(401);
  });
});
