/**
 * CHK-008: Food DB seeding script.
 * Verifies: seed data exists with correct structure, script inserts foods + demo user.
 * Source: spec/05-tech-stack.md §Food Database Strategy
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../../");

// Mock the DB to capture inserts without a real database
vi.mock("@/server/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
  foods: {},
  servingSizes: {},
  user: {},
}));

describe("CHK-008: Food DB seeding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("seed-data/foods.ts file exists", () => {
    const path = join(root, "src/server/db/seed-data/foods.ts");
    expect(existsSync(path), `Missing: ${path}`).toBe(true);
  });

  it("seed data exports SEED_FOODS array", async () => {
    const { SEED_FOODS } = await import("@/server/db/seed-data/foods");
    expect(Array.isArray(SEED_FOODS)).toBe(true);
  });

  it("seed data has >= 10000 food items (curated starter set)", async () => {
    const { SEED_FOODS } = await import("@/server/db/seed-data/foods");
    expect(SEED_FOODS.length).toBeGreaterThanOrEqual(10000);
  });

  it("each food item has required nutrition fields", async () => {
    const { SEED_FOODS } = await import("@/server/db/seed-data/foods");
    const required = [
      "id", "name", "source", "caloriesPer100g",
      "proteinPer100g", "carbsPer100g", "fatPer100g", "fiberPer100g",
    ];
    for (const food of SEED_FOODS.slice(0, 10)) {
      for (const field of required) {
        expect(food, `food "${food.id}" missing ${field}`).toHaveProperty(field);
      }
    }
  });

  it("each food has servingSizes array with at least one entry", async () => {
    const { SEED_FOODS } = await import("@/server/db/seed-data/foods");
    for (const food of SEED_FOODS.slice(0, 10)) {
      expect(Array.isArray(food.servingSizes), `food "${food.id}" missing servingSizes`).toBe(true);
      expect(food.servingSizes.length, `food "${food.id}" has no serving sizes`).toBeGreaterThanOrEqual(1);
      expect(food.servingSizes[0]).toHaveProperty("label");
      expect(food.servingSizes[0]).toHaveProperty("weightG");
    }
  });

  it("seed data includes both usda and open_food_facts sources", async () => {
    const { SEED_FOODS } = await import("@/server/db/seed-data/foods");
    const sources = new Set(SEED_FOODS.map((f) => f.source));
    expect(sources.has("usda")).toBe(true);
    expect(sources.has("open_food_facts")).toBe(true);
  });

  it("some foods have barcodes (branded)", async () => {
    const { SEED_FOODS } = await import("@/server/db/seed-data/foods");
    const withBarcodes = SEED_FOODS.filter((f) => f.barcode);
    expect(withBarcodes.length).toBeGreaterThan(0);
  });

  it("seed.ts file exports a seedFoods function", async () => {
    const seedModule = await import("@/server/db/seed");
    expect(typeof seedModule.seedFoods).toBe("function");
  });

  it("seed.ts exports a seedDemoUser function for development setup", async () => {
    const seedModule = await import("@/server/db/seed");
    expect(typeof seedModule.seedDemoUser).toBe("function");
  });

  it("seedFoods inserts foods and serving sizes into DB", async () => {
    const { seedFoods } = await import("@/server/db/seed");
    const { db } = await import("@/server/db");
    await seedFoods(db as never);
    expect(db.insert).toHaveBeenCalled();
  });

  it("seedDemoUser inserts a demo user into DB", async () => {
    const { seedDemoUser } = await import("@/server/db/seed");
    const { db } = await import("@/server/db");
    await seedDemoUser(db as never);
    expect(db.insert).toHaveBeenCalled();
  });
});
