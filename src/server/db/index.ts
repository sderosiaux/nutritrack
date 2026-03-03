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

// Lazy singleton — deferred until first query, avoids DB connection at import time
const globalForDb = globalThis as unknown as { _db?: ReturnType<typeof createDb> };

function getDb() {
  if (!globalForDb._db) {
    globalForDb._db = createDb();
  }
  return globalForDb._db;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof createDb>];
  },
});

export type Database = typeof db;
