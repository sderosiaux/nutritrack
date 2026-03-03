"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-md",
          description: "text-[var(--color-text-muted)]",
          actionButton:
            "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
          cancelButton:
            "bg-[var(--color-muted)] text-[var(--color-text-muted)]",
        },
      }}
    />
  );
}
