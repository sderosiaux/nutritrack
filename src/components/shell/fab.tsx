"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogEntry } from "@/lib/hooks/use-log-entry";

interface FABProps {
  onClick?: () => void;
  className?: string;
}

export function FAB({ onClick, className }: FABProps) {
  // useLogEntry wires the IndexedDB-first data path for guest mode.
  // The full log modal (lane 5) will call logMealEntry/logWaterEntry/logWeightEntry.
  const { isGuest } = useLogEntry();

  return (
    <button
      onClick={onClick}
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
