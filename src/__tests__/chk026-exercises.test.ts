/**
 * CHK-026: Exercise DB seed + GET /api/v1/exercises
 * Tests: 200+ exercises with METs, category filtering, search
 * Source: spec/01-features.md §F7
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
  const exercises = {
    id: "id", name: "name", category: "category",
    metValue: "met_value", metLow: "met_low", metHigh: "met_high",
  };
  const weightEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at",
    weightKg: "weight_kg", note: "note",
  };
  const activityEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at",
    exerciseId: "exercise_id", customName: "custom_name",
    durationMin: "duration_min", intensityLevel: "intensity_level",
    caloriesBurned: "calories_burned", notes: "notes",
  };
  return { db, exercises, weightEntries, activityEntries };
});

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

import { db } from "@/server/db";
import { getSessionFromRequest } from "@/server/auth";
import { app } from "@/server/api/index";
import {
  EXERCISE_SEED_A,
  EXERCISE_SEED_B,
} from "@/server/db/seed-data/exercises";

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

// ── Seed data validation ────────────────────────────────────────────────────

describe("CHK-026: Exercise seed data — structure and coverage", () => {
  const ALL_EXERCISES = [...EXERCISE_SEED_A, ...EXERCISE_SEED_B];

  it("has 200+ exercises in total", () => {
    expect(ALL_EXERCISES.length).toBeGreaterThanOrEqual(200);
  });

  it("all exercises have required fields", () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
      expect(ex.category).toBeTruthy();
      expect(ex.metValue).toBeGreaterThan(0);
      expect(ex.metLow).toBeGreaterThan(0);
      expect(ex.metHigh).toBeGreaterThanOrEqual(ex.metValue);
    }
  });

  it("covers all 5 required categories", () => {
    const categories = new Set(ALL_EXERCISES.map(e => e.category));
    expect(categories.has("cardio")).toBe(true);
    expect(categories.has("strength")).toBe(true);
    expect(categories.has("flexibility")).toBe(true);
    expect(categories.has("sports")).toBe(true);
    expect(categories.has("daily_activity")).toBe(true);
  });

  it("has no duplicate IDs", () => {
    const ids = ALL_EXERCISES.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("has realistic MET values (between 1 and 20)", () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.metValue).toBeGreaterThanOrEqual(1);
      expect(ex.metValue).toBeLessThanOrEqual(20);
      expect(ex.metLow).toBeGreaterThanOrEqual(1);
      expect(ex.metHigh).toBeLessThanOrEqual(25);
    }
  });

  it("has at least 30 cardio exercises", () => {
    const cardio = ALL_EXERCISES.filter(e => e.category === "cardio");
    expect(cardio.length).toBeGreaterThanOrEqual(30);
  });

  it("has at least 30 strength exercises", () => {
    const strength = ALL_EXERCISES.filter(e => e.category === "strength");
    expect(strength.length).toBeGreaterThanOrEqual(30);
  });

  it("has at least 20 sports exercises", () => {
    const sports = ALL_EXERCISES.filter(e => e.category === "sports");
    expect(sports.length).toBeGreaterThanOrEqual(20);
  });
});

// ── Route: GET /api/v1/exercises ────────────────────────────────────────────

describe("CHK-026: GET /api/v1/exercises — list exercises", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  const EXERCISE_ROWS = [
    { id: "ex-1", name: "Running", category: "cardio", metValue: "8.0", metLow: "6.0", metHigh: "12.0" },
    { id: "ex-2", name: "Squat", category: "strength", metValue: "5.0", metLow: "3.5", metHigh: "6.0" },
  ];

  it("returns 200 with list of exercises (public endpoint)", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    vi.mocked(db.select).mockReturnValueOnce(makeChain(EXERCISE_ROWS) as never);

    const res = await app.request("/api/v1/exercises");
    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(2);
  });

  it("returns exercises with metValue numeric", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    vi.mocked(db.select).mockReturnValueOnce(makeChain(EXERCISE_ROWS) as never);

    const res = await app.request("/api/v1/exercises");
    const body = await res.json() as { items: Array<{ metValue: number; name: string }> };
    expect(body.items[0].metValue).toBe(8.0);
    expect(body.items[0].name).toBe("Running");
  });

  it("supports ?category= filter", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    const cardioRows = [EXERCISE_ROWS[0]];
    vi.mocked(db.select).mockReturnValueOnce(makeChain(cardioRows) as never);

    const res = await app.request("/api/v1/exercises?category=cardio");
    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ category: string }> };
    expect(body.items.every(e => e.category === "cardio")).toBe(true);
  });

  it("supports ?q= text search", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    vi.mocked(db.select).mockReturnValueOnce(makeChain([EXERCISE_ROWS[0]]) as never);

    const res = await app.request("/api/v1/exercises?q=run");
    expect(res.status).toBe(200);
  });

  it("returns 422 for invalid category", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const res = await app.request("/api/v1/exercises?category=invalid");
    expect(res.status).toBe(422);
  });
});

describe("CHK-026: GET /api/v1/exercises/:id — single exercise", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns single exercise by ID", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    vi.mocked(db.select).mockReturnValueOnce(makeChain([
      { id: "ex-1", name: "Running", category: "cardio", metValue: "8.0", metLow: "6.0", metHigh: "12.0" }
    ]) as never);

    const res = await app.request("/api/v1/exercises/ex-1");
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; name: string };
    expect(body.id).toBe("ex-1");
    expect(body.name).toBe("Running");
  });

  it("returns 404 for unknown ID", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    const res = await app.request("/api/v1/exercises/nonexistent");
    expect(res.status).toBe(404);
  });
});
