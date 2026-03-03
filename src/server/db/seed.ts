#!/usr/bin/env tsx
/**
 * Database seed — loads demo data for development.
 * Full implementation in lane 3 (food-database).
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seed: starting (lane-1 stub — food data seeded in lane 3)");

  // Demo user creation handled by Better Auth registration flow.
  // Food data seed implemented in lane-3 (food-database).

  console.log("Seed: complete");
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
