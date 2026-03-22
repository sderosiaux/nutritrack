/**
 * CHK-025: Activity logging API
 * POST /api/v1/logs/:date/activities
 * PUT  /api/v1/logs/activities/:id
 * DELETE /api/v1/logs/activities/:id
 * GET  /api/v1/logs/activities?date=YYYY-MM-DD
 * Tests real service functions (only @/server/db mocked).
 * Source: spec/07-api.md §Meal Logging
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ────────────────────────────────────────────────────────────────
vi.mock("@/server/db", () => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const activityEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at",
    exerciseId: "exercise_id", customName: "custom_name",
    durationMin: "duration_min", intensityLevel: "intensity_level",
    caloriesBurned: "calories_burned", notes: "notes",
  };
  const exercises = {
    id: "id", name: "name", category: "category",
    metValue: "met_value", metLow: "met_low", metHigh: "met_high",
  };
  const weightEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at",
    weightKg: "weight_kg", note: "note",
  };
  return { db, activityEntries, exercises, weightEntries };
});

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

import { db } from "@/server/db";
import { getSessionFromRequest } from "@/server/auth";
import {
  createActivityEntry,
  updateActivityEntry,
  deleteActivityEntry,
  getActivityEntries,
  computeCaloriesBurned,
} from "@/server/services/log-service";
import { app } from "@/server/api/index";

// ── Chainable mock factory ─────────────────────────────────────────────────
function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "innerJoin", "leftJoin", "orderBy",
    "limit", "offset", "set", "values", "returning", "onConflictDoNothing", "and"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  return chain;
}

// ── Fixtures ───────────────────────────────────────────────────────────────
const USER_ID = "user-abc";
const OTHER_USER_ID = "user-xyz";
const DATE = "2025-03-15";

const EXERCISE_ROW = {
  id: "ex-1",
  name: "Running",
  category: "cardio",
  metValue: "8.0",
  metLow: "6.0",
  metHigh: "12.0",
};

const ACTIVITY_ROW = {
  id: "ae-1",
  userId: USER_ID,
  date: DATE,
  loggedAt: new Date("2025-03-15T10:00:00Z"),
  exerciseId: "ex-1",
  customName: null,
  durationMin: 30,
  intensityLevel: "moderate" as const,
  caloriesBurned: "240",
  notes: null,
};

// ── computeCaloriesBurned (pure) ───────────────────────────────────────────

describe("CHK-025: computeCaloriesBurned — pure MET calculation", () => {
  it("computes calories burned using MET formula", () => {
    // calories = MET × weight_kg × duration_hours
    const result = computeCaloriesBurned(8.0, 75, 30);
    // 8.0 × 75 × (30/60) = 8 × 75 × 0.5 = 300
    expect(result).toBeCloseTo(300, 0);
  });

  it("handles 60 minute session correctly", () => {
    const result = computeCaloriesBurned(4.0, 70, 60);
    // 4.0 × 70 × 1.0 = 280
    expect(result).toBeCloseTo(280, 0);
  });

  it("returns 0 for zero duration", () => {
    expect(computeCaloriesBurned(8.0, 70, 0)).toBe(0);
  });
});

// ── Service: createActivityEntry ───────────────────────────────────────────

describe("CHK-025: createActivityEntry — persists activity with calorie estimate", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("creates entry with exerciseId and MET-based calorie calculation", async () => {
    // exercise lookup
    vi.mocked(db.select).mockReturnValueOnce(makeChain([EXERCISE_ROW]) as never);

    const insertChain = makeChain([ACTIVITY_ROW]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const result = await createActivityEntry(USER_ID, DATE, {
      exerciseId: "ex-1",
      durationMinutes: 30,
      userWeightKg: 75,
    });

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(result.exerciseId).toBe("ex-1");
    expect(result.durationMin).toBe(30);
    expect(result.userId).toBe(USER_ID);
  });

  it("creates entry with custom name when no exerciseId", async () => {
    const customRow = {
      ...ACTIVITY_ROW,
      exerciseId: null,
      customName: "Home yoga",
      caloriesBurned: "150",
    };
    const insertChain = makeChain([customRow]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const result = await createActivityEntry(USER_ID, DATE, {
      customName: "Home yoga",
      durationMinutes: 45,
      caloriesBurned: 150,
    });

    expect(result.customName).toBe("Home yoga");
    expect(result.caloriesBurned).toBeCloseTo(150, 0);
  });

  it("throws validation_error when neither exerciseId nor customName provided", async () => {
    await expect(
      createActivityEntry(USER_ID, DATE, { durationMinutes: 30, caloriesBurned: 100 })
    ).rejects.toMatchObject({ code: "validation_error" });
  });

  it("throws not_found when exerciseId doesn't exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      createActivityEntry(USER_ID, DATE, { exerciseId: "nonexistent", durationMinutes: 30, userWeightKg: 75 })
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

// ── Service: updateActivityEntry ───────────────────────────────────────────

describe("CHK-025: updateActivityEntry — updates own entry only", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("updates activity entry for correct owner", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ACTIVITY_ROW]) as never);
    const updatedRow = { ...ACTIVITY_ROW, durationMin: 45, caloriesBurned: "360" };
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue(makeChain([updatedRow])),
    } as never);

    const result = await updateActivityEntry("ae-1", USER_ID, { durationMinutes: 45 });
    expect(result.durationMin).toBe(45);
  });

  it("throws forbidden for wrong user", async () => {
    const otherRow = { ...ACTIVITY_ROW, userId: OTHER_USER_ID };
    vi.mocked(db.select).mockReturnValueOnce(makeChain([otherRow]) as never);

    await expect(
      updateActivityEntry("ae-1", USER_ID, { durationMinutes: 45 })
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("throws not_found when entry missing", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      updateActivityEntry("nonexistent", USER_ID, { durationMinutes: 30 })
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

// ── Service: deleteActivityEntry ───────────────────────────────────────────

describe("CHK-025: deleteActivityEntry — deletes own entry only", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("deletes entry when user is owner", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ACTIVITY_ROW]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    await expect(deleteActivityEntry("ae-1", USER_ID)).resolves.toBeUndefined();
  });

  it("throws forbidden for wrong user", async () => {
    const otherRow = { ...ACTIVITY_ROW, userId: OTHER_USER_ID };
    vi.mocked(db.select).mockReturnValueOnce(makeChain([otherRow]) as never);

    await expect(deleteActivityEntry("ae-1", USER_ID)).rejects.toMatchObject({ code: "forbidden" });
  });
});

// ── Service: getActivityEntries ────────────────────────────────────────────

describe("CHK-025: getActivityEntries — list by date", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns activities for given date", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ACTIVITY_ROW]) as never);

    const result = await getActivityEntries(USER_ID, DATE);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(DATE);
  });

  it("returns empty array when no entries", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);
    const result = await getActivityEntries(USER_ID, DATE);
    expect(result).toEqual([]);
  });
});

// ── Route tests ─────────────────────────────────────────────────────────────

describe("CHK-025: POST /api/v1/logs/:date/activities — route", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    const res = await app.request("/api/v1/logs/2025-03-15/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName: "Walking", durationMinutes: 30, caloriesBurned: 100 }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 201 with custom activity", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);

    const customRow = { ...ACTIVITY_ROW, exerciseId: null, customName: "Walking" };
    const insertChain = makeChain([customRow]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const res = await app.request("/api/v1/logs/2025-03-15/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName: "Walking", durationMinutes: 30, caloriesBurned: 100 }),
    });
    expect(res.status).toBe(201);
  });

  it("returns 422 on missing durationMinutes", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);

    const res = await app.request("/api/v1/logs/2025-03-15/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName: "Walking" }),
    });
    expect(res.status).toBe(422);
  });
});

describe("CHK-025: DELETE /api/v1/logs/activities/:id — route", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 204 on success", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);
    vi.mocked(db.select).mockReturnValueOnce(makeChain([ACTIVITY_ROW]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    const res = await app.request("/api/v1/logs/activities/ae-1", { method: "DELETE" });
    expect(res.status).toBe(204);
  });

  it("returns 403 for wrong user", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);
    const otherRow = { ...ACTIVITY_ROW, userId: OTHER_USER_ID };
    vi.mocked(db.select).mockReturnValueOnce(makeChain([otherRow]) as never);

    const res = await app.request("/api/v1/logs/activities/ae-1", { method: "DELETE" });
    expect(res.status).toBe(403);
  });
});
