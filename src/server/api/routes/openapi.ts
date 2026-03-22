import { Hono } from "hono";

const app = new Hono();

// Hand-crafted OpenAPI 3.0 spec for NutriTrack API
// Covers: auth, foods, logs, analytics, profile, lessons, recipes, vision, exercises
const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "NutriTrack API",
    description:
      "Open-source AI nutrition tracker API. Self-hostable via Docker Compose.",
    version: "1.0.0",
    license: { name: "MIT" },
  },
  servers: [
    {
      url: "/api/v1",
      description: "NutriTrack REST API v1",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Better Auth bearer token",
      },
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Session cookie set by Better Auth",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
        },
      },
      Food: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          brandName: { type: "string", nullable: true },
          source: {
            type: "string",
            enum: ["usda", "open_food_facts", "user_created", "admin"],
          },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          fiber: { type: "number" },
          barcode: { type: "string", nullable: true },
          servingSizes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                grams: { type: "number" },
              },
            },
          },
        },
      },
      MealEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", format: "date" },
          mealSlot: {
            type: "string",
            enum: [
              "breakfast",
              "morning_snack",
              "lunch",
              "afternoon_snack",
              "dinner",
              "evening_snack",
              "other",
            ],
          },
          foodId: { type: "string" },
          quantityG: { type: "number" },
          caloriesKcal: { type: "number" },
          proteinG: { type: "number" },
          carbsG: { type: "number" },
          fatG: { type: "number" },
          fiberG: { type: "number" },
          loggedAt: { type: "string", format: "date-time" },
        },
      },
      DailySummary: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          totals: {
            type: "object",
            properties: {
              caloriesKcal: { type: "number" },
              proteinG: { type: "number" },
              carbsG: { type: "number" },
              fatG: { type: "number" },
              fiberG: { type: "number" },
              waterMl: { type: "number" },
            },
          },
          meals: {
            type: "object",
            additionalProperties: { type: "array", items: { $ref: "#/components/schemas/MealEntry" } },
          },
          waterEntries: { type: "array" },
          weightEntry: { type: "object", nullable: true },
          activities: { type: "array" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          userId: { type: "string" },
          displayName: { type: "string" },
          goal: { type: "string", enum: ["lose_weight", "maintain", "build_muscle", "eat_healthier"] },
          currentWeightKg: { type: "number", nullable: true },
          heightCm: { type: "number", nullable: true },
          activityLevel: { type: "string" },
          units: { type: "string", enum: ["metric", "imperial"] },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }, { CookieAuth: [] }],
  paths: {
    // ── Health ──────────────────────────────────────────────────
    "/health": {
      get: {
        summary: "Health check",
        description: "Returns API status. No auth required.",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: { type: "object", properties: { status: { type: "string", example: "ok" } } },
              },
            },
          },
        },
      },
    },
    // ── Auth ────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User registered; session returned" },
          "400": { description: "Validation error" },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login with email and password",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful; session cookie set" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout and clear session",
        tags: ["Auth"],
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/auth/session": {
      get: {
        summary: "Get current session",
        tags: ["Auth"],
        responses: {
          "200": { description: "Current session and user" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Request password reset email",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } },
            },
          },
        },
        responses: { "200": { description: "Reset email sent if account exists" } },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password with token",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successful" },
          "400": { description: "Invalid or expired token" },
        },
      },
    },
    // ── Foods ────────────────────────────────────────────────────
    "/foods/search": {
      get: {
        summary: "Search food database",
        tags: ["Foods"],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          { name: "source", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    foods: { type: "array", items: { $ref: "#/components/schemas/Food" } },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/foods/recent": {
      get: {
        summary: "Get recently logged foods",
        tags: ["Foods"],
        responses: {
          "200": {
            description: "Recent foods from meal entries",
            content: {
              "application/json": {
                schema: { type: "object", properties: { foods: { type: "array", items: { $ref: "#/components/schemas/Food" } } } },
              },
            },
          },
        },
      },
    },
    "/foods/favorites": {
      get: {
        summary: "Get user's favorite foods",
        tags: ["Foods"],
        responses: {
          "200": {
            description: "Favorited foods",
            content: {
              "application/json": {
                schema: { type: "object", properties: { foods: { type: "array", items: { $ref: "#/components/schemas/Food" } } } },
              },
            },
          },
        },
      },
    },
    "/foods/barcode/{barcode}": {
      get: {
        summary: "Lookup food by barcode",
        tags: ["Foods"],
        parameters: [{ name: "barcode", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Food found", content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } },
          "404": { description: "Barcode not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/foods/{id}": {
      get: {
        summary: "Get food details by ID",
        tags: ["Foods"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Food details", content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } },
          "404": { description: "Not found" },
        },
      },
      put: {
        summary: "Update a custom food (own foods only)",
        tags: ["Foods"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } },
        responses: {
          "200": { description: "Updated food" },
          "403": { description: "Not owner" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete a custom food (own foods only)",
        tags: ["Foods"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted" },
          "403": { description: "Not owner" },
        },
      },
    },
    "/foods": {
      post: {
        summary: "Create a custom food",
        tags: ["Foods"],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } },
        responses: {
          "201": { description: "Created food" },
          "422": { description: "Validation error" },
        },
      },
    },
    "/foods/{id}/favorite": {
      post: {
        summary: "Add food to favorites",
        tags: ["Foods"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Added to favorites" } },
      },
      delete: {
        summary: "Remove food from favorites",
        tags: ["Foods"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Removed from favorites" } },
      },
    },
    // ── Logs ─────────────────────────────────────────────────────
    "/logs/{date}": {
      get: {
        summary: "Get daily summary for a date",
        tags: ["Logs"],
        parameters: [{ name: "date", in: "path", required: true, schema: { type: "string", format: "date" } }],
        responses: {
          "200": { description: "Daily summary", content: { "application/json": { schema: { $ref: "#/components/schemas/DailySummary" } } } },
        },
      },
    },
    "/logs/{date}/meals": {
      post: {
        summary: "Log a meal entry",
        tags: ["Logs"],
        parameters: [{ name: "date", in: "path", required: true, schema: { type: "string", format: "date" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["foodId", "mealSlot", "quantityG"],
                properties: {
                  foodId: { type: "string" },
                  mealSlot: { type: "string" },
                  quantityG: { type: "number" },
                  servingSizeId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Meal entry created", content: { "application/json": { schema: { $ref: "#/components/schemas/MealEntry" } } } },
          "422": { description: "Validation error" },
        },
      },
    },
    "/logs/{date}/meals/{entryId}": {
      put: {
        summary: "Update a meal entry",
        tags: ["Logs"],
        parameters: [
          { name: "date", in: "path", required: true, schema: { type: "string", format: "date" } },
          { name: "entryId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Updated" }, "404": { description: "Not found" } },
      },
      delete: {
        summary: "Delete a meal entry",
        tags: ["Logs"],
        parameters: [
          { name: "date", in: "path", required: true, schema: { type: "string", format: "date" } },
          { name: "entryId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/logs/{date}/water": {
      post: {
        summary: "Log water intake",
        tags: ["Logs"],
        parameters: [{ name: "date", in: "path", required: true, schema: { type: "string", format: "date" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["volumeMl"], properties: { volumeMl: { type: "number" } } } } },
        },
        responses: { "201": { description: "Water entry created" } },
      },
    },
    "/logs/{date}/weight": {
      post: {
        summary: "Log a weight entry",
        tags: ["Logs"],
        parameters: [{ name: "date", in: "path", required: true, schema: { type: "string", format: "date" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["weightKg"], properties: { weightKg: { type: "number" } } } } },
        },
        responses: { "201": { description: "Weight entry created" } },
      },
    },
    "/logs/{date}/activities": {
      post: {
        summary: "Log an activity",
        tags: ["Logs"],
        parameters: [{ name: "date", in: "path", required: true, schema: { type: "string", format: "date" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["exerciseId", "durationMinutes"],
                properties: {
                  exerciseId: { type: "string" },
                  durationMinutes: { type: "integer" },
                  intensity: { type: "string", enum: ["light", "moderate", "vigorous"] },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Activity logged" } },
      },
    },
    // ── Analytics ────────────────────────────────────────────────
    "/analytics/summary": {
      get: {
        summary: "Get calorie/macro summary for date range",
        tags: ["Analytics"],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Aggregated summary by day" } },
      },
    },
    "/analytics/nutrients": {
      get: {
        summary: "Get nutrient breakdown vs RDA",
        tags: ["Analytics"],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Macro + micro nutrient breakdown" } },
      },
    },
    "/analytics/weight": {
      get: {
        summary: "Get weight history and trend",
        tags: ["Analytics"],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Weight entries with trend line" } },
      },
    },
    "/analytics/foods/top": {
      get: {
        summary: "Get most frequently logged foods",
        tags: ["Analytics"],
        responses: { "200": { description: "Top foods by log count" } },
      },
    },
    "/analytics/meals/timing": {
      get: {
        summary: "Get meal timing heatmap data",
        tags: ["Analytics"],
        responses: { "200": { description: "Entries bucketed by hour of day" } },
      },
    },
    // ── Profile ──────────────────────────────────────────────────
    "/profile": {
      get: {
        summary: "Get user profile",
        tags: ["Profile"],
        responses: {
          "200": { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
          "404": { description: "Profile not found" },
        },
      },
      put: {
        summary: "Update user profile",
        tags: ["Profile"],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
        responses: { "200": { description: "Updated profile" } },
      },
    },
    "/profile/recalculate-targets": {
      post: {
        summary: "Recalculate daily nutrition targets",
        tags: ["Profile"],
        responses: { "200": { description: "New daily targets based on current profile" } },
      },
    },
    // ── Exercises ────────────────────────────────────────────────
    "/exercises": {
      get: {
        summary: "Search exercises",
        tags: ["Exercises"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Exercise list with MET values" } },
      },
    },
    // ── Lessons ──────────────────────────────────────────────────
    "/lessons": {
      get: {
        summary: "Browse all lessons",
        tags: ["Lessons"],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Lesson list" } },
      },
    },
    "/lessons/today": {
      get: {
        summary: "Get today's lesson queue (2-3 lessons)",
        tags: ["Lessons"],
        responses: { "200": { description: "Today's recommended lessons" } },
      },
    },
    "/lessons/{id}": {
      get: {
        summary: "Get lesson detail",
        tags: ["Lessons"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Full lesson with markdown content" }, "404": { description: "Not found" } },
      },
    },
    "/lessons/{id}/complete": {
      post: {
        summary: "Mark lesson as complete",
        tags: ["Lessons"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Lesson progress updated" } },
      },
    },
    // ── Recipes ──────────────────────────────────────────────────
    "/recipes": {
      get: {
        summary: "Browse recipes",
        tags: ["Recipes"],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Recipe list" } },
      },
      post: {
        summary: "Create a recipe",
        tags: ["Recipes"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Created recipe" } },
      },
    },
    "/recipes/{id}": {
      get: {
        summary: "Get recipe details",
        tags: ["Recipes"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Recipe with ingredients" }, "404": { description: "Not found" } },
      },
      put: {
        summary: "Update a recipe",
        tags: ["Recipes"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Updated" }, "403": { description: "Not owner" } },
      },
      delete: {
        summary: "Delete a recipe",
        tags: ["Recipes"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" }, "403": { description: "Not owner" } },
      },
    },
    "/recipes/{id}/log": {
      post: {
        summary: "Log recipe as a meal",
        tags: ["Recipes"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date", "mealSlot"],
                properties: {
                  date: { type: "string", format: "date" },
                  mealSlot: { type: "string" },
                  servings: { type: "number" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Meal entry created from recipe" } },
      },
    },
    // ── Vision / Photos ──────────────────────────────────────────
    "/recognize/upload": {
      post: {
        summary: "Upload photo for food recognition",
        tags: ["Vision"],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } },
        },
        responses: {
          "202": {
            description: "Upload queued; returns jobId for polling",
            content: { "application/json": { schema: { type: "object", properties: { jobId: { type: "string" } } } } },
          },
        },
      },
    },
    "/recognize/{jobId}/status": {
      get: {
        summary: "Poll recognition job status (SSE)",
        tags: ["Vision"],
        parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Server-sent events stream",
            content: {
              "text/event-stream": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      weightG: { type: "number" },
                      confidence: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // ── Users ────────────────────────────────────────────────────
    "/users/me": {
      delete: {
        summary: "Delete account and all user data",
        tags: ["Users"],
        responses: { "200": { description: "Account deleted" }, "401": { description: "Not authenticated" } },
      },
    },
    // ── Export ───────────────────────────────────────────────────
    "/export/json": {
      get: {
        summary: "Export all user data as JSON",
        tags: ["Export"],
        responses: { "200": { description: "Full JSON export", content: { "application/json": { schema: { type: "object" } } } } },
      },
    },
    "/export/csv": {
      get: {
        summary: "Export meal log as CSV",
        tags: ["Export"],
        responses: { "200": { description: "CSV file", content: { "text/csv": { schema: { type: "string" } } } } },
      },
    },
  },
  tags: [
    { name: "System", description: "Health and status" },
    { name: "Auth", description: "Authentication (via Better Auth)" },
    { name: "Foods", description: "Food database and search" },
    { name: "Logs", description: "Daily food, water, weight, activity logging" },
    { name: "Analytics", description: "Trends, summaries, and insights" },
    { name: "Profile", description: "User profile and nutrition targets" },
    { name: "Exercises", description: "Exercise database" },
    { name: "Lessons", description: "Educational content" },
    { name: "Recipes", description: "Recipe management" },
    { name: "Vision", description: "AI photo food recognition" },
    { name: "Users", description: "Account management" },
    { name: "Export", description: "Data export" },
  ],
};

app.get("/openapi.json", (c) => {
  return c.json(OPENAPI_SPEC);
});

export { app as openapiRoute };
