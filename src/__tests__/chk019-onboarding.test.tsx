// @vitest-environment jsdom
/**
 * CHK-019: Onboarding wizard (6 steps)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
}) as unknown as typeof fetch;

const { OnboardingWizard } = await import("@/app/onboarding/onboarding-wizard");

function renderWizard() {
  return render(<OnboardingWizard />);
}

describe("OnboardingWizard — step navigation", () => {
  it("renders step 1 (Goal selection) on mount", () => {
    renderWizard();
    expect(screen.getByText(/what's your goal/i)).toBeInTheDocument();
  });

  it("shows progress indicator", () => {
    renderWizard();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("advances to step 2 after selecting a goal", async () => {
    renderWizard();
    fireEvent.click(screen.getByText(/lose weight/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByText(/activity level/i)).toBeInTheDocument();
    });
  });

  it("shows back button from step 2 onwards", async () => {
    renderWizard();
    fireEvent.click(screen.getByText(/lose weight/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    });
  });

  it("can go back from step 2 to step 1", async () => {
    renderWizard();
    fireEvent.click(screen.getByText(/lose weight/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => screen.getByRole("button", { name: /back/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByText(/what's your goal/i)).toBeInTheDocument();
    });
  });
});

describe("OnboardingWizard — step 1: Goal", () => {
  it("shows all four goal options", () => {
    renderWizard();
    expect(screen.getByText(/lose weight/i)).toBeInTheDocument();
    expect(screen.getByText(/build muscle/i)).toBeInTheDocument();
    expect(screen.getByText(/maintain/i)).toBeInTheDocument();
    expect(screen.getByText(/eat healthier/i)).toBeInTheDocument();
  });

  it("continue button disabled until goal is selected", () => {
    renderWizard();
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it("enables continue after selecting goal", () => {
    renderWizard();
    fireEvent.click(screen.getByText(/maintain/i));
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });
});

describe("OnboardingWizard — step 2: Activity level", () => {
  async function goToStep2() {
    renderWizard();
    fireEvent.click(screen.getByText(/lose weight/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => screen.getByText(/activity level/i));
  }

  it("shows activity level options", async () => {
    await goToStep2();
    expect(screen.getByText(/sedentary/i)).toBeInTheDocument();
    expect(screen.getByText(/lightly active/i)).toBeInTheDocument();
    expect(screen.getByText(/moderately active/i)).toBeInTheDocument();
    expect(screen.getByText(/very active/i)).toBeInTheDocument();
  });
});

describe("OnboardingWizard — step 3: Demographics", () => {
  async function goToStep3() {
    renderWizard();
    // Step 1
    fireEvent.click(screen.getByText(/lose weight/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    // Step 2
    await waitFor(() => screen.getByText(/activity level/i));
    fireEvent.click(screen.getByText(/moderately active/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => screen.getByText(/about you/i));
  }

  it("shows sex and birth date fields", async () => {
    await goToStep3();
    expect(screen.getByLabelText(/biological sex/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });
});

describe("OnboardingWizard — step 6: Summary", () => {
  it("shows calculated calorie target", async () => {
    renderWizard();

    // Step 1: goal
    fireEvent.click(screen.getByText(/maintain/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2: activity
    await waitFor(() => screen.getByText(/activity level/i));
    fireEvent.click(screen.getByText(/moderately active/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3: demographics
    await waitFor(() => screen.getByText(/about you/i));
    const sexSelect = screen.getByLabelText(/biological sex/i);
    fireEvent.change(sexSelect, { target: { value: "male" } });
    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: "1990-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 4: height + weight
    await waitFor(() => screen.getByText(/height.*weight/i));
    const heightInput = screen.getByLabelText(/height/i);
    const weightInput = screen.getByLabelText(/weight/i);
    fireEvent.change(heightInput, { target: { value: "180" } });
    fireEvent.change(weightInput, { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 5: dietary restrictions
    await waitFor(() => screen.getByText(/dietary/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 6: summary
    await waitFor(() => screen.getByText(/daily target/i));
    expect(screen.getByText(/kcal/i)).toBeInTheDocument();
  });
});
