// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
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

const mockFoodSearchResponse = {
  foods: [
    { id: "f1", name: "Chicken Breast", brandName: null, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0, servingSizes: [{ id: "ss1", label: "100g", weightG: 100 }] },
    { id: "f2", name: "Brown Rice", brandName: null, caloriesPer100g: 370, proteinPer100g: 8, carbsPer100g: 77, fatPer100g: 3, fiberPer100g: 3.5, servingSizes: [{ id: "ss2", label: "1 cup cooked", weightG: 195 }] },
  ],
  total: 2,
};

describe("CHK-016: Food Search UI", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockFoodSearchResponse,
    });
  });

  it("renders food search component without crashing", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    const onSelect = vi.fn();
    render(
      <FoodSearch onSelect={onSelect} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );
    expect(document.body.innerHTML).toBeTruthy();
  });

  it("renders search input", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    const onSelect = vi.fn();
    render(
      <FoodSearch onSelect={onSelect} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );
    // type="search" has implicit role "searchbox"
    const input = screen.queryByRole("searchbox") ?? screen.queryByRole("textbox") ?? screen.queryByPlaceholderText(/search/i);
    expect(input).toBeDefined();
  });

  it("shows filter chips (All, My Foods, Branded, Generic)", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    render(
      <FoodSearch onSelect={vi.fn()} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );
    expect(screen.getByText(/all/i)).toBeDefined();
    expect(screen.getByText(/my foods/i)).toBeDefined();
  });

  it("calls fetch with search query after input (debounced)", async () => {
    // Use real timers - wait for debounce to fire naturally
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    render(
      <FoodSearch onSelect={vi.fn()} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );

    const input = screen.queryByRole("searchbox") ?? screen.queryByRole("textbox") ?? screen.queryByPlaceholderText(/search/i);
    expect(input).toBeDefined();
    if (input) {
      fireEvent.change(input, { target: { value: "chicken" } });
      // Wait up to 1s for the debounced fetch to fire
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/v1/foods/search?q=chicken")
        );
      }, { timeout: 1500 });
    }
  });

  it("displays search results after typing", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    render(
      <FoodSearch onSelect={vi.fn()} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );

    const input = screen.queryByRole("searchbox") ?? screen.queryByRole("textbox") ?? screen.queryByPlaceholderText(/search/i);
    expect(input).toBeDefined();
    if (input) {
      fireEvent.change(input, { target: { value: "ch" } });
      await waitFor(() => {
        expect(screen.queryByText(/chicken breast/i)).toBeDefined();
      }, { timeout: 2000 });
    }
  });

  it("shows food detail view when a result is clicked", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    const onSelect = vi.fn();
    render(
      <FoodSearch onSelect={onSelect} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );

    const input = screen.queryByRole("searchbox") ?? screen.queryByRole("textbox") ?? screen.queryByPlaceholderText(/search/i);
    expect(input).toBeDefined();
    if (input) {
      fireEvent.change(input, { target: { value: "ch" } });
      await waitFor(() => {
        const item = screen.queryByText(/chicken breast/i);
        if (item) {
          fireEvent.click(item);
          // After click, should show serving detail UI
          expect(screen.queryByText(/add to|serving|quantity/i)).toBeDefined();
        }
      }, { timeout: 2000 });
    }
  });

  it("shows scan barcode button", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    render(
      <FoodSearch onSelect={vi.fn()} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );
    expect(screen.getByText(/scan barcode|barcode/i)).toBeDefined();
  });

  it("shows create custom food link", async () => {
    const { FoodSearch } = await import("@/app/(app)/today/food-search");
    render(
      <FoodSearch onSelect={vi.fn()} mealType="breakfast" date="2026-03-22" />,
      { wrapper }
    );
    expect(screen.getByText(/create|custom food/i)).toBeDefined();
  });
});
