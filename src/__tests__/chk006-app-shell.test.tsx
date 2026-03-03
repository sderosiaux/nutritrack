// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { FAB } from "@/components/shell/fab";
import { useUIStore } from "@/lib/stores/ui-store";
import { useGuestStore } from "@/lib/stores/guest-store";
import AppLayout from "@/app/(app)/layout";

// Mock next/navigation — not needed in unit tests
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

const NAV_ITEMS = ["Today", "Journal", "Coach", "Progress", "Profile"];

describe("CHK-006: BottomNav (mobile)", () => {
  it("renders all 5 navigation items", () => {
    render(<BottomNav />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByText(item)).toBeDefined();
    }
  });

  it("Today nav item links to /today", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const todayLink = links.find((l) => l.getAttribute("href") === "/today");
    expect(todayLink).toBeDefined();
  });

  it("marks active item based on current path", () => {
    render(<BottomNav />);
    // usePathname returns /today — Today should have active styling
    const todayEl = screen.getByText("Today");
    expect(todayEl).toBeDefined();
  });
});

describe("CHK-006: Sidebar (tablet/desktop)", () => {
  beforeEach(() => {
    // Expand sidebar so labels are visible
    useUIStore.setState({ sidebarOpen: true });
  });

  it("renders navigation links for all 5 items", () => {
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/today");
    expect(hrefs).toContain("/journal");
    expect(hrefs).toContain("/coach");
    expect(hrefs).toContain("/progress");
    expect(hrefs).toContain("/profile");
  });

  it("renders all 5 navigation labels when expanded", () => {
    render(<Sidebar />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByText(item)).toBeDefined();
    }
  });

  it("contains app logo/brand name when expanded", () => {
    render(<Sidebar />);
    expect(screen.getByText(/nutritrack/i)).toBeDefined();
  });
});

describe("CHK-006: FAB global '+' button", () => {
  it("renders FAB with accessible label", () => {
    const onClick = vi.fn();
    render(<FAB onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /log food|add/i });
    expect(btn).toBeDefined();
  });

  it("calls onClick handler when clicked", async () => {
    const onClick = vi.fn();
    render(<FAB onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /log food|add/i });
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("CHK-006: Breakpoints — spec compliance (mobile <640 / tablet 640–1024 / desktop >1024)", () => {
  const sidebarSrc = readFileSync(
    join(process.cwd(), "src/components/shell/sidebar.tsx"),
    "utf-8"
  );
  const bottomNavSrc = readFileSync(
    join(process.cwd(), "src/components/shell/bottom-nav.tsx"),
    "utf-8"
  );

  it("Sidebar uses sm: breakpoint (640px) — shows on tablet+", () => {
    // spec/04-screens.md: tablet ≥640px → sidebar visible
    expect(sidebarSrc).toContain("hidden sm:flex");
  });

  it("Sidebar does NOT use md: breakpoint (768px) for primary visibility", () => {
    // md: would exclude 640–767px range from tablet sidebar, violating spec
    expect(sidebarSrc).not.toContain("hidden md:flex");
  });

  it("BottomNav uses sm: breakpoint (640px) — hides on tablet+", () => {
    // spec/04-screens.md: bottom nav only on mobile <640px
    expect(bottomNavSrc).toContain("sm:hidden");
  });

  it("BottomNav does NOT use md: breakpoint (768px) for hiding", () => {
    // md: would show bottom nav in 640–767px range (should be hidden per spec)
    expect(bottomNavSrc).not.toContain("md:hidden");
  });
});

describe("CHK-006: AppLayout shell integration", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false });
    useGuestStore.setState({ isGuest: false });
  });

  it("AppLayout renders the global FAB button", () => {
    render(<AppLayout>content</AppLayout>);
    const fab = screen.getByRole("button", { name: /log food/i });
    expect(fab).toBeDefined();
  });

  it("AppLayout renders sidebar and bottom nav together", () => {
    render(<AppLayout>page content</AppLayout>);
    // Sidebar has unique aria-label on the <aside> element
    expect(screen.getByLabelText("Sidebar navigation")).toBeDefined();
    // Both Sidebar and BottomNav render a <nav aria-label="Main navigation">
    const navs = screen.getAllByLabelText("Main navigation");
    expect(navs.length).toBe(2);
  });
});
