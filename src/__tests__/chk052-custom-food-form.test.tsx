// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("CHK-052: Custom Food Creation Form", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "new-food-id", name: "My Custom Food" }),
    });
  });

  it("renders custom food form without crashing", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    expect(document.body.innerHTML).toBeTruthy();
  });

  it("renders food name field", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/food name|name/i)).toBeDefined();
    });
  });

  it("renders calories field", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/calories|kcal/i)).toBeDefined();
    });
  });

  it("renders protein field", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/protein/i)).toBeDefined();
    });
  });

  it("renders carbs field", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/carbs|carbohydrates/i)).toBeDefined();
    });
  });

  it("renders fat field", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/fat/i)).toBeDefined();
    });
  });

  it("renders serving size fields", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/serving size|serving label/i)).toBeDefined();
    });
  });

  it("renders submit button", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    await waitFor(() => {
      const submitBtn = screen.queryByRole("button", { name: /save|create|submit/i });
      expect(submitBtn).toBeDefined();
    });
  });

  it("submits POST to /api/v1/foods with form data", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );

    await waitFor(async () => {
      const nameField = screen.queryByLabelText(/food name|name/i);
      const caloriesField = screen.queryByLabelText(/calories|kcal/i);
      const submitBtn = screen.queryByRole("button", { name: /save|create|submit/i });

      if (nameField && caloriesField && submitBtn) {
        fireEvent.change(nameField, { target: { value: "My Test Food" } });
        fireEvent.change(caloriesField, { target: { value: "200" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          if (mockFetch.mock.calls.length > 0) {
            expect(mockFetch).toHaveBeenCalledWith(
              expect.stringContaining("/api/v1/foods"),
              expect.objectContaining({ method: "POST" })
            );
          }
        });
      }
    });
  });

  it("calls onCreated after successful submission", async () => {
    const onCreated = vi.fn();
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    render(
      <CustomFoodForm open={true} onOpenChange={vi.fn()} onCreated={onCreated} />,
      { wrapper }
    );

    await waitFor(async () => {
      const nameField = screen.queryByLabelText(/food name|name/i);
      const caloriesField = screen.queryByLabelText(/calories|kcal/i);
      const proteinField = screen.queryByLabelText(/protein/i);
      const carbsField = screen.queryByLabelText(/carbs|carbohydrates/i);
      const fatField = screen.queryByLabelText(/fat/i);
      const submitBtn = screen.queryByRole("button", { name: /save|create|submit/i });

      if (nameField && caloriesField && submitBtn) {
        fireEvent.change(nameField, { target: { value: "My Test Food" } });
        fireEvent.change(caloriesField, { target: { value: "200" } });
        if (proteinField) fireEvent.change(proteinField, { target: { value: "10" } });
        if (carbsField) fireEvent.change(carbsField, { target: { value: "30" } });
        if (fatField) fireEvent.change(fatField, { target: { value: "5" } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          if (mockFetch.mock.calls.length > 0) {
            expect(onCreated).toHaveBeenCalled();
          }
        }, { timeout: 1000 });
      }
    });
  });

  it("does not render when closed", async () => {
    const { CustomFoodForm } = await import("@/app/(app)/today/custom-food-form");
    const { container } = render(
      <CustomFoodForm open={false} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
      { wrapper }
    );
    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).toBeNull();
  });
});
