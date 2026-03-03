/**
 * CHK-009: Food search API.
 * GET /api/v1/foods/search?q=...&limit=20&offset=0
 * Full-text search, fuzzy ranking, multi-language, pagination.
 * Source: spec/07-api.md §Food Database
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth to inject fake session
vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@example.com", name: "Test" },
    session: { id: "session-1" },
  }),
}));

// Mock food service
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

const MOCK_FOOD_ITEM = {
  id: "food-1",
  name: "Chicken Breast",
  brandName: null,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  fiberPer100g: 0,
  servingSizes: [{ id: "ss-1", label: "100g", weightG: 100 }],
  source: "usda",
};

describe("CHK-009: Food search API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/v1/foods/search returns 200 with items and total", async () => {
    const { searchFoods } = await import("@/server/services/food-service");
    vi.mocked(searchFoods).mockResolvedValue({
      items: [MOCK_FOOD_ITEM],
      total: 1,
    });

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/search?q=chicken&limit=20&offset=0")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("source");
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("search response items have correct FoodSearchItem shape", async () => {
    const { searchFoods } = await import("@/server/services/food-service");
    vi.mocked(searchFoods).mockResolvedValue({
      items: [MOCK_FOOD_ITEM],
      total: 1,
    });

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/search?q=chicken")
    );
    const body = await res.json();
    const item = body.items[0];

    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("name");
    expect(item).toHaveProperty("brandName");
    expect(item).toHaveProperty("caloriesPer100g");
    expect(item).toHaveProperty("proteinPer100g");
    expect(item).toHaveProperty("carbsPer100g");
    expect(item).toHaveProperty("fatPer100g");
    expect(item).toHaveProperty("servingSizes");
    expect(item).toHaveProperty("source");
  });

  it("passes q, limit, offset to searchFoods", async () => {
    const { searchFoods } = await import("@/server/services/food-service");
    vi.mocked(searchFoods).mockResolvedValue({ items: [], total: 0 });

    const { app } = await import("@/server/api");
    await app.fetch(
      new Request("http://localhost/api/v1/foods/search?q=banana&limit=10&offset=5")
    );

    expect(searchFoods).toHaveBeenCalledWith(
      expect.objectContaining({ q: "banana", limit: 10, offset: 5 })
    );
  });

  it("returns 400 when q param is missing", async () => {
    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/search")
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/search?q=chicken")
    );
    expect(res.status).toBe(401);
  });

  it("source field is 'local' for DB results", async () => {
    const { searchFoods } = await import("@/server/services/food-service");
    vi.mocked(searchFoods).mockResolvedValue({ items: [MOCK_FOOD_ITEM], total: 1 });

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/search?q=chicken")
    );
    const body = await res.json();
    expect(body.source).toBe("local");
  });

  it("passes userId to searchFoods for ranking recent foods higher", async () => {
    const { searchFoods } = await import("@/server/services/food-service");
    vi.mocked(searchFoods).mockResolvedValue({ items: [], total: 0 });

    const { app } = await import("@/server/api");
    await app.fetch(new Request("http://localhost/api/v1/foods/search?q=egg"));

    expect(searchFoods).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" })
    );
  });
});
