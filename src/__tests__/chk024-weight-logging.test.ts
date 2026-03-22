/**
 * CHK-024: Weight logging API
 * POST /api/v1/logs/:date/weight
 * PUT  /api/v1/logs/weight/:id
 * DELETE /api/v1/logs/weight/:id
 * GET  /api/v1/logs/weight?date=YYYY-MM-DD
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
  const weightEntries = {
    id: "id", userId: "user_id", date: "date", loggedAt: "logged_at",
    weightKg: "weight_kg", note: "note",
  };
  return { db, weightEntries };
});

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

import { db } from "@/server/db";
import { getSessionFromRequest } from "@/server/auth";
import {
  createWeightEntry,
  updateWeightEntry,
  deleteWeightEntry,
  getWeightEntries,
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

const WEIGHT_ROW = {
  id: "we-1",
  userId: USER_ID,
  date: DATE,
  loggedAt: new Date("2025-03-15T10:00:00Z"),
  weightKg: "82.5",
  note: null,
};

// ── Service: createWeightEntry ─────────────────────────────────────────────

describe("CHK-024: createWeightEntry — persists weight entry", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("creates a weight entry and returns structured result", async () => {
    const insertChain = makeChain([WEIGHT_ROW]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const result = await createWeightEntry(USER_ID, DATE, { weightKg: 82.5 });

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(result.weightKg).toBeCloseTo(82.5, 1);
    expect(result.userId).toBe(USER_ID);
    expect(result.date).toBe(DATE);
  });

  it("includes note when provided", async () => {
    const rowWithNote = { ...WEIGHT_ROW, note: "morning weigh-in" };
    const insertChain = makeChain([rowWithNote]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const result = await createWeightEntry(USER_ID, DATE, {
      weightKg: 82.5,
      note: "morning weigh-in",
    });

    expect(result.note).toBe("morning weigh-in");
  });

  it("rejects invalid weightKg (zero)", async () => {
    await expect(
      createWeightEntry(USER_ID, DATE, { weightKg: 0 })
    ).rejects.toMatchObject({ code: "validation_error" });
  });

  it("rejects invalid weightKg (negative)", async () => {
    await expect(
      createWeightEntry(USER_ID, DATE, { weightKg: -5 })
    ).rejects.toMatchObject({ code: "validation_error" });
  });
});

// ── Service: updateWeightEntry ─────────────────────────────────────────────

describe("CHK-024: updateWeightEntry — updates own entry only", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("updates weight entry for correct owner", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([WEIGHT_ROW]) as never);
    const updatedRow = { ...WEIGHT_ROW, weightKg: "80.0" };
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue(makeChain([updatedRow])),
    } as never);

    const result = await updateWeightEntry("we-1", USER_ID, { weightKg: 80.0 });
    expect(result.weightKg).toBeCloseTo(80.0, 1);
  });

  it("throws forbidden when user doesn't own entry", async () => {
    const otherRow = { ...WEIGHT_ROW, userId: OTHER_USER_ID };
    vi.mocked(db.select).mockReturnValueOnce(makeChain([otherRow]) as never);

    await expect(
      updateWeightEntry("we-1", USER_ID, { weightKg: 80.0 })
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("throws not_found when entry doesn't exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(
      updateWeightEntry("nonexistent", USER_ID, { weightKg: 80.0 })
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

// ── Service: deleteWeightEntry ─────────────────────────────────────────────

describe("CHK-024: deleteWeightEntry — deletes own entry only", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("deletes entry when user is owner", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([WEIGHT_ROW]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    await expect(deleteWeightEntry("we-1", USER_ID)).resolves.toBeUndefined();
    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  it("throws forbidden when user doesn't own entry", async () => {
    const otherRow = { ...WEIGHT_ROW, userId: OTHER_USER_ID };
    vi.mocked(db.select).mockReturnValueOnce(makeChain([otherRow]) as never);

    await expect(deleteWeightEntry("we-1", USER_ID)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("throws not_found when entry doesn't exist", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);

    await expect(deleteWeightEntry("nonexistent", USER_ID)).rejects.toMatchObject({ code: "not_found" });
  });
});

// ── Service: getWeightEntries ──────────────────────────────────────────────

describe("CHK-024: getWeightEntries — list last 90 days", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns list of weight entries ordered desc", async () => {
    const rows = [WEIGHT_ROW, { ...WEIGHT_ROW, id: "we-2", weightKg: "83.0", date: "2025-03-14" }];
    vi.mocked(db.select).mockReturnValueOnce(makeChain(rows) as never);

    const result = await getWeightEntries(USER_ID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("we-1");
  });

  it("returns empty array when no entries", async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeChain([]) as never);
    const result = await getWeightEntries(USER_ID);
    expect(result).toEqual([]);
  });
});

// ── Route tests ─────────────────────────────────────────────────────────────

describe("CHK-024: POST /api/v1/logs/:date/weight — route", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);
    const res = await app.request("/api/v1/logs/2025-03-15/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: 82.5 }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 201 with weight entry on success", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);

    const insertChain = makeChain([WEIGHT_ROW]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue(insertChain),
    } as never);

    const res = await app.request("/api/v1/logs/2025-03-15/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: 82.5 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { weightKg: number };
    expect(body.weightKg).toBeCloseTo(82.5, 1);
  });

  it("returns 422 on validation error (missing weightKg)", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);

    const res = await app.request("/api/v1/logs/2025-03-15/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });
});

describe("CHK-024: DELETE /api/v1/logs/weight/:id — route", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns 204 on successful delete", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);
    vi.mocked(db.select).mockReturnValueOnce(makeChain([WEIGHT_ROW]) as never);
    vi.mocked(db.delete).mockReturnValueOnce(makeChain(undefined) as never);

    const res = await app.request("/api/v1/logs/weight/we-1", {
      method: "DELETE",
    });
    expect(res.status).toBe(204);
  });

  it("returns 403 when deleting another user's entry", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);
    const otherRow = { ...WEIGHT_ROW, userId: OTHER_USER_ID };
    vi.mocked(db.select).mockReturnValueOnce(makeChain([otherRow]) as never);

    const res = await app.request("/api/v1/logs/weight/we-1", {
      method: "DELETE",
    });
    expect(res.status).toBe(403);
  });
});

describe("CHK-024: GET /api/v1/logs/weight — list route", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("returns weight entries list", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      user: { id: USER_ID, email: "test@example.com" },
    } as never);
    vi.mocked(db.select).mockReturnValueOnce(makeChain([WEIGHT_ROW]) as never);

    const res = await app.request("/api/v1/logs/weight");
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(Array.isArray(body)).toBe(true);
  });
});
