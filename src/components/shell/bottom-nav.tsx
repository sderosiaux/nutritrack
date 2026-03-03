"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, GraduationCap, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Today", href: "/today", icon: LayoutDashboard },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Coach", href: "/coach", icon: GraduationCap },
  { label: "Progress", href: "/progress", icon: BarChart2 },
  { label: "Profile", href: "/profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden"
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              "min-h-[44px]",
              active
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
