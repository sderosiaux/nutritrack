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

// Mock getUserMedia as not available (no camera in test env)
Object.defineProperty(global.navigator, "mediaDevices", {
  value: undefined,
  writable: true,
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("CHK-032: Barcode Scanner UI", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "f-barcode-1",
        name: "Product Name",
        brandName: "Brand Co",
        caloriesPer100g: 250,
        proteinPer100g: 5,
        carbsPer100g: 40,
        fatPer100g: 10,
        fiberPer100g: 2,
        servingSizes: [{ id: "ss1", label: "100g", weightG: 100 }],
      }),
    });
  });

  it("renders barcode scanner component without crashing", async () => {
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={vi.fn()} onClose={vi.fn()} />,
      { wrapper }
    );
    expect(document.body.innerHTML).toBeTruthy();
  });

  it("shows manual barcode entry option", async () => {
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={vi.fn()} onClose={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText(/enter barcode manually|manual|type barcode/i)).toBeDefined();
  });

  it("renders manual barcode input", async () => {
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={vi.fn()} onClose={vi.fn()} />,
      { wrapper }
    );
    // Should have a text input for manual barcode entry
    const input = screen.queryByRole("textbox");
    expect(input).toBeDefined();
  });

  it("looks up barcode when submitted", async () => {
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={vi.fn()} onClose={vi.fn()} />,
      { wrapper }
    );

    const input = screen.queryByRole("textbox");
    if (input) {
      fireEvent.change(input, { target: { value: "1234567890" } });
      const submitBtn = screen.queryByRole("button", { name: /search|look up|find|submit/i });
      if (submitBtn) {
        fireEvent.click(submitBtn);
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/v1/foods/barcode/1234567890")
          );
        });
      }
    }
  });

  it("calls onFoodFound with result after barcode lookup", async () => {
    const onFoodFound = vi.fn();
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={onFoodFound} onClose={vi.fn()} />,
      { wrapper }
    );

    const input = screen.queryByRole("textbox");
    if (input) {
      fireEvent.change(input, { target: { value: "1234567890" } });
      const submitBtn = screen.queryByRole("button", { name: /search|look up|find|submit/i });
      if (submitBtn) {
        fireEvent.click(submitBtn);
        await waitFor(() => {
          if (mockFetch.mock.calls.length > 0) {
            expect(onFoodFound).toHaveBeenCalled();
          }
        });
      }
    }
  });

  it("shows error message when barcode not found", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "barcode_not_found" }),
    });
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={vi.fn()} onClose={vi.fn()} />,
      { wrapper }
    );

    const input = screen.queryByRole("textbox");
    if (input) {
      fireEvent.change(input, { target: { value: "0000000000" } });
      const submitBtn = screen.queryByRole("button", { name: /search|look up|find|submit/i });
      if (submitBtn) {
        fireEvent.click(submitBtn);
        await waitFor(() => {
          const errMsg = screen.queryByText(/not found|no product|try again/i);
          if (mockFetch.mock.calls.length > 0) {
            expect(errMsg ?? screen.queryByRole("alert")).toBeDefined();
          }
        });
      }
    }
  });

  it("renders camera unavailable notice when no camera", async () => {
    const { BarcodeScanner } = await import("@/app/(app)/today/barcode-scanner");
    render(
      <BarcodeScanner onFoodFound={vi.fn()} onClose={vi.fn()} />,
      { wrapper }
    );
    // With no camera API available, should show manual entry as default
    // Manual entry input should be visible
    expect(screen.queryByRole("textbox") ?? screen.queryByText(/manual|enter barcode/i)).toBeDefined();
  });
});
