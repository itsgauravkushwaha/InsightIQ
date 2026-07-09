// Central TypeScript types shared across services and pages.

export interface KpiSummary {
  revenue: number;
  profit: number;
  orders: number;
  customers: number;
  revenue_delta_pct: number;
  profit_delta_pct: number;
  orders_delta_pct: number;
  customers_delta_pct: number;
}

export interface TrendPoint {
  date: string; // ISO date
  revenue: number;
  profit: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  share: number; // 0..1
}

export interface RegionBreakdown {
  region: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product: string;
  category: string;
  revenue: number;
  quantity: number;
}

export interface DashboardResponse {
  dataset: DatasetMeta;
  kpi: KpiSummary;
  salesTrend: TrendPoint[];
  categoryRevenue: CategoryBreakdown[];
  regions: RegionBreakdown[];
  top_products: TopProduct[];
}

export interface DatasetMeta {
  filename: string;
  rows: number;
  columns: string[];
  uploaded_at: string;
  is_sample: boolean;
}

export interface AnalyticsRow {
  [key: string]: string | number | null;
}

export interface AnalyticsResponse {
  dataset: DatasetMeta;
  columns: string[];
  rows: AnalyticsRow[];
  total: number;
}

export interface InsightsResponse {
  dataset: DatasetMeta;
  executive_summary: string[];
  risks: InsightItem[];
  opportunities: InsightItem[];
  recommendations: InsightItem[];
}

export interface InsightItem {
  title: string;
  detail: string;
  severity?: "low" | "medium" | "high";
}

export interface UploadResponse {
  dataset: DatasetMeta;
  preview: AnalyticsRow[];
  validation: {
    ok: boolean;
    warnings: string[];
    errors: string[];
  };
}
