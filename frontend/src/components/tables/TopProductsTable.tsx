import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { TopProduct } from "@/types";
import { cn } from "@/utils/cn";

type SortKey = keyof Pick<TopProduct, "product" | "category" | "revenue" | "profit" | "quantity">;
type SortDir = "asc" | "desc";

interface Column {
  key: SortKey;
  label: string;
  align: "left" | "right";
  format: (row: TopProduct) => string;
}

export interface TopProductsTableProps {
  rows: TopProduct[];
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
}

export default function TopProductsTable({ rows, formatCurrency, formatNumber }: TopProductsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const columns: Column[] = useMemo(
    () => [
      { key: "product",  label: "Product Name",  align: "left",  format: (r) => r.product },
      { key: "category", label: "Category",      align: "left",  format: (r) => r.category },
      { key: "revenue",  label: "Revenue",       align: "right", format: (r) => formatCurrency(r.revenue) },
      { key: "profit",   label: "Profit",        align: "right", format: (r) => formatCurrency(r.profit) },
      { key: "quantity", label: "Quantity Sold", align: "right", format: (r) => formatNumber(r.quantity) },
    ],
    [formatCurrency, formatNumber]
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggle(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Numeric fields default to desc, text fields to asc.
      setSortDir(key === "product" || key === "category" ? "asc" : "desc");
    }
  }

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm iq-muted" data-testid="top-products-empty">
        No products match the current filters.
      </p>
    );
  }

  return (
    <div
      className="relative -mx-5 max-h-[440px] overflow-auto rounded-b-xl"
      data-testid="top-products-table"
    >
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-white/95 backdrop-blur dark:bg-[#121319]/95">
            {columns.map((col) => {
              const isActive = sortKey === col.key;
              const Icon = !isActive ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "border-b border-black/5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] dark:border-white/10",
                    col.align === "right" ? "text-right" : "text-left",
                    isActive ? "text-ink dark:text-white" : "iq-muted"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 transition-colors hover:text-ink dark:hover:text-white",
                      col.align === "right" ? "flex-row-reverse" : ""
                    )}
                    data-testid={`top-products-sort-${col.key}`}
                  >
                    {col.label}
                    <Icon size={12} className={isActive ? "text-brand-600 dark:text-brand-400" : "opacity-60"} />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr
              key={`${row.product}-${idx}`}
              className="group transition-colors hover:bg-brand-50/60 dark:hover:bg-brand-500/[0.06]"
              data-testid={`top-products-row-${idx}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "border-b border-black/5 px-5 py-3 dark:border-white/[0.06]",
                    col.align === "right" ? "text-right tabular-nums" : "text-left",
                    col.key === "product" ? "font-medium" : ""
                  )}
                >
                  {col.format(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
