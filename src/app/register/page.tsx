"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailSchema, passwordSchema, zodResolver } from "@/lib/forms";
import { upgradeGuestAccount } from "@/lib/guest/upgrade";

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: data.password, name: data.email.split("@")[0] }),
    });
    if (res.ok) {
      const body = await res.json().catch(() => null);
      const userId: string | undefined = body?.user?.id;
      if (userId) {
        await upgradeGuestAccount(userId);
      }
      router.push("/onboarding");
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[var(--color-surface)] px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold text-[var(--color-text)]">
          Create account
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-text)]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[var(--color-destructive)]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[var(--color-text)]">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-[var(--color-destructive)]">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--color-text)]">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-[var(--color-destructive)]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
