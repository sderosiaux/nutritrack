/**
 * CHK-051: Custom food CRUD API.
 * POST /api/v1/foods (source=user_created)
 * PUT  /api/v1/foods/:id (own foods only)
 * DELETE /api/v1/foods/:id (own foods only)
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

const VALID_CREATE_DTO = {
  name: "My Protein Bar",
  brandName: "HomeChef",
  servingSizeLabel: "1 bar",
  servingSizeWeightG: 60,
  caloriesPer100g: 380,
  proteinPer100g: 28,
  carbsPer100g: 35,
  fatPer100g: 12,
  fiberPer100g: 5,
};

const CREATED_FOOD = {
  id: "custom-1",
  ...VALID_CREATE_DTO,
  source: "user_created",
  createdByUserId: "user-1",
  servingSizes: [{ id: "ss-c1", label: "1 bar", weightG: 60 }],
};

describe("CHK-051: Custom food creation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("POST /api/v1/foods returns 201 with created food", async () => {
    const { createCustomFood } = await import("@/server/services/food-service");
    vi.mocked(createCustomFood).mockResolvedValue(CREATED_FOOD as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(VALID_CREATE_DTO),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.source).toBe("user_created");
    expect(body.name).toBe("My Protein Bar");
  });

  it("createCustomFood is called with userId and dto", async () => {
    const { createCustomFood } = await import("@/server/services/food-service");
    vi.mocked(createCustomFood).mockResolvedValue(CREATED_FOOD as never);

    const { app } = await import("@/server/api");
    await app.fetch(
      new Request("http://localhost/api/v1/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(VALID_CREATE_DTO),
      })
    );

    expect(createCustomFood).toHaveBeenCalledWith("user-1", VALID_CREATE_DTO);
  });

  it("POST /api/v1/foods returns 422 when required fields missing", async () => {
    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Incomplete" }),
      })
    );

    expect(res.status).toBe(422);
  });
});

describe("CHK-051: Custom food update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("PUT /api/v1/foods/:id returns 200 for own food", async () => {
    const { updateCustomFood } = await import("@/server/services/food-service");
    vi.mocked(updateCustomFood).mockResolvedValue({ ...CREATED_FOOD, name: "Updated" } as never);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/custom-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      })
    );

    expect(res.status).toBe(200);
  });

  it("PUT /api/v1/foods/:id returns 403 for another user's food", async () => {
    const { updateCustomFood } = await import("@/server/services/food-service");
    vi.mocked(updateCustomFood).mockRejectedValue(
      Object.assign(new Error("forbidden"), { code: "forbidden" })
    );

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/other-food", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hack" }),
      })
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("forbidden");
  });
});

describe("CHK-051: Custom food deletion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("DELETE /api/v1/foods/:id returns 204 for own food", async () => {
    const { deleteCustomFood } = await import("@/server/services/food-service");
    vi.mocked(deleteCustomFood).mockResolvedValue(undefined);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/custom-1", { method: "DELETE" })
    );

    expect(res.status).toBe(204);
    expect(deleteCustomFood).toHaveBeenCalledWith("custom-1", "user-1");
  });

  it("DELETE /api/v1/foods/:id returns 403 for another user's food", async () => {
    const { deleteCustomFood } = await import("@/server/services/food-service");
    vi.mocked(deleteCustomFood).mockRejectedValue(
      Object.assign(new Error("forbidden"), { code: "forbidden" })
    );

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/other-food", { method: "DELETE" })
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("forbidden");
  });

  it("DELETE /api/v1/foods/:id returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api");
    const res = await app.fetch(
      new Request("http://localhost/api/v1/foods/custom-1", { method: "DELETE" })
    );
    expect(res.status).toBe(401);
  });
});
