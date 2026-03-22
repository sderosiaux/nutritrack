/**
 * Quick-add NLP free-text parsing service.
 * Parses natural language like "2 eggs and 80g brown rice" into structured items.
 */

export interface ParsedItem {
  query: string;
  quantity?: number;
  grams?: number;
  unit?: string;
  originalText: string;
}

// Unit mappings to canonical names
const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  l: "l",
  liter: "l",
  litre: "l",
  liters: "l",
  litres: "l",
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  pound: "lb",
  pounds: "lb",
  slice: "slice",
  slices: "slice",
  piece: "piece",
  pieces: "piece",
};

// Liquid units → ml conversion (approximate)
const LIQUID_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
};

// Weight units → grams conversion (approximate)
const WEIGHT_TO_G: Record<string, number> = {
  g: 1,
  oz: 28.3495,
  lb: 453.592,
};

/**
 * Parse a free-text quick-add string into structured items.
 * Handles:
 *   "2 eggs" → { query: "eggs", quantity: 2 }
 *   "250g oatmeal" → { query: "oatmeal", grams: 250 }
 *   "250ml milk" → { query: "milk", grams: 250 }
 *   "1 cup brown rice" → { query: "brown rice", unit: "cup", quantity: 1 }
 *   "2 eggs and 80g rice" → two items
 */
export function parseQuickAdd(text: string): ParsedItem[] {
  if (!text || !text.trim()) return [];

  // Split on "and" or "," (but not within a token)
  const segments = text
    .split(/\s*(?:,|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return segments.flatMap(parseSegment);
}

function parseSegment(text: string): ParsedItem[] {
  const original = text.trim();
  if (!original) return [];

  // Pattern 1: "250g oatmeal" or "250ml milk" — number+unit directly before food
  const weightPattern = /^(\d+(?:\.\d+)?)\s*(g|gram|grams|ml|milliliter|milliliters|millilitre|millilitres|l|liter|litre|liters|litres|oz|ounce|ounces|lb|pound|pounds)\s+(.+)$/i;
  const weightMatch = original.match(weightPattern);
  if (weightMatch) {
    const amount = parseFloat(weightMatch[1]);
    const rawUnit = weightMatch[2].toLowerCase();
    const unit = UNIT_ALIASES[rawUnit] ?? rawUnit;
    const query = weightMatch[3].trim().toLowerCase();

    if (unit === "ml" || unit === "l") {
      const ml = amount * (LIQUID_TO_ML[unit] ?? 1);
      return [{ query, grams: ml, unit, originalText: original }];
    }
    if (unit === "g" || unit === "oz" || unit === "lb") {
      const grams = amount * (WEIGHT_TO_G[unit] ?? 1);
      return [{ query, grams, unit, originalText: original }];
    }
    // Volume unit like cup, tbsp, tsp
    return [{ query, quantity: amount, unit, originalText: original }];
  }

  // Pattern 2: "2 cups brown rice" or "1 tbsp peanut butter"
  const unitPattern = /^(\d+(?:\.\d+)?)\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|slice|slices|piece|pieces)\s+(.+)$/i;
  const unitMatch = original.match(unitPattern);
  if (unitMatch) {
    const quantity = parseFloat(unitMatch[1]);
    const rawUnit = unitMatch[2].toLowerCase();
    const unit = UNIT_ALIASES[rawUnit] ?? rawUnit;
    const query = unitMatch[3].trim().toLowerCase();
    return [{ query, quantity, unit, originalText: original }];
  }

  // Pattern 3: "2 eggs" — number + food name
  const quantityPattern = /^(\d+(?:\.\d+)?)\s+(.+)$/;
  const quantityMatch = original.match(quantityPattern);
  if (quantityMatch) {
    const quantity = parseFloat(quantityMatch[1]);
    const query = quantityMatch[2].trim().toLowerCase();
    return [{ query, quantity, originalText: original }];
  }

  // Pattern 4: just a food name
  return [{ query: original.toLowerCase(), originalText: original }];
}

/**
 * Estimate serving size from a parsed item.
 * Returns grams to use for the meal entry.
 */
export function estimateGrams(
  item: ParsedItem,
  servingGrams: number = 100
): number {
  if (item.grams !== undefined) return item.grams;
  if (item.quantity !== undefined && item.unit) {
    // Cup ≈ 240ml / ~200g average, tbsp ≈ 15g, tsp ≈ 5g
    const unitToGrams: Record<string, number> = {
      cup: 200,
      tbsp: 15,
      tsp: 5,
      slice: 30,
      piece: servingGrams,
    };
    return item.quantity * (unitToGrams[item.unit] ?? servingGrams);
  }
  if (item.quantity !== undefined) {
    // Number of servings
    return item.quantity * servingGrams;
  }
  return servingGrams;
}
