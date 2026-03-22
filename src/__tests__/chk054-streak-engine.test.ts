/**
 * CHK-054: Streak engine — pure function tests (no mocks needed)
 */
import { describe, it, expect } from "vitest";
import {
  calculateStreak,
  buildDateSet,
  getCurrentStreak,
  getLongestStreak,
} from "@/server/services/streak-service";

describe("calculateStreak — pure function", () => {
  it("returns 0 for empty array", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("returns 1 for single date (today)", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(calculateStreak([today])).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    const today = new Date();
    const dates = [0, 1, 2].map((d) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      return dt.toISOString().slice(0, 10);
    });
    expect(calculateStreak(dates)).toBe(3);
  });

  it("breaks on gap — returns streak from most recent run", () => {
    const today = new Date();
    const dates = [
      new Date(today.getTime() - 0 * 86400000).toISOString().slice(0, 10),
      new Date(today.getTime() - 1 * 86400000).toISOString().slice(0, 10),
      // gap: day -3 is missing
      new Date(today.getTime() - 4 * 86400000).toISOString().slice(0, 10),
    ];
    expect(calculateStreak(dates)).toBe(2);
  });

  it("returns 0 when most recent date is not today or yesterday", () => {
    const old = new Date();
    old.setDate(old.getDate() - 3);
    expect(calculateStreak([old.toISOString().slice(0, 10)])).toBe(0);
  });

  it("handles duplicate dates gracefully", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    expect(calculateStreak([today, today, yesterday, yesterday])).toBe(2);
  });
});

describe("buildDateSet", () => {
  it("converts array to Set", () => {
    const s = buildDateSet(["2025-01-01", "2025-01-02", "2025-01-01"]);
    expect(s.size).toBe(2);
    expect(s.has("2025-01-01")).toBe(true);
  });
});

describe("getLongestStreak", () => {
  it("finds longest run in unsorted dates", () => {
    // 3 consecutive days in Jan, 5 consecutive days in Feb
    const dates = [
      "2025-01-01", "2025-01-02", "2025-01-03",
      "2025-02-10", "2025-02-11", "2025-02-12", "2025-02-13", "2025-02-14",
    ];
    expect(getLongestStreak(dates)).toBe(5);
  });

  it("returns 0 for empty array", () => {
    expect(getLongestStreak([])).toBe(0);
  });

  it("returns 1 for single isolated date", () => {
    expect(getLongestStreak(["2025-03-01"])).toBe(1);
  });
});

describe("getCurrentStreak", () => {
  it("returns streak ending today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    expect(getCurrentStreak([today, yesterday])).toBe(2);
  });

  it("streak counts from yesterday if today not logged", () => {
    // yesterday is fine — streak is still "active" (not broken yet)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    expect(getCurrentStreak([yesterday, dayBefore])).toBe(2);
  });
});
