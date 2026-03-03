// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Install fake IndexedDB before importing Dexie
import "fake-indexeddb/auto";

import { NutriDB } from "@/lib/db/offline";
import { useGuestStore } from "@/lib/stores/guest-store";
import { BackupBanner } from "@/components/guest/backup-banner";
import { migrateGuestData } from "@/lib/guest/migration";
import { upgradeGuestAccount } from "@/lib/guest/upgrade";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/today",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("CHK-053: Dexie offline store — NutriDB", () => {
  let db: NutriDB;

  beforeEach(async () => {
    db = new NutriDB();
    await db.open();
  });

  it("opens NutriDB without error", async () => {
    expect(db.isOpen()).toBe(true);
  });

  it("has mealEntries table", () => {
    expect(db.mealEntries).toBeDefined();
  });

  it("has waterEntries table", () => {
    expect(db.waterEntries).toBeDefined();
  });

  it("has weightEntries table", () => {
    expect(db.weightEntries).toBeDefined();
  });

  it("has syncQueue table for background sync", () => {
    expect(db.syncQueue).toBeDefined();
  });

  it("can add and retrieve a meal entry", async () => {
    const id = await db.mealEntries.add({
      date: "2026-03-03",
      foodId: "test-food-1",
      name: "Chicken breast",
      kcal: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      grams: 100,
      mealType: "lunch",
      createdAt: Date.now(),
    });
    const entry = await db.mealEntries.get(id);
    expect(entry?.name).toBe("Chicken breast");
    expect(entry?.kcal).toBe(165);
  });

  it("can query meal entries by date", async () => {
    await db.mealEntries.add({
      date: "2026-03-03",
      foodId: "test-food-2",
      name: "Greek yogurt",
      kcal: 80,
      protein: 10,
      carbs: 5,
      fat: 2,
      fiber: 0,
      grams: 150,
      mealType: "breakfast",
      createdAt: Date.now(),
    });
    const entries = await db.mealEntries
      .where("date")
      .equals("2026-03-03")
      .toArray();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.date === "2026-03-03")).toBe(true);
  });

  it("can add and retrieve a water entry", async () => {
    const id = await db.waterEntries.add({
      date: "2026-03-03",
      ml: 250,
      createdAt: Date.now(),
    });
    const entry = await db.waterEntries.get(id);
    expect(entry?.ml).toBe(250);
  });
});

describe("CHK-053: Guest store", () => {
  it("isGuest starts as false", () => {
    useGuestStore.setState({ isGuest: false });
    expect(useGuestStore.getState().isGuest).toBe(false);
  });

  it("setIsGuest(true) activates guest mode", () => {
    useGuestStore.getState().setIsGuest(true);
    expect(useGuestStore.getState().isGuest).toBe(true);
  });

  it("setIsGuest(false) deactivates guest mode", () => {
    useGuestStore.setState({ isGuest: true });
    useGuestStore.getState().setIsGuest(false);
    expect(useGuestStore.getState().isGuest).toBe(false);
  });
});

describe("CHK-053: BackupBanner component", () => {
  beforeEach(() => {
    useGuestStore.setState({ isGuest: false });
  });

  it("renders nothing when user is not a guest", () => {
    useGuestStore.setState({ isGuest: false });
    const { container } = render(<BackupBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Back up your data' when user is a guest", () => {
    useGuestStore.setState({ isGuest: true });
    render(<BackupBanner />);
    expect(screen.getByText(/back up your data/i)).toBeDefined();
  });

  it("banner has a link to sign-up / register", () => {
    useGuestStore.setState({ isGuest: true });
    render(<BackupBanner />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toMatch(/register|sign-up/);
  });

  it("banner is non-intrusive — no modal, no forced redirect", () => {
    useGuestStore.setState({ isGuest: true });
    render(<BackupBanner />);
    // Should not render a dialog/modal — no role=dialog
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("CHK-053: Guest data migration — HTTP status handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("migrateGuestData counts 2xx responses as migrated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const db = new NutriDB();
    // Clear all tables to isolate from other test entries
    await db.mealEntries.clear();
    await db.waterEntries.clear();
    await db.weightEntries.clear();
    await db.mealEntries.add({
      date: "2026-03-03",
      foodId: "food-migrate-1",
      name: "Rice",
      kcal: 200,
      protein: 4,
      carbs: 44,
      fat: 0.4,
      fiber: 0.6,
      grams: 100,
      mealType: "lunch",
      createdAt: Date.now(),
    });
    const result = await migrateGuestData(db, "user-abc");
    expect(result.migrated).toBe(1);
    expect(result.errors).toBe(0);
  });

  it("migrateGuestData counts non-2xx responses as errors, not migrations", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422 }));
    const db = new NutriDB();
    await db.mealEntries.add({
      date: "2026-03-03",
      foodId: "food-migrate-2",
      name: "Oats",
      kcal: 150,
      protein: 5,
      carbs: 27,
      fat: 3,
      fiber: 4,
      grams: 50,
      mealType: "breakfast",
      createdAt: Date.now(),
    });
    const result = await migrateGuestData(db, "user-abc");
    expect(result.errors).toBe(1);
    expect(result.migrated).toBe(0);
  });

  it("migrateGuestData does NOT clear IndexedDB when errors > 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const db = new NutriDB();
    await db.waterEntries.add({ date: "2026-03-03", ml: 500, createdAt: Date.now() });
    await migrateGuestData(db, "user-abc");
    // Local data must be preserved when server rejected the upload
    const remaining = await db.waterEntries.toArray();
    expect(remaining.length).toBeGreaterThan(0);
  });
});

describe("CHK-053: Guest upgrade flow (guest-to-account migration)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useGuestStore.setState({ isGuest: false });
  });

  it("upgradeGuestAccount is a no-op when user is not a guest", async () => {
    useGuestStore.setState({ isGuest: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await upgradeGuestAccount("user-xyz");
    expect(result.migrated).toBe(0);
    expect(result.errors).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("upgradeGuestAccount clears guest flag after migration", async () => {
    useGuestStore.setState({ isGuest: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await upgradeGuestAccount("user-registered-1");
    expect(useGuestStore.getState().isGuest).toBe(false);
  });

  it("upgradeGuestAccount clears guest flag even when migration has errors", async () => {
    // User should not be stuck in guest mode after registration, even on partial failure
    useGuestStore.setState({ isGuest: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await upgradeGuestAccount("user-registered-2");
    expect(useGuestStore.getState().isGuest).toBe(false);
  });
});
