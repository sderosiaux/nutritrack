// @vitest-environment jsdom
/**
 * CHK-058: Weekly check-in flow
 * Simple modal triggered weekly, stored in localStorage
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

beforeEach(() => {
  vi.resetModules();
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});

describe("WeeklyCheckinModal — display logic", () => {
  it("shows modal when no previous check-in stored", async () => {
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => {
      expect(screen.getByText(/how.*week.*going/i)).toBeInTheDocument();
    });
  });

  it("does not show if dismissed forever", async () => {
    localStorageMock.setItem("nutritrack-weekly-checkin", JSON.stringify({ dismissedForever: true }));
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => {
      expect(screen.queryByText(/how.*week.*going/i)).not.toBeInTheDocument();
    });
  });

  it("does not show if checked in this week", async () => {
    const now = new Date();
    localStorageMock.setItem("nutritrack-weekly-checkin", JSON.stringify({ lastCheckin: now.toISOString() }));
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => {
      expect(screen.queryByText(/how.*week.*going/i)).not.toBeInTheDocument();
    });
  });
});

describe("WeeklyCheckinModal — interactions", () => {
  it("shows emoji options for response", async () => {
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => screen.getByText(/how.*week.*going/i));
    // Should show at least 3 emoji options
    const emojiButtons = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("data-emoji") !== null
    );
    expect(emojiButtons.length).toBeGreaterThanOrEqual(3);
  });

  it("stores response and dismisses modal on emoji click", async () => {
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => screen.getByText(/how.*week.*going/i));

    const emojiButtons = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("data-emoji") !== null
    );
    fireEvent.click(emojiButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/how.*week.*going/i)).not.toBeInTheDocument();
    });

    const stored = JSON.parse(localStorageMock.getItem("nutritrack-weekly-checkin") ?? "{}");
    expect(stored.lastCheckin).toBeTruthy();
    expect(stored.lastResponse).toBeTruthy();
  });

  it("stores dismissedForever on 'Don't ask again'", async () => {
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => screen.getByText(/how.*week.*going/i));

    fireEvent.click(screen.getByRole("button", { name: /don't ask again/i }));

    await waitFor(() => {
      expect(screen.queryByText(/how.*week.*going/i)).not.toBeInTheDocument();
    });

    const stored = JSON.parse(localStorageMock.getItem("nutritrack-weekly-checkin") ?? "{}");
    expect(stored.dismissedForever).toBe(true);
  });

  it("can be dismissed without answering", async () => {
    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => screen.getByText(/how.*week.*going/i));

    const dismissBtn = screen.getByRole("button", { name: /dismiss|later|skip|×|close/i });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText(/how.*week.*going/i)).not.toBeInTheDocument();
    });
  });
});

describe("WeeklyCheckinModal — shows again after 7+ days", () => {
  it("shows modal if last checkin was >7 days ago", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 8);
    localStorageMock.setItem("nutritrack-weekly-checkin", JSON.stringify({ lastCheckin: pastDate.toISOString() }));

    const { WeeklyCheckinModal } = await import("@/components/weekly-checkin/weekly-checkin-modal");
    render(<WeeklyCheckinModal />);
    await waitFor(() => {
      expect(screen.getByText(/how.*week.*going/i)).toBeInTheDocument();
    });
  });
});
