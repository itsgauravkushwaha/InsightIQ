import { Calendar, MapPin, Package, RotateCcw, Users } from "lucide-react";
import type { DashboardFilterOptions, DashboardFilters } from "@/types";
import { cn } from "@/utils/cn";

export interface FilterBarProps {
  value: DashboardFilters;
  options: DashboardFilterOptions;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onReset: () => void;
  disabled?: boolean;
}

// Shared classes for controls so <select>/<input> stay visually consistent.
const controlBase =
  "peer w-full appearance-none rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-ink-muted/70 focus:border-brand-500 disabled:opacity-50 dark:border-white/10";

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] iq-muted">
        <span className="text-brand-600 dark:text-brand-400">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

export default function FilterBar({
  value,
  options,
  onChange,
  onReset,
  disabled,
}: FilterBarProps) {
  const isActive =
    !!value.date_from ||
    !!value.date_to ||
    !!value.region ||
    !!value.category ||
    !!value.segment;

  return (
    <div
      className="iq-card p-4 shadow-soft md:p-5"
      data-testid="filter-bar"
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:gap-4">
        <div className="lg:col-span-2">
          <Field label="Date Range" icon={<Calendar size={12} />}>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={value.date_from ?? ""}
                min={options.date_min ?? undefined}
                max={value.date_to ?? options.date_max ?? undefined}
                onChange={(e) => onChange({ date_from: e.target.value || undefined })}
                disabled={disabled}
                data-testid="filter-date-from"
                className={cn(controlBase, "flex-1")}
              />
              <span className="text-xs iq-muted">to</span>
              <input
                type="date"
                value={value.date_to ?? ""}
                min={value.date_from ?? options.date_min ?? undefined}
                max={options.date_max ?? undefined}
                onChange={(e) => onChange({ date_to: e.target.value || undefined })}
                disabled={disabled}
                data-testid="filter-date-to"
                className={cn(controlBase, "flex-1")}
              />
            </div>
          </Field>
        </div>

        <Field label="Region" icon={<MapPin size={12} />}>
          <select
            value={value.region ?? ""}
            onChange={(e) => onChange({ region: e.target.value || undefined })}
            disabled={disabled}
            data-testid="filter-region"
            className={controlBase}
          >
            <option value="">All regions</option>
            {options.regions.map((r) => (
              <option key={r} value={r} className="text-ink">
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Product Category" icon={<Package size={12} />}>
          <select
            value={value.category ?? ""}
            onChange={(e) => onChange({ category: e.target.value || undefined })}
            disabled={disabled}
            data-testid="filter-category"
            className={controlBase}
          >
            <option value="">All categories</option>
            {options.categories.map((c) => (
              <option key={c} value={c} className="text-ink">
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Customer Segment" icon={<Users size={12} />}>
          <select
            value={value.segment ?? ""}
            onChange={(e) => onChange({ segment: e.target.value || undefined })}
            disabled={disabled}
            data-testid="filter-segment"
            className={controlBase}
          >
            <option value="">All segments</option>
            {options.segments.map((s) => (
              <option key={s} value={s} className="text-ink">
                {s}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            disabled={disabled || !isActive}
            data-testid="filter-reset-btn"
            className={cn(
              "inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
              isActive
                ? "border-brand-500/40 text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                : "border-black/10 iq-muted dark:border-white/10",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
