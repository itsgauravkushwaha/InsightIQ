// Formatting helpers for currency, numbers, and dates.
// Keep pure and dependency-free.

export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatNumber(value: number, locale = "en-US"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDate(value: string | Date, locale = "en-US"): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });
}
