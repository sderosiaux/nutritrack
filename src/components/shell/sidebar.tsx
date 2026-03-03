"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  BarChart2,
  User,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";

const NAV_ITEMS = [
  { label: "Today", href: "/today", icon: LayoutDashboard },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Coach", href: "/coach", icon: GraduationCap },
  { label: "Progress", href: "/progress", icon: BarChart2 },
  { label: "Profile", href: "/profile", icon: User },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200",
        sidebarOpen ? "w-56" : "w-16"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-[var(--color-border)] px-4">
        <Leaf className="h-6 w-6 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
        {sidebarOpen && (
          <span className="ml-2 text-base font-semibold text-[var(--color-text)]">
            NutriTrack
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                active
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-12 items-center justify-center border-t border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
