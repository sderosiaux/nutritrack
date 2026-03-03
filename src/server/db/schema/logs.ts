/**
 * Daily logging tables: meal entries, water, weight, activity.
 */
import {
  pgTable,
  text,
  timestamp,
  date,
  decimal,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { foods, servingSizes } from "./foods";

export const mealSlotEnum = pgEnum("meal_slot", [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
  "other",
]);

export const entrySourceEnum = pgEnum("entry_source", [
  "manual",
  "barcode",
  "photo",
  "voice",
  "quick_add",
  "recipe",
]);

export const mealEntries = pgTable(
  "meal_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    mealSlot: mealSlotEnum("meal_slot").notNull(),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),

    foodId: text("food_id").references(() => foods.id, {
      onDelete: "restrict",
    }),
    recipeId: text("recipe_id"), // FK added in content schema
    customName: text("custom_name"),

    servingSizeId: text("serving_size_id").references(() => servingSizes.id, {
      onDelete: "set null",
    }),
    quantityG: decimal("quantity_g", { precision: 7, scale: 2 }).notNull(),
    servingLabel: text("serving_label").notNull(),

    // Computed macro snapshot — stored on write for read performance
    caloriesKcal: decimal("calories_kcal", { precision: 7, scale: 2 }).notNull(),
    proteinG: decimal("protein_g", { precision: 6, scale: 2 }).notNull(),
    carbsG: decimal("carbs_g", { precision: 6, scale: 2 }).notNull(),
    fatG: decimal("fat_g", { precision: 6, scale: 2 }).notNull(),
    fiberG: decimal("fiber_g", { precision: 6, scale: 2 }).notNull(),

    source: entrySourceEnum("source").notNull().default("manual"),
    photoUrl: text("photo_url"),
    notes: text("notes"),
  },
  (t) => [
    index("meal_entries_user_date_idx").on(t.userId, t.date),
    index("meal_entries_user_slot_idx").on(t.userId, t.date, t.mealSlot),
  ]
);

export const waterEntries = pgTable(
  "water_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),
    amountMl: integer("amount_ml").notNull(),
  },
  (t) => [index("water_entries_user_date_idx").on(t.userId, t.date)]
);

export const weightEntries = pgTable(
  "weight_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),
    weightKg: decimal("weight_kg", { precision: 5, scale: 2 }).notNull(),
    note: text("note"),
  },
  (t) => [index("weight_entries_user_date_idx").on(t.userId, t.date)]
);

export const intensityLevelEnum = pgEnum("intensity_level", [
  "low",
  "moderate",
  "high",
]);

export const exerciseCategoryEnum = pgEnum("exercise_category", [
  "cardio",
  "strength",
  "flexibility",
  "sports",
  "daily_activity",
]);

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: exerciseCategoryEnum("category").notNull(),
  metValue: decimal("met_value", { precision: 4, scale: 2 }).notNull(),
  metLow: decimal("met_low", { precision: 4, scale: 2 }).notNull(),
  metHigh: decimal("met_high", { precision: 4, scale: 2 }).notNull(),
});

export const activityEntries = pgTable(
  "activity_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),

    exerciseId: text("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    customName: text("custom_name"),
    durationMin: integer("duration_min").notNull(),
    intensityLevel: intensityLevelEnum("intensity_level"),
    caloriesBurned: decimal("calories_burned", {
      precision: 7,
      scale: 2,
    }).notNull(),

    notes: text("notes"),
  },
  (t) => [index("activity_entries_user_date_idx").on(t.userId, t.date)]
);
