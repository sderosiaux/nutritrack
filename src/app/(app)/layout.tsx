import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { FAB } from "@/components/shell/fab";
import { BackupBanner } from "@/components/guest/backup-banner";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh bg-[var(--color-surface-alt)]">
      {/* Left sidebar — visible on sm+ (640px) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <BackupBanner />
        <main className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — visible on mobile only (<640px) */}
      <BottomNav />

      {/* Global FAB '+' — log food shortcut */}
      <FAB />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
