"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { useGuestStore } from "@/lib/stores/guest-store";

interface FABProps {
  onClick?: () => void;
  className?: string;
}

export function FAB({ onClick, className }: FABProps) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const openLogModal = useUIStore((s) => s.openLogModal);

  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      openLogModal();
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isGuest ? "Log food (guest mode)" : "Log food"}
      className={cn(
        "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg",
        "hover:bg-[var(--color-primary-dark)] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        "md:bottom-6 md:right-6",
        className
      )}
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
