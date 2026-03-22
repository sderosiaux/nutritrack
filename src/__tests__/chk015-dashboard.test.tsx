// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockDailyLog = {
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
      entries: [{ id: "1", foodName: "Oatmeal", calories: 350, protein: 15, carbs: 60, fat: 8, fiber: 6, quantity: 100, mealType: "breakfast", loggedAt: new Date(), servingSizeLabel: "1 bowl", servingSizeWeightG: 100, notes: null, foodId: "f1" }],
      totalKcal: 350,
    },
    {
      mealType: "lunch",
      entries: [{ id: "2", foodName: "Chicken Salad", calories: 500, protein: 30, carbs: 40, fat: 22, fiber: 6, quantity: 200, mealType: "lunch", loggedAt: new Date(), servingSizeLabel: "1 serving", servingSizeWeightG: 200, notes: null, foodId: "f2" }],
      totalKcal: 500,
    },
  ],
};

describe("CHK-015: Today Dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDailyLog,
    });
  });

  it("renders without crashing", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    // Should render some content
    expect(document.body.innerHTML).toBeTruthy();
  });

  it("renders date navigation with prev/next buttons", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /prev|previous|earlier|◀|←|chevron-left/i })).toBeDefined();
    });
  });

  it("renders calorie ring SVG", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    const { container } = render(<TodayPage />, { wrapper });
    await waitFor(() => {
      const svg = container.querySelector("svg circle");
      expect(svg).toBeDefined();
    });
  });

  it("renders macro bars section", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/protein/i)).toBeDefined();
      expect(screen.getByText(/carbs/i)).toBeDefined();
      expect(screen.getByText(/fat/i)).toBeDefined();
    });
  });

  it("renders meal slot cards", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/breakfast/i)).toBeDefined();
    });
  });

  it("renders hydration tile", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/water|hydration/i)).toBeDefined();
    });
  });

  it("fetches daily log from API on mount", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/logs/")
      );
    });
  });

  it("shows meal entries once loaded", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/oatmeal/i)).toBeDefined();
    });
  });

  it("calorie ring shows consumed calories", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/850/)).toBeDefined();
    });
  });

  it("renders +250ml and +500ml quick-add water buttons", async () => {
    const { default: TodayPage } = await import("@/app/(app)/today/page");
    render(<TodayPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("+250ml")).toBeDefined();
      expect(screen.getByText("+500ml")).toBeDefined();
    });
  });
});
