/**
 * CHK-040: Recipe API — CRUD + log-as-meal
 * GET /api/v1/recipes, GET /api/v1/recipes/:id
 * POST /api/v1/recipes, PUT /api/v1/recipes/:id, DELETE /api/v1/recipes/:id
 * POST /api/v1/recipes/:id/favorite, DELETE /api/v1/recipes/:id/favorite
 * POST /api/v1/recipes/:id/log
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ──────────────────────────────────────────────────────────────────
vi.mock("@/server/db", () => {
  const db = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const recipes = {
    id: "id", title: "title", description: "description",
    authorId: "author_id", source: "source",
    servings: "servings", prepTimeMins: "prep_time_mins",
    cookTimeMins: "cook_time_mins", difficulty: "difficulty",
    tags: "tags", steps: "steps",
    caloriesPerServing: "calories_per_serving",
    proteinPerServing: "protein_per_serving",
    carbsPerServing: "carbs_per_serving",
    fatPerServing: "fat_per_serving",
    fiberPerServing: "fiber_per_serving",
    published: "published",
    createdAt: "created_at", updatedAt: "updated_at",
    coverImageUrl: "cover_image_url", sourceUrl: "source_url",
  };
  const recipeIngredients = {
    id: "id", recipeId: "recipe_id", foodId: "food_id",
    quantityG: "quantity_g", displayLabel: "display_label",
    optional: "optional", sortOrder: "sort_order",
  };
  const favoriteRecipes = {
    userId: "user_id", recipeId: "recipe_id", createdAt: "created_at",
  };
  const foods = {
    id: "id", name: "name", caloriesPer100g: "calories_per_100g",
    proteinPer100g: "protein_per_100g", carbsPer100g: "carbs_per_100g",
    fatPer100g: "fat_per_100g", fiberPer100g: "fiber_per_100g",
  };
  const mealEntries = {
    id: "id", userId: "user_id", date: "date", mealSlot: "meal_slot",
    quantityG: "quantity_g", servingLabel: "serving_label",
    caloriesKcal: "calories_kcal", proteinG: "protein_g",
    carbsG: "carbs_g", fatG: "fat_g", fiberG: "fiber_g",
    source: "source", loggedAt: "logged_at",
    foodId: "food_id", recipeId: "recipe_id",
  };
  return { db, recipes, recipeIngredients, favoriteRecipes, foods, mealEntries };
});

// Mock auth for authenticated tests
vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue(null),
  auth: { handler: vi.fn() },
}));

import { db } from "@/server/db";
import { getSessionFromRequest } from "@/server/auth";
import { app } from "@/server/api/index";

// ── Chainable mock factory ────────────────────────────────────────────────────
function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "orderBy", "limit", "offset",
    "leftJoin", "innerJoin", "groupBy", "returning"];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  return chain;
}

function makeInsertChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.onConflictDoNothing = vi.fn().mockReturnValue(chain);
  chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockReturnValue(chain);
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  return chain;
}

function makeUpdateChain() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve([]).then(resolve);
  return chain;
}

function makeDeleteChain() {
  const chain: Record<string, unknown> = {};
  chain.where = vi.fn().mockReturnValue(chain);
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve([]).then(resolve);
  return chain;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────
const RECIPE_1 = {
  id: "recipe-1",
  title: "Oatmeal with Berries",
  description: "A healthy breakfast",
  authorId: "user-1",
  source: "system",
  servings: 1,
  prepTimeMins: 5,
  cookTimeMins: 10,
  difficulty: "easy",
  tags: ["breakfast", "healthy"],
  steps: ["Cook oats", "Add berries"],
  caloriesPerServing: "350.00",
  proteinPerServing: "12.00",
  carbsPerServing: "55.00",
  fatPerServing: "8.00",
  fiberPerServing: "6.00",
  published: true,
  coverImageUrl: null,
  sourceUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const INGREDIENT_1 = {
  id: "ing-1",
  recipeId: "recipe-1",
  foodId: "food-1",
  quantityG: "80.00",
  displayLabel: "80g oats",
  optional: false,
  sortOrder: 0,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CHK-040: GET /api/v1/recipes", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 200 with recipe list (public)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([]) as never); // ingredients
    const res = await app.request("/api/v1/recipes");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("recipes");
    expect(Array.isArray(json.recipes)).toBe(true);
  });

  it("supports pagination", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    const res = await app.request("/api/v1/recipes?limit=10&offset=0");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("total");
  });

  it("filters by category", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    const res = await app.request("/api/v1/recipes?category=breakfast");
    expect(res.status).toBe(200);
  });
});

describe("CHK-040: GET /api/v1/recipes/:id", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 200 with recipe detail and ingredients", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([INGREDIENT_1]) as never);
    const res = await app.request("/api/v1/recipes/recipe-1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("recipe-1");
    expect(json).toHaveProperty("ingredients");
  });

  it("returns 404 when recipe not found", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);
    const res = await app.request("/api/v1/recipes/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("CHK-040: POST /api/v1/recipes (create)", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/v1/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Recipe", servings: 2, steps: [] }),
    });
    expect(res.status).toBe(401);
  });

  it("creates recipe when authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
      session: {} as never,
    });
    vi.mocked(db.insert).mockReturnValue(makeInsertChain([RECIPE_1]) as never);
    const res = await app.request("/api/v1/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Recipe",
        servings: 2,
        steps: ["Step 1"],
        ingredients: [],
      }),
    });
    expect([200, 201]).toContain(res.status);
  });

  it("returns 422 when title is missing", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
      session: {} as never,
    });
    const res = await app.request("/api/v1/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servings: 2 }),
    });
    expect(res.status).toBe(422);
  });
});

describe("CHK-040: PUT /api/v1/recipes/:id (update)", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/v1/recipes/recipe-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not own recipe", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-2", email: "other@test.com", name: "Other" },
      session: {} as never,
    });
    vi.mocked(db.select).mockReturnValueOnce(makeChain([RECIPE_1]) as never);
    const res = await app.request("/api/v1/recipes/recipe-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(403);
  });
});

describe("CHK-040: DELETE /api/v1/recipes/:id", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/v1/recipes/recipe-1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("deletes own recipe", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
      session: {} as never,
    });
    vi.mocked(db.select).mockReturnValueOnce(makeChain([RECIPE_1]) as never);
    vi.mocked(db.delete).mockReturnValue(makeDeleteChain() as never);
    const res = await app.request("/api/v1/recipes/recipe-1", { method: "DELETE" });
    expect(res.status).toBe(200);
  });
});

describe("CHK-040: POST /api/v1/recipes/:id/favorite", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/v1/recipes/recipe-1/favorite", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("adds favorite when authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
      session: {} as never,
    });
    // getRecipeById: select recipe row + select ingredients
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([]) as never); // ingredients
    vi.mocked(db.insert).mockReturnValue(makeInsertChain([]) as never);
    const res = await app.request("/api/v1/recipes/recipe-1/favorite", { method: "POST" });
    expect(res.status).toBe(200);
  });
});

describe("CHK-040: DELETE /api/v1/recipes/:id/favorite", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/v1/recipes/recipe-1/favorite", { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});

describe("CHK-040: POST /api/v1/recipes/:id/log", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/v1/recipes/recipe-1/log", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("logs recipe as meal when authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
      session: {} as never,
    });
    // fetch recipe
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([INGREDIENT_1]) as never);
    vi.mocked(db.insert).mockReturnValue(makeInsertChain([]) as never);

    const res = await app.request("/api/v1/recipes/recipe-1/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealSlot: "breakfast", date: "2026-03-22" }),
    });
    expect([200, 201]).toContain(res.status);
  });

  it("returns 404 when recipe not found", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
      session: {} as never,
    });
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);
    const res = await app.request("/api/v1/recipes/nonexistent/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealSlot: "breakfast", date: "2026-03-22" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("CHK-040: Recipe service pure functions", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("getRecipes returns array from db", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    const { getRecipes } = await import("@/server/services/recipe-service");
    const result = await getRecipes({});
    expect(Array.isArray(result.recipes)).toBe(true);
  });

  it("getRecipeById returns recipe with ingredients", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([RECIPE_1]) as never)
      .mockReturnValueOnce(makeChain([INGREDIENT_1]) as never);
    const { getRecipeById } = await import("@/server/services/recipe-service");
    const result = await getRecipeById("recipe-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("recipe-1");
    expect(Array.isArray(result?.ingredients)).toBe(true);
  });

  it("getRecipeById returns null when not found", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);
    const { getRecipeById } = await import("@/server/services/recipe-service");
    const result = await getRecipeById("no-such-id");
    expect(result).toBeNull();
  });
});
