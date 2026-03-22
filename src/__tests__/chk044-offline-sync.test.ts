// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NutriDB } from "@/lib/db/offline";
import { processOfflineQueue, getQueueStatus } from "@/lib/offline/offline-sync";

describe("CHK-044: offline queue processing", () => {
  let db: NutriDB;

  beforeEach(async () => {
    db = new NutriDB();
    await db.open();
    await db.syncQueue.clear();
    await db.mealEntries.clear();
    await db.waterEntries.clear();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("getQueueStatus returns count of pending items", async () => {
    await db.syncQueue.add({
      action: "add",
      table: "mealEntries",
      payload: JSON.stringify({ foodId: "1", kcal: 200 }),
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    const status = await getQueueStatus(db);
    expect(status.pending).toBe(1);
    expect(status.total).toBe(1);
  });

  it("processOfflineQueue sends pending items when online", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "123" }) });
    vi.stubGlobal("fetch", fetchMock);

    await db.syncQueue.add({
      action: "add",
      table: "mealEntries",
      payload: JSON.stringify({ date: "2026-03-22", foodId: "1", kcal: 200, protein: 10, carbs: 20, fat: 5, fiber: 2, grams: 100, mealType: "breakfast", name: "Test" }),
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    const result = await processOfflineQueue(db);
    expect(result.processed).toBe(1);
    expect(fetchMock).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("marks items as failed after fetch error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", fetchMock);

    await db.syncQueue.add({
      action: "add",
      table: "mealEntries",
      payload: JSON.stringify({ date: "2026-03-22", kcal: 200 }),
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    const result = await processOfflineQueue(db);
    expect(result.failed).toBeGreaterThanOrEqual(0);

    vi.unstubAllGlobals();
  });

  it("does not process items when offline (navigator.onLine=false)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { onLine: false });

    await db.syncQueue.add({
      action: "add",
      table: "waterEntries",
      payload: JSON.stringify({ date: "2026-03-22", ml: 250 }),
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    const result = await processOfflineQueue(db);
    expect(result.skipped).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("waterEntries in queue are sent to water endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "456" }) });
    vi.stubGlobal("fetch", fetchMock);

    await db.syncQueue.add({
      action: "add",
      table: "waterEntries",
      payload: JSON.stringify({ date: "2026-03-22", ml: 500 }),
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    await processOfflineQueue(db);

    const calls = fetchMock.mock.calls;
    const waterCall = calls.find((c) => (c[0] as string).includes("water"));
    expect(waterCall).toBeDefined();

    vi.unstubAllGlobals();
  });
});

describe("CHK-044: offline DB queue table schema", () => {
  let db: NutriDB;

  beforeEach(async () => {
    db = new NutriDB();
    await db.open();
    await db.syncQueue.clear();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("syncQueue table has status field", async () => {
    const id = await db.syncQueue.add({
      action: "add",
      table: "mealEntries",
      payload: "{}",
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    const item = await db.syncQueue.get(id);
    expect(item).toBeDefined();
    expect(item!.status).toBe("pending");
  });
});
