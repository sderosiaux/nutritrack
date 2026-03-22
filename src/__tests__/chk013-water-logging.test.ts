/**
 * CHK-013: Water entry API — POST/DELETE /api/v1/logs/:date/water
 * Tests real log-service functions (only @/server/db mocked).
 * Verifies: create, delete ownership, list by date.
 * Source: spec/07-api.md §Meal Logging
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
  const waterEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at", amountMl: "amount_ml",
  };
  const mealEntries = {
    id: "id", userId: "user_id", date: "date", mealSlot: "meal_slot",
    loggedAt: "logged_at", foodId: "food_id", servingSizeId: "serving_size_id",
    quantityG: "quantity_g", servingLabel: "serving_label",
    caloriesKcal: "calories_kcal", proteinG: "protein_g",
    carbsG: "carbs_g", fatG: "fat_g", fiberG: "fiber_g",
    source: "source", notes: "notes",
  };
  const foods = {
    id: "id", name: "name", caloriesPer100g: "calories_per_100g",
    proteinPer100g: "protein_per_100g", carbsPer100g: "carbs_per_100g",
    fatPer100g: "fat_per_100g", fiberPer100g: "fiber_per_100g",
  };
  const servingSizes = { id: "id", foodId: "food_id", label: "label", weightG: "weight_g" };
  return { db, waterEntries, mealEntries, foods, servingSizes };
});

import { db } from "@/server/db";
import { createWaterEntry, deleteWaterEntry, getWaterEntries } from "@/server/services/log-service";

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
const OTHER_USER_ID = "user-xyz";
const DATE = "2025-03-15";

const WATER_ROW = {
  id: "water-1",
  userId: USER_ID,
  date: DATE,
  loggedAt: new Date(),
  amountMl: 250,
};

describe("CHK-013: createWaterEntry", () => {
  beforeEach(() => vi.resetAllMocks());

  it("creates water entry and returns it", async () => {
    const insertChain = makeChain([WATER_ROW]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const result = await createWaterEntry(USER_ID, DATE, 250);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(result.amountMl).toBe(250);
    expect(result.userId).toBe(USER_ID);
  });

  it("rejects negative amountMl", async () => {
    await expect(createWaterEntry(USER_ID, DATE, -100))
      .rejects.toMatchObject({ code: "validation_error" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects zero amountMl", async () => {
    await expect(createWaterEntry(USER_ID, DATE, 0))
      .rejects.toMatchObject({ code: "validation_error" });
  });
});

describe("CHK-013: deleteWaterEntry — ownership enforcement", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws 'forbidden' when caller does not own the entry", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([WATER_ROW]) as never);

    await expect(deleteWaterEntry("water-1", OTHER_USER_ID))
      .rejects.toMatchObject({ code: "forbidden" });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws 'not_found' when entry does not exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(deleteWaterEntry("missing", USER_ID))
      .rejects.toMatchObject({ code: "not_found" });
  });

  it("deletes entry when owner is caller", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([WATER_ROW]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    await expect(deleteWaterEntry("water-1", USER_ID)).resolves.toBeUndefined();
    expect(db.delete).toHaveBeenCalledTimes(1);
  });
});

describe("CHK-013: getWaterEntries — list for a date", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns water entries for the given date", async () => {
    const rows = [WATER_ROW, { ...WATER_ROW, id: "water-2", amountMl: 500 }];
    vi.mocked(db.select).mockReturnValueOnce(makeChain(rows) as never);

    const result = await getWaterEntries(USER_ID, DATE);
    expect(result).toHaveLength(2);
    expect(result[0].amountMl).toBe(250);
    expect(result[1].amountMl).toBe(500);
  });

  it("returns empty array when no water logged for date", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    const result = await getWaterEntries(USER_ID, DATE);
    expect(result).toHaveLength(0);
  });
});

// ── Route-level tests ──────────────────────────────────────────────────────

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("CHK-013: POST /api/v1/logs/:date/water — route validation", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns 422 when amountMl is missing and user is authenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: USER_ID, email: "test@test.com", name: "Test" },
      session: { id: "sess-1", userId: USER_ID, expiresAt: new Date() },
    } as never);

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/2025-03-15/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(422);
  });

  it("returns 401 when no session", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/2025-03-15/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl: 250 }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 for GET /water?date=... when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);

    const { app } = await import("@/server/api/index");

    const res = await app.request("/api/v1/logs/water?date=2025-03-15");
    expect(res.status).toBe(401);
  });
});
