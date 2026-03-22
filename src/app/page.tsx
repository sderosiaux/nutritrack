"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuestStore } from "@/lib/stores/guest-store";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const setIsGuest = useGuestStore((s) => s.setIsGuest);
  const router = useRouter();

  function handleContinueAsGuest() {
    setIsGuest(true);
    router.push("/today");
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-[var(--color-surface)] px-6 text-center">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary)]">
          <Leaf className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">NutriTrack</h1>
        <p className="text-[var(--color-text-muted)]">
          Open-source AI nutrition tracker
        </p>
      </div>

      {/* CTAs */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/register">Get Started</Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/login">Sign In</Link>
        </Button>

        <button
          onClick={handleContinueAsGuest}
          className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </main>
  );
}
