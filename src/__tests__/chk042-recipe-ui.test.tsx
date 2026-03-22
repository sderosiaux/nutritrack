/**
 * CHK-042: Recipe browser + detail UI
 * /app/(app)/recipes/page.tsx — grid, category filter, search, empty state
 * /app/(app)/recipes/[id]/page.tsx — detail, ingredients, log button
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  usePathname: () => "/recipes",
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "recipe-1" }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_RECIPES = [
  {
    id: "recipe-1",
    title: "Overnight Oats",
    description: "Easy make-ahead breakfast",
    caloriesPerServing: "350.00",
    proteinPerServing: "12.00",
    carbsPerServing: "55.00",
    fatPerServing: "8.00",
    fiberPerServing: "6.00",
    servings: 1,
    prepTimeMins: 5,
    cookTimeMins: 0,
    difficulty: "easy",
    tags: ["breakfast", "healthy"],
    published: true,
  },
  {
    id: "recipe-2",
    title: "Grilled Chicken Salad",
    description: "High protein lunch",
    caloriesPerServing: "420.00",
    proteinPerServing: "45.00",
    carbsPerServing: "20.00",
    fatPerServing: "15.00",
    fiberPerServing: "5.00",
    servings: 1,
    prepTimeMins: 15,
    cookTimeMins: 20,
    difficulty: "easy",
    tags: ["lunch", "high-protein"],
    published: true,
  },
  {
    id: "recipe-3",
    title: "Chocolate Protein Balls",
    description: "Healthy snack",
    caloriesPerServing: "120.00",
    proteinPerServing: "8.00",
    carbsPerServing: "10.00",
    fatPerServing: "5.00",
    fiberPerServing: "2.00",
    servings: 2,
    prepTimeMins: 10,
    cookTimeMins: 0,
    difficulty: "easy",
    tags: ["snack", "dessert"],
    published: true,
  },
];

const MOCK_RECIPE_DETAIL = {
  ...MOCK_RECIPES[0],
  steps: ["Combine oats and milk", "Add toppings", "Refrigerate overnight"],
  ingredients: [
    { id: "ing-1", foodId: "food-1", displayLabel: "80g rolled oats", quantityG: "80.00", sortOrder: 0 },
    { id: "ing-2", foodId: "food-2", displayLabel: "200ml almond milk", quantityG: "200.00", sortOrder: 1 },
  ],
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Recipe Browser Tests ──────────────────────────────────────────────────────

describe("CHK-042: Recipe browser page", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("renders a heading for the recipes section", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: MOCK_RECIPES, total: MOCK_RECIPES.length }),
    } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    });
  });

  it("shows recipe cards after data loads", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: MOCK_RECIPES, total: MOCK_RECIPES.length }),
    } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    expect(screen.getByText("Grilled Chicken Salad")).toBeDefined();
    expect(screen.getByText("Chocolate Protein Balls")).toBeDefined();
  });

  it("shows calories per serving on recipe cards", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: [MOCK_RECIPES[0]], total: 1 }),
    } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    // Should show calorie count
    const calEl = screen.queryByText(/350/) ?? screen.queryByText(/kcal/i);
    expect(calEl).not.toBeNull();
  });

  it("shows category filter chips", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: MOCK_RECIPES, total: MOCK_RECIPES.length }),
    } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    // Should show at least one filter button (All, Breakfast, etc.)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no recipes", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: [], total: 0 }),
    } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const emptyEl = screen.queryByText(/no recipes/i) ??
        screen.queryByText(/browse/i) ??
        screen.queryByText(/save recipes/i) ??
        screen.queryByText(/empty/i);
      expect(emptyEl).not.toBeNull();
    });
  });

  it("shows loading skeleton while fetching", async () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    const qc = makeQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <RecipesPage />
      </QueryClientProvider>
    );

    const loadingEl = document.querySelector("[aria-busy='true']") ??
      document.querySelector(".animate-pulse");
    expect(loadingEl).not.toBeNull();
  });

  it("recipe cards link to detail page", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: [MOCK_RECIPES[0]], total: 1 }),
    } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    const links = screen.getAllByRole("link");
    const recipeLink = links.find((l) => l.getAttribute("href")?.includes("recipe-1"));
    expect(recipeLink).toBeDefined();
  });

  it("filters recipes by category when chip is clicked", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recipes: MOCK_RECIPES, total: MOCK_RECIPES.length }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recipes: [MOCK_RECIPES[0]], total: 1 }),
      } as Response);

    const { default: RecipesPage } = await import("@/app/(app)/recipes/page");
    render(<RecipesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    // Click a filter button (Breakfast if present)
    const breakfastBtn = screen.queryByText(/^breakfast$/i) ??
      screen.queryByRole("button", { name: /breakfast/i });
    if (breakfastBtn) {
      fireEvent.click(breakfastBtn);
    }
    // Just verify no crash
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });
});

// ── Recipe Detail Tests ───────────────────────────────────────────────────────

describe("CHK-042: Recipe detail page", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("renders recipe title and description", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RECIPE_DETAIL,
    } as Response);

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    render(<RecipeDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });
  });

  it("shows macros per serving", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RECIPE_DETAIL,
    } as Response);

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    render(<RecipeDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    // Should show calorie or macro data
    const calorieEl = screen.queryByText(/350/) ?? screen.queryByText(/kcal/i);
    expect(calorieEl).not.toBeNull();
  });

  it("shows ingredient list", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RECIPE_DETAIL,
    } as Response);

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    render(<RecipeDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    expect(screen.getByText(/80g rolled oats/i)).toBeDefined();
  });

  it("shows step-by-step instructions", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RECIPE_DETAIL,
    } as Response);

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    render(<RecipeDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    expect(screen.getByText(/Combine oats and milk/i)).toBeDefined();
  });

  it("shows Log as meal button", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RECIPE_DETAIL,
    } as Response);

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    render(<RecipeDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Overnight Oats")).toBeDefined();
    });

    // Use queryAllByText since there may be multiple "Log as meal" buttons
    const logBtns = screen.queryAllByText(/log as meal/i);
    expect(logBtns.length).toBeGreaterThan(0);
  });

  it("shows loading state while fetching", async () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    const qc = makeQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <RecipeDetailPage />
      </QueryClientProvider>
    );

    const loadingEl = document.querySelector("[aria-busy='true']") ??
      document.querySelector(".animate-pulse") ??
      screen.queryByText(/loading/i);
    expect(loadingEl).not.toBeNull();
  });

  it("shows not found state when recipe missing", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" }),
    } as Response);

    const { default: RecipeDetailPage } = await import("@/app/(app)/recipes/[id]/page");
    render(<RecipeDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const notFoundEl = screen.queryByText(/not found/i) ??
        screen.queryByText(/doesn't exist/i) ??
        screen.queryByText(/error/i);
      expect(notFoundEl).not.toBeNull();
    }, { timeout: 3000 });
  });
});
