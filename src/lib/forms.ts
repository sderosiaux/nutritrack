/**
 * Shared RHF + Zod form validation utilities.
 * Re-exports zodResolver so pages don't need separate imports.
 */
import { z } from "zod";
export { zodResolver } from "@hookform/resolvers/zod";

// ── Primitive schemas ────────────────────────────────────────────────────────

export const emailSchema = z.string().email("Invalid email");
export const passwordSchema = z.string().min(8, "Min 8 characters");
export const nameSchema = z.string().min(1, "Name is required");

// ── Composite form schemas ───────────────────────────────────────────────────

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

// ── Helper: extract first error message from RHF fieldErrors ─────────────────

export function firstError(
  errors: Partial<Record<string, { message?: string }>>
): string | undefined {
  const first = Object.values(errors).find((e) => e?.message);
  return first?.message;
}
