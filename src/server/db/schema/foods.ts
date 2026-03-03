/**
 * Food database: foods, serving sizes, user favorites.
 */
import {
  pgTable,
  text,
  timestamp,
  decimal,
  boolean,
  pgEnum,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const foodSourceEnum = pgEnum("food_source", [
  "usda",
  "open_food_facts",
  "user_created",
  "admin",
]);

export const foods = pgTable(
  "foods",
  {
    id: text("id").primaryKey(),

    name: text("name").notNull(),
    nameTranslations: jsonb("name_translations")
      .notNull()
      .default({}),
    brandName: text("brand_name"),
    barcode: text("barcode"),

    source: foodSourceEnum("source").notNull(),
    sourceId: text("source_id"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // Nutrition per 100g
    caloriesPer100g: decimal("calories_per_100g", {
      precision: 7,
      scale: 2,
    }).notNull(),
    proteinPer100g: decimal("protein_per_100g", {
      precision: 6,
      scale: 2,
    }).notNull(),
    carbsPer100g: decimal("carbs_per_100g", {
      precision: 6,
      scale: 2,
    }).notNull(),
    fatPer100g: decimal("fat_per_100g", { precision: 6, scale: 2 }).notNull(),
    fiberPer100g: decimal("fiber_per_100g", {
      precision: 6,
      scale: 2,
    }).notNull(),
    sugarPer100g: decimal("sugar_per_100g", { precision: 6, scale: 2 }),
    sodiumMgPer100g: decimal("sodium_mg_per_100g", { precision: 8, scale: 2 }),
    saturatedFatPer100g: decimal("saturated_fat_per_100g", {
      precision: 6,
      scale: 2,
    }),

    // Sparse micronutrients — JSONB { vitamin_c_mg: number, iron_mg: number, ... }
    micronutrients: jsonb("micronutrients").notNull().default({}),

    defaultServingId: text("default_serving_id"),
    category: text("category"),
    imageUrl: text("image_url"),
    verified: boolean("verified").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("foods_name_idx").on(t.name),
    index("foods_barcode_idx").on(t.barcode),
    index("foods_source_idx").on(t.source),
  ]
);

export const servingSizes = pgTable(
  "serving_sizes",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    weightG: decimal("weight_g", { precision: 7, scale: 2 }).notNull(),
  },
  (t) => [index("serving_sizes_food_idx").on(t.foodId)]
);

export const foodFavorites = pgTable(
  "food_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("food_favorites_unique").on(t.userId, t.foodId),
    index("food_favorites_user_idx").on(t.userId),
  ]
);
