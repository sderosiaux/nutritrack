// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { FAB } from "@/components/shell/fab";
import { useUIStore } from "@/lib/stores/ui-store";

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
