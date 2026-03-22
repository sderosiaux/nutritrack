/**
 * CHK-038: Coach home UI — /app/(app)/coach/page.tsx
 * Lesson cards grouped by category, TanStack Query fetch, responsive grid, empty state.
 * Source: spec/04-screens.md §S-COACH-1
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/coach",
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────
const MOCK_LESSONS = [
  {
    id: "lesson-1",
    slug: "intro-to-macros",
    title: "Intro to Macros",
    summary: "Learn what macros are",
    category: "nutrition",
    readTimeMin: 5,
    publishedAt: "2024-01-01",
    illustrationUrl: null,
  },
  {
    id: "lesson-2",
    slug: "hydration-guide",
    title: "Hydration Guide",
    summary: "Why water matters",
    category: "hydration",
    readTimeMin: 4,
    publishedAt: "2024-01-02",
    illustrationUrl: null,
  },
  {
    id: "lesson-3",
    slug: "mindfulness-intro",
    title: "Mindfulness Intro",
    summary: "Start your mindfulness journey",
    category: "mindfulness",
    readTimeMin: 6,
    publishedAt: "2024-01-03",
    illustrationUrl: null,
  },
];

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("CHK-038: Coach home page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders a heading for the coach section", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessons: MOCK_LESSONS, total: MOCK_LESSONS.length }),
    } as Response);

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    render(<CoachPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    });
  });

  it("shows lesson cards after data loads", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessons: MOCK_LESSONS, total: MOCK_LESSONS.length }),
    } as Response);

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    render(<CoachPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Intro to Macros")).toBeDefined();
    });

    expect(screen.getByText("Hydration Guide")).toBeDefined();
    expect(screen.getByText("Mindfulness Intro")).toBeDefined();
  });

  it("displays category badges on lesson cards", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessons: MOCK_LESSONS, total: MOCK_LESSONS.length }),
    } as Response);

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    render(<CoachPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Intro to Macros")).toBeDefined();
    });

    // Category badges should appear — use queryAllByText since there may be section headers + badges
    const nutritionEls = screen.queryAllByText(/^nutrition$/i);
    expect(nutritionEls.length).toBeGreaterThan(0);
  });

  it("shows read time on lesson cards", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessons: [MOCK_LESSONS[0]], total: 1 }),
    } as Response);

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    render(<CoachPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Intro to Macros")).toBeDefined();
    });

    // Read time should appear somewhere
    const readTimeEl = screen.queryByText(/5 min/i);
    expect(readTimeEl).not.toBeNull();
  });

  it("lesson cards link to /coach/:slug", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessons: [MOCK_LESSONS[0]], total: 1 }),
    } as Response);

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    render(<CoachPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Intro to Macros")).toBeDefined();
    });

    const links = screen.getAllByRole("link");
    const lessonLink = links.find((l) => l.getAttribute("href") === "/coach/intro-to-macros");
    expect(lessonLink).toBeDefined();
  });

  it("shows empty state when no lessons returned", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessons: [], total: 0 }),
    } as Response);

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    render(<CoachPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const emptyText = screen.queryByText(/no lessons/i) ??
        screen.queryByText(/seed/i) ??
        screen.queryByText(/coming soon/i) ??
        screen.queryByText(/start/i);
      expect(emptyText).not.toBeNull();
    });
  });

  it("shows loading skeleton while fetching", async () => {
    // Pending promise — never resolves during this test
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    const { default: CoachPage } = await import("@/app/(app)/coach/page");
    const qc = makeQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <CoachPage />
      </QueryClientProvider>
    );

    // Should show aria-busy or animate-pulse loading indicator
    const loadingEl = document.querySelector("[aria-busy='true']") ??
      document.querySelector(".animate-pulse");
    expect(loadingEl).not.toBeNull();
  });
});
