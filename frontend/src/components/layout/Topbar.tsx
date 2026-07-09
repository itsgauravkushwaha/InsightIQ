import { Moon, Sun, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/utils/cn";

const titles: Record<string, { title: string; hint: string }> = {
  "/dashboard": { title: "Dashboard", hint: "Snapshot of business performance." },
  "/upload": { title: "Upload Data", hint: "Bring in CSV or Excel files to analyse." },
  "/analytics": { title: "Analytics", hint: "Drill into every row with sort, search and filters." },
  "/insights": { title: "AI Insights", hint: "Generated narratives from the current dataset." },
  "/reports": { title: "Reports", hint: "Printable executive summary." },
  "/settings": { title: "Settings", hint: "Workspace preferences." },
};

export default function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { theme, toggle } = useTheme();
  const { settings } = useSettings();
  const { pathname } = useLocation();
  const meta = titles[pathname] ?? { title: "InsightIQ", hint: "" };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-black/5 dark:border-white/10 px-4 md:px-8",
        "iq-glass"
      )}
      data-testid="app-topbar"
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="grid h-9 w-9 place-items-center rounded-lg border border-black/5 dark:border-white/10 md:hidden"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          data-testid="open-sidebar-btn"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display truncate text-lg font-semibold tracking-tight md:text-xl">
            {meta.title}
          </h1>
          {meta.hint ? <p className="hidden truncate text-xs iq-muted md:block">{meta.hint}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="hidden rounded-full border border-black/5 px-3 py-1.5 text-xs font-medium iq-muted transition-colors hover:text-ink dark:border-white/10 dark:hover:text-white md:inline-flex"
          data-testid="topbar-home-link"
        >
          {settings.companyName}
        </Link>
        <button
          onClick={toggle}
          className="grid h-9 w-9 place-items-center rounded-lg border border-black/5 dark:border-white/10 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          aria-label="Toggle theme"
          data-testid="theme-toggle-btn"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
