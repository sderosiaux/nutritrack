/**
 * TDEE calculation engine (CHK-020)
 * Pure functions — no side effects, no DB calls, fully unit-testable.
 *
 * Formula: Mifflin-St Jeor BMR × activity multiplier, then goal adjustment.
 * Macro defaults per WHO/DRI: protein 20%, fat 30%, carbs 50%.
 */

export type BiologicalSex = "male" | "female" | "other" | "prefer_not_to_say";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose_weight" | "maintain" | "build_muscle" | "eat_healthier";

export interface TDEEInput {
  biologicalSex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  weeklyPaceKg: number | null;
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  targets: MacroTargets;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor BMR formula */
function calcBMR(sex: BiologicalSex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  // female: -161, male/other/prefer_not_to_say: +5
  return sex === "female" ? base - 161 : base + 5;
}

function calcCalorieTarget(tdee: number, goal: Goal, weeklyPaceKg: number | null): number {
  switch (goal) {
    case "lose_weight": {
      if (weeklyPaceKg !== null) {
        const dailyDeficit = (weeklyPaceKg * 7700) / 7;
        return Math.round(tdee - dailyDeficit);
      }
      // Default: 500 kcal/day deficit (≈ 0.46 kg/week)
      return Math.round(tdee - 500);
    }
    case "build_muscle": {
      if (weeklyPaceKg !== null) {
        const dailySurplus = (weeklyPaceKg * 7700) / 7;
        return Math.round(tdee + dailySurplus);
      }
      // Default: 300 kcal/day surplus
      return Math.round(tdee + 300);
    }
    case "maintain":
    case "eat_healthier":
    default:
      return Math.round(tdee);
  }
}

function calcMacros(calorieTarget: number): MacroTargets {
  return {
    proteinG: Math.round((calorieTarget * 0.20) / 4),
    fatG: Math.round((calorieTarget * 0.30) / 9),
    carbsG: Math.round((calorieTarget * 0.50) / 4),
    fiberG: 25,     // standard recommendation
    waterMl: 2000,  // standard recommendation
  };
}

/**
 * Calculate TDEE, calorie target, and macro targets from user profile.
 * Pure function — no IO, fully testable.
 */
export function calculateTDEE(input: TDEEInput): TDEEResult {
  const bmr = calcBMR(input.biologicalSex, input.weightKg, input.heightCm, input.ageYears);
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] ?? 1.2;
  const tdee = bmr * multiplier;
  const calorieTarget = calcCalorieTarget(tdee, input.goal, input.weeklyPaceKg);
  const targets = calcMacros(calorieTarget);

  return { bmr, tdee, calorieTarget, targets };
}

/**
 * Derive age in years from a birthDate string (YYYY-MM-DD).
 */
export function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
