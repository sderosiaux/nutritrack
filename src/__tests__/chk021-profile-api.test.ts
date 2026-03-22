/**
 * CHK-021: Profile API
 * GET /api/v1/profile, PUT /api/v1/profile, POST /api/v1/profile/recalculate-targets
 * DELETE /api/v1/users/me (CHK-055 account deletion)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => {
  const makeChain = (value: unknown = null) => {
    const chain: Record<string, unknown> = {};
    const methods = ["where", "limit", "set", "from", "values", "returning",
      "onConflictDoUpdate", "execute", "orderBy", "offset"];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(value ? [value] : []).then(resolve);
    return chain;
  };
  return {
    db: {
      select: vi.fn(() => ({ from: vi.fn(() => makeChain()) })),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoUpdate: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([]) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => makeChain()) })),
      delete: vi.fn(() => makeChain()),
      query: { userProfiles: { findFirst: vi.fn().mockResolvedValue(null) } },
    },
    userProfiles: { userId: "user_id" },
    dailyTargets: { userId: "user_id", date: "date" },
    user: { id: "id" },
    mealEntries: {},
    waterEntries: {},
    weightEntries: {},
    activityEntries: {},
  };
});

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@test.com", name: "Test User" },
    session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
  }),
}));

beforeEach(() => vi.resetAllMocks());

describe("GET /api/v1/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile");
    expect(res.status).toBe(401);
  });

  it("returns 404 when profile not found", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile");
    expect(res.status).toBe(404);
  });

  it("returns profile + targets when found", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValueOnce({
      userId: "user-1",
      displayName: "Test User",
      biologicalSex: "male",
      goal: "maintain",
      activityLevel: "moderate",
      currentWeightKg: "80",
      heightCm: "180",
      birthDate: "1994-01-01",
      dietaryRestrictions: [],
      allergies: [],
      units: "metric",
      language: "en",
      timezone: "UTC",
    } as never);

    // Mock daily targets query
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            caloriesKcal: 2000,
            proteinG: "100",
            carbsG: "250",
            fatG: "67",
            fiberG: "25",
            waterMl: 2000,
          }]),
        }),
      }),
    });
    vi.mocked(db.select).mockImplementationOnce(mockSelect as never);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile");
    expect(res.status).toBe(200);
    const body = await res.json() as { profile: { userId: string }; targets: unknown };
    expect(body).toHaveProperty("profile");
    expect(body).toHaveProperty("targets");
    expect(body.profile.userId).toBe("user-1");
  });
});

describe("PUT /api/v1/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("returns 422 for invalid body", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biologicalSex: "invalid_value" }),
    });
    expect(res.status).toBe(422);
  });

  it("upserts profile and returns 200", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    const updatedProfile = {
      userId: "user-1",
      displayName: "Updated Name",
      biologicalSex: null,
      goal: "lose_weight",
      activityLevel: null,
      currentWeightKg: null,
      heightCm: null,
      birthDate: null,
      dietaryRestrictions: [],
      allergies: [],
      units: "metric",
      language: "en",
      timezone: "UTC",
    };
    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedProfile]),
        }),
      }),
    });
    vi.mocked(db.insert).mockImplementationOnce(insertMock as never);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Updated Name", goal: "lose_weight" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/profile/recalculate-targets", () => {
  it("returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile/recalculate-targets", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("returns 404 if profile not found", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile/recalculate-targets", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("returns new targets when profile exists", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValueOnce({
      userId: "user-1",
      biologicalSex: "male",
      goal: "maintain",
      activityLevel: "moderate",
      currentWeightKg: "80",
      heightCm: "180",
      birthDate: "1994-01-01",
      weeklyPaceKg: null,
    } as never);

    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            caloriesKcal: 2500,
            proteinG: "125",
            carbsG: "313",
            fatG: "83",
            fiberG: "25",
            waterMl: 2000,
          }]),
        }),
      }),
    });
    vi.mocked(db.insert).mockImplementationOnce(insertMock as never);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/profile/recalculate-targets", { method: "POST" });
    expect(res.status).toBe(200);
    const body = await res.json() as { caloriesKcal: number };
    expect(body).toHaveProperty("caloriesKcal");
  });
});

describe("DELETE /api/v1/users/me (CHK-055)", () => {
  it("returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/users/me", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("deletes user account and returns 204", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    const deleteChain = {
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.delete).mockReturnValueOnce(deleteChain as never);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/users/me", { method: "DELETE" });
    expect(res.status).toBe(204);
  });
});
