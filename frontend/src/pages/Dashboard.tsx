import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Users, LayoutDashboard, Loader2 } from "lucide-react";
import KpiCard from "@/components/kpi/KpiCard";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import CategoryRevenueChart from "@/components/charts/CategoryRevenueChart";
import FilterBar from "@/components/filters/FilterBar";
import TopProductsTable from "@/components/tables/TopProductsTable";
import InsightsSection from "@/components/insights/InsightsSection";
import { api } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { DashboardFilters, DashboardResponse } from "@/types";
import { cn } from "@/utils/cn";

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

const EMPTY_FILTERS: DashboardFilters = {};

export default function Dashboard() {
  const { settings } = useSettings();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS);

  // Fetch on filter change. `refreshing` overlay is used after first load so
  // KPIs/charts don't disappear while data is being updated.
  useEffect(() => {
    let cancelled = false;
    if (data === null) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);

    api
      .getDashboard(filters)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      });
    return () => { cancelled = true; };
    // `data` intentionally omitted — we only refetch when filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const locale = useMemo(() => localeForCurrency(settings.currency), [settings.currency]);

  const money = useCallback(
    (v: number) => formatCurrency(v, settings.currency, locale),
    [settings.currency, locale]
  );
  const number = useCallback((v: number) => formatNumber(v, locale), [locale]);

  const cards = useMemo(() => {
    if (!data) return [];
    const { kpi } = data;
    return [
      { testId: "kpi-revenue",   label: "Revenue",   value: money(kpi.revenue),   deltaPct: kpi.revenue_delta_pct,   icon: DollarSign },
      { testId: "kpi-profit",    label: "Profit",    value: money(kpi.profit),    deltaPct: kpi.profit_delta_pct,    icon: TrendingUp },
      { testId: "kpi-orders",    label: "Orders",    value: number(kpi.orders),   deltaPct: kpi.orders_delta_pct,    icon: ShoppingBag },
      { testId: "kpi-customers", label: "Customers", value: number(kpi.customers), deltaPct: kpi.customers_delta_pct, icon: Users },
    ];
  }, [data, money, number]);

  const trend = useMemo(() => data?.salesTrend ?? [], [data]);
  const categories = useMemo(() => data?.categoryRevenue ?? [], [data]);
  const topProducts = useMemo(() => data?.topProducts ?? [], [data]);
  const insights = useMemo(
    () => data?.insights ?? { executive_summary: [], risks: [], opportunities: [], recommendations: [] },
    [data]
  );

  const patchFilters = useCallback(
    (patch: Partial<DashboardFilters>) => setFilters((f) => ({ ...f, ...patch })),
    []
  );
  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  if (initialLoading) return <PageLoader label="Loading dashboard…" />;

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
      {/* Filter bar */}
      <FilterBar
        value={filters}
        options={data.filters}
        onChange={patchFilters}
        onReset={resetFilters}
        disabled={refreshing}
      />

      {/* Refreshing overlay for the sections that depend on filters */}
      <div
        className={cn(
          "space-y-6 transition-opacity duration-200",
          refreshing ? "pointer-events-none opacity-60" : "opacity-100"
        )}
      >
        {refreshing && (
          <div
            className="flex items-center gap-2 text-xs iq-muted"
            data-testid="dashboard-refreshing"
          >
            <Loader2 size={13} className="animate-spin" />
            Updating…
          </div>
        )}

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

        {/* Top products */}
        <Card>
          <CardHeader className="flex items-baseline justify-between">
            <div>
              <CardTitle>Top 10 Products</CardTitle>
              <p className="mt-1 text-xs iq-muted">
                Highest-revenue products across the current filter set.
              </p>
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] iq-muted sm:inline">
              {topProducts.length} shown
            </span>
          </CardHeader>
          <CardBody className="p-0">
            <TopProductsTable
              rows={topProducts}
              formatCurrency={money}
              formatNumber={number}
            />
          </CardBody>
        </Card>

        {/* Executive Insights (rule-based, no LLM) */}
        <InsightsSection insights={insights} />
      </div>
    </div>
  );
}
