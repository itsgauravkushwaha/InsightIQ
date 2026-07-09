import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export interface KpiCardProps {
  label: string;
  value: string;                     // pre-formatted (e.g. ₹12,45,670)
  deltaPct: number;                  // signed, in percent (e.g. 12.4)
  comparisonText?: string;           // defaults to "vs Previous Month"
  icon: LucideIcon;
  testId?: string;
}

/**
 * Executive KPI card. Reuses the shared <Card /> primitive and stays
 * intentionally lightweight — formatting is done by the caller so this
 * component doesn't own any currency/locale logic.
 */
export default function KpiCard({
  label,
  value,
  deltaPct,
  comparisonText = "vs Previous Month",
  icon: Icon,
  testId,
}: KpiCardProps) {
  const isNeutral = deltaPct === 0;
  const isUp = deltaPct > 0;

  const trendColor = isNeutral
    ? "text-ink-muted dark:text-white/50"
    : isUp
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";

  const trendBg = isNeutral
    ? "bg-black/[0.04] dark:bg-white/[0.06]"
    : isUp
      ? "bg-emerald-500/10"
      : "bg-rose-500/10";

  const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;
  const sign = isUp ? "+" : ""; // negative already has a "-" prefix

  return (
    <Card
      className="group relative overflow-hidden p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift"
      data-testid={testId}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] iq-muted">
          {label}
        </p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:group-hover:bg-brand-500/25">
          <Icon size={16} strokeWidth={2.2} />
        </span>
      </div>

      {/* Value */}
      <p
        className="font-display mt-4 truncate text-3xl font-semibold tracking-tight sm:text-[2rem]"
        data-testid={testId ? `${testId}-value` : undefined}
      >
        {value}
      </p>

      {/* Delta pill + comparison text */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            trendBg,
            trendColor
          )}
          data-testid={testId ? `${testId}-delta` : undefined}
        >
          {!isNeutral && <TrendIcon size={12} strokeWidth={2.6} />}
          {isNeutral ? "0.0%" : `${sign}${deltaPct.toFixed(1)}%`}
        </span>
        <span className="text-xs iq-muted">{comparisonText}</span>
      </div>
    </Card>
  );
}
