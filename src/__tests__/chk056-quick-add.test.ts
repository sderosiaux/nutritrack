// @vitest-environment node
/**
 * CHK-056: Quick-add NLP free-text parsing
 * Tests: parseQuickAdd(), POST /api/v1/logs/quick-add
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));
vi.mock("@/server/services/food-service", () => ({
  searchFoods: vi.fn(),
}));
vi.mock("@/server/services/log-service", () => ({
  createMealEntry: vi.fn(),
}));

import { parseQuickAdd, type ParsedItem } from "@/server/services/quick-add-service";
import { getSessionFromRequest } from "@/server/auth";
import { searchFoods } from "@/server/services/food-service";
import { createMealEntry } from "@/server/services/log-service";
import { app } from "@/server/api/index";

const mockSession = { user: { id: "user-1", email: "test@example.com" } };

describe("CHK-056 — parseQuickAdd()", () => {
  it("parses single item with number prefix", () => {
    const result = parseQuickAdd("2 eggs");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("eggs");
    expect(result[0].quantity).toBe(2);
  });

  it("parses grams notation", () => {
    const result = parseQuickAdd("250g oatmeal");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("oatmeal");
    expect(result[0].grams).toBe(250);
  });

  it("parses ml notation", () => {
    const result = parseQuickAdd("250ml milk");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("milk");
    expect(result[0].grams).toBe(250);
  });

  it("parses multiple items separated by and", () => {
    const result = parseQuickAdd("2 eggs and 80g brown rice");
    expect(result).toHaveLength(2);
    expect(result[0].query).toBe("eggs");
    expect(result[0].quantity).toBe(2);
    expect(result[1].query).toBe("brown rice");
    expect(result[1].grams).toBe(80);
  });

  it("parses multiple items separated by comma", () => {
    const result = parseQuickAdd("1 banana, 200ml orange juice");
    expect(result).toHaveLength(2);
    expect(result[0].query).toBe("banana");
    expect(result[1].query).toBe("orange juice");
  });

  it("parses 'cup' unit notation", () => {
    const result = parseQuickAdd("1 cup brown rice");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("brown rice");
    expect(result[0].unit).toBe("cup");
  });

  it("parses 'tbsp' unit notation", () => {
    const result = parseQuickAdd("2 tbsp peanut butter");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("peanut butter");
    expect(result[0].unit).toBe("tbsp");
  });

  it("handles plain text without quantity", () => {
    const result = parseQuickAdd("chicken breast");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("chicken breast");
  });

  it("handles empty string", () => {
    const result = parseQuickAdd("");
    expect(result).toHaveLength(0);
  });

  it("handles whitespace-only string", () => {
    const result = parseQuickAdd("   ");
    expect(result).toHaveLength(0);
  });

  it("normalizes case for query", () => {
    const result = parseQuickAdd("2 Eggs");
    expect(result[0].query).toBe("eggs");
  });
});

describe("CHK-056 — POST /api/v1/logs/quick-add", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession as never);
  });

  it("returns 401 without auth", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);
    const req = new Request("http://localhost/api/v1/logs/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "2 eggs", date: "2026-03-22", mealType: "breakfast" }),
    });
    const res = await app.request(req);
    expect(res.status).toBe(401);
  });

  it("returns 422 when text missing", async () => {
    const req = new Request("http://localhost/api/v1/logs/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-03-22", mealType: "breakfast" }),
    });
    const res = await app.request(req);
    expect(res.status).toBe(422);
  });

  it("returns matched foods and creates entries", async () => {
    const mockFood = {
      id: "food-123",
      name: "Eggs",
      caloriesPer100g: 155,
      proteinPer100g: 13,
      carbsPer100g: 1.1,
      fatPer100g: 11,
      fiberPer100g: 0,
      servingSizes: [{ id: "ss-1", label: "1 egg", grams: 50 }],
    };

    vi.mocked(searchFoods).mockResolvedValue([mockFood] as never);
    vi.mocked(createMealEntry).mockResolvedValue({
      id: "entry-1",
      foodId: "food-123",
      caloriesKcal: 77.5,
    } as never);

    const req = new Request("http://localhost/api/v1/logs/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "2 eggs",
        date: "2026-03-22",
        mealType: "breakfast",
      }),
    });

    const res = await app.request(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.matched).toHaveLength(1);
    expect(body.matched[0].food.name).toBe("Eggs");
  });

  it("returns unmatched items when no food found", async () => {
    vi.mocked(searchFoods).mockResolvedValue([] as never);

    const req = new Request("http://localhost/api/v1/logs/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "flurbfood",
        date: "2026-03-22",
        mealType: "breakfast",
      }),
    });

    const res = await app.request(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unmatched).toHaveLength(1);
    expect(body.matched).toHaveLength(0);
  });

  it("handles multiple items — some matched, some not", async () => {
    vi.mocked(searchFoods)
      .mockResolvedValueOnce([{
        id: "food-1",
        name: "Eggs",
        caloriesPer100g: 155,
        proteinPer100g: 13,
        carbsPer100g: 1.1,
        fatPer100g: 11,
        fiberPer100g: 0,
        servingSizes: [{ id: "ss-1", label: "1 egg", grams: 50 }],
      }] as never)
      .mockResolvedValueOnce([] as never);

    vi.mocked(createMealEntry).mockResolvedValue({ id: "e-1" } as never);

    const req = new Request("http://localhost/api/v1/logs/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "2 eggs and flurbfood",
        date: "2026-03-22",
        mealType: "breakfast",
      }),
    });

    const res = await app.request(req);
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body.matched).toHaveLength(1);
    expect(body.unmatched).toHaveLength(1);
  });
});
