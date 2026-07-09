import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Users, LayoutDashboard } from "lucide-react";
import KpiCard from "@/components/kpi/KpiCard";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { DashboardResponse } from "@/types";

// Match locale to currency so ₹ uses Indian grouping (12,45,670) and
// $/€ etc. use their native grouping. Kept local to Dashboard because
// it is the only place currency is rendered right now.
function localeForCurrency(currency: string): string {
  switch (currency) {
    case "INR": return "en-IN";
    case "EUR": return "en-IE";
    case "GBP": return "en-GB";
    case "JPY": return "ja-JP";
    case "AUD": return "en-AU";
    case "CAD": return "en-CA";
    default:    return "en-US";
  }
}

export default function Dashboard() {
  const { settings } = useSettings();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getDashboard()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PageLoader label="Loading dashboard…" />;

  if (error || !data) {
    return (
      <EmptyState
        icon={<LayoutDashboard size={22} />}
        title="Unable to load dashboard"
        hint={error ?? "The dashboard endpoint returned no data."}
      />
    );
  }

  const { kpi } = data;
  const locale = localeForCurrency(settings.currency);
  const money = (v: number) => formatCurrency(v, settings.currency, locale);
  const number = (v: number) => formatNumber(v, locale);

  const cards = [
    {
      testId: "kpi-revenue",
      label: "Revenue",
      value: money(kpi.revenue),
      deltaPct: kpi.revenue_delta_pct,
      icon: DollarSign,
    },
    {
      testId: "kpi-profit",
      label: "Profit",
      value: money(kpi.profit),
      deltaPct: kpi.profit_delta_pct,
      icon: TrendingUp,
    },
    {
      testId: "kpi-orders",
      label: "Orders",
      value: number(kpi.orders),
      deltaPct: kpi.orders_delta_pct,
      icon: ShoppingBag,
    },
    {
      testId: "kpi-customers",
      label: "Customers",
      value: number(kpi.customers),
      deltaPct: kpi.customers_delta_pct,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6"
        data-testid="kpi-grid"
      >
        {cards.map((c) => (
          <KpiCard key={c.testId} {...c} />
        ))}
      </div>
    </div>
  );
}
