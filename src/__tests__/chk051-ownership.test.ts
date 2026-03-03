/**
 * CHK-051: updateCustomFood / deleteCustomFood — ownership enforcement.
 * Calls the REAL service functions. Only @/server/db is mocked (no connection attempts).
 * Verifies: forbidden when not owner, not_found when missing, success when owner.
 * Source: spec/07-api.md §Food Database — "own foods only"
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ────────────────────────────────────────────────────────────────
// Module-level vi.mock — hoisted before imports. Static import of real service below.
vi.mock("@/server/db", () => {
  const db = {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue([]) }),
    }),
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
import { updateCustomFood, deleteCustomFood } from "@/server/services/food-service";

// ── Chainable mock factory ─────────────────────────────────────────────────
function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "innerJoin", "leftJoin", "where", "orderBy", "limit", "offset", "set", "values"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  return chain;
}

// ── Food fixtures ──────────────────────────────────────────────────────────
const OWNER_ID = "user-owner";
const OTHER_USER_ID = "user-other";

const OWN_FOOD = {
  id: "food-custom-1",
  name: "My Protein Bar",
  brandName: "HomeChef",
  caloriesPer100g: "380",
  proteinPer100g: "28",
  carbsPer100g: "35",
  fatPer100g: "12",
  fiberPer100g: "5",
  source: "user_created",
  verified: false,
  barcode: null, createdAt: new Date(), updatedAt: new Date(),
  category: null, nameTranslations: {}, micronutrients: {},
  defaultServingId: "ss-c1", imageUrl: null, sugarPer100g: null,
  sodiumMgPer100g: null, saturatedFatPer100g: null, sourceId: null,
  createdByUserId: OWNER_ID,    // ← owned by OWNER_ID
};

// ── updateCustomFood tests ────────────────────────────────────────────────

describe("CHK-051: updateCustomFood — ownership enforcement (real service, DB-only mock)", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // clears mockReturnValueOnce queues between tests
  });

  it("throws error with code 'forbidden' when caller is not the food owner", async () => {
    // DB returns the food owned by OWNER_ID
    vi.mocked(db.select).mockReturnValueOnce(makeChain([OWN_FOOD]) as never);

    await expect(
      updateCustomFood("food-custom-1", OTHER_USER_ID, { name: "Hijacked" })
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("throws error with code 'not_found' when food does not exist", async () => {
    // DB returns empty array — food not found
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      updateCustomFood("nonexistent-food", OWNER_ID, { name: "Update" })
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("succeeds and returns updated food when owner updates own food", async () => {
    // First select: food lookup for ownership check
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([OWN_FOOD]) as never)
      // Second select: fetch serving sizes after update
      .mockReturnValueOnce(makeChain([{ id: "ss-c1", foodId: "food-custom-1", label: "1 bar", weightG: "60" }]) as never);

    vi.mocked(db.update).mockReturnValueOnce(makeChain(undefined) as never);

    const result = await updateCustomFood("food-custom-1", OWNER_ID, { name: "Updated Bar" });

    // Update succeeded — db.update was called
    expect(db.update).toHaveBeenCalled();
    // Result reflects the food id
    expect(result.id).toBe("food-custom-1");
  });

  it("db.update is NOT called when ownership check fails (no side effects)", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([OWN_FOOD]) as never);

    await expect(
      updateCustomFood("food-custom-1", OTHER_USER_ID, { name: "Hack" })
    ).rejects.toMatchObject({ code: "forbidden" });

    // db.update must never be called when ownership check fails
    expect(db.update).not.toHaveBeenCalled();
  });
});

// ── deleteCustomFood tests ────────────────────────────────────────────────

describe("CHK-051: deleteCustomFood — ownership enforcement (real service, DB-only mock)", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // clears mockReturnValueOnce queues between tests
  });

  it("throws error with code 'forbidden' when caller is not the food owner", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([OWN_FOOD]) as never);

    await expect(
      deleteCustomFood("food-custom-1", OTHER_USER_ID)
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("throws error with code 'not_found' when food does not exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      deleteCustomFood("nonexistent-food", OWNER_ID)
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("succeeds when owner deletes own food — db.delete is called once", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([OWN_FOOD]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    await expect(
      deleteCustomFood("food-custom-1", OWNER_ID)
    ).resolves.toBeUndefined();

    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  it("db.delete is NOT called when ownership check fails (no side effects)", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([OWN_FOOD]) as never);

    await expect(
      deleteCustomFood("food-custom-1", OTHER_USER_ID)
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(db.delete).not.toHaveBeenCalled();
  });
});
