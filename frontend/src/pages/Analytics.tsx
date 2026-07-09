import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  FileSpreadsheet,
  Loader2,
  Search,
  Sigma,
  Tags,
  TableProperties,
  Type as TypeIcon,
  AlertOctagon,
  Copy,
  Calendar,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/services/api";
import type { AnalyticsResponse, AnalyticsRow, AnalyticsSummary, ColumnMeta } from "@/types";
import { cn } from "@/utils/cn";

const PAGE_SIZES = [10, 25, 50, 100] as const;

// ------------------------------ Sub-components ---------------------------- //

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "muted" | "amber";
  testId: string;
}

function StatTile({ label, value, icon: Icon, tone = "brand", testId }: StatTileProps) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    muted: "bg-black/[0.04] text-ink-muted dark:bg-white/[0.06] dark:text-white/60",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  } as const;
  return (
    <div className="iq-card p-4 shadow-soft" data-testid={testId}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] iq-muted">
          {label}
        </p>
        <span className={cn("grid h-7 w-7 place-items-center rounded-md", tones[tone])}>
          <Icon size={13} />
        </span>
      </div>
      <p className="font-display mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

const DTYPE_STYLES: Record<ColumnMeta["dtype"], { label: string; className: string; icon: LucideIcon }> = {
  date:     { label: "date",     icon: Calendar,  className: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  numeric:  { label: "numeric",  icon: Sigma,     className: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" },
  category: { label: "category", icon: Tags,      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  text:     { label: "text",     icon: TypeIcon,  className: "bg-black/[0.05] text-ink dark:bg-white/[0.08] dark:text-white/80" },
};

function DTypeChip({ dtype }: { dtype: ColumnMeta["dtype"] }) {
  const { label, className, icon: Icon } = DTYPE_STYLES[dtype];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        className
      )}
      data-testid={`dtype-chip-${dtype}`}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

// --------------------------------- Page ----------------------------------- //

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Debounce free-text search so we don't hammer the backend on every keystroke.
  const searchTimer = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
  }, [searchInput]);

  const sortParams = useMemo(() => {
    const s = sorting[0];
    return s ? { sort_by: s.id, sort_dir: (s.desc ? "desc" : "asc") as "asc" | "desc" } : {};
  }, [sorting]);

  // Fetcher — dependencies are all primitives so React batches well.
  useEffect(() => {
    let cancelled = false;
    if (data === null) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);

    api
      .getAnalytics({ page, page_size: pageSize, search, filters, ...sortParams })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, filters, sortParams]);

  const columnsMeta: ColumnMeta[] = useMemo(() => data?.columns ?? [], [data]);
  const summary: AnalyticsSummary | null = useMemo(() => data?.summary ?? null, [data]);
  const rows: AnalyticsRow[] = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Numeric formatter — kept minimal so the table stays neutral in style.
  const fmtCell = useCallback((value: unknown, dtype: ColumnMeta["dtype"]): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (dtype === "numeric" && typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
      }).format(value);
    }
    return String(value);
  }, []);

  // TanStack columns from the column metadata. Filtering / sorting are
  // server-side; TanStack is used purely for rendering + sort UI state.
  const tableColumns = useMemo<ColumnDef<AnalyticsRow>[]>(
    () =>
      columnsMeta.map((col) => ({
        id: col.name,
        accessorKey: col.name,
        header: col.name,
        cell: (info) => fmtCell(info.getValue(), col.dtype),
        enableSorting: true,
      })),
    [columnsMeta, fmtCell]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    state: { sorting },
    onSortingChange: setSorting,
    pageCount: totalPages,
  });

  // Convenience handlers ---------------------------------------------------- //
  const setFilter = useCallback((col: string, value: string) => {
    setPage(1);
    setFilters((f) => {
      const next = { ...f };
      if (!value) delete next[col];
      else next[col] = value;
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setFilters({});
    setSorting([]);
    setPage(1);
  }, []);

  const hasActiveFilters = search !== "" || Object.keys(filters).length > 0 || sorting.length > 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // -------------------------------- Render -------------------------------- //
  if (initialLoading) return <PageLoader label="Loading analytics…" />;

  if (error || !data) {
    return (
      <EmptyState
        icon={<AlertOctagon size={22} />}
        title="Unable to load analytics"
        hint={error ?? "The analytics endpoint returned no data."}
        action={
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            data-testid="analytics-retry-btn"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Dataset banner */}
      <div className="iq-card flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <FileSpreadsheet size={16} />
          </span>
          <div>
            <p className="font-display text-sm font-semibold" data-testid="analytics-filename">
              {data.dataset.filename}
            </p>
            <p className="text-xs iq-muted">
              {data.dataset.is_sample ? "Bundled sample dataset" : "Uploaded dataset"} · updated{" "}
              {new Date(data.dataset.uploaded_at).toLocaleString()}
            </p>
          </div>
        </div>
        <span className="text-xs iq-muted">
          {new Intl.NumberFormat().format(summary!.total_rows)} rows ·{" "}
          {summary!.total_columns} columns
        </span>
      </div>

      {/* Summary strip */}
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 xl:gap-4"
        data-testid="analytics-summary"
      >
        <StatTile label="Total Rows"        value={new Intl.NumberFormat().format(summary!.total_rows)}    icon={Database}         testId="stat-rows" />
        <StatTile label="Total Columns"     value={summary!.total_columns}                                 icon={TableProperties}  testId="stat-columns" />
        <StatTile label="Numeric Columns"   value={summary!.numeric_columns}                               icon={Sigma}            testId="stat-numeric" />
        <StatTile label="Categorical"       value={summary!.categorical_columns}                           icon={Tags}             testId="stat-categorical" />
        <StatTile label="Missing Values"    value={new Intl.NumberFormat().format(summary!.missing_values)} icon={AlertOctagon}     tone={summary!.missing_values > 0 ? "amber" : "muted"} testId="stat-missing" />
        <StatTile label="Duplicate Rows"    value={new Intl.NumberFormat().format(summary!.duplicate_rows)} icon={Copy}             tone={summary!.duplicate_rows > 0 ? "amber" : "muted"} testId="stat-duplicates" />
      </div>

      {/* Toolbar + table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Data Explorer</CardTitle>
            <p className="mt-1 text-xs iq-muted">
              {new Intl.NumberFormat().format(total)} matching rows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search all columns…"
                data-testid="analytics-search"
                className="w-56 rounded-lg border border-black/10 bg-transparent py-2 pl-8 pr-3 text-sm outline-none transition-colors focus:border-brand-500 dark:border-white/10"
              />
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              data-testid="analytics-page-size"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-white/10"
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n} className="text-ink">
                  {n} / page
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetAll}
              disabled={refreshing || !hasActiveFilters}
              data-testid="analytics-reset-btn"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                hasActiveFilters
                  ? "border-brand-500/40 text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                  : "border-black/10 iq-muted dark:border-white/10",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {refreshing && (
            <div className="flex items-center gap-2 border-b border-black/5 px-5 py-2 text-xs iq-muted dark:border-white/10" data-testid="analytics-refreshing">
              <Loader2 size={13} className="animate-spin" /> Updating…
            </div>
          )}

          <div className="relative max-h-[560px] overflow-auto" data-testid="analytics-table-wrap">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                {/* Column names + sort */}
                <tr className="bg-white/95 backdrop-blur dark:bg-[#121319]/95">
                  {table.getHeaderGroups()[0]?.headers.map((header, idx) => {
                    const meta = columnsMeta[idx];
                    const isSorted = header.column.getIsSorted();
                    const Icon = !isSorted ? ArrowUpDown : isSorted === "asc" ? ArrowUp : ArrowDown;
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className={cn(
                          "border-b border-black/5 px-4 py-3 text-left align-bottom dark:border-white/10",
                          meta?.dtype === "numeric" ? "text-right" : "text-left"
                        )}
                      >
                        <div className={cn("flex flex-col gap-1.5", meta?.dtype === "numeric" ? "items-end" : "items-start")}>
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className={cn(
                              "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-ink dark:hover:text-white",
                              isSorted ? "text-ink dark:text-white" : "iq-muted",
                              meta?.dtype === "numeric" ? "flex-row-reverse" : ""
                            )}
                            data-testid={`col-header-${meta?.name}`}
                          >
                            {header.column.columnDef.header as string}
                            <Icon size={11} className={isSorted ? "text-brand-600 dark:text-brand-400" : "opacity-60"} />
                          </button>
                          {meta && <DTypeChip dtype={meta.dtype} />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                {/* Per-column filter inputs */}
                <tr className="bg-white/95 backdrop-blur dark:bg-[#121319]/95">
                  {columnsMeta.map((col) => (
                    <th
                      key={`f-${col.name}`}
                      className="border-b border-black/5 px-4 pb-2 pt-0 dark:border-white/10"
                    >
                      <input
                        type="text"
                        value={filters[col.name] ?? ""}
                        onChange={(e) => setFilter(col.name, e.target.value)}
                        placeholder="Filter…"
                        data-testid={`col-filter-${col.name}`}
                        className="w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand-500 dark:border-white/10"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columnsMeta.length} className="px-4 py-16 text-center">
                      <p className="text-sm iq-muted" data-testid="analytics-empty">
                        No rows match the current filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition-colors",
                        i % 2 === 0 ? "bg-transparent" : "bg-black/[0.02] dark:bg-white/[0.02]",
                        "hover:bg-brand-50/60 dark:hover:bg-brand-500/[0.06]"
                      )}
                      data-testid={`analytics-row-${i}`}
                    >
                      {row.getVisibleCells().map((cell, j) => {
                        const meta = columnsMeta[j];
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "border-b border-black/5 px-4 py-2.5 dark:border-white/[0.06]",
                              meta?.dtype === "numeric" ? "text-right tabular-nums" : "text-left"
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>

        {/* Pagination footer */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-black/5 px-5 py-3 text-sm dark:border-white/10 md:flex-row md:items-center">
          <p className="iq-muted" data-testid="analytics-range">
            Showing <span className="text-ink dark:text-white">{rangeStart}</span> –{" "}
            <span className="text-ink dark:text-white">{rangeEnd}</span> of{" "}
            <span className="text-ink dark:text-white">{new Intl.NumberFormat().format(total)}</span>
          </p>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setPage(1)} disabled={page <= 1} testId="page-first"><ChevronsLeft size={14} /></PageBtn>
            <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} testId="page-prev"><ChevronLeft size={14} /></PageBtn>
            <span className="px-3 text-xs iq-muted tabular-nums" data-testid="page-indicator">
              Page {page} of {totalPages}
            </span>
            <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} testId="page-next"><ChevronRight size={14} /></PageBtn>
            <PageBtn onClick={() => setPage(totalPages)} disabled={page >= totalPages} testId="page-last"><ChevronsRight size={14} /></PageBtn>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PageBtn({
  onClick,
  disabled,
  testId,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 transition-colors dark:border-white/10",
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {children}
    </button>
  );
}
