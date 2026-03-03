/**
 * Educational content and recipes.
 */
import {
  pgTable,
  text,
  timestamp,
  date,
  decimal,
  integer,
  boolean,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { foods } from "./foods";

// ── Recipes ──────────────────────────────────────────────────────────────────

export const recipeDifficultyEnum = pgEnum("recipe_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const recipeSourceEnum = pgEnum("recipe_source", [
  "system",
  "user_created",
]);

export const recipes = pgTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),

    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    source: recipeSourceEnum("source").notNull().default("system"),
    sourceUrl: text("source_url"),

    servings: integer("servings").notNull().default(1),
    prepTimeMins: integer("prep_time_mins").notNull().default(0),
    cookTimeMins: integer("cook_time_mins").notNull().default(0),
    difficulty: recipeDifficultyEnum("difficulty").notNull().default("easy"),

    tags: text("tags").array().notNull().default([]),
    steps: text("steps").array().notNull().default([]),

    // Computed per serving — updated when ingredients change
    caloriesPerServing: decimal("calories_per_serving", {
      precision: 7,
      scale: 2,
    }).notNull().default("0"),
    proteinPerServing: decimal("protein_per_serving", {
      precision: 6,
      scale: 2,
    }).notNull().default("0"),
    carbsPerServing: decimal("carbs_per_serving", {
      precision: 6,
      scale: 2,
    }).notNull().default("0"),
    fatPerServing: decimal("fat_per_serving", {
      precision: 6,
      scale: 2,
    }).notNull().default("0"),
    fiberPerServing: decimal("fiber_per_serving", {
      precision: 6,
      scale: 2,
    }).notNull().default("0"),

    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("recipes_source_idx").on(t.source)]
);

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    quantityG: decimal("quantity_g", { precision: 7, scale: 2 }).notNull(),
    displayLabel: text("display_label").notNull(),
    optional: boolean("optional").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("recipe_ingredients_recipe_idx").on(t.recipeId)]
);

export const favoriteRecipes = pgTable(
  "favorite_recipes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("favorite_recipes_unique").on(t.userId, t.recipeId),
    index("favorite_recipes_user_idx").on(t.userId),
  ]
);

// ── Lessons ───────────────────────────────────────────────────────────────────

export const lessonCategoryEnum = pgEnum("lesson_category", [
  "nutrition",
  "sleep",
  "stress",
  "habits",
  "fitness",
  "mindfulness",
]);

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  category: lessonCategoryEnum("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  readTimeMin: integer("read_time_min").notNull().default(5),
  illustrationUrl: text("illustration_url"),
  order: integer("order").notNull().default(0),
  publishedAt: date("published_at"),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at"),
    queuedAt: timestamp("queued_at").notNull().defaultNow(),
  },
  (t) => [
    unique("lesson_progress_unique").on(t.userId, t.lessonId),
    index("lesson_progress_user_idx").on(t.userId),
  ]
);
