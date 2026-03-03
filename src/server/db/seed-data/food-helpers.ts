/**
 * Shared helpers for building seed food entries.
 * Extracted so foods.ts, food-extended-a.ts, food-extended-b.ts can all use mk().
 */

export type SeedFood = {
  id: string;
  name: string;
  brandName?: string | null;
  barcode?: string | null;
  source: "usda" | "open_food_facts";
  sourceId?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g?: number | null;
  sodiumMgPer100g?: number | null;
  saturatedFatPer100g?: number | null;
  micronutrients?: Record<string, number>;
  category?: string | null;
  verified?: boolean;
  servingSizes: Array<{ id: string; label: string; weightG: number }>;
};

type SS = [string, number];

export const mk = (
  id: string, name: string, src: "usda" | "open_food_facts",
  cal: number, pro: number, carb: number, fat: number, fib: number,
  ss: SS[], opts?: { barcode?: string; brand?: string; cat?: string; sugar?: number; sodium?: number }
): SeedFood => ({
  id, name, source: src, caloriesPer100g: cal, proteinPer100g: pro,
  carbsPer100g: carb, fatPer100g: fat, fiberPer100g: fib,
  barcode: opts?.barcode ?? null, brandName: opts?.brand ?? null,
  category: opts?.cat ?? null, sugarPer100g: opts?.sugar ?? null,
  sodiumMgPer100g: opts?.sodium ?? null, verified: src === "usda",
  servingSizes: ss.map(([label, weightG], i) => ({ id: `${id}-ss${i}`, label, weightG })),
});
