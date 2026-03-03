/**
 * CHK-003: Drizzle ORM setup + initial migration:
 * User, UserProfile, DailyTargets, Food (with nameTranslations JSONB + micronutrients JSONB),
 * ServingSize, MealEntry, WaterEntry, WeightEntry, ActivityEntry, Exercise, FavoriteRecipes
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as schema from "@/server/db/schema";

const root = join(__dirname, "../../");

describe("CHK-003: Drizzle schema exports", () => {
  describe("Better Auth tables", () => {
    it("exports user table", () => {
      expect(schema.user).toBeDefined();
    });
    it("exports session table", () => {
      expect(schema.session).toBeDefined();
    });
    it("exports account table", () => {
      expect(schema.account).toBeDefined();
    });
    it("exports verification table", () => {
      expect(schema.verification).toBeDefined();
    });
  });

  describe("App tables", () => {
    it("exports userProfiles table", () => {
      expect(schema.userProfiles).toBeDefined();
    });
    it("exports dailyTargets table", () => {
      expect(schema.dailyTargets).toBeDefined();
    });
    it("exports foods table", () => {
      expect(schema.foods).toBeDefined();
    });
    it("exports servingSizes table", () => {
      expect(schema.servingSizes).toBeDefined();
    });
    it("exports foodFavorites table", () => {
      expect(schema.foodFavorites).toBeDefined();
    });
    it("exports mealEntries table", () => {
      expect(schema.mealEntries).toBeDefined();
    });
    it("exports waterEntries table", () => {
      expect(schema.waterEntries).toBeDefined();
    });
    it("exports weightEntries table", () => {
      expect(schema.weightEntries).toBeDefined();
    });
    it("exports activityEntries table", () => {
      expect(schema.activityEntries).toBeDefined();
    });
    it("exports exercises table", () => {
      expect(schema.exercises).toBeDefined();
    });
    it("exports favoriteRecipes table", () => {
      expect(schema.favoriteRecipes).toBeDefined();
    });
  });

  describe("Food schema correctness", () => {
    it("foods table has JSONB nameTranslations column", () => {
      const cols = schema.foods as Record<string, unknown>;
      expect(cols).toHaveProperty("nameTranslations");
    });
    it("foods table has JSONB micronutrients column", () => {
      const cols = schema.foods as Record<string, unknown>;
      expect(cols).toHaveProperty("micronutrients");
    });
    it("foods table has source enum column", () => {
      const cols = schema.foods as Record<string, unknown>;
      expect(cols).toHaveProperty("source");
    });
  });

  describe("MealEntry schema correctness", () => {
    it("mealEntries has mealSlot column", () => {
      const cols = schema.mealEntries as Record<string, unknown>;
      expect(cols).toHaveProperty("mealSlot");
    });
    it("mealEntries has computed macro columns", () => {
      const cols = schema.mealEntries as Record<string, unknown>;
      const macros = ["caloriesKcal", "proteinG", "carbsG", "fatG", "fiberG"];
      for (const m of macros) {
        expect(cols, `mealEntries.${m} missing`).toHaveProperty(m);
      }
    });
  });

  describe("Exercise schema correctness", () => {
    it("exercises table has MET columns", () => {
      const cols = schema.exercises as Record<string, unknown>;
      expect(cols).toHaveProperty("metValue");
      expect(cols).toHaveProperty("metLow");
      expect(cols).toHaveProperty("metHigh");
    });
  });
});

describe("CHK-003: Migration artifacts", () => {
  it("drizzle/migrations/ directory contains at least one SQL migration file", () => {
    const migrationsDir = join(root, "drizzle/migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    expect(
      files.length,
      "No SQL migration files found — run pnpm db:generate"
    ).toBeGreaterThan(0);
  });

  it("initial migration SQL creates core tables", () => {
    const migrationsDir = join(root, "drizzle/migrations");
    const sqlFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const initial = readFileSync(join(migrationsDir, sqlFiles[0]!), "utf-8");

    // Must contain all CHK-003 required tables
    const requiredTables = [
      "user",
      "user_profiles",
      "daily_targets",
      "foods",
      "serving_sizes",
      "meal_entries",
      "water_entries",
      "weight_entries",
      "activity_entries",
      "exercises",
    ];
    for (const table of requiredTables) {
      expect(
        initial,
        `CREATE TABLE for '${table}' missing from initial migration`
      ).toMatch(new RegExp(`CREATE TABLE[^;]*"${table}"`, "i"));
    }
  });

  it("initial migration SQL creates favorite_recipes table", () => {
    const migrationsDir = join(root, "drizzle/migrations");
    const sqlFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const initial = readFileSync(join(migrationsDir, sqlFiles[0]!), "utf-8");
    expect(initial).toMatch(/CREATE TABLE[^;]*"favorite_recipes"/i);
  });
});
