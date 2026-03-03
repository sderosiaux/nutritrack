// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

const css = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf-8"
);

describe("CHK-005: Design System Tokens", () => {
  it("defines Primary #16A34A in globals.css", () => {
    expect(css).toContain("--color-primary: #16a34a");
  });

  it("defines Primary-dark #15803D for hover states", () => {
    expect(css).toContain("--color-primary-dark: #15803d");
  });

  it("defines Accent #F59E0B for calories/energy", () => {
    expect(css).toContain("--color-accent: #f59e0b");
  });

  it("defines Macro colors — Protein blue, Carbs purple, Fat red, Fiber emerald", () => {
    expect(css).toContain("--color-macro-protein: #3b82f6");
    expect(css).toContain("--color-macro-carbs: #a855f7");
    expect(css).toContain("--color-macro-fat: #ef4444");
    expect(css).toContain("--color-macro-fiber: #10b981");
  });

  it("defines border-radii on 4px grid: sm=6 md=12 lg=16 xl=24 full=9999", () => {
    expect(css).toContain("--radius-sm: 6px");
    expect(css).toContain("--radius-md: 12px");
    expect(css).toContain("--radius-lg: 16px");
    expect(css).toContain("--radius-xl: 24px");
    expect(css).toContain("--radius-full: 9999px");
  });

  it("defines Inter variable font", () => {
    expect(css).toContain("Inter");
  });

  it("defines surface, border, and text colors", () => {
    expect(css).toContain("--color-surface: #ffffff");
    expect(css).toContain("--color-border: #e5e7eb");
    expect(css).toContain("--color-text: #111827");
    expect(css).toContain("--color-text-muted: #6b7280");
  });

  it("defines overflow rose color for calorie ring overflow state", () => {
    expect(css).toContain("--color-rose: #f43f5e");
  });

  it("does NOT define traffic-light food classification tokens", () => {
    // Spec: NO traffic-light food classification (spec/06-ux-design.md)
    expect(css).not.toContain("--color-food-green");
    expect(css).not.toContain("--color-food-amber");
    expect(css).not.toContain("--color-food-red");
    expect(css).not.toContain("--color-food-healthy");
    expect(css).not.toContain("--color-food-unhealthy");
    expect(css).not.toContain("traffic-light");
  });
});

describe("CHK-005: shadcn/ui Button component", () => {
  it("renders Button with default variant", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });

  it("renders Button with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" })).toBeDefined();
  });

  it("renders Button with destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("renders Button as disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button", { name: "Disabled" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("CHK-005: shadcn/ui Input component", () => {
  it("renders Input with placeholder", () => {
    render(<Input placeholder="Email address" />);
    expect(screen.getByPlaceholderText("Email address")).toBeDefined();
  });

  it("renders Input with type=password", () => {
    render(<Input type="password" placeholder="Password" />);
    const input = screen.getByPlaceholderText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");
  });
});

describe("CHK-005: shadcn/ui Card component", () => {
  it("renders Card with header and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Breakfast</CardTitle>
        </CardHeader>
        <CardContent>520 kcal</CardContent>
      </Card>
    );
    expect(screen.getByText("Breakfast")).toBeDefined();
    expect(screen.getByText("520 kcal")).toBeDefined();
  });
});

describe("CHK-005: shadcn/ui Dialog component", () => {
  it("renders Dialog with title and description when open", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Confirm deletion</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Confirm deletion")).toBeDefined();
    expect(screen.getByText("This action cannot be undone.")).toBeDefined();
  });

  it("does not render dialog content when closed", () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("CHK-005: shadcn/ui Sheet component", () => {
  it("renders Sheet with bottom side for mobile log entry", () => {
    render(
      <Sheet open={true}>
        <SheetContent side="bottom">
          <SheetTitle>Log food</SheetTitle>
          <SheetDescription>Select a logging method</SheetDescription>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText("Log food")).toBeDefined();
    expect(screen.getByText("Select a logging method")).toBeDefined();
  });

  it("renders Sheet with right side for tablet/desktop side panel", () => {
    render(
      <Sheet open={true}>
        <SheetContent side="right">
          <SheetTitle>Food search</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText("Food search")).toBeDefined();
  });
});

describe("CHK-005: shadcn/ui Toast (Sonner) component", () => {
  it("renders Toaster without errors", () => {
    const { container } = render(<Toaster />);
    expect(container).toBeDefined();
  });

  it("Toaster configured with bottom-center position per UX spec", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/ui/sonner.tsx"),
      "utf-8"
    );
    expect(src).toContain("bottom-center");
  });
});
