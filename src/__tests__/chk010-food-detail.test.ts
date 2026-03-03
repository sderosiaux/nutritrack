/**
 * CHK-010: Food detail, recent, favorites API.
 * GET /api/v1/foods/:id, /recent, /favorites
 * POST /DELETE /api/v1/foods/:id/favorite
 * Source: spec/07-api.md §Food Database
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@example.com", name: "Test" },
    session: { id: "session-1" },
  }),
}));

vi.mock("@/server/services/food-service", () => ({
  searchFoods: vi.fn(),
  getFoodById: vi.fn(),
  getRecentFoods: vi.fn(),
  getFavoriteFoods: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFoodByBarcode: vi.fn(),
  fetchFoodFromOpenFoodFacts: vi.fn(),
  createCustomFood: vi.fn(),
  updateCustomFood: vi.fn(),
  deleteCustomFood: vi.fn(),
}));

const MOCK_FOOD = {
  id: "food-1",
  name: "Chicken Breast",
  brandName: null,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  fiberPer100g: 0,
  sugarPer100g: null,
  sodiumMgPer100g: null,
  micronutrients: {},
  source: "usda",
  verified: true,
  servingSizes: [{ id: "ss-1", label: "100g", weightG: 100 }],
};

describe("CHK-010: Food detail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/v1/foods/:id returns 200 with food object", async () => {
    const { getFoodById } = await import("@/server/services/food-service");
    vi.mocked(getFoodById).mockResolvedValue(MOCK_FOOD as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(new Request("http://localhost/api/v1/foods/food-1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("food-1");
    expect(body.name).toBe("Chicken Breast");
  });

  it("GET /api/v1/foods/:id returns 404 when food not found", async () => {
    const { getFoodById } = await import("@/server/services/food-service");
    vi.mocked(getFoodById).mockResolvedValue(null);

    const { app } = await import("@/server/api");
    const res = await app.fetch(new Request("http://localhost/api/v1/foods/nonexistent"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("not_found");
  });
});

describe("CHK-010: Recent foods", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/v1/foods/recent returns 200 with array", async () => {
    const { getRecentFoods } = await import("@/server/services/food-service");
    vi.mocked(getRecentFoods).mockResolvedValue([MOCK_FOOD] as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(new Request("http://localhost/api/v1/foods/recent"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("recent foods calls getRecentFoods with userId and limit 20", async () => {
    const { getRecentFoods } = await import("@/server/services/food-service");
    vi.mocked(getRecentFoods).mockResolvedValue([]);

    const { app } = await import("@/server/api");
    await app.fetch(new Request("http://localhost/api/v1/foods/recent"));

    expect(getRecentFoods).toHaveBeenCalledWith("user-1", 20);
  });
});

describe("CHK-010: Favorites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/v1/foods/favorites returns 200 with array", async () => {
    const { getFavoriteFoods } = await import("@/server/services/food-service");
    vi.mocked(getFavoriteFoods).mockResolvedValue([MOCK_FOOD] as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(new Request("http://localhost/api/v1/foods/favorites"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /api/v1/foods/:id/favorite returns 201", async () => {
    const { addFavorite } = await import("@/server/services/food-service");
    vi.mocked(addFavorite).mockResolvedValue(undefined);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/food-1/favorite", { method: "POST" })
    );

    expect(res.status).toBe(201);
    expect(addFavorite).toHaveBeenCalledWith("user-1", "food-1");
  });

  it("DELETE /api/v1/foods/:id/favorite returns 204", async () => {
    const { removeFavorite } = await import("@/server/services/food-service");
    vi.mocked(removeFavorite).mockResolvedValue(undefined);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/food-1/favorite", { method: "DELETE" })
    );

    expect(res.status).toBe(204);
    expect(removeFavorite).toHaveBeenCalledWith("user-1", "food-1");
  });
});
