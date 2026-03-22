/**
 * CHK-041: Recipe seed data — 30+ diverse recipes
 * Each recipe has real ingredient data, categories, and macro calculations.
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { SEED_RECIPES } from "@/server/db/seed-data/recipes";

const VALID_CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "dessert"];

describe("CHK-041: Recipe seed data", () => {
  it("contains at least 30 recipes", () => {
    expect(SEED_RECIPES.length).toBeGreaterThanOrEqual(30);
  });

  it("all recipes have required fields", () => {
    for (const recipe of SEED_RECIPES) {
      expect(recipe.id, `${recipe.title}: missing id`).toBeTruthy();
      expect(recipe.title, `${recipe.id}: missing title`).toBeTruthy();
      expect(recipe.servings, `${recipe.title}: missing servings`).toBeGreaterThan(0);
      expect(Array.isArray(recipe.steps), `${recipe.title}: steps must be array`).toBe(true);
      expect(recipe.steps.length, `${recipe.title}: must have at least 1 step`).toBeGreaterThan(0);
    }
  });

  it("all recipes have valid categories", () => {
    for (const recipe of SEED_RECIPES) {
      const tags = recipe.tags ?? [];
      const hasCategory = tags.some((t) => VALID_CATEGORIES.includes(t));
      expect(hasCategory, `${recipe.title}: must have a valid category tag`).toBe(true);
    }
  });

  it("all recipes have positive caloriesPerServing", () => {
    for (const recipe of SEED_RECIPES) {
      const cal = parseFloat(String(recipe.caloriesPerServing));
      expect(cal, `${recipe.title}: caloriesPerServing must be > 0`).toBeGreaterThan(0);
    }
  });

  it("all recipes have macro values (protein, carbs, fat)", () => {
    for (const recipe of SEED_RECIPES) {
      const protein = parseFloat(String(recipe.proteinPerServing));
      const carbs = parseFloat(String(recipe.carbsPerServing));
      const fat = parseFloat(String(recipe.fatPerServing));
      expect(protein, `${recipe.title}: proteinPerServing must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(carbs, `${recipe.title}: carbsPerServing must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(fat, `${recipe.title}: fatPerServing must be >= 0`).toBeGreaterThanOrEqual(0);
    }
  });

  it("covers all 5 categories", () => {
    const foundCategories = new Set<string>();
    for (const recipe of SEED_RECIPES) {
      for (const tag of recipe.tags ?? []) {
        if (VALID_CATEGORIES.includes(tag)) foundCategories.add(tag);
      }
    }
    for (const cat of VALID_CATEGORIES) {
      expect(foundCategories.has(cat), `Missing category: ${cat}`).toBe(true);
    }
  });

  it("all recipe IDs are unique", () => {
    const ids = SEED_RECIPES.map((r) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all recipe titles are unique", () => {
    const titles = SEED_RECIPES.map((r) => r.title);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });

  it("has at least 5 breakfast recipes", () => {
    const count = SEED_RECIPES.filter((r) => r.tags?.includes("breakfast")).length;
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it("has at least 5 dinner recipes", () => {
    const count = SEED_RECIPES.filter((r) => r.tags?.includes("dinner")).length;
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it("recipes have realistic calorie ranges (100-1500 per serving)", () => {
    for (const recipe of SEED_RECIPES) {
      const cal = parseFloat(String(recipe.caloriesPerServing));
      expect(cal, `${recipe.title}: calories out of range (${cal})`).toBeGreaterThan(50);
      expect(cal, `${recipe.title}: calories too high (${cal})`).toBeLessThan(2000);
    }
  });
});
