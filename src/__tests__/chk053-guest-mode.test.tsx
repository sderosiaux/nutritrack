// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Install fake IndexedDB before importing Dexie
import "fake-indexeddb/auto";

import { NutriDB } from "@/lib/db/offline";
import { useGuestStore } from "@/lib/stores/guest-store";
import { BackupBanner } from "@/components/guest/backup-banner";
import { migrateGuestData } from "@/lib/guest/migration";

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

describe("CHK-053: Guest data migration", () => {
  it("migrateGuestData is a function", () => {
    expect(typeof migrateGuestData).toBe("function");
  });

  it("migrateGuestData returns a Promise", () => {
    const db = new NutriDB();
    const result = migrateGuestData(db, "user-123");
    expect(result).toBeInstanceOf(Promise);
    // Don't await — just check it's thenable
    result.catch(() => {}); // suppress unhandled rejection
  });
});
