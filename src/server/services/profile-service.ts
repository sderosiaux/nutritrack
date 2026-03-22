/**
 * Profile service (CHK-021)
 * GET/PUT profile, recalculate-targets, account deletion (CHK-055)
 */
import { db, userProfiles, dailyTargets, user } from "@/server/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { calculateTDEE, ageFromBirthDate, type TDEEInput } from "./tdee";

// ── Types ──────────────────────────────────────────────────────────────────

export type UpdateProfileDto = {
  displayName?: string;
  birthDate?: string;
  biologicalSex?: "male" | "female" | "other" | "prefer_not_to_say";
  currentWeightKg?: number;
  heightCm?: number;
  goal?: "lose_weight" | "maintain" | "build_muscle" | "eat_healthier";
  targetWeightKg?: number | null;
  weeklyPaceKg?: number | null;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietaryRestrictions?: string[];
  allergies?: string[];
  units?: "metric" | "imperial";
  language?: string;
  timezone?: string;
};

// ── Profile helpers ────────────────────────────────────────────────────────

function toTDEEInput(profile: {
  biologicalSex?: string | null;
  currentWeightKg?: string | number | null;
  heightCm?: string | number | null;
  birthDate?: string | null;
  activityLevel?: string | null;
  goal?: string | null;
  weeklyPaceKg?: string | number | null;
}): TDEEInput | null {
  if (
    !profile.biologicalSex ||
    !profile.currentWeightKg ||
    !profile.heightCm ||
    !profile.birthDate ||
    !profile.activityLevel ||
    !profile.goal
  ) {
    return null;
  }

  return {
    biologicalSex: profile.biologicalSex as TDEEInput["biologicalSex"],
    weightKg: Number(profile.currentWeightKg),
    heightCm: Number(profile.heightCm),
    ageYears: ageFromBirthDate(profile.birthDate),
    activityLevel: profile.activityLevel as TDEEInput["activityLevel"],
    goal: profile.goal as TDEEInput["goal"],
    weeklyPaceKg: profile.weeklyPaceKg != null ? Number(profile.weeklyPaceKg) : null,
  };
}

async function upsertTargets(userId: string, calorieTarget: number, macros: {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
}) {
  const today = new Date().toISOString().split("T")[0];
  const record = {
    id: randomUUID(),
    userId,
    date: today,
    caloriesKcal: calorieTarget,
    proteinG: String(macros.proteinG),
    carbsG: String(macros.carbsG),
    fatG: String(macros.fatG),
    fiberG: String(macros.fiberG),
    waterMl: macros.waterMl,
    calculatedAt: new Date(),
  };

  const result = await db
    .insert(dailyTargets)
    .values(record)
    .onConflictDoUpdate({
      target: [dailyTargets.userId, dailyTargets.date],
      set: {
        caloriesKcal: record.caloriesKcal,
        proteinG: record.proteinG,
        carbsG: record.carbsG,
        fatG: record.fatG,
        fiberG: record.fiberG,
        waterMl: record.waterMl,
        calculatedAt: record.calculatedAt,
      },
    })
    .returning();

  return result[0];
}

// ── Service functions ──────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, userId),
  });

  if (!profile) return null;

  // Get latest targets
  const today = new Date().toISOString().split("T")[0];
  const targets = await db
    .select()
    .from(dailyTargets)
    .where(eq(dailyTargets.userId, userId))
    .limit(1);

  return {
    profile,
    targets: targets[0] ?? null,
  };
}

export async function upsertProfile(userId: string, data: UpdateProfileDto) {
  const now = new Date();
  const record = {
    userId,
    ...(data.displayName !== undefined && { displayName: data.displayName }),
    ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
    ...(data.biologicalSex !== undefined && { biologicalSex: data.biologicalSex }),
    ...(data.currentWeightKg !== undefined && { currentWeightKg: String(data.currentWeightKg) }),
    ...(data.heightCm !== undefined && { heightCm: String(data.heightCm) }),
    ...(data.goal !== undefined && { goal: data.goal }),
    ...(data.targetWeightKg !== undefined && { targetWeightKg: data.targetWeightKg != null ? String(data.targetWeightKg) : null }),
    ...(data.weeklyPaceKg !== undefined && { weeklyPaceKg: data.weeklyPaceKg != null ? String(data.weeklyPaceKg) : null }),
    ...(data.activityLevel !== undefined && { activityLevel: data.activityLevel }),
    ...(data.dietaryRestrictions !== undefined && { dietaryRestrictions: data.dietaryRestrictions }),
    ...(data.allergies !== undefined && { allergies: data.allergies }),
    ...(data.units !== undefined && { units: data.units }),
    ...(data.language !== undefined && { language: data.language }),
    ...(data.timezone !== undefined && { timezone: data.timezone }),
    updatedAt: now,
  };

  const result = await db
    .insert(userProfiles)
    .values({ ...record, createdAt: now })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: record,
    })
    .returning();

  const saved = result[0];

  // Auto-recalculate targets if profile is complete enough
  const tdeeInput = toTDEEInput(saved);
  if (tdeeInput) {
    const { calorieTarget, targets } = calculateTDEE(tdeeInput);
    await upsertTargets(userId, calorieTarget, targets);
  }

  return saved;
}

export async function recalculateTargets(userId: string) {
  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, userId),
  });

  if (!profile) {
    throw Object.assign(new Error("Profile not found"), { code: "not_found" });
  }

  const tdeeInput = toTDEEInput(profile);
  if (!tdeeInput) {
    throw Object.assign(new Error("Profile incomplete for TDEE calculation"), { code: "validation_error" });
  }

  const { calorieTarget, targets } = calculateTDEE(tdeeInput);
  return upsertTargets(userId, calorieTarget, targets);
}

export async function deleteAccount(userId: string) {
  // Cascade delete: user_profiles, daily_targets, meal_entries etc. all have
  // ON DELETE CASCADE from user.id, so deleting the user record is sufficient.
  await db.delete(user).where(eq(user.id, userId));
}
