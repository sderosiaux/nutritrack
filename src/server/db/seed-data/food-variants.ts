/**
 * Programmatic food variant generator.
 * Generates preparation variants (cooked, frozen, organic, etc.) from base foods
 * to expand the seed dataset toward the ~10k curated starter set described in spec.
 * spec/05-tech-stack.md §Food Database Strategy: "~50k for a curated starter set"
 */
import type { SeedFood } from "./foods";

type PrepVariant = {
  suffix: string;
  calMul: number;
  proMul: number;
  carbMul: number;
  fatMul: number;
  fibMul: number;
  sourcePrefix: string;
  applicable: string[];
};

const PREP_VARIANTS: PrepVariant[] = [
  {
    suffix: "cooked", calMul: 1.2, proMul: 1.2, carbMul: 1.1, fatMul: 1.15, fibMul: 1.1,
    sourcePrefix: "ckd",
    applicable: ["meat", "fish", "seafood", "eggs", "grains", "vegetables", "legumes", "soy"],
  },
  {
    suffix: "steamed", calMul: 1.15, proMul: 1.15, carbMul: 1.0, fatMul: 1.1, fibMul: 1.05,
    sourcePrefix: "stmd",
    applicable: ["fish", "seafood", "vegetables", "grains", "soy"],
  },
  {
    suffix: "baked", calMul: 1.25, proMul: 1.25, carbMul: 1.1, fatMul: 1.2, fibMul: 1.1,
    sourcePrefix: "bkd",
    applicable: ["meat", "fish", "grains", "vegetables", "eggs"],
  },
  {
    suffix: "grilled", calMul: 1.2, proMul: 1.25, carbMul: 1.0, fatMul: 1.1, fibMul: 1.0,
    sourcePrefix: "grld",
    applicable: ["meat", "fish", "seafood", "vegetables"],
  },
  {
    suffix: "roasted", calMul: 1.1, proMul: 1.1, carbMul: 1.0, fatMul: 1.05, fibMul: 1.05,
    sourcePrefix: "rstd",
    applicable: ["meat", "fish", "vegetables", "nuts", "seeds", "legumes"],
  },
  {
    suffix: "frozen", calMul: 1.0, proMul: 1.0, carbMul: 1.0, fatMul: 1.0, fibMul: 1.0,
    sourcePrefix: "frz",
    applicable: ["all"],
  },
  {
    suffix: "canned in water", calMul: 0.9, proMul: 0.95, carbMul: 0.9, fatMul: 0.85, fibMul: 0.9,
    sourcePrefix: "cnd",
    applicable: ["fish", "vegetables", "legumes", "fruits"],
  },
  {
    suffix: "dried", calMul: 3.2, proMul: 3.0, carbMul: 3.5, fatMul: 3.0, fibMul: 3.5,
    sourcePrefix: "drd",
    applicable: ["fruits", "vegetables", "legumes", "grains", "meat", "fish"],
  },
  {
    suffix: "raw", calMul: 0.95, proMul: 0.95, carbMul: 1.0, fatMul: 0.95, fibMul: 1.0,
    sourcePrefix: "raw",
    applicable: ["meat", "fish", "seafood", "vegetables", "grains"],
  },
  {
    suffix: "organic", calMul: 1.0, proMul: 1.0, carbMul: 1.0, fatMul: 1.0, fibMul: 1.0,
    sourcePrefix: "org",
    applicable: ["meat", "fish", "dairy", "grains", "vegetables", "fruits", "legumes", "nuts", "seeds", "eggs"],
  },
  {
    suffix: "low-fat", calMul: 0.6, proMul: 0.95, carbMul: 1.1, fatMul: 0.2, fibMul: 1.0,
    sourcePrefix: "lf",
    applicable: ["dairy", "meat", "fish"],
  },
  {
    suffix: "whole grain", calMul: 0.98, proMul: 1.1, carbMul: 0.95, fatMul: 1.0, fibMul: 1.5,
    sourcePrefix: "wg",
    applicable: ["grains"],
  },
  {
    suffix: "no salt added", calMul: 1.0, proMul: 1.0, carbMul: 1.0, fatMul: 1.0, fibMul: 1.0,
    sourcePrefix: "nsa",
    applicable: ["nuts", "legumes", "vegetables", "seafood"],
  },
  {
    suffix: "stir-fried", calMul: 1.3, proMul: 1.2, carbMul: 1.0, fatMul: 1.5, fibMul: 1.0,
    sourcePrefix: "strf",
    applicable: ["vegetables", "meat", "soy"],
  },
  {
    suffix: "boiled", calMul: 1.1, proMul: 1.1, carbMul: 1.0, fatMul: 1.0, fibMul: 1.0,
    sourcePrefix: "bld",
    applicable: ["eggs", "vegetables", "legumes", "grains", "seafood"],
  },
];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function applyPrep(base: SeedFood, prep: PrepVariant): SeedFood {
  const id = `${base.id}-${prep.sourcePrefix}`;
  return {
    id,
    name: `${base.name}, ${prep.suffix}`,
    source: base.source,
    sourceId: base.sourceId ?? null,
    brandName: base.brandName ?? null,
    barcode: null,
    category: base.category ?? null,
    verified: base.verified ?? false,
    caloriesPer100g: round1(base.caloriesPer100g * prep.calMul),
    proteinPer100g: round1(base.proteinPer100g * prep.proMul),
    carbsPer100g: round1(base.carbsPer100g * prep.carbMul),
    fatPer100g: round1(base.fatPer100g * prep.fatMul),
    fiberPer100g: round1(base.fiberPer100g * prep.fibMul),
    sugarPer100g: base.sugarPer100g != null
      ? round1(base.sugarPer100g * prep.carbMul)
      : null,
    sodiumMgPer100g: base.sodiumMgPer100g ?? null,
    saturatedFatPer100g: base.saturatedFatPer100g ?? null,
    servingSizes: base.servingSizes.map((ss, si) => ({
      id: `${id}-ss${si}`,
      label: ss.label,
      weightG: ss.weightG,
    })),
  };
}

/**
 * Generate preparation variants for each base food.
 * Returns only new variants (not the originals).
 */
export function generateFoodVariants(baseFoods: SeedFood[]): SeedFood[] {
  const variants: SeedFood[] = [];
  const seenIds = new Set(baseFoods.map(f => f.id));

  for (const food of baseFoods) {
    const cat = food.category ?? "";

    for (const prep of PREP_VARIANTS) {
      const catApplies =
        prep.applicable.includes("all") ||
        prep.applicable.includes(cat);

      if (!catApplies) continue;

      // Skip if base food name already ends with this prep suffix
      if (food.name.toLowerCase().endsWith(`, ${prep.suffix}`)) continue;

      const variant = applyPrep(food, prep);
      if (seenIds.has(variant.id)) continue;

      seenIds.add(variant.id);
      variants.push(variant);
    }
  }

  return variants;
}
