/**
 * CHK-009: rankSearchResults — behavior-precise tests.
 * Calls the REAL function (no food-service mock). Only DB is mocked to avoid connection errors.
 * Verifies: recent > exact match > verified > branded ranking semantics.
 * Source: spec/07-api.md §Food Database, .forge/checkboxes.yaml CHK-009
 */
import { describe, it, expect } from "vitest";

// Mock DB only to prevent connection attempts — rankSearchResults is pure and doesn't use it.
vi.mock("@/server/db", () => ({
  db: {},
  foods: {}, servingSizes: {}, foodFavorites: {}, mealEntries: {},
}));

import { rankSearchResults } from "@/server/services/food-service";

// ── Fixture ──────────────────────────────────────────────────────────────────

const base = {
  caloriesPer100g: 100,
  proteinPer100g: 10,
  carbsPer100g: 10,
  fatPer100g: 5,
  fiberPer100g: 1,
  servingSizes: [{ id: "ss-1", label: "100g", weightG: 100 }],
};

const recentFood = { ...base, id: "recent", name: "Chicken Strips", brandName: "BrandX", source: "open_food_facts", verified: false };
const exactFood  = { ...base, id: "exact",  name: "chicken breast", brandName: null, source: "usda", verified: true };
const verifiedFood = { ...base, id: "verified", name: "Chicken Breast, raw", brandName: null, source: "usda", verified: true };
const brandedFood  = { ...base, id: "branded", name: "Chicken Nuggets", brandName: "FastBrand", source: "open_food_facts", verified: false };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CHK-009: rankSearchResults — recent > exact > verified > branded", () => {
  it("rankSearchResults is exported as a named function", () => {
    expect(typeof rankSearchResults).toBe("function");
  });

  it("recently logged food ranks first, above even exact name matches", () => {
    const items = [exactFood, verifiedFood, recentFood];
    const recentIds = new Set(["recent"]);
    const result = rankSearchResults(items, "chicken breast", recentIds);
    expect(result[0].id).toBe("recent");
  });

  it("exact name match ranks before verified non-exact match", () => {
    const items = [verifiedFood, exactFood]; // verifiedFood is NOT exact: "Chicken Breast, raw" ≠ "chicken breast"
    const result = rankSearchResults(items, "chicken breast", new Set());
    expect(result[0].id).toBe("exact");
    expect(result[1].id).toBe("verified");
  });

  it("exact match is case-insensitive", () => {
    const upperFood = { ...base, id: "upper", name: "CHICKEN BREAST", brandName: null, source: "usda" as const, verified: true };
    const result = rankSearchResults([verifiedFood, upperFood], "chicken breast", new Set());
    expect(result[0].id).toBe("upper"); // "CHICKEN BREAST".toLowerCase() === "chicken breast"
  });

  it("verified USDA food ranks before unverified branded food", () => {
    const items = [brandedFood, verifiedFood];
    const result = rankSearchResults(items, "chicken", new Set());
    expect(result[0].id).toBe("verified");
    expect(result[1].id).toBe("branded");
  });

  it("full priority order: recent > exact > verified > branded", () => {
    const items = [brandedFood, verifiedFood, exactFood, recentFood];
    const recentIds = new Set(["recent"]);
    const [first, second, third, fourth] = rankSearchResults(items, "chicken breast", recentIds);
    expect(first.id).toBe("recent");
    expect(second.id).toBe("exact");
    expect(third.id).toBe("verified");
    expect(fourth.id).toBe("branded");
  });

  it("empty recentIds does not crash", () => {
    const result = rankSearchResults([verifiedFood, brandedFood], "chicken", new Set());
    expect(result).toHaveLength(2);
  });

  it("empty item list returns empty array", () => {
    expect(rankSearchResults([], "chicken", new Set())).toEqual([]);
  });

  it("single item list returns that item unchanged", () => {
    const result = rankSearchResults([verifiedFood], "chicken breast", new Set());
    expect(result[0].id).toBe("verified");
  });

  it("foods not in recentIds are not promoted", () => {
    const items = [exactFood, verifiedFood];
    const recentIds = new Set(["some-other-food"]); // neither is recent
    const result = rankSearchResults(items, "chicken breast", recentIds);
    expect(result[0].id).toBe("exact"); // exact match still wins
  });

  it("multi-language scenario: non-English query still ranks by same rules", () => {
    // nameTranslations matching happens at DB query level;
    // rankSearchResults ranks whatever the service returns.
    // Verify: a food returned for a French query is ranked by verified status.
    const frenchVerified = { ...base, id: "fr-v", name: "poulet", brandName: null, source: "usda" as const, verified: true };
    const frenchBranded  = { ...base, id: "fr-b", name: "poulet rôti", brandName: "MarcheF", source: "open_food_facts" as const, verified: false };
    const result = rankSearchResults([frenchBranded, frenchVerified], "poulet", new Set());
    expect(result[0].id).toBe("fr-v");
    expect(result[1].id).toBe("fr-b");
  });
});
