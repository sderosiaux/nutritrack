/**
 * CHK-033: Analytics API — summary + nutrients endpoints
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "@/server/api/index";

// Mock auth — default: authenticated
vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@test.com" },
  }),
}));

// Mock DB (minimal stub — analytics service is separately mocked)
vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

// Mock analytics service
vi.mock("@/server/services/analytics-service", () => ({
  getSummary: vi.fn(),
  getNutrientBreakdown: vi.fn(),
  getWeightHistory: vi.fn(),
  getTopFoods: vi.fn(),
  getMealTiming: vi.fn(),
  getExportData: vi.fn(),
}));

describe("GET /api/v1/analytics/summary", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    // Restore auth mock after reset
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns 200 with summary data", async () => {
    const { getSummary } = await import("@/server/services/analytics-service");
    vi.mocked(getSummary).mockResolvedValueOnce({
      avgCalories: 1800,
      avgProtein: 90,
      avgCarbs: 225,
      avgFat: 60,
      avgFiber: 25,
      avgWaterMl: 2000,
      daysLogged: 7,
      currentStreak: 5,
      longestStreak: 10,
    });

    const res = await app.request(
      "/api/v1/analytics/summary?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty("avgCalories", 1800);
    expect(body).toHaveProperty("currentStreak", 5);
    expect(body).toHaveProperty("longestStreak", 10);
    expect(body).toHaveProperty("daysLogged", 7);
  });

  it("returns 401 without auth", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const res = await app.request(
      "/api/v1/analytics/summary?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/analytics/nutrients", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
    });
  });

  it("returns per-day nutrient breakdown", async () => {
    const { getNutrientBreakdown } = await import("@/server/services/analytics-service");
    vi.mocked(getNutrientBreakdown).mockResolvedValueOnce([
      { date: "2025-01-01", calories: 1800, protein: 90, carbs: 225, fat: 60, fiber: 25, waterMl: 2000 },
    ]);

    const res = await app.request(
      "/api/v1/analytics/nutrients?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("date", "2025-01-01");
    expect(body[0]).toHaveProperty("calories", 1800);
  });

  it("returns 401 without auth", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const res = await app.request(
      "/api/v1/analytics/nutrients?startDate=2025-01-01&endDate=2025-01-07",
      { method: "GET" }
    );
    expect(res.status).toBe(401);
  });
});
