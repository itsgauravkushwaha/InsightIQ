import { LayoutDashboard } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Dashboard — placeholder for phase 1 scaffolding.
 * Charts, KPI cards, category & region breakdowns will be wired in the
 * next iteration once the backend analytics endpoints are implemented.
 */
export default function Dashboard() {
  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <EmptyState
        icon={<LayoutDashboard size={22} />}
        title="Dashboard scaffolded"
        hint="KPI cards (Revenue, Profit, Orders, Customers), sales trend, category, region and top-products widgets will be wired to /api/dashboard in the next iteration."
      />
    </div>
  );
}
