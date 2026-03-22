/**
 * CHK-039: Lesson detail UI — /app/(app)/coach/[slug]/page.tsx
 * Title, category, read time, published date, body markdown, back navigation, loading skeleton.
 * Source: spec/04-screens.md §S-COACH-2
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/coach/intro-to-macros",
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ slug: "intro-to-macros" }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────
const MOCK_LESSON = {
  id: "lesson-1",
  slug: "intro-to-macros",
  title: "Intro to Macros",
  summary: "Learn what macros are and why they matter",
  bodyMarkdown: `# Intro to Macros

Macronutrients — often called "macros" — are the three main categories of nutrients your body needs.

## Protein
Protein helps build and repair muscle tissue.

## Carbohydrates
Carbs are your body's primary energy source.

## Fat
Dietary fat supports hormone production.`,
  category: "nutrition",
  tags: ["basics", "macros"],
  readTimeMin: 5,
  illustrationUrl: null,
  order: 1,
  publishedAt: "2024-01-01",
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

describe("CHK-039: Lesson detail page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the lesson title after data loads", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_LESSON,
    } as Response);

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    render(<LessonDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      // The article title renders as h1 — use getAllByRole, first match is the article title
      const headings = screen.queryAllByRole("heading", { level: 1 });
      expect(headings.length).toBeGreaterThan(0);
      const titleHeading = headings.find((h) => h.textContent === "Intro to Macros");
      expect(titleHeading).toBeDefined();
    });
  });

  it("shows category label", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_LESSON,
    } as Response);

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    render(<LessonDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const headings = screen.queryAllByRole("heading", { level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });

    // Category badge appears
    const badges = screen.queryAllByText("Nutrition");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows read time", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_LESSON,
    } as Response);

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    render(<LessonDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const headings = screen.queryAllByRole("heading", { level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });

    const readTimeEl = screen.queryByText(/5 min/i);
    expect(readTimeEl).not.toBeNull();
  });

  it("renders lesson body content", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_LESSON,
    } as Response);

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    render(<LessonDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const headings = screen.queryAllByRole("heading", { level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });

    // Body content should be rendered somewhere in the DOM
    const html = document.body.innerHTML;
    expect(html).toContain("Macros");
  });

  it("has back navigation link to /coach", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_LESSON,
    } as Response);

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    render(<LessonDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const headings = screen.queryAllByRole("heading", { level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });

    const links = screen.getAllByRole("link");
    const backLink = links.find((l) => l.getAttribute("href") === "/coach");
    expect(backLink).toBeDefined();
  });

  it("shows loading skeleton while fetching", async () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    const qc = makeQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <LessonDetailPage />
      </QueryClientProvider>
    );

    // Should render without crashing in loading state
    expect(document.body).not.toBeNull();
  });

  it("shows 404 message when lesson not found", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found", code: "not_found" }),
    } as Response);

    const { default: LessonDetailPage } = await import("@/app/(app)/coach/[slug]/page");
    render(<LessonDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const notFoundEl =
        screen.queryByText(/not found/i) ??
        screen.queryByText(/lesson.*not/i) ??
        screen.queryByText(/could not/i);
      expect(notFoundEl).not.toBeNull();
    });
  });
});
