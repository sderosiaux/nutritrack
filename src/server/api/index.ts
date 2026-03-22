import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { health } from "./routes/health";
import { foods } from "./routes/foods";
import { logs } from "./routes/logs";
import { lessons } from "./routes/lessons";
import { recipes } from "./routes/recipes";
import { exercisesRouter } from "./routes/exercises";
import { notificationsRouter } from "./routes/notifications";
import { profile } from "./routes/profile";
import { users } from "./routes/users";
import { recognize } from "./routes/recognize";
import { analytics } from "./routes/analytics";
import { openapiRoute } from "./routes/openapi";
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

// OpenAPI spec — no auth required
app.route("/", openapiRoute);

// Food database
app.route("/foods", foods);

// Daily logging (meals, water)
app.route("/logs", logs);

// Educational content
app.route("/lessons", lessons);

// Recipes
app.route("/recipes", recipes);

// Exercises (public read-only)
app.route("/exercises", exercisesRouter);

// Push notifications
app.route("/notifications", notificationsRouter);

// User profile + targets
app.route("/profile", profile);

// User account management (deletion)
app.route("/users", users);

// AI recognition (photo upload, vision providers)
app.route("/recognize", recognize);

// Analytics
app.route("/analytics", analytics);

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
