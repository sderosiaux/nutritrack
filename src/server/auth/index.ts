import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/server/db/schema";

function createAuth() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = postgres(url, { max: 5 });
  const db = drizzle(client, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },

    trustedOrigins: [
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    ],

    // Bearer plugin: converts Authorization: Bearer <token> to session cookie.
    // Enables JWT-style API access without cookie dependencies.
    plugins: [bearer()],
  });
}

// Lazy singleton — created on first access, not at import time
const globalForAuth = globalThis as unknown as {
  _auth?: ReturnType<typeof createAuth>;
};

function getAuth() {
  if (!globalForAuth._auth) {
    globalForAuth._auth = createAuth();
  }
  return globalForAuth._auth;
}

// Proxy that delegates to lazy instance
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    return getAuth()[prop as keyof ReturnType<typeof createAuth>];
  },
});

export type Auth = ReturnType<typeof createAuth>;
export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];

/**
 * Extract and validate session from a request.
 * Supports both session cookies and Authorization: Bearer <token> headers
 * (bearer plugin handles header-to-cookie conversion before this call).
 */
export async function getSessionFromRequest(req: Request) {
  return getAuth().api.getSession({ headers: req.headers });
}
