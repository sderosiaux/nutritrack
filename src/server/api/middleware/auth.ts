import { createMiddleware } from "hono/factory";
import { getSessionFromRequest } from "@/server/auth";

type Variables = {
  session: Awaited<ReturnType<typeof getSessionFromRequest>>;
};

/**
 * Attaches the session (or null) to the Hono context.
 * Does not reject unauthenticated requests — use requireAuth for protected routes.
 */
export const sessionMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const session = await getSessionFromRequest(c.req.raw);
    c.set("session", session);
    await next();
  }
);

/**
 * Rejects unauthenticated requests with 401.
 */
export const requireAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const session = c.get("session");
    if (!session?.user) {
      return c.json({ error: "Unauthorized", code: "unauthorized" }, 401);
    }
    await next();
  }
);
