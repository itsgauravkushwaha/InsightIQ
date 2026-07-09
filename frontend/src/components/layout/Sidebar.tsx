import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  TableProperties,
  Sparkles,
  FileText,
  Settings as SettingsIcon,
  BarChart3,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  testId: string;
}

const items: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/upload", label: "Upload", icon: UploadCloud, testId: "nav-upload" },
  { to: "/analytics", label: "Analytics", icon: TableProperties, testId: "nav-analytics" },
  { to: "/insights", label: "AI Insights", icon: Sparkles, testId: "nav-insights" },
  { to: "/reports", label: "Reports", icon: FileText, testId: "nav-reports" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testId: "nav-settings" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside
      className="flex h-full w-full flex-col border-r border-black/5 dark:border-white/10 bg-white dark:bg-[#0f1115]"
      data-testid="app-sidebar"
    >
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
          <BarChart3 size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg font-semibold tracking-tight">
            InsightIQ
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] iq-muted">
            Analytics workspace
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] iq-muted">
          Workspace
        </p>
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, testId }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                data-testid={testId}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300"
                      : "text-ink-muted hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/[0.05] dark:hover:text-white"
                  )
                }
              >
                <Icon size={17} className="shrink-0" />
                <span className="font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-black/5 dark:border-white/10 p-4">
        <div className="rounded-xl border border-black/5 dark:border-white/10 p-3">
          <p className="font-display text-sm font-semibold">No database</p>
          <p className="mt-1 text-xs iq-muted">
            All analytics run on your uploaded CSV/Excel files. Nothing is persisted server-side.
          </p>
        </div>
      </div>
    </aside>
  );
}
