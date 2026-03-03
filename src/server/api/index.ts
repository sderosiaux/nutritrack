import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { health } from "./routes/health";
import { foods } from "./routes/foods";
import { sessionMiddleware } from "./middleware/auth";

const app = new Hono().basePath("/api/v1");

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use("*", sessionMiddleware);

// Health check — no auth required
app.route("/", health);

// Food database
app.route("/foods", foods);

// 404 fallback
app.notFound((c) => {
  return c.json({ error: "Not found", code: "not_found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("[API Error]", err);
  return c.json({ error: "Internal server error", code: "internal_error" }, 500);
});

export { app };
