"""Dashboard router — KPIs, Sales Trend, Category Revenue, Top Products.

Filter parameters (all optional) narrow the working DataFrame before any
aggregation. `filters` in the response always reflects the FULL dataset
so dropdown options stay stable while filters are being applied.
"""
from __future__ import annotations

from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from models.schemas import (
    CategoryBreakdown,
    DashboardFilterOptions,
    DashboardResponse,
    KpiSummary,
    TopProduct,
    TrendPoint,
)
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["dashboard"])


_REVENUE_COL = "Sales"
_PROFIT_COL = "Profit"
_ORDER_ID_COL = "Order ID"
_CUSTOMER_COL = "Customer Name"
_DATE_COL = "Order Date"
_CATEGORY_COL = "Product Category"
_REGION_COL = "Region"
_SEGMENT_COL = "Customer Segment"
_PRODUCT_COL = "Product Name"
_QTY_COL = "Quantity"


def _pct_delta(current: float, previous: float) -> float:
    if previous in (0, 0.0) or pd.isna(previous):
        return 0.0
    return round(((current - previous) / previous) * 100, 1)


def _sorted_unique(df: pd.DataFrame, col: str) -> list[str]:
    if col not in df.columns:
        return []
    return sorted(str(v) for v in df[col].dropna().unique())


def _build_filter_options(df: pd.DataFrame) -> DashboardFilterOptions:
    date_min = date_max = None
    if _DATE_COL in df.columns:
        dates = pd.to_datetime(df[_DATE_COL], errors="coerce").dropna()
        if not dates.empty:
            date_min = dates.min().date().isoformat()
            date_max = dates.max().date().isoformat()
    return DashboardFilterOptions(
        regions=_sorted_unique(df, _REGION_COL),
        categories=_sorted_unique(df, _CATEGORY_COL),
        segments=_sorted_unique(df, _SEGMENT_COL),
        date_min=date_min,
        date_max=date_max,
    )


def _apply_filters(
    df: pd.DataFrame,
    *,
    date_from: Optional[str],
    date_to: Optional[str],
    region: Optional[str],
    category: Optional[str],
    segment: Optional[str],
) -> pd.DataFrame:
    """Return a filtered copy of df. Missing columns short-circuit safely."""
    if df.empty:
        return df

    out = df
    if _DATE_COL in out.columns and (date_from or date_to):
        dates = pd.to_datetime(out[_DATE_COL], errors="coerce")
        mask = pd.Series(True, index=out.index)
        if date_from:
            mask &= dates >= pd.to_datetime(date_from, errors="coerce")
        if date_to:
            mask &= dates <= pd.to_datetime(date_to, errors="coerce")
        out = out[mask.fillna(False)]

    if region and _REGION_COL in out.columns:
        out = out[out[_REGION_COL].astype(str) == region]
    if category and _CATEGORY_COL in out.columns:
        out = out[out[_CATEGORY_COL].astype(str) == category]
    if segment and _SEGMENT_COL in out.columns:
        out = out[out[_SEGMENT_COL].astype(str) == segment]
    return out


def _compute(df: pd.DataFrame) -> tuple[
    KpiSummary,
    list[TrendPoint],
    list[CategoryBreakdown],
    list[TopProduct],
]:
    """Return (kpi, salesTrend, categoryRevenue, topProducts) from one pass."""
    if df.empty or _DATE_COL not in df.columns:
        return KpiSummary(), [], [], _compute_top_products(df)

    dates = pd.to_datetime(df[_DATE_COL], errors="coerce")
    working = df.assign(_period=dates.dt.to_period("M")).dropna(subset=["_period"])
    if working.empty:
        return KpiSummary(), [], [], _compute_top_products(df)

    # Single monthly aggregation reused by KPI + trend.
    agg_spec = {}
    if _REVENUE_COL in working.columns:
        agg_spec["revenue"] = (_REVENUE_COL, "sum")
    if _PROFIT_COL in working.columns:
        agg_spec["profit"] = (_PROFIT_COL, "sum")
    if _ORDER_ID_COL in working.columns:
        agg_spec["orders"] = (_ORDER_ID_COL, "nunique")
    if _CUSTOMER_COL in working.columns:
        agg_spec["customers"] = (_CUSTOMER_COL, "nunique")

    monthly = working.groupby("_period").agg(**agg_spec).sort_index()

    def _val(period, col: str, default: float | int = 0) -> float:
        if col not in monthly.columns or period is None or period not in monthly.index:
            return default
        return monthly.loc[period, col]

    periods = list(monthly.index)
    current = periods[-1]
    previous = periods[-2] if len(periods) >= 2 else None

    kpi = KpiSummary(
        revenue=round(float(_val(current, "revenue")), 2),
        profit=round(float(_val(current, "profit")), 2),
        orders=int(_val(current, "orders")),
        customers=int(_val(current, "customers")),
        revenue_delta_pct=_pct_delta(float(_val(current, "revenue")), float(_val(previous, "revenue"))),
        profit_delta_pct=_pct_delta(float(_val(current, "profit")), float(_val(previous, "profit"))),
        orders_delta_pct=_pct_delta(float(_val(current, "orders")), float(_val(previous, "orders"))),
        customers_delta_pct=_pct_delta(float(_val(current, "customers")), float(_val(previous, "customers"))),
    )

    trend: list[TrendPoint] = [
        TrendPoint(
            date=period.to_timestamp().date().isoformat(),
            revenue=round(float(row.get("revenue", 0.0)), 2),
            profit=round(float(row.get("profit", 0.0)), 2),
        )
        for period, row in monthly.iterrows()
    ]

    categories: list[CategoryBreakdown] = []
    if _CATEGORY_COL in working.columns and _REVENUE_COL in working.columns:
        cat_series = (
            working.groupby(_CATEGORY_COL)[_REVENUE_COL]
            .sum()
            .sort_values(ascending=False)
        )
        total = float(cat_series.sum()) or 1.0
        categories = [
            CategoryBreakdown(
                category=str(name),
                revenue=round(float(value), 2),
                share=round(float(value) / total, 4),
            )
            for name, value in cat_series.items()
        ]

    return kpi, trend, categories, _compute_top_products(working)


def _compute_top_products(df: pd.DataFrame, limit: int = 10) -> list[TopProduct]:
    if df.empty or _PRODUCT_COL not in df.columns:
        return []
    agg_spec: dict = {}
    if _REVENUE_COL in df.columns:
        agg_spec["revenue"] = (_REVENUE_COL, "sum")
    if _PROFIT_COL in df.columns:
        agg_spec["profit"] = (_PROFIT_COL, "sum")
    if _QTY_COL in df.columns:
        agg_spec["quantity"] = (_QTY_COL, "sum")

    # Category is a "first" pick — retail sample has 1 product → 1 category.
    if _CATEGORY_COL in df.columns:
        agg_spec["category"] = (_CATEGORY_COL, "first")

    if not agg_spec:
        return []

    grouped = df.groupby(_PRODUCT_COL).agg(**agg_spec)
    if "revenue" in grouped.columns:
        grouped = grouped.sort_values("revenue", ascending=False)
    grouped = grouped.head(limit).reset_index()

    out: list[TopProduct] = []
    for _, row in grouped.iterrows():
        out.append(
            TopProduct(
                product=str(row.get(_PRODUCT_COL, "")),
                category=str(row.get("category", "")),
                revenue=round(float(row.get("revenue", 0.0) or 0.0), 2),
                profit=round(float(row.get("profit", 0.0) or 0.0), 2),
                quantity=int(row.get("quantity", 0) or 0),
            )
        )
    return out


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    date_from: Optional[str] = Query(None, description="ISO date lower bound (inclusive)"),
    date_to: Optional[str] = Query(None, description="ISO date upper bound (inclusive)"),
    region: Optional[str] = None,
    category: Optional[str] = None,
    segment: Optional[str] = None,
):
    df, path, is_sample = load_dataframe()

    # Filter options always reflect the FULL dataset so the dropdowns
    # remain stable even after selecting a filter.
    filter_options = _build_filter_options(df)

    filtered = _apply_filters(
        df,
        date_from=date_from,
        date_to=date_to,
        region=region,
        category=category,
        segment=segment,
    )
    kpi, sales_trend, category_revenue, top_products = _compute(filtered)

    return DashboardResponse(
        dataset=dataset_meta(path, filtered, is_sample),
        kpi=kpi,
        salesTrend=sales_trend,
        categoryRevenue=category_revenue,
        regions=[],
        topProducts=top_products,
        filters=filter_options,
    )
