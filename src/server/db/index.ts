import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Re-export schema for convenience
export * from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

// Singleton for server-side usage — avoids connection pool exhaustion in dev
const globalForDb = globalThis as unknown as { _db?: ReturnType<typeof createDb> };

export const db = globalForDb._db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb._db = db;
}

export type Database = typeof db;
