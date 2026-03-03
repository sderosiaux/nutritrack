// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createQueryClient, createOptimisticMutation } from "@/lib/query-client";
import { useUIStore } from "@/lib/stores/ui-store";
import { useGuestStore } from "@/lib/stores/guest-store";
import { QueryProvider } from "@/components/providers/query-provider";
import {
  emailSchema,
  passwordSchema,
  loginFormSchema,
  registerFormSchema,
  firstError,
  zodResolver,
} from "@/lib/forms";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/today",
}));

describe("CHK-050: TanStack Query client config", () => {
  it("createQueryClient returns a QueryClient instance", () => {
    const client = createQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it("default staleTime is 60s (1 minute)", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(60 * 1000);
  });

  it("default gcTime is 5 minutes", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.gcTime).toBe(5 * 60 * 1000);
  });

  it("default retry is 1", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
  });
});

describe("CHK-050: Optimistic mutation helper", () => {
  it("createOptimisticMutation returns object with onMutate, onError, onSettled, mutationFn", () => {
    const client = createQueryClient();
    const mutFn = vi.fn();
    const opts = createOptimisticMutation({
      queryClient: client,
      queryKey: ["test"],
      mutationFn: mutFn,
      updateCache: (old: unknown[]) => old,
    });
    expect(typeof opts.mutationFn).toBe("function");
    expect(typeof opts.onMutate).toBe("function");
    expect(typeof opts.onError).toBe("function");
    expect(typeof opts.onSettled).toBe("function");
  });

  it("onMutate applies optimistic update to cache", async () => {
    const client = createQueryClient();
    client.setQueryData(["items"], ["a", "b"]);

    const opts = createOptimisticMutation({
      queryClient: client,
      queryKey: ["items"],
      mutationFn: vi.fn(),
      updateCache: (old: string[], input: string) => [...old, input],
    });

    const ctx = await opts.onMutate("c");
    expect(client.getQueryData<string[]>(["items"])).toEqual(["a", "b", "c"]);
    expect(ctx?.previous).toEqual(["a", "b"]);
  });

  it("onError rolls back cache to previous state", async () => {
    const client = createQueryClient();
    client.setQueryData(["items"], ["a", "b"]);

    const opts = createOptimisticMutation({
      queryClient: client,
      queryKey: ["items"],
      mutationFn: vi.fn(),
      updateCache: (old: string[], input: string) => [...old, input],
    });

    const ctx = await opts.onMutate("c");
    // Simulate error rollback
    opts.onError(new Error("fail"), "c", ctx);
    expect(client.getQueryData<string[]>(["items"])).toEqual(["a", "b"]);
  });
});

describe("CHK-050: Zustand UI store", () => {
  it("initializes with selectedDate as today's date string", () => {
    const state = useUIStore.getState();
    const today = new Date().toISOString().split("T")[0];
    expect(state.selectedDate).toBe(today);
  });

  it("setSelectedDate updates the date", () => {
    useUIStore.getState().setSelectedDate("2026-01-15");
    expect(useUIStore.getState().selectedDate).toBe("2026-01-15");
    // Reset
    useUIStore.getState().setSelectedDate(new Date().toISOString().split("T")[0]);
  });

  it("sidebarOpen defaults to false", () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(false);
  });

  it("toggleSidebar flips sidebarOpen", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });
});

describe("CHK-050: Zustand guest store", () => {
  it("isGuest defaults to false", () => {
    expect(useGuestStore.getState().isGuest).toBe(false);
  });

  it("setIsGuest(true) marks session as guest", () => {
    useGuestStore.getState().setIsGuest(true);
    expect(useGuestStore.getState().isGuest).toBe(true);
    useGuestStore.getState().setIsGuest(false);
  });
});

describe("CHK-050: QueryProvider component", () => {
  it("renders children inside QueryProvider", () => {
    render(
      <QueryProvider>
        <div data-testid="child">Hello</div>
      </QueryProvider>
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });
});

describe("CHK-050: RHF + Zod validation utilities (src/lib/forms.ts)", () => {
  it("emailSchema rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("emailSchema accepts valid email", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  it("passwordSchema rejects password shorter than 8 chars", () => {
    expect(passwordSchema.safeParse("abc123").success).toBe(false);
  });

  it("passwordSchema accepts password of 8+ chars", () => {
    expect(passwordSchema.safeParse("secure99").success).toBe(true);
  });

  it("loginFormSchema validates correct email+password", () => {
    expect(
      loginFormSchema.safeParse({ email: "test@example.com", password: "password1" }).success
    ).toBe(true);
  });

  it("loginFormSchema rejects missing password", () => {
    expect(loginFormSchema.safeParse({ email: "test@example.com" }).success).toBe(false);
  });

  it("registerFormSchema requires name field", () => {
    expect(
      registerFormSchema.safeParse({ name: "", email: "a@b.com", password: "password1" }).success
    ).toBe(false);
  });

  it("registerFormSchema accepts valid name+email+password", () => {
    expect(
      registerFormSchema.safeParse({ name: "Alice", email: "a@b.com", password: "password1" }).success
    ).toBe(true);
  });

  it("firstError returns first error message from field map", () => {
    const errors = {
      email: { message: "Invalid email" },
      password: undefined,
    };
    expect(firstError(errors)).toBe("Invalid email");
  });

  it("firstError returns undefined when no errors", () => {
    expect(firstError({})).toBeUndefined();
  });

  it("zodResolver is exported and callable", () => {
    const resolver = zodResolver(loginFormSchema);
    expect(typeof resolver).toBe("function");
  });
});
