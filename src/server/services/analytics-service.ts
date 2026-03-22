/**
 * Analytics service — pure query functions.
 * No side effects; each function returns data for one analytics endpoint.
 */
import { db } from "@/server/db";
import { mealEntries, waterEntries, weightEntries } from "@/server/db/schema/logs";
import { foods } from "@/server/db/schema/foods";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { getCurrentStreak, getLongestStreak } from "./streak-service";

export interface SummaryResult {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
  avgWaterMl: number;
  daysLogged: number;
  currentStreak: number;
  longestStreak: number;
}

export interface DailyNutrient {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface TopFood {
  foodId: string;
  foodName: string;
  count: number;
}

export interface MealTimingEntry {
  hour: number;
  count: number;
}

export interface ExportRow {
  date: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity: number;
}

/**
 * Get analytics summary with averages and streaks for a date range.
 */
export async function getSummary(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SummaryResult> {
  // Get per-day meal aggregates
  const dailyRows = await db
    .select({
      date: mealEntries.date,
      calories: sql<number>`SUM(CAST(${mealEntries.caloriesKcal} AS DECIMAL))`,
      protein: sql<number>`SUM(CAST(${mealEntries.proteinG} AS DECIMAL))`,
      carbs: sql<number>`SUM(CAST(${mealEntries.carbsG} AS DECIMAL))`,
      fat: sql<number>`SUM(CAST(${mealEntries.fatG} AS DECIMAL))`,
      fiber: sql<number>`SUM(CAST(${mealEntries.fiberG} AS DECIMAL))`,
    })
    .from(mealEntries)
    .where(
      and(
        eq(mealEntries.userId, userId),
        gte(mealEntries.date, startDate),
        lte(mealEntries.date, endDate)
      )
    )
    .groupBy(mealEntries.date)
    .orderBy(mealEntries.date);

  // Get per-day water totals
  const waterRows = await db
    .select({
      date: waterEntries.date,
      totalMl: sql<number>`SUM(${waterEntries.amountMl})`,
    })
    .from(waterEntries)
    .where(
      and(
        eq(waterEntries.userId, userId),
        gte(waterEntries.date, startDate),
        lte(waterEntries.date, endDate)
      )
    )
    .groupBy(waterEntries.date);

  const waterByDate = new Map(waterRows.map((r) => [r.date, Number(r.totalMl)]));

  const daysLogged = dailyRows.length;
  if (daysLogged === 0) {
    return {
      avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, avgFiber: 0,
      avgWaterMl: 0, daysLogged: 0, currentStreak: 0, longestStreak: 0,
    };
  }

  const sum = dailyRows.reduce(
    (acc, r) => ({
      calories: acc.calories + Number(r.calories),
      protein: acc.protein + Number(r.protein),
      carbs: acc.carbs + Number(r.carbs),
      fat: acc.fat + Number(r.fat),
      fiber: acc.fiber + Number(r.fiber),
      waterMl: acc.waterMl + (waterByDate.get(r.date) ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0 }
  );

  // Get ALL logged dates for streak calculation (not limited to date range)
  const allDates = await db
    .select({ date: mealEntries.date })
    .from(mealEntries)
    .where(eq(mealEntries.userId, userId))
    .groupBy(mealEntries.date);

  const allDateStrings = allDates.map((r) => r.date as string);

  return {
    avgCalories: Math.round(sum.calories / daysLogged),
    avgProtein: Math.round((sum.protein / daysLogged) * 10) / 10,
    avgCarbs: Math.round((sum.carbs / daysLogged) * 10) / 10,
    avgFat: Math.round((sum.fat / daysLogged) * 10) / 10,
    avgFiber: Math.round((sum.fiber / daysLogged) * 10) / 10,
    avgWaterMl: Math.round(sum.waterMl / daysLogged),
    daysLogged,
    currentStreak: getCurrentStreak(allDateStrings),
    longestStreak: getLongestStreak(allDateStrings),
  };
}

/**
 * Get per-day nutrient breakdown for a date range.
 */
export async function getNutrientBreakdown(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyNutrient[]> {
  const dailyRows = await db
    .select({
      date: mealEntries.date,
      calories: sql<number>`SUM(CAST(${mealEntries.caloriesKcal} AS DECIMAL))`,
      protein: sql<number>`SUM(CAST(${mealEntries.proteinG} AS DECIMAL))`,
      carbs: sql<number>`SUM(CAST(${mealEntries.carbsG} AS DECIMAL))`,
      fat: sql<number>`SUM(CAST(${mealEntries.fatG} AS DECIMAL))`,
      fiber: sql<number>`SUM(CAST(${mealEntries.fiberG} AS DECIMAL))`,
    })
    .from(mealEntries)
    .where(
      and(
        eq(mealEntries.userId, userId),
        gte(mealEntries.date, startDate),
        lte(mealEntries.date, endDate)
      )
    )
    .groupBy(mealEntries.date)
    .orderBy(mealEntries.date);

  const waterRows = await db
    .select({
      date: waterEntries.date,
      totalMl: sql<number>`SUM(${waterEntries.amountMl})`,
    })
    .from(waterEntries)
    .where(
      and(
        eq(waterEntries.userId, userId),
        gte(waterEntries.date, startDate),
        lte(waterEntries.date, endDate)
      )
    )
    .groupBy(waterEntries.date);

  const waterByDate = new Map(waterRows.map((r) => [r.date, Number(r.totalMl)]));

  return dailyRows.map((r) => ({
    date: r.date as string,
    calories: Math.round(Number(r.calories)),
    protein: Math.round(Number(r.protein) * 10) / 10,
    carbs: Math.round(Number(r.carbs) * 10) / 10,
    fat: Math.round(Number(r.fat) * 10) / 10,
    fiber: Math.round(Number(r.fiber) * 10) / 10,
    waterMl: waterByDate.get(r.date as string) ?? 0,
  }));
}

/**
 * Get weight history for a date range.
 */
export async function getWeightHistory(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WeightEntry[]> {
  const rows = await db
    .select({
      date: weightEntries.date,
      weightKg: weightEntries.weightKg,
    })
    .from(weightEntries)
    .where(
      and(
        eq(weightEntries.userId, userId),
        gte(weightEntries.date, startDate),
        lte(weightEntries.date, endDate)
      )
    )
    .orderBy(weightEntries.date);

  return rows.map((r) => ({
    date: r.date as string,
    weightKg: Number(r.weightKg),
  }));
}

/**
 * Get top N most logged foods in a date range.
 */
export async function getTopFoods(
  userId: string,
  startDate: string,
  endDate: string,
  limit = 10
): Promise<TopFood[]> {
  const rows = await db
    .select({
      foodId: mealEntries.foodId,
      foodName: foods.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(mealEntries)
    .leftJoin(foods, eq(mealEntries.foodId, foods.id))
    .where(
      and(
        eq(mealEntries.userId, userId),
        gte(mealEntries.date, startDate),
        lte(mealEntries.date, endDate)
      )
    )
    .groupBy(mealEntries.foodId, foods.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  return rows
    .filter((r) => r.foodId !== null)
    .map((r) => ({
      foodId: r.foodId as string,
      foodName: r.foodName ?? r.foodId ?? "Unknown",
      count: Number(r.count),
    }));
}

/**
 * Get meal timing distribution by hour of day.
 */
export async function getMealTiming(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MealTimingEntry[]> {
  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${mealEntries.loggedAt})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(mealEntries)
    .where(
      and(
        eq(mealEntries.userId, userId),
        gte(mealEntries.date, startDate),
        lte(mealEntries.date, endDate)
      )
    )
    .groupBy(sql`EXTRACT(HOUR FROM ${mealEntries.loggedAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${mealEntries.loggedAt})`);

  return rows.map((r) => ({
    hour: Number(r.hour),
    count: Number(r.count),
  }));
}

/**
 * Get full export data for meal log entries.
 */
export async function getExportData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ExportRow[]> {
  const rows = await db
    .select({
      date: mealEntries.date,
      mealSlot: mealEntries.mealSlot,
      foodName: foods.name,
      customName: mealEntries.customName,
      caloriesKcal: mealEntries.caloriesKcal,
      proteinG: mealEntries.proteinG,
      carbsG: mealEntries.carbsG,
      fatG: mealEntries.fatG,
      fiberG: mealEntries.fiberG,
      quantityG: mealEntries.quantityG,
    })
    .from(mealEntries)
    .leftJoin(foods, eq(mealEntries.foodId, foods.id))
    .where(
      and(
        eq(mealEntries.userId, userId),
        gte(mealEntries.date, startDate),
        lte(mealEntries.date, endDate)
      )
    )
    .orderBy(mealEntries.date, mealEntries.loggedAt);

  return rows.map((r) => ({
    date: r.date as string,
    mealType: r.mealSlot as string,
    foodName: r.foodName ?? r.customName ?? "Custom",
    calories: Number(r.caloriesKcal),
    protein: Number(r.proteinG),
    carbs: Number(r.carbsG),
    fat: Number(r.fatG),
    fiber: Number(r.fiberG),
    quantity: Number(r.quantityG),
  }));
}
