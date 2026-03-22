/**
 * CHK-036: Data export API — JSON + CSV
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "@/server/api/index";

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@test.com" },
  }),
}));

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/server/services/analytics-service", () => ({
  getSummary: vi.fn(),
  getNutrientBreakdown: vi.fn(),
  getWeightHistory: vi.fn(),
  getTopFoods: vi.fn(),
  getMealTiming: vi.fn(),
  getExportData: vi.fn(),
}));

const mockExportRow = {
  date: "2025-01-01",
  mealType: "breakfast",
  foodName: "Oatmeal",
  calories: 300,
  protein: 10,
  carbs: 55,
  fat: 5,
  fiber: 6,
  quantity: 100,
};

describe("GET /api/v1/analytics/export (JSON)", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns JSON with proper Content-Disposition", async () => {
    const { getExportData } = await import("@/server/services/analytics-service");
    vi.mocked(getExportData).mockResolvedValueOnce([mockExportRow]);

    const res = await app.request(
      "/api/v1/analytics/export?format=json&startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment/);
    expect(res.headers.get("Content-Disposition")).toMatch(/\.json/);
  });

  it("returns 401 without auth", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const res = await app.request(
      "/api/v1/analytics/export?format=json",
      { method: "GET" }
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/analytics/export (CSV)", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns CSV with proper headers", async () => {
    const { getExportData } = await import("@/server/services/analytics-service");
    vi.mocked(getExportData).mockResolvedValueOnce([mockExportRow]);

    const res = await app.request(
      "/api/v1/analytics/export?format=csv&startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment/);
    expect(res.headers.get("Content-Disposition")).toMatch(/\.csv/);

    const text = await res.text();
    // CSV header row
    expect(text).toContain("date,meal_type,food_name");
    // Data row
    expect(text).toContain("2025-01-01");
    expect(text).toContain("Oatmeal");
  });

  it("returns 422 for invalid format", async () => {
    const res = await app.request(
      "/api/v1/analytics/export?format=xml",
      { method: "GET" }
    );
    expect(res.status).toBe(422);
  });
});
