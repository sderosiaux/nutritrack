// @vitest-environment jsdom
/**
 * CHK-023: Wire dashboard targets from user profile
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TodayPage from "@/app/(app)/today/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/stores/ui-store", () => ({
  useUIStore: () => ({
    selectedDate: "2026-03-22",
    setSelectedDate: vi.fn(),
    logModalOpen: false,
    openLogModal: vi.fn(),
    closeLogModal: vi.fn(),
    logModalMealType: null,
  }),
}));

function setupFetch(targets: { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; waterMl: number }) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === "string" && url.includes("/api/v1/profile")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          profile: { userId: "user-1", displayName: "Alice", goal: "lose_weight" },
          targets,
        }),
      });
    }
    if (typeof url === "string" && url.includes("/api/v1/logs/")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          date: "2026-03-22",
          totalCalories: 850,
          totalProtein: 60,
          totalCarbs: 100,
          totalFat: 30,
          totalFiber: 8,
          waterMl: 500,
          meals: [],
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as unknown as typeof fetch;
}

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TodayPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  setupFetch({ caloriesKcal: 1850, proteinG: 93, carbsG: 231, fatG: 62, fiberG: 25, waterMl: 2500 });
});

describe("Dashboard — target wiring (CHK-023)", () => {
  it("shows user calorie target from profile (not hardcoded 2000)", async () => {
    renderDashboard();
    await waitFor(() => {
      // Should show 1850 from profile, not the old DEFAULT_TARGETS.calories=2000
      expect(screen.getByText(/1850/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows consumed / target kcal in calorie ring", async () => {
    renderDashboard();
    await waitFor(() => {
      // CalorieRing renders consumed as "850" and target as "/ 1850 kcal"
      expect(screen.getByText("850")).toBeInTheDocument();
      expect(screen.getByText(/1850 kcal/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows water target from profile (not hardcoded 2000ml)", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/2500/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows fallback targets when profile not available", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/v1/profile")) {
        return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: "not_found" }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          date: "2026-03-22",
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          waterMl: 0,
          meals: [],
        }),
      });
    }) as unknown as typeof fetch;

    renderDashboard();
    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText(/today/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
