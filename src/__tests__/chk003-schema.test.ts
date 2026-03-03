/**
 * CHK-003: Drizzle ORM setup + initial migration:
 * User, UserProfile, DailyTargets, Food, ServingSize,
 * MealEntry, WaterEntry, WeightEntry, ActivityEntry, Exercise, FavoriteRecipes
 */
import { describe, it, expect } from "vitest";
import * as schema from "@/server/db/schema";

describe("CHK-003: Drizzle schema", () => {
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
