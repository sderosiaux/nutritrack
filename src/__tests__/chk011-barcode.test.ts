/**
 * CHK-011: Barcode lookup API.
 * GET /api/v1/foods/barcode/:barcode
 * Local DB first, Open Food Facts fallback, error code barcode_not_found.
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
  id: "food-barcode-1",
  name: "Coca-Cola 330ml",
  brandName: "Coca-Cola",
  barcode: "5449000000996",
  caloriesPer100g: 42,
  proteinPer100g: 0,
  carbsPer100g: 10.6,
  fatPer100g: 0,
  fiberPer100g: 0,
  source: "open_food_facts",
  servingSizes: [{ id: "ss-2", label: "330ml can", weightG: 330 }],
};

describe("CHK-011: Barcode lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 when barcode found in local DB", async () => {
    const { getFoodByBarcode } = await import("@/server/services/food-service");
    vi.mocked(getFoodByBarcode).mockResolvedValue(MOCK_FOOD as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/barcode/5449000000996")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.barcode).toBe("5449000000996");
    expect(body.name).toBe("Coca-Cola 330ml");
  });

  it("falls back to Open Food Facts when not in local DB", async () => {
    const { getFoodByBarcode, fetchFoodFromOpenFoodFacts } =
      await import("@/server/services/food-service");
    vi.mocked(getFoodByBarcode).mockResolvedValue(null);
    vi.mocked(fetchFoodFromOpenFoodFacts).mockResolvedValue(MOCK_FOOD as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/barcode/5449000000996")
    );

    expect(res.status).toBe(200);
    expect(fetchFoodFromOpenFoodFacts).toHaveBeenCalledWith("5449000000996");
  });

  it("returns 404 with barcode_not_found when not in DB or OFF", async () => {
    const { getFoodByBarcode, fetchFoodFromOpenFoodFacts } =
      await import("@/server/services/food-service");
    vi.mocked(getFoodByBarcode).mockResolvedValue(null);
    vi.mocked(fetchFoodFromOpenFoodFacts).mockResolvedValue(null);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/barcode/9999999999999")
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("barcode_not_found");
  });

  it("local DB is queried first before calling OFF", async () => {
    const { getFoodByBarcode, fetchFoodFromOpenFoodFacts } =
      await import("@/server/services/food-service");
    vi.mocked(getFoodByBarcode).mockResolvedValue(MOCK_FOOD as never);

    const { app } = await import("@/server/api");
    await app.fetch(new Request("http://localhost/api/v1/foods/barcode/5449000000996"));

    expect(getFoodByBarcode).toHaveBeenCalledWith("5449000000996");
    expect(fetchFoodFromOpenFoodFacts).not.toHaveBeenCalled();
  });

  it("returns 404 when unauthenticated and barcode not found (barcode is public)", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    const { getFoodByBarcode, fetchFoodFromOpenFoodFacts } = await import("@/server/services/food-service");
    vi.mocked(getFoodByBarcode).mockResolvedValueOnce(null);
    vi.mocked(fetchFoodFromOpenFoodFacts).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/barcode/1234567890")
    );
    expect(res.status).toBe(404);
  });
});
