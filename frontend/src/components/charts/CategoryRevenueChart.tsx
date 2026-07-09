import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryBreakdown } from "@/types";

/**
 * Revenue by Category — vertical bars with rounded tops.
 * Colour palette is fixed and cycled to keep bars visually distinct
 * without depending on the surrounding theme.
 */
export interface CategoryRevenueChartProps {
  data: CategoryBreakdown[];
  formatCurrency: (value: number) => string;
}

const PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#f59e0b", "#e11d48", "#10b981"];

interface Row {
  category: string;
  revenue: number;
}

export default function CategoryRevenueChart({ data, formatCurrency }: CategoryRevenueChartProps) {
  const rows: Row[] = useMemo(
    () => data.map((c) => ({ category: c.category, revenue: c.revenue })),
    [data]
  );

  return (
    <div className="h-72 w-full" data-testid="category-revenue-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="category"
            tick={{ fill: "currentColor", opacity: 0.65, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
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
            cursor={{ fill: "rgba(37,99,235,0.06)" }}
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
          <Bar
            dataKey="revenue"
            radius={[8, 8, 0, 0]}
            maxBarSize={72}
            isAnimationActive
            animationDuration={700}
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
