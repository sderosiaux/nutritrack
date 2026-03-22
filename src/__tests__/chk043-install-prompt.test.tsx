// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { InstallPrompt } from "@/components/pwa/install-prompt";

describe("CHK-043: InstallPrompt component", () => {
  let mockPrompt: { prompt: ReturnType<typeof vi.fn>; userChoice: Promise<{ outcome: string }> };

  beforeEach(() => {
    mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing initially (no install prompt event)", () => {
    const { container } = render(<InstallPrompt />);
    // Before beforeinstallprompt fires, banner should not be visible
    const banner = container.querySelector("[data-testid='install-banner']");
    expect(banner).toBeNull();
  });

  it("shows install banner when beforeinstallprompt fires", async () => {
    render(<InstallPrompt />);

    await act(async () => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, { preventDefault: vi.fn(), prompt: mockPrompt.prompt, userChoice: mockPrompt.userChoice });
      window.dispatchEvent(event);
    });

    expect(screen.getByTestId("install-banner")).toBeInTheDocument();
  });

  it("banner shows 'Add to Home Screen' text", async () => {
    render(<InstallPrompt />);

    await act(async () => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, { preventDefault: vi.fn(), prompt: mockPrompt.prompt, userChoice: mockPrompt.userChoice });
      window.dispatchEvent(event);
    });

    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
  });

  it("calls prompt() when install button is clicked", async () => {
    render(<InstallPrompt />);

    await act(async () => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, { preventDefault: vi.fn(), prompt: mockPrompt.prompt, userChoice: mockPrompt.userChoice });
      window.dispatchEvent(event);
    });

    const installBtn = screen.getByRole("button", { name: /install/i });
    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(mockPrompt.prompt).toHaveBeenCalled();
  });

  it("hides banner when dismiss button is clicked", async () => {
    render(<InstallPrompt />);

    await act(async () => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, { preventDefault: vi.fn(), prompt: mockPrompt.prompt, userChoice: mockPrompt.userChoice });
      window.dispatchEvent(event);
    });

    const dismissBtn = screen.getByRole("button", { name: /dismiss|close|later/i });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(screen.queryByTestId("install-banner")).toBeNull();
  });
});
