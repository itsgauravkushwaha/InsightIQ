"""Dashboard router — computes KPI + Sales Trend + Category Revenue.

A single monthly groupby is reused across the KPI block and the Sales
Trend chart so we never recompute the same aggregation twice.
"""
from __future__ import annotations

import pandas as pd
from fastapi import APIRouter

from models.schemas import (
    CategoryBreakdown,
    DashboardResponse,
    KpiSummary,
    TrendPoint,
)
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["dashboard"])


# Retail-sample columns. Missing columns degrade to zeros / empties.
_REVENUE_COL = "Sales"
_PROFIT_COL = "Profit"
_ORDER_ID_COL = "Order ID"
_CUSTOMER_COL = "Customer Name"
_DATE_COL = "Order Date"
_CATEGORY_COL = "Product Category"


def _pct_delta(current: float, previous: float) -> float:
    if previous in (0, 0.0) or pd.isna(previous):
        return 0.0
    return round(((current - previous) / previous) * 100, 1)


def _compute(df: pd.DataFrame) -> tuple[KpiSummary, list[TrendPoint], list[CategoryBreakdown]]:
    """Return (kpi, salesTrend, categoryRevenue) from one pass over the data."""
    if df.empty or _DATE_COL not in df.columns:
        return KpiSummary(), [], []

    dates = pd.to_datetime(df[_DATE_COL], errors="coerce")
    working = df.assign(_period=dates.dt.to_period("M")).dropna(subset=["_period"])
    if working.empty:
        return KpiSummary(), [], []

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

    # Sales trend = every month present, formatted as YYYY-MM-01.
    trend: list[TrendPoint] = [
        TrendPoint(
            date=period.to_timestamp().date().isoformat(),
            revenue=round(float(row.get("revenue", 0.0)), 2),
            profit=round(float(row.get("profit", 0.0)), 2),
        )
        for period, row in monthly.iterrows()
    ]

    # Category revenue — independent groupby, one pass.
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

    return kpi, trend, categories


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    df, path, is_sample = load_dataframe()
    kpi, sales_trend, category_revenue = _compute(df)
    return DashboardResponse(
        dataset=dataset_meta(path, df, is_sample),
        kpi=kpi,
        salesTrend=sales_trend,
        categoryRevenue=category_revenue,
        regions=[],
        top_products=[],
    )
