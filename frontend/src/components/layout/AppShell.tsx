import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "@/utils/cn";

/**
 * AppShell — the shared layout wrapping every non-landing route.
 * On desktop: sidebar is a fixed 260px column.
 * On mobile: sidebar is hidden by default and opened via the menu button.
 */
export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grid h-full w-full md:grid-cols-[260px_1fr]" data-testid="app-shell">
      {/* Desktop sidebar */}
      <div className="hidden h-full md:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
