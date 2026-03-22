/**
 * CHK-055: Account deletion API
 * DELETE /api/v1/users/me
 * (Also covered in chk021-profile-api.test.ts — this file is the dedicated suite)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => {
  const makeChain = () => ({
    where: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
    returning: vi.fn().mockResolvedValue([]),
  });
  return {
    db: {
      delete: vi.fn(() => makeChain()),
      select: vi.fn(() => ({ from: vi.fn(() => makeChain()) })),
      query: { userProfiles: { findFirst: vi.fn().mockResolvedValue(null) } },
    },
    user: { id: "id" },
    userProfiles: { userId: "user_id" },
    dailyTargets: { userId: "user_id", date: "date" },
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

describe("DELETE /api/v1/users/me", () => {
  it("returns 401 when unauthenticated", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/users/me", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 204 on successful deletion", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { app } = await import("@/server/api/index");
    const res = await app.request("/api/v1/users/me", { method: "DELETE" });
    expect(res.status).toBe(204);
  });

  it("calls db.delete when deleting account", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User" },
      session: { id: "sess-1", userId: "user-1", expiresAt: new Date() },
    } as never);

    const { db } = await import("@/server/db");
    const deleteChain = { where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.delete).mockReturnValueOnce(deleteChain as never);

    const { app } = await import("@/server/api/index");
    await app.request("/api/v1/users/me", { method: "DELETE" });
    expect(db.delete).toHaveBeenCalled();
  });
});
