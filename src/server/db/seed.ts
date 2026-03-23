#!/usr/bin/env tsx
/**
 * Database seed — loads demo data for development.
 * Run via: pnpm db:seed
 */
import { SEED_FOODS } from "./seed-data/foods";
import { seedLessons } from "./seed-data/lessons";
import { SEED_RECIPES } from "./seed-data/recipes";
import { EXERCISE_SEED_A } from "./seed-data/exercise-seed-a";
import { EXERCISE_SEED_B } from "./seed-data/exercise-seed-b";
import { foods, servingSizes, user, lessons, recipes, exercises } from "./schema";

type InsertableDb = {
  insert: (table: unknown) => {
    values: (data: unknown) => {
      onConflictDoNothing: () => Promise<unknown>;
    };
  };
};

const CHUNK = 200; // Drizzle mergeQueries stack-overflows on large batches

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Insert seed foods + serving sizes into the database. Skips if bulk data already present. */
export async function seedFoods(db: InsertableDb): Promise<void> {
  // Skip seed foods if bulk data:sync has already loaded >50k foods
  try {
    const { sql } = await import("drizzle-orm");
    const [row] = await (db as unknown as { execute: (q: unknown) => Promise<{ count: number }[]> })
      .execute(sql`SELECT count(*) as count FROM foods`);
    if (Number(row?.count ?? 0) > 50_000) {
      console.log("Seed: skipping foods (bulk data already loaded)");
      return;
    }
  } catch {
    // If count check fails (e.g. table doesn't exist yet), proceed with seed
  }

  const foodRows = SEED_FOODS.map(({ servingSizes: ss, ...food }) => ({
    ...food,
    nameTranslations: {},
    micronutrients: food.micronutrients ?? {},
    verified: food.verified ?? false,
    defaultServingId: ss[0]?.id ?? null,
    updatedAt: new Date(),
  }));

  for (const batch of chunk(foodRows, CHUNK)) {
    await db.insert(foods).values(batch).onConflictDoNothing();
  }

  const servingRows = SEED_FOODS.flatMap((f) =>
    f.servingSizes.map((ss) => ({
      id: ss.id,
      foodId: f.id,
      label: ss.label,
      weightG: String(ss.weightG),
    }))
  );

  for (const batch of chunk(servingRows, CHUNK)) {
    await db.insert(servingSizes).values(batch).onConflictDoNothing();
  }
}

/** Insert a demo user for development/onboarding testing. */
export async function seedDemoUser(db: InsertableDb): Promise<void> {
  await db.insert(user).values({
    id: "demo-user-001",
    name: "Demo User",
    email: "demo@nutritrack.app",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never).onConflictDoNothing();
}

/** Insert lesson seed data. */
export async function seedLessonsData(db: InsertableDb): Promise<void> {
  const rows = seedLessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    summary: l.summary,
    bodyMarkdown: l.bodyMarkdown,
    category: l.category,
    tags: l.tags,
    readTimeMin: l.readTimeMin,
    order: l.order,
    publishedAt: l.publishedAt,
    illustrationUrl: l.illustrationUrl ?? `/illustrations/${l.category}.svg`,
  }));
  for (const batch of chunk(rows, CHUNK)) {
    await db.insert(lessons).values(batch).onConflictDoNothing();
  }
}

/** Insert recipe seed data. */
export async function seedRecipesData(db: InsertableDb): Promise<void> {
  const rows = SEED_RECIPES.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    servings: r.servings,
    prepTimeMins: r.prepTimeMins,
    cookTimeMins: r.cookTimeMins,
    difficulty: r.difficulty,
    tags: r.tags,
    steps: r.steps,
    caloriesPerServing: r.caloriesPerServing,
    proteinPerServing: r.proteinPerServing,
    carbsPerServing: r.carbsPerServing,
    fatPerServing: r.fatPerServing,
    fiberPerServing: r.fiberPerServing,
    source: r.source,
    published: (r as { published?: boolean }).published ?? true,
  }));
  for (const batch of chunk(rows, CHUNK)) {
    await db.insert(recipes).values(batch).onConflictDoNothing();
  }
}

/** Insert exercise seed data. */
export async function seedExercisesData(db: InsertableDb): Promise<void> {
  const all = [...EXERCISE_SEED_A, ...EXERCISE_SEED_B];
  const rows = all.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    metValue: String(e.metValue),
    metLow: String(e.metLow),
    metHigh: String(e.metHigh),
  }));
  for (const batch of chunk(rows, CHUNK)) {
    await db.insert(exercises).values(batch).onConflictDoNothing();
  }
}

/** Seed everything: foods, serving sizes, and demo user. */
export async function seedAll(db: InsertableDb): Promise<void> {
  await seedFoods(db);
  await seedDemoUser(db);
  await seedLessonsData(db);
  await seedRecipesData(db);
  await seedExercisesData(db);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const postgres = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const schema = await import("./schema");

  const client = postgres.default(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seed: starting");
  await seedAll(db as never);
  console.log(`Seed: inserted ${SEED_FOODS.length} foods, lessons, recipes, exercises + demo user`);

  await client.end();
}

// Only run when invoked directly as a script, not during tests
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
