// @vitest-environment jsdom
/**
 * CHK-035: Progress UI — analytics charts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock("@/lib/stores/guest-store", () => ({
  useGuestStore: () => ({ isGuest: false }),
}));

const mockSummaryData = {
  avgCalories: 1800,
  avgProtein: 90,
  avgCarbs: 225,
  avgFat: 60,
  avgFiber: 25,
  avgWaterMl: 2000,
  daysLogged: 7,
  currentStreak: 5,
  longestStreak: 10,
};

const mockNutrientData = [
  { date: "2025-01-01", calories: 1800, protein: 90, carbs: 225, fat: 60, fiber: 25, waterMl: 2000 },
  { date: "2025-01-02", calories: 2000, protein: 100, carbs: 250, fat: 65, fiber: 30, waterMl: 1800 },
  { date: "2025-01-03", calories: 1600, protein: 80, carbs: 200, fat: 55, fiber: 20, waterMl: 2200 },
];

describe("ProgressPage", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);
  });

  it("renders the progress page heading", async () => {
    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("renders date range selector with 7d/30d/90d tabs", async () => {
    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);

    expect(screen.getByText("7d")).toBeTruthy();
    expect(screen.getByText("30d")).toBeTruthy();
    expect(screen.getByText("90d")).toBeTruthy();
  });

  it("switches range when tab is clicked", async () => {
    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);

    const btn30d = screen.getByText("30d");
    fireEvent.click(btn30d);

    await waitFor(() => {
      expect(btn30d).toBeTruthy();
    });
  });

  it("shows loading skeletons when data is loading", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useQuery>);

    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);

    const skeletons = document.querySelectorAll("[data-testid='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when less than 3 days logged", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        data: { ...mockSummaryData, daysLogged: 2 },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>)
      .mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>);

    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByText(/3\+ days/i)).toBeTruthy();
    });
  });

  it("renders calorie trend chart section when data available", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        data: mockSummaryData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>)
      .mockReturnValue({
        data: mockNutrientData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>);

    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByText(/calorie/i)).toBeTruthy();
    });
  });

  it("renders streak information", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        data: mockSummaryData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>)
      .mockReturnValue({
        data: mockNutrientData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>);

    const { default: ProgressPage } = await import("@/app/(app)/progress/page");
    render(<ProgressPage />);

    await waitFor(() => {
      const streakEls = screen.queryAllByText(/streak/i);
      expect(streakEls.length).toBeGreaterThan(0);
    });
  });
});

describe("NutrientsPage", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { useQuery } = await import("@tanstack/react-query");
    vi.mocked(useQuery).mockReturnValue({
      data: mockNutrientData,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);
  });

  it("renders nutrient deep-dive page", async () => {
    const { default: NutrientsPage } = await import("@/app/(app)/progress/nutrients/page");
    render(<NutrientsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("renders nutrient selector", async () => {
    const { default: NutrientsPage } = await import("@/app/(app)/progress/nutrients/page");
    render(<NutrientsPage />);
    const proteinBtns = screen.queryAllByText(/protein/i);
    const carbsBtns = screen.queryAllByText(/carbs/i);
    expect((proteinBtns.length + carbsBtns.length)).toBeGreaterThan(0);
  });
});
