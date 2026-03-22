import { describe, it, expect } from "vitest";
import { parseOffRow, parseOffServing, parseUsdaFood } from "@/scripts/data-sync";

describe("parseOffRow", () => {
  it("parses a valid OFF CSV row", () => {
    const row = {
      code: "3017620422003",
      product_name: "Nutella",
      brands: "Ferrero",
      "energy-kcal_100g": "539",
      proteins_100g: "6.3",
      carbohydrates_100g: "57.5",
      fat_100g: "30.9",
      fiber_100g: "3.4",
      sugars_100g: "56.3",
      sodium_100g: "0.107",
      "saturated-fat_100g": "10.6",
      categories_en: "Spreads,Chocolate spreads",
      serving_size: "15g",
    };
    const food = parseOffRow(row);
    expect(food).not.toBeNull();
    expect(food!.id).toBe("off-3017620422003");
    expect(food!.name).toBe("Nutella");
    expect(food!.brandName).toBe("Ferrero");
    expect(food!.barcode).toBe("3017620422003");
    expect(food!.caloriesPer100g).toBe(539);
    expect(food!.proteinPer100g).toBe(6.3);
    expect(food!.sodiumMgPer100g).toBeCloseTo(107);
    expect(food!.category).toBe("Spreads");
    expect(food!.source).toBe("open_food_facts");
    expect(food!.verified).toBe(false);
  });

  it("returns null for rows without product_name", () => {
    expect(parseOffRow({ code: "123", product_name: "", "energy-kcal_100g": "100" })).toBeNull();
  });

  it("returns null for rows without code", () => {
    expect(parseOffRow({ code: "", product_name: "Test", "energy-kcal_100g": "100" })).toBeNull();
  });

  it("handles missing optional fields", () => {
    const food = parseOffRow({
      code: "999",
      product_name: "Simple food",
      "energy-kcal_100g": "50",
      proteins_100g: "2",
      carbohydrates_100g: "5",
      fat_100g: "1",
      fiber_100g: "0.5",
    });
    expect(food).not.toBeNull();
    expect(food!.sugarPer100g).toBeNull();
    expect(food!.sodiumMgPer100g).toBeNull();
    expect(food!.saturatedFatPer100g).toBeNull();
    expect(food!.category).toBeNull();
  });
});

describe("parseOffServing", () => {
  it("parses serving size from OFF row", () => {
    const serving = parseOffServing({
      code: "3017620422003",
      serving_size: "15g",
    });
    expect(serving).not.toBeNull();
    expect(serving!.id).toBe("off-3017620422003-ss0");
    expect(serving!.foodId).toBe("off-3017620422003");
    expect(serving!.label).toBe("15g");
    expect(serving!.weightG).toBe(15);
  });

  it("returns null for invalid serving size", () => {
    expect(parseOffServing({ code: "123", serving_size: "unknown" })).toBeNull();
  });

  it("returns null for missing serving size", () => {
    expect(parseOffServing({ code: "123" })).toBeNull();
  });
});

describe("parseUsdaFood", () => {
  it("parses USDA food with nutrients", () => {
    const food = parseUsdaFood(
      { fdc_id: "12345", description: "Chicken breast, raw" },
      { 1008: 120, 1003: 22.5, 1005: 0, 1004: 2.6, 1079: 0, 2000: 0, 1093: 74, 1258: 0.6 }
    );
    expect(food.id).toBe("usda-12345");
    expect(food.name).toBe("Chicken breast, raw");
    expect(food.source).toBe("usda");
    expect(food.verified).toBe(true);
    expect(food.caloriesPer100g).toBe(120);
    expect(food.proteinPer100g).toBe(22.5);
    expect(food.sodiumMgPer100g).toBe(74);
  });

  it("handles missing nutrients gracefully", () => {
    const food = parseUsdaFood(
      { fdc_id: "99999", description: "Unknown food" },
      {}
    );
    expect(food.caloriesPer100g).toBe(0);
    expect(food.proteinPer100g).toBe(0);
    expect(food.sugarPer100g).toBeNull();
  });
});
