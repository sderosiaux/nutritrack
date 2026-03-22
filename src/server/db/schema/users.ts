/**
 * User profile and daily targets — app-specific user data.
 */
import {
  pgTable,
  text,
  timestamp,
  date,
  decimal,
  integer,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const biologicalSexEnum = pgEnum("biological_sex", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

export const goalEnum = pgEnum("goal", [
  "lose_weight",
  "maintain",
  "build_muscle",
  "eat_healthier",
]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const unitsEnum = pgEnum("units", ["metric", "imperial"]);

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),

    displayName: text("display_name"),
    birthDate: date("birth_date"),
    biologicalSex: biologicalSexEnum("biological_sex"),

    currentWeightKg: decimal("current_weight_kg", { precision: 5, scale: 2 }),
    heightCm: decimal("height_cm", { precision: 5, scale: 2 }),

    goal: goalEnum("goal"),
    targetWeightKg: decimal("target_weight_kg", { precision: 5, scale: 2 }),
    weeklyPaceKg: decimal("weekly_pace_kg", { precision: 4, scale: 2 }),
    activityLevel: activityLevelEnum("activity_level"),

    // Arrays stored as text[] in Postgres
    dietaryRestrictions: text("dietary_restrictions")
      .array()
      .notNull()
      .default([]),
    allergies: text("allergies").array().notNull().default([]),

    units: unitsEnum("units").notNull().default("metric"),
    language: text("language").notNull().default("en"),
    timezone: text("timezone").notNull().default("UTC"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

export const dailyTargets = pgTable(
  "daily_targets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),

    caloriesKcal: integer("calories_kcal").notNull(),
    proteinG: decimal("protein_g", { precision: 6, scale: 2 }).notNull(),
    carbsG: decimal("carbs_g", { precision: 6, scale: 2 }).notNull(),
    fatG: decimal("fat_g", { precision: 6, scale: 2 }).notNull(),
    fiberG: decimal("fiber_g", { precision: 6, scale: 2 }).notNull(),
    waterMl: integer("water_ml").notNull(),

    calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("daily_targets_user_date_idx").on(t.userId, t.date),
  ]
);
