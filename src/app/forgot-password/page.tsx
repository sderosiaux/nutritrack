"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailSchema, zodResolver } from "@/lib/forms";
import { z } from "zod";

const schema = z.object({ email: emailSchema });
type ForgotPasswordInput = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: ForgotPasswordInput) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    setSent(true);
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[var(--color-surface)] px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--color-text)]">
          Forgot password
        </h1>

        {sent ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-text)]">
            If that email exists, a reset link is on its way.{" "}
            <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              Enter your email and we&apos;ll send a reset link.
            </p>
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
                  <p className="text-xs text-[var(--color-destructive)]">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
              <Link href="/login" className="text-[var(--color-primary)] hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
