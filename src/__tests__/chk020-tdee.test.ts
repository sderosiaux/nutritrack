/**
 * CHK-020: TDEE calculation engine
 * Pure function tests — no mocks needed
 */
import { calculateTDEE, type TDEEInput } from "@/server/services/tdee";

describe("calculateTDEE — BMR (Mifflin-St Jeor)", () => {
  it("calculates BMR for a male", () => {
    const input: TDEEInput = {
      biologicalSex: "male",
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      activityLevel: "sedentary",
      goal: "maintain",
      weeklyPaceKg: null,
    };
    const { bmr } = calculateTDEE(input);
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(bmr).toBeCloseTo(1780, 0);
  });

  it("calculates BMR for a female", () => {
    const input: TDEEInput = {
      biologicalSex: "female",
      weightKg: 60,
      heightCm: 165,
      ageYears: 25,
      activityLevel: "sedentary",
      goal: "maintain",
      weeklyPaceKg: null,
    };
    const { bmr } = calculateTDEE(input);
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(bmr).toBeCloseTo(1345, 0);
  });

  it("uses male formula for 'other' sex", () => {
    const male: TDEEInput = { biologicalSex: "male", weightKg: 75, heightCm: 175, ageYears: 35, activityLevel: "moderate", goal: "maintain", weeklyPaceKg: null };
    const other: TDEEInput = { ...male, biologicalSex: "other" };
    // 'other' and 'prefer_not_to_say' fall back to male formula
    expect(calculateTDEE(other).bmr).toBe(calculateTDEE(male).bmr);
  });
});

describe("calculateTDEE — activity multipliers", () => {
  const base: TDEEInput = {
    biologicalSex: "male",
    weightKg: 70,
    heightCm: 175,
    ageYears: 30,
    activityLevel: "sedentary",
    goal: "maintain",
    weeklyPaceKg: null,
  };
  // BMR = 10*70 + 6.25*175 - 5*30 + 5 = 700+1093.75-150+5 = 1648.75

  it("sedentary: 1.2×", () => {
    const { tdee } = calculateTDEE({ ...base, activityLevel: "sedentary" });
    expect(tdee).toBeCloseTo(1648.75 * 1.2, 0);
  });

  it("light: 1.375×", () => {
    const { tdee } = calculateTDEE({ ...base, activityLevel: "light" });
    expect(tdee).toBeCloseTo(1648.75 * 1.375, 0);
  });

  it("moderate: 1.55×", () => {
    const { tdee } = calculateTDEE({ ...base, activityLevel: "moderate" });
    expect(tdee).toBeCloseTo(1648.75 * 1.55, 0);
  });

  it("active: 1.725×", () => {
    const { tdee } = calculateTDEE({ ...base, activityLevel: "active" });
    expect(tdee).toBeCloseTo(1648.75 * 1.725, 0);
  });

  it("very_active: 1.9×", () => {
    const { tdee } = calculateTDEE({ ...base, activityLevel: "very_active" });
    expect(tdee).toBeCloseTo(1648.75 * 1.9, 0);
  });
});

describe("calculateTDEE — goal adjustments", () => {
  const base: TDEEInput = {
    biologicalSex: "male",
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    activityLevel: "moderate",
    goal: "maintain",
    weeklyPaceKg: null,
  };

  it("maintain: calorieTarget = TDEE", () => {
    const { tdee, calorieTarget } = calculateTDEE({ ...base, goal: "maintain" });
    expect(calorieTarget).toBe(Math.round(tdee));
  });

  it("eat_healthier: calorieTarget = TDEE", () => {
    const { tdee, calorieTarget } = calculateTDEE({ ...base, goal: "eat_healthier" });
    expect(calorieTarget).toBe(Math.round(tdee));
  });

  it("lose_weight with 0.5kg/week pace: TDEE - 550 kcal/day", () => {
    const { tdee, calorieTarget } = calculateTDEE({ ...base, goal: "lose_weight", weeklyPaceKg: 0.5 });
    // 0.5 kg/week × 7700 kcal/kg / 7 days = 550 kcal/day deficit
    expect(calorieTarget).toBe(Math.round(tdee - 550));
  });

  it("lose_weight with default pace when weeklyPaceKg is null: TDEE - 500", () => {
    const { tdee, calorieTarget } = calculateTDEE({ ...base, goal: "lose_weight", weeklyPaceKg: null });
    // default pace = 500 kcal/day
    expect(calorieTarget).toBe(Math.round(tdee - 500));
  });

  it("build_muscle with 0.25kg/week pace: TDEE + 275 kcal/day", () => {
    const { tdee, calorieTarget } = calculateTDEE({ ...base, goal: "build_muscle", weeklyPaceKg: 0.25 });
    expect(calorieTarget).toBe(Math.round(tdee + 275));
  });

  it("build_muscle with default pace when weeklyPaceKg is null: TDEE + 300", () => {
    const { tdee, calorieTarget } = calculateTDEE({ ...base, goal: "build_muscle", weeklyPaceKg: null });
    expect(calorieTarget).toBe(Math.round(tdee + 300));
  });
});

describe("calculateTDEE — macro split (WHO/DRI defaults)", () => {
  const input: TDEEInput = {
    biologicalSex: "female",
    weightKg: 65,
    heightCm: 168,
    ageYears: 28,
    activityLevel: "light",
    goal: "maintain",
    weeklyPaceKg: null,
  };

  it("returns macro targets based on calorieTarget", () => {
    const { calorieTarget, targets } = calculateTDEE(input);
    // protein: 20% / 4 kcal/g — allow ±1 for rounding
    expect(targets.proteinG).toBeGreaterThanOrEqual(Math.floor((calorieTarget * 0.20) / 4) - 1);
    expect(targets.proteinG).toBeLessThanOrEqual(Math.ceil((calorieTarget * 0.20) / 4) + 1);
    // fat: 30% / 9 kcal/g — allow ±1 for rounding
    expect(targets.fatG).toBeGreaterThanOrEqual(Math.floor((calorieTarget * 0.30) / 9) - 1);
    expect(targets.fatG).toBeLessThanOrEqual(Math.ceil((calorieTarget * 0.30) / 9) + 1);
    // carbs: 50% / 4 kcal/g — allow ±1 for rounding
    expect(targets.carbsG).toBeGreaterThanOrEqual(Math.floor((calorieTarget * 0.50) / 4) - 1);
    expect(targets.carbsG).toBeLessThanOrEqual(Math.ceil((calorieTarget * 0.50) / 4) + 1);
  });

  it("fiber default: 25g", () => {
    const { targets } = calculateTDEE(input);
    expect(targets.fiberG).toBe(25);
  });

  it("water default: 2000ml", () => {
    const { targets } = calculateTDEE(input);
    expect(targets.waterMl).toBe(2000);
  });

  it("returns integer calories", () => {
    const { calorieTarget } = calculateTDEE(input);
    expect(Number.isInteger(calorieTarget)).toBe(true);
  });
});

describe("calculateTDEE — return shape", () => {
  it("returns bmr, tdee, calorieTarget, and targets object", () => {
    const input: TDEEInput = {
      biologicalSex: "male",
      weightKg: 75,
      heightCm: 175,
      ageYears: 32,
      activityLevel: "moderate",
      goal: "maintain",
      weeklyPaceKg: null,
    };
    const result = calculateTDEE(input);
    expect(result).toHaveProperty("bmr");
    expect(result).toHaveProperty("tdee");
    expect(result).toHaveProperty("calorieTarget");
    expect(result).toHaveProperty("targets");
    expect(result.targets).toHaveProperty("proteinG");
    expect(result.targets).toHaveProperty("carbsG");
    expect(result.targets).toHaveProperty("fatG");
    expect(result.targets).toHaveProperty("fiberG");
    expect(result.targets).toHaveProperty("waterMl");
  });
});
