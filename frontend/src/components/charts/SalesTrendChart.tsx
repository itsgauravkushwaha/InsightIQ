import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/types";

/**
 * Sales Trend chart — monthly revenue as a smooth line.
 *
 * Callers provide pre-computed points; we only handle rendering.
 * `formatCurrency` is injected so the chart stays currency-agnostic.
 */
export interface SalesTrendChartProps {
  data: TrendPoint[];
  formatCurrency: (value: number) => string;
}

interface Row {
  month: string;      // e.g. "Jan '24"
  revenue: number;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toMonthLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yr = String(d.getUTCFullYear()).slice(-2);
  return `${MONTHS_SHORT[d.getUTCMonth()]} '${yr}`;
}

export default function SalesTrendChart({ data, formatCurrency }: SalesTrendChartProps) {
  const rows: Row[] = useMemo(
    () => data.map((p) => ({ month: toMonthLabel(p.date), revenue: p.revenue })),
    [data]
  );

  return (
    <div className="h-72 w-full" data-testid="sales-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="salesLineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "currentColor", opacity: 0.55, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: "currentColor", opacity: 0.55, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={68}
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
            }
          />
          <Tooltip
            cursor={{ stroke: "#2563eb", strokeOpacity: 0.25, strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 10px 30px -12px rgba(16,24,40,0.18)",
              backgroundColor: "rgb(var(--surface))",
              color: "rgb(var(--fg))",
              padding: "8px 12px",
              fontSize: 12,
            }}
            labelStyle={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}
            formatter={(value: number) => [formatCurrency(value), "Revenue"]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="url(#salesLineStroke)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, stroke: "#2563eb", strokeWidth: 2, fill: "#fff" }}
            isAnimationActive
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
