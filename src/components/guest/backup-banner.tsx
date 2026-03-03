"use client";

import Link from "next/link";
import { useGuestStore } from "@/lib/stores/guest-store";

export function BackupBanner() {
  const isGuest = useGuestStore((s) => s.isGuest);

  if (!isGuest) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-text)]"
    >
      <span>Your data is stored locally.</span>
      <Link
        href="/register"
        className="font-medium text-[var(--color-primary)] hover:underline"
      >
        Back up your data →
      </Link>
    </div>
  );
}
