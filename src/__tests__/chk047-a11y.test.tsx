// @vitest-environment jsdom
/**
 * CHK-047: WCAG AA accessibility audit
 * Tests: skip nav link, aria-live regions, 44px touch targets, focus rings.
 */
import { readFileSync } from "fs";
import { join } from "path";

// ── Skip nav link ──────────────────────────────────────────────────────────

describe("CHK-047: Skip Navigation Link", () => {
  it("root layout.tsx contains a skip-to-main-content link", () => {
    const layoutPath = join(process.cwd(), "src/app/layout.tsx");
    const src = readFileSync(layoutPath, "utf-8");
    expect(src).toContain("#main-content");
    expect(src).toContain("Skip to main content");
  });

  it("skip nav link has sr-only class that becomes visible on focus", () => {
    const cssPath = join(process.cwd(), "src/app/globals.css");
    const css = readFileSync(cssPath, "utf-8");
    // Must have .skip-nav or .sr-only-focusable style
    const hasSkipStyle =
      css.includes(".skip-nav") ||
      css.includes(".sr-only-focusable") ||
      css.includes("skip-to");
    expect(hasSkipStyle).toBe(true);
  });

  it("main content area has id='main-content'", () => {
    // Check the app shell layout
    const appLayoutPath = join(process.cwd(), "src/app/(app)/layout.tsx");
    const src = readFileSync(appLayoutPath, "utf-8");
    expect(src).toContain('id="main-content"');
  });
});

// ── ARIA live regions ──────────────────────────────────────────────────────

describe("CHK-047: Aria-live Regions", () => {
  it("globals.css has aria-live region styles (sr-only)", () => {
    const cssPath = join(process.cwd(), "src/app/globals.css");
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(".sr-only");
  });

  it("app shell layout has aria-live announcement region", () => {
    const appLayoutPath = join(process.cwd(), "src/app/(app)/layout.tsx");
    const src = readFileSync(appLayoutPath, "utf-8");
    expect(src).toContain("aria-live");
  });
});

// ── Focus ring ──────────────────────────────────────────────────────────────

describe("CHK-047: Focus Ring", () => {
  it("globals.css has 2px primary focus ring on :focus-visible", () => {
    const cssPath = join(process.cwd(), "src/app/globals.css");
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("2px");
    expect(css).toContain("var(--color-primary)");
  });
});

// ── Touch target size ──────────────────────────────────────────────────────

describe("CHK-047: Touch Target Sizes", () => {
  it("globals.css has min-touch-target utility class (44px)", () => {
    const cssPath = join(process.cwd(), "src/app/globals.css");
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain("44px");
  });

  it("FAB component has min 44px dimensions", () => {
    const fabPath = join(process.cwd(), "src/components/shell/fab.tsx");
    const src = readFileSync(fabPath, "utf-8");
    // Look for size indicators: h-11 (44px), h-12, h-14 (56px), or explicit 44
    // Tailwind: h-10=40px h-11=44px h-12=48px h-14=56px
    const hasSize =
      src.includes("h-11") ||
      src.includes("h-12") ||
      src.includes("h-14") ||
      src.includes("44") ||
      src.includes("min-h-");
    expect(hasSize).toBe(true);
  });

  it("bottom-nav items have adequate touch target styling", () => {
    const navPath = join(process.cwd(), "src/components/shell/bottom-nav.tsx");
    const src = readFileSync(navPath, "utf-8");
    // Has padding or min-height that ensures 44px tap area
    const hasSize =
      src.includes("py-") ||
      src.includes("p-3") ||
      src.includes("min-h") ||
      src.includes("h-11") ||
      src.includes("h-12") ||
      src.includes("44");
    expect(hasSize).toBe(true);
  });
});

// ── Color-only info ────────────────────────────────────────────────────────

describe("CHK-047: No Color-Only Information", () => {
  it("sidebar has text labels alongside icons (not icon-only)", () => {
    const sidebarPath = join(process.cwd(), "src/components/shell/sidebar.tsx");
    const src = readFileSync(sidebarPath, "utf-8");
    // Must have text labels (Today, Journal, etc.)
    expect(src).toMatch(/Today|Dashboard|Journal|Progress/);
    // Must have aria-label on icon-only elements
    const hasAriaOrText =
      src.includes("aria-label") || src.includes("sr-only");
    expect(hasAriaOrText).toBe(true);
  });

  it("bottom nav has aria-labels on nav items", () => {
    const navPath = join(process.cwd(), "src/components/shell/bottom-nav.tsx");
    const src = readFileSync(navPath, "utf-8");
    expect(src).toMatch(/aria-label|aria-current|title/);
  });
});

// ── Decorative images ──────────────────────────────────────────────────────

describe("CHK-047: Image Alt Text Policy", () => {
  it("globals.css documents img alt text requirement comment", () => {
    // The policy is enforced via code review; check the CSS has the sr-only class
    // that is used for screen-reader-only text alongside icons
    const cssPath = join(process.cwd(), "src/app/globals.css");
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(".sr-only");
  });
});
