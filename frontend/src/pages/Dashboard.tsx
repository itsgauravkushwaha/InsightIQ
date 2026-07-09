import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Users, LayoutDashboard } from "lucide-react";
import KpiCard from "@/components/kpi/KpiCard";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import CategoryRevenueChart from "@/components/charts/CategoryRevenueChart";
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

  const locale = useMemo(() => localeForCurrency(settings.currency), [settings.currency]);

  // Currency formatter memoised so child charts receive a stable reference.
  const money = useCallback(
    (v: number) => formatCurrency(v, settings.currency, locale),
    [settings.currency, locale]
  );
  const number = useCallback((v: number) => formatNumber(v, locale), [locale]);

  const cards = useMemo(() => {
    if (!data) return [];
    const { kpi } = data;
    return [
      { testId: "kpi-revenue",   label: "Revenue",   value: money(kpi.revenue), deltaPct: kpi.revenue_delta_pct,   icon: DollarSign },
      { testId: "kpi-profit",    label: "Profit",    value: money(kpi.profit),  deltaPct: kpi.profit_delta_pct,    icon: TrendingUp },
      { testId: "kpi-orders",    label: "Orders",    value: number(kpi.orders), deltaPct: kpi.orders_delta_pct,    icon: ShoppingBag },
      { testId: "kpi-customers", label: "Customers", value: number(kpi.customers), deltaPct: kpi.customers_delta_pct, icon: Users },
    ];
  }, [data, money, number]);

  // Memoised chart datasets to avoid re-renders when unrelated state changes.
  const trend = useMemo(() => data?.salesTrend ?? [], [data]);
  const categories = useMemo(() => data?.categoryRevenue ?? [], [data]);

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

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* KPI row */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6"
        data-testid="kpi-grid"
      >
        {cards.map((c) => (
          <KpiCard key={c.testId} {...c} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6" data-testid="charts-grid">
        <Card>
          <CardHeader className="flex items-baseline justify-between">
            <div>
              <CardTitle>Sales Trend</CardTitle>
              <p className="mt-1 text-xs iq-muted">Monthly revenue across the active dataset.</p>
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] iq-muted sm:inline">
              Revenue
            </span>
          </CardHeader>
          <CardBody className="pt-2">
            {trend.length > 0 ? (
              <SalesTrendChart data={trend} formatCurrency={money} />
            ) : (
              <p className="py-16 text-center text-sm iq-muted">No trend data available.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-baseline justify-between">
            <div>
              <CardTitle>Revenue by Category</CardTitle>
              <p className="mt-1 text-xs iq-muted">Aggregated revenue per product category.</p>
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] iq-muted sm:inline">
              Category
            </span>
          </CardHeader>
          <CardBody className="pt-2">
            {categories.length > 0 ? (
              <CategoryRevenueChart data={categories} formatCurrency={money} />
            ) : (
              <p className="py-16 text-center text-sm iq-muted">No category data available.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
