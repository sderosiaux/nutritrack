/**
 * Log service: meal entry CRUD, water entry CRUD, weight entry CRUD,
 * activity entry CRUD, daily log aggregate.
 * All macro snapshots computed on write and stored denormalized for read performance.
 */
import {
  db, foods, servingSizes, mealEntries, waterEntries,
  weightEntries, activityEntries, exercises,
} from "@/server/db";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export type NutritionPer100g = {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
};

export type MacroSnapshot = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type CreateMealEntryDto = {
  foodId: string;
  servingSizeId: string;
  quantity: number; // multiplier × serving size weight
  mealType: string;
  loggedAt?: string; // ISO timestamp, defaults to now
  notes?: string;
};

export type UpdateMealEntryDto = {
  quantity?: number;
  mealType?: string;
  notes?: string;
};

export type MealEntryResult = {
  id: string;
  userId: string;
  date: string;
  mealSlot: string;
  loggedAt: Date;
  foodId: string | null;
  servingSizeId: string | null;
  quantityG: number;
  servingLabel: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  source: string;
  notes: string | null;
};

export type WaterEntryResult = {
  id: string;
  userId: string;
  date: string;
  loggedAt: Date;
  amountMl: number;
};

export type DailyLogEntry = {
  id: string;
  foodId: string | null;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity: number;
  servingSizeLabel: string | null;
  servingSizeWeightG: number | null;
  mealType: string;
  loggedAt: Date;
  notes: string | null;
};

export type DailyLogMealSlot = {
  mealType: string;
  entries: DailyLogEntry[];
  totalKcal: number;
};

export type DailyLogResult = {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  waterMl: number;
  meals: DailyLogMealSlot[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

/**
 * Pure function: compute macro snapshot given nutrition per 100g and total grams.
 * Exported for direct unit testing.
 */
export function computeMacros(nutrition: NutritionPer100g, totalGrams: number): MacroSnapshot {
  const factor = totalGrams / 100;
  return {
    caloriesKcal: toNum(nutrition.caloriesPer100g) * factor,
    proteinG: toNum(nutrition.proteinPer100g) * factor,
    carbsG: toNum(nutrition.carbsPer100g) * factor,
    fatG: toNum(nutrition.fatPer100g) * factor,
    fiberG: toNum(nutrition.fiberPer100g) * factor,
  };
}

function rowToMealEntry(row: typeof mealEntries.$inferSelect): MealEntryResult {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    mealSlot: row.mealSlot,
    loggedAt: row.loggedAt,
    foodId: row.foodId,
    servingSizeId: row.servingSizeId,
    quantityG: toNum(row.quantityG),
    servingLabel: row.servingLabel,
    caloriesKcal: toNum(row.caloriesKcal),
    proteinG: toNum(row.proteinG),
    carbsG: toNum(row.carbsG),
    fatG: toNum(row.fatG),
    fiberG: toNum(row.fiberG),
    source: row.source,
    notes: row.notes,
  };
}

// ── Meal Entry CRUD ────────────────────────────────────────────────────────

export async function createMealEntry(
  userId: string,
  date: string,
  dto: CreateMealEntryDto
): Promise<MealEntryResult> {
  // Validate mealType
  const validSlots = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack", "other"];
  if (!validSlots.includes(dto.mealType)) {
    throw Object.assign(new Error("Invalid mealType"), { code: "validation_error" });
  }

  // Load food for macro computation
  const [food] = await db.select().from(foods).where(eq(foods.id, dto.foodId));
  if (!food) throw Object.assign(new Error("Food not found"), { code: "not_found" });

  // Load serving size and verify it belongs to this food
  const [serving] = await db
    .select()
    .from(servingSizes)
    .where(and(eq(servingSizes.id, dto.servingSizeId), eq(servingSizes.foodId, dto.foodId)));
  if (!serving) throw Object.assign(new Error("Serving size not found"), { code: "not_found" });

  // Compute total grams: quantity × serving weight
  const totalGrams = dto.quantity * toNum(serving.weightG);
  const macros = computeMacros(
    {
      caloriesPer100g: toNum(food.caloriesPer100g),
      proteinPer100g: toNum(food.proteinPer100g),
      carbsPer100g: toNum(food.carbsPer100g),
      fatPer100g: toNum(food.fatPer100g),
      fiberPer100g: toNum(food.fiberPer100g),
    },
    totalGrams
  );

  const id = randomUUID();
  const loggedAt = dto.loggedAt ? new Date(dto.loggedAt) : new Date();

  const [inserted] = await db.insert(mealEntries).values({
    id,
    userId,
    date,
    mealSlot: dto.mealType as typeof mealEntries.$inferInsert["mealSlot"],
    loggedAt,
    foodId: dto.foodId,
    servingSizeId: dto.servingSizeId,
    quantityG: String(totalGrams),
    servingLabel: `${dto.quantity} × ${serving.label}`,
    caloriesKcal: String(macros.caloriesKcal),
    proteinG: String(macros.proteinG),
    carbsG: String(macros.carbsG),
    fatG: String(macros.fatG),
    fiberG: String(macros.fiberG),
    source: "manual",
    notes: dto.notes ?? null,
  }).returning();

  if (!inserted) {
    // Fallback: reconstruct from input data if RETURNING not supported in test mock
    return {
      id,
      userId,
      date,
      mealSlot: dto.mealType,
      loggedAt,
      foodId: dto.foodId,
      servingSizeId: dto.servingSizeId,
      quantityG: totalGrams,
      servingLabel: `${dto.quantity} × ${serving.label}`,
      caloriesKcal: macros.caloriesKcal,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
      fiberG: macros.fiberG,
      source: "manual",
      notes: dto.notes ?? null,
    };
  }

  // Handle both raw DB row and already-resolved result
  if (typeof (inserted as unknown as { caloriesKcal: unknown }).caloriesKcal !== "undefined") {
    return rowToMealEntry(inserted as typeof mealEntries.$inferSelect);
  }
  return {
    id,
    userId,
    date,
    mealSlot: dto.mealType,
    loggedAt,
    foodId: dto.foodId,
    servingSizeId: dto.servingSizeId,
    quantityG: totalGrams,
    servingLabel: `${dto.quantity} × ${serving.label}`,
    caloriesKcal: macros.caloriesKcal,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    fiberG: macros.fiberG,
    source: "manual",
    notes: dto.notes ?? null,
  };
}

export async function updateMealEntry(
  entryId: string,
  userId: string,
  dto: UpdateMealEntryDto
): Promise<MealEntryResult> {
  const [existing] = await db.select().from(mealEntries).where(eq(mealEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  const updates: Partial<typeof mealEntries.$inferInsert> = {};

  // If quantity changes, recompute macros
  if (dto.quantity !== undefined && existing.foodId && existing.servingSizeId) {
    const [food] = await db.select().from(foods).where(eq(foods.id, existing.foodId));
    const [serving] = await db.select().from(servingSizes).where(eq(servingSizes.id, existing.servingSizeId));

    if (food && serving) {
      const totalGrams = dto.quantity * toNum(serving.weightG);
      const macros = computeMacros(
        {
          caloriesPer100g: toNum(food.caloriesPer100g),
          proteinPer100g: toNum(food.proteinPer100g),
          carbsPer100g: toNum(food.carbsPer100g),
          fatPer100g: toNum(food.fatPer100g),
          fiberPer100g: toNum(food.fiberPer100g),
        },
        totalGrams
      );
      updates.quantityG = String(totalGrams);
      updates.caloriesKcal = String(macros.caloriesKcal);
      updates.proteinG = String(macros.proteinG);
      updates.carbsG = String(macros.carbsG);
      updates.fatG = String(macros.fatG);
      updates.fiberG = String(macros.fiberG);
    }
  }

  if (dto.mealType !== undefined) {
    updates.mealSlot = dto.mealType as typeof mealEntries.$inferInsert["mealSlot"];
  }
  if (dto.notes !== undefined) updates.notes = dto.notes;

  const rows = await db
    .update(mealEntries)
    .set(updates)
    .where(eq(mealEntries.id, entryId))
    .returning();

  const updated = rows[0] ?? { ...existing, ...updates };
  return rowToMealEntry(updated as typeof mealEntries.$inferSelect);
}

export async function deleteMealEntry(entryId: string, userId: string): Promise<void> {
  const [existing] = await db.select().from(mealEntries).where(eq(mealEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  await db.delete(mealEntries).where(eq(mealEntries.id, entryId));
}

// ── Water Entry CRUD ───────────────────────────────────────────────────────

export async function createWaterEntry(
  userId: string,
  date: string,
  amountMl: number
): Promise<WaterEntryResult> {
  if (amountMl <= 0) {
    throw Object.assign(new Error("amountMl must be positive"), { code: "validation_error" });
  }

  const id = randomUUID();
  const loggedAt = new Date();

  const [inserted] = await db.insert(waterEntries).values({
    id,
    userId,
    date,
    loggedAt,
    amountMl,
  }).returning();

  if (inserted) {
    return {
      id: inserted.id,
      userId: inserted.userId,
      date: inserted.date,
      loggedAt: inserted.loggedAt,
      amountMl: inserted.amountMl,
    };
  }

  return { id, userId, date, loggedAt, amountMl };
}

export async function deleteWaterEntry(entryId: string, userId: string): Promise<void> {
  const [existing] = await db.select().from(waterEntries).where(eq(waterEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  await db.delete(waterEntries).where(eq(waterEntries.id, entryId));
}

export async function getWaterEntries(userId: string, date: string): Promise<WaterEntryResult[]> {
  const rows = await db
    .select()
    .from(waterEntries)
    .where(and(eq(waterEntries.userId, userId), sql`DATE(${waterEntries.loggedAt}) = ${date}`))
    .orderBy(waterEntries.loggedAt);

  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    date: r.date,
    loggedAt: r.loggedAt,
    amountMl: r.amountMl,
  }));
}

// ── Daily Log Aggregate ────────────────────────────────────────────────────

type JoinedMealRow = {
  id: string;
  userId: string;
  date: string;
  mealSlot: string;
  loggedAt: Date;
  foodId: string | null;
  servingSizeId: string | null;
  quantityG: string | number;
  servingLabel: string;
  caloriesKcal: string | number;
  proteinG: string | number;
  carbsG: string | number;
  fatG: string | number;
  fiberG: string | number;
  source: string;
  notes: string | null;
  foodName: string;
  foodBrandName?: string | null;
  servingSizeLabel?: string | null;
  servingSizeWeightG?: string | number | null;
};

// ── Weight Entry CRUD ──────────────────────────────────────────────────────

export type CreateWeightEntryDto = {
  weightKg: number;
  note?: string;
};

export type UpdateWeightEntryDto = {
  weightKg?: number;
  note?: string;
};

export type WeightEntryResult = {
  id: string;
  userId: string;
  date: string;
  loggedAt: Date;
  weightKg: number;
  note: string | null;
};

function rowToWeightEntry(row: typeof weightEntries.$inferSelect): WeightEntryResult {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    loggedAt: row.loggedAt,
    weightKg: toNum(row.weightKg),
    note: row.note,
  };
}

export async function createWeightEntry(
  userId: string,
  date: string,
  dto: CreateWeightEntryDto
): Promise<WeightEntryResult> {
  if (dto.weightKg <= 0) {
    throw Object.assign(new Error("weightKg must be positive"), { code: "validation_error" });
  }

  const id = randomUUID();
  const loggedAt = new Date();

  const [inserted] = await db.insert(weightEntries).values({
    id, userId, date, loggedAt,
    weightKg: String(dto.weightKg),
    note: dto.note ?? null,
  }).returning();

  if (inserted) return rowToWeightEntry(inserted as typeof weightEntries.$inferSelect);
  return { id, userId, date, loggedAt, weightKg: dto.weightKg, note: dto.note ?? null };
}

export async function updateWeightEntry(
  entryId: string,
  userId: string,
  dto: UpdateWeightEntryDto
): Promise<WeightEntryResult> {
  const [existing] = await db.select().from(weightEntries).where(eq(weightEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  const updates: Partial<typeof weightEntries.$inferInsert> = {};
  if (dto.weightKg !== undefined) updates.weightKg = String(dto.weightKg);
  if (dto.note !== undefined) updates.note = dto.note;

  const rows = await db.update(weightEntries).set(updates).where(eq(weightEntries.id, entryId)).returning();
  const updated = rows[0] ?? { ...existing, ...updates };
  return rowToWeightEntry(updated as typeof weightEntries.$inferSelect);
}

export async function deleteWeightEntry(entryId: string, userId: string): Promise<void> {
  const [existing] = await db.select().from(weightEntries).where(eq(weightEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });
  await db.delete(weightEntries).where(eq(weightEntries.id, entryId));
}

export async function getWeightEntries(userId: string): Promise<WeightEntryResult[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const rows = await db
    .select()
    .from(weightEntries)
    .where(and(
      eq(weightEntries.userId, userId),
      gte(weightEntries.loggedAt, cutoff)
    ))
    .orderBy(desc(weightEntries.loggedAt));

  return rows.map(rowToWeightEntry);
}

// ── Activity Entry CRUD ────────────────────────────────────────────────────

export type CreateActivityEntryDto = {
  exerciseId?: string;
  customName?: string;
  durationMinutes: number;
  caloriesBurned?: number;   // override if no exerciseId
  userWeightKg?: number;     // used for MET calc if exerciseId provided
  intensityLevel?: "low" | "moderate" | "high";
  loggedAt?: string;
  notes?: string;
};

export type UpdateActivityEntryDto = {
  durationMinutes?: number;
  caloriesBurned?: number;
  intensityLevel?: "low" | "moderate" | "high";
  notes?: string;
};

export type ActivityEntryResult = {
  id: string;
  userId: string;
  date: string;
  loggedAt: Date;
  exerciseId: string | null;
  customName: string | null;
  durationMin: number;
  intensityLevel: string | null;
  caloriesBurned: number;
  notes: string | null;
};

/**
 * Pure function: MET-based calorie estimate.
 * calories = MET × weightKg × (durationMin / 60)
 * Exported for direct unit testing.
 */
export function computeCaloriesBurned(metValue: number, weightKg: number, durationMin: number): number {
  return metValue * weightKg * (durationMin / 60);
}

function rowToActivityEntry(row: typeof activityEntries.$inferSelect): ActivityEntryResult {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    loggedAt: row.loggedAt,
    exerciseId: row.exerciseId,
    customName: row.customName,
    durationMin: row.durationMin,
    intensityLevel: row.intensityLevel,
    caloriesBurned: toNum(row.caloriesBurned),
    notes: row.notes,
  };
}

export async function createActivityEntry(
  userId: string,
  date: string,
  dto: CreateActivityEntryDto
): Promise<ActivityEntryResult> {
  if (!dto.exerciseId && !dto.customName) {
    throw Object.assign(new Error("exerciseId or customName required"), { code: "validation_error" });
  }

  let kcalBurned = dto.caloriesBurned ?? 0;

  if (dto.exerciseId) {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, dto.exerciseId));
    if (!exercise) throw Object.assign(new Error("Exercise not found"), { code: "not_found" });

    // Pick MET by intensity
    let met = toNum(exercise.metValue);
    if (dto.intensityLevel === "low") met = toNum(exercise.metLow);
    else if (dto.intensityLevel === "high") met = toNum(exercise.metHigh);

    const weightKg = dto.userWeightKg ?? 70; // fallback default 70kg
    kcalBurned = computeCaloriesBurned(met, weightKg, dto.durationMinutes);
  }

  const id = randomUUID();
  const loggedAt = dto.loggedAt ? new Date(dto.loggedAt) : new Date();

  const [inserted] = await db.insert(activityEntries).values({
    id, userId, date, loggedAt,
    exerciseId: dto.exerciseId ?? null,
    customName: dto.customName ?? null,
    durationMin: dto.durationMinutes,
    intensityLevel: (dto.intensityLevel ?? null) as typeof activityEntries.$inferInsert["intensityLevel"],
    caloriesBurned: String(kcalBurned),
    notes: dto.notes ?? null,
  }).returning();

  if (inserted) return rowToActivityEntry(inserted as typeof activityEntries.$inferSelect);

  return {
    id, userId, date, loggedAt,
    exerciseId: dto.exerciseId ?? null,
    customName: dto.customName ?? null,
    durationMin: dto.durationMinutes,
    intensityLevel: dto.intensityLevel ?? null,
    caloriesBurned: kcalBurned,
    notes: dto.notes ?? null,
  };
}

export async function updateActivityEntry(
  entryId: string,
  userId: string,
  dto: UpdateActivityEntryDto
): Promise<ActivityEntryResult> {
  const [existing] = await db.select().from(activityEntries).where(eq(activityEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });

  const updates: Partial<typeof activityEntries.$inferInsert> = {};
  if (dto.durationMinutes !== undefined) updates.durationMin = dto.durationMinutes;
  if (dto.caloriesBurned !== undefined) updates.caloriesBurned = String(dto.caloriesBurned);
  if (dto.intensityLevel !== undefined) updates.intensityLevel = dto.intensityLevel as typeof activityEntries.$inferInsert["intensityLevel"];
  if (dto.notes !== undefined) updates.notes = dto.notes;

  const rows = await db.update(activityEntries).set(updates).where(eq(activityEntries.id, entryId)).returning();
  const updated = rows[0] ?? { ...existing, ...updates };
  return rowToActivityEntry(updated as typeof activityEntries.$inferSelect);
}

export async function deleteActivityEntry(entryId: string, userId: string): Promise<void> {
  const [existing] = await db.select().from(activityEntries).where(eq(activityEntries.id, entryId));
  if (!existing) throw Object.assign(new Error("Entry not found"), { code: "not_found" });
  if (existing.userId !== userId) throw Object.assign(new Error("Forbidden"), { code: "forbidden" });
  await db.delete(activityEntries).where(eq(activityEntries.id, entryId));
}

export async function getActivityEntries(userId: string, date: string): Promise<ActivityEntryResult[]> {
  const rows = await db
    .select()
    .from(activityEntries)
    .where(and(eq(activityEntries.userId, userId), eq(activityEntries.date, date)))
    .orderBy(activityEntries.loggedAt);

  return rows.map(rowToActivityEntry);
}

// ── Daily Log Aggregate ────────────────────────────────────────────────────

export async function getDailyLog(userId: string, date: string): Promise<DailyLogResult> {
  // Fetch meal entries joined with food name and serving size label
  const mealRows = await db
    .select({
      id: mealEntries.id,
      userId: mealEntries.userId,
      date: mealEntries.date,
      mealSlot: mealEntries.mealSlot,
      loggedAt: mealEntries.loggedAt,
      foodId: mealEntries.foodId,
      servingSizeId: mealEntries.servingSizeId,
      quantityG: mealEntries.quantityG,
      servingLabel: mealEntries.servingLabel,
      caloriesKcal: mealEntries.caloriesKcal,
      proteinG: mealEntries.proteinG,
      carbsG: mealEntries.carbsG,
      fatG: mealEntries.fatG,
      fiberG: mealEntries.fiberG,
      source: mealEntries.source,
      notes: mealEntries.notes,
      foodName: sql<string>`COALESCE(${foods.name}, ${mealEntries.servingLabel})`,
      foodBrandName: foods.brandName,
      servingSizeLabel: servingSizes.label,
      servingSizeWeightG: servingSizes.weightG,
    })
    .from(mealEntries)
    .leftJoin(foods, eq(mealEntries.foodId, foods.id))
    .leftJoin(servingSizes, eq(mealEntries.servingSizeId, servingSizes.id))
    .where(and(
      eq(mealEntries.userId, userId),
      sql`DATE(${mealEntries.loggedAt}) = ${date}`
    ))
    .orderBy(mealEntries.loggedAt);

  // Fetch water entries for date
  const waterRows = await db
    .select()
    .from(waterEntries)
    .where(and(
      eq(waterEntries.userId, userId),
      sql`DATE(${waterEntries.loggedAt}) = ${date}`
    ))
    .orderBy(waterEntries.loggedAt);

  // Build entries list
  const entries: DailyLogEntry[] = (mealRows as JoinedMealRow[]).map(row => ({
    id: row.id,
    foodId: row.foodId,
    foodName: row.foodName ?? row.servingLabel,
    calories: toNum(row.caloriesKcal),
    protein: toNum(row.proteinG),
    carbs: toNum(row.carbsG),
    fat: toNum(row.fatG),
    fiber: toNum(row.fiberG),
    quantity: toNum(row.quantityG),
    servingSizeLabel: row.servingSizeLabel ?? null,
    servingSizeWeightG: row.servingSizeWeightG != null ? toNum(row.servingSizeWeightG) : null,
    mealType: row.mealSlot,
    loggedAt: row.loggedAt,
    notes: row.notes,
  }));

  // Group by meal slot
  const slotMap = new Map<string, DailyLogEntry[]>();
  for (const entry of entries) {
    const list = slotMap.get(entry.mealType) ?? [];
    list.push(entry);
    slotMap.set(entry.mealType, list);
  }

  const meals: DailyLogMealSlot[] = Array.from(slotMap.entries()).map(([mealType, slotEntries]) => ({
    mealType,
    entries: slotEntries,
    totalKcal: slotEntries.reduce((sum, e) => sum + e.calories, 0),
  }));

  // Aggregate totals
  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = entries.reduce((s, e) => s + e.fat, 0);
  const totalFiber = entries.reduce((s, e) => s + e.fiber, 0);
  const waterMl = waterRows.reduce((s, r) => s + r.amountMl, 0);

  return {
    date,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalFiber,
    waterMl,
    meals,
  };
}
