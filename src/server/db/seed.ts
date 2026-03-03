#!/usr/bin/env tsx
/**
 * Database seed — loads demo data for development.
 * Run via: pnpm db:seed
 */
import { SEED_FOODS } from "./seed-data/foods";
import { foods, servingSizes } from "./schema";

type InsertableDb = {
  insert: (table: unknown) => {
    values: (data: unknown) => {
      onConflictDoNothing: () => Promise<unknown>;
    };
  };
};

/** Insert seed foods + serving sizes into the database. */
export async function seedFoods(db: InsertableDb): Promise<void> {
  const foodRows = SEED_FOODS.map(({ servingSizes: ss, ...food }) => ({
    ...food,
    nameTranslations: {},
    micronutrients: food.micronutrients ?? {},
    verified: food.verified ?? false,
    defaultServingId: ss[0]?.id ?? null,
    updatedAt: new Date(),
  }));

  await db.insert(foods).values(foodRows).onConflictDoNothing();

  const servingRows = SEED_FOODS.flatMap((f) =>
    f.servingSizes.map((ss) => ({
      id: ss.id,
      foodId: f.id,
      label: ss.label,
      weightG: String(ss.weightG),
    }))
  );

  await db.insert(servingSizes).values(servingRows).onConflictDoNothing();
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
  await seedFoods(db as never);
  console.log(`Seed: inserted ${SEED_FOODS.length} foods`);

  await client.end();
}

// Only run when invoked directly as a script, not during tests
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
