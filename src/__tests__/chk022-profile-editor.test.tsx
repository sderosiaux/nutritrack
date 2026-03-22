// @vitest-environment jsdom
/**
 * CHK-022: Profile editor UI (S-PROFILE-1, S-PROFILE-2)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfilePage } from "@/app/(app)/profile/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function mockFetch(profileData: object, targetsData?: object) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === "string" && url.includes("/api/v1/profile")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          profile: profileData,
          targets: targetsData ?? { caloriesKcal: 2000, proteinG: 100, carbsG: 250, fatG: 67, fiberG: 25, waterMl: 2000 },
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as unknown as typeof fetch;
}

function renderProfile() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ProfilePage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mockFetch({
    userId: "user-1",
    displayName: "Alice",
    biologicalSex: "female",
    goal: "lose_weight",
    activityLevel: "moderate",
    currentWeightKg: "65",
    heightCm: "168",
    units: "metric",
    language: "en",
    timezone: "UTC",
    dietaryRestrictions: [],
    allergies: [],
  });
});

describe("ProfilePage — layout", () => {
  it("renders profile heading", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /profile/i })).toBeInTheDocument();
    });
  });

  it("shows My Goals section", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText(/my goals/i)).toBeInTheDocument();
    });
  });

  it("shows Body Metrics section", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText(/body metrics/i)).toBeInTheDocument();
    });
  });

  it("shows Nutrition Targets section", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText(/nutrition targets/i)).toBeInTheDocument();
    });
  });

  it("shows Data & Privacy section", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText(/data.*privacy/i)).toBeInTheDocument();
    });
  });
});

describe("ProfilePage — goals editor", () => {
  it("shows current goal", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText(/lose weight/i)).toBeInTheDocument();
    });
  });

  it("shows recalculate targets button", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /recalculate/i })).toBeInTheDocument();
    });
  });
});

describe("ProfilePage — account deletion (CHK-055)", () => {
  it("shows delete account button", async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
    });
  });

  it("shows confirmation dialog on delete click", async () => {
    renderProfile();
    await waitFor(() => screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it("cancels deletion dialog", async () => {
    renderProfile();
    await waitFor(() => screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    await waitFor(() => screen.getByText(/are you sure/i));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });
});
