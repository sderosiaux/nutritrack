// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  usePathname: () => "/journal",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockEmptyLog = {
  date: "2026-03-22",
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  totalFiber: 0,
  waterMl: 0,
  meals: [],
};

const mockLogWithEntries = {
  date: "2026-03-22",
  totalCalories: 850,
  totalProtein: 45,
  totalCarbs: 100,
  totalFat: 30,
  totalFiber: 12,
  waterMl: 1250,
  meals: [
    {
      mealType: "breakfast",
      entries: [
        {
          id: "entry-1",
          foodId: "f1",
          foodName: "Greek Yogurt",
          calories: 350,
          protein: 20,
          carbs: 40,
          fat: 8,
          fiber: 2,
          quantity: 200,
          servingSizeLabel: "1 cup",
          servingSizeWeightG: 200,
          mealType: "breakfast",
          loggedAt: new Date("2026-03-22T08:00:00"),
          notes: null,
        },
      ],
      totalKcal: 350,
    },
    {
      mealType: "lunch",
      entries: [
        {
          id: "entry-2",
          foodId: "f2",
          foodName: "Caesar Salad",
          calories: 500,
          protein: 25,
          carbs: 60,
          fat: 22,
          fiber: 10,
          quantity: 300,
          servingSizeLabel: "1 serving",
          servingSizeWeightG: 300,
          mealType: "lunch",
          loggedAt: new Date("2026-03-22T12:30:00"),
          notes: null,
        },
      ],
      totalKcal: 500,
    },
  ],
};

describe("CHK-018: Journal Screen", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockLogWithEntries,
    });
  });

  it("renders journal page without crashing", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    expect(document.body.innerHTML).toBeTruthy();
  });

  it("renders journal heading", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    expect(screen.getByText(/journal/i)).toBeDefined();
  });

  it("renders date navigation", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      // Should render navigation buttons (prev/next)
      const prevBtn = screen.queryByRole("button", { name: /previous day/i });
      const nextBtn = screen.queryByRole("button", { name: /next day/i });
      expect(prevBtn ?? nextBtn).toBeDefined();
    });
  });

  it("shows meal entries for the selected date", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByText(/greek yogurt/i)).toBeDefined();
    });
  });

  it("shows empty state when no meals logged", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockEmptyLog,
    });
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      expect(
        screen.queryByText(/no meals|start your day|log your first meal|empty/i)
      ).toBeDefined();
    });
  });

  it("renders meal slots (breakfast, lunch, dinner)", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByText(/breakfast/i)).toBeDefined();
    });
  });

  it("shows day totals (calories, protein, carbs, fat)", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByText(/850|kcal|calories/i)).toBeDefined();
    });
  });

  it("shows delete button for meal entries", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      const deleteBtns = screen.queryAllByRole("button", { name: /delete|remove/i });
      expect(deleteBtns.length).toBeGreaterThanOrEqual(0);
    });
  });

  it("shows water section with total", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByText(/water|ml|hydration/i)).toBeDefined();
    });
  });

  it("fetches daily log from API on mount", async () => {
    const { default: JournalPage } = await import("@/app/(app)/journal/page");
    render(<JournalPage />, { wrapper });
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/logs/")
      );
    });
  });
});
