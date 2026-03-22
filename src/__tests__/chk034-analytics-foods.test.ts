/**
 * CHK-034: Analytics API — weight + foods + meal-timing endpoints
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

describe("GET /api/v1/analytics/weight", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns weight entries ordered by date", async () => {
    const { getWeightHistory } = await import("@/server/services/analytics-service");
    vi.mocked(getWeightHistory).mockResolvedValueOnce([
      { date: "2025-01-01", weightKg: 75.5 },
      { date: "2025-01-03", weightKg: 75.2 },
    ]);

    const res = await app.request(
      "/api/v1/analytics/weight?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty("weightKg", 75.5);
  });

  it("returns 401 without auth", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const res = await app.request(
      "/api/v1/analytics/weight?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/analytics/foods/top", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns most logged foods with count", async () => {
    const { getTopFoods } = await import("@/server/services/analytics-service");
    vi.mocked(getTopFoods).mockResolvedValueOnce([
      { foodId: "f-1", foodName: "Chicken Breast", count: 12 },
      { foodId: "f-2", foodName: "Brown Rice", count: 8 },
    ]);

    const res = await app.request(
      "/api/v1/analytics/foods/top?startDate=2025-01-01&endDate=2025-01-07&limit=10",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("foodName", "Chicken Breast");
    expect(body[0]).toHaveProperty("count", 12);
  });
});

describe("GET /api/v1/analytics/meal-timing", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns meal timing distribution by hour", async () => {
    const { getMealTiming } = await import("@/server/services/analytics-service");
    vi.mocked(getMealTiming).mockResolvedValueOnce([
      { hour: 8, count: 15 },
      { hour: 12, count: 20 },
      { hour: 19, count: 18 },
    ]);

    const res = await app.request(
      "/api/v1/analytics/meal-timing?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("hour");
    expect(body[0]).toHaveProperty("count");
  });
});
