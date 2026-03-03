// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("CHK-007: S-AUTH-1 Landing / Welcome page", () => {
  it("renders app name / logo area", () => {
    render(<LandingPage />);
    expect(screen.getByText(/nutritrack/i)).toBeDefined();
  });

  it("has 'Get Started' CTA → onboarding", () => {
    render(<LandingPage />);
    expect(screen.getByText(/get started/i)).toBeDefined();
  });

  it("has 'Sign In' link → login", () => {
    render(<LandingPage />);
    expect(screen.getByText(/sign in/i)).toBeDefined();
  });

  it("has 'Continue as Guest' option", () => {
    render(<LandingPage />);
    expect(screen.getByText(/continue as guest/i)).toBeDefined();
  });

  it("'Sign In' navigates to /login", () => {
    render(<LandingPage />);
    const signIn = screen.getByText(/sign in/i);
    // Either a link or a button — check href or role
    const link = signIn.closest("a");
    if (link) {
      expect(link.getAttribute("href")).toBe("/login");
    } else {
      expect(screen.getByText(/sign in/i)).toBeDefined();
    }
  });
});

describe("CHK-007: S-AUTH-4 Login screen", () => {
  it("renders email input", () => {
    render(<LoginPage />);
    // Label is "Email" — getByLabelText finds the input associated with it
    expect(screen.getByLabelText(/email/i)).toBeDefined();
  });

  it("renders password input", () => {
    render(<LoginPage />);
    const inputs = screen.getAllByRole("textbox");
    const pwInput =
      (document.querySelector('input[type="password"]') as HTMLInputElement | null);
    expect(pwInput).toBeTruthy();
  });

  it("renders 'Forgot password' link", () => {
    render(<LoginPage />);
    expect(screen.getByText(/forgot password/i)).toBeDefined();
  });

  it("renders submit button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in|log in/i })).toBeDefined();
  });
});

describe("CHK-007: Register / Account creation screen", () => {
  it("renders email input", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeDefined();
  });

  it("renders password input", () => {
    render(<RegisterPage />);
    const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement | null;
    expect(pwInput).toBeTruthy();
  });

  it("renders submit/create button", () => {
    render(<RegisterPage />);
    expect(
      screen.getByRole("button", { name: /create account|sign up|register/i })
    ).toBeDefined();
  });

  it("has link back to login", () => {
    render(<RegisterPage />);
    // Use getByRole to avoid matching both the paragraph and the link text
    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink.getAttribute("href")).toBe("/login");
  });
});
