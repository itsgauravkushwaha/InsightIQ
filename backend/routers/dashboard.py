"""Dashboard router — computes KPI summary from the active dataset.

Only the KPI block is populated in this iteration (per spec).
Trend/category/region/top_products remain empty until a later phase.
"""
from __future__ import annotations

import pandas as pd
from fastapi import APIRouter

from models.schemas import DashboardResponse, KpiSummary
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["dashboard"])


# Columns expected on the retail sample. Fallback logic below handles
# other datasets gracefully by returning zeros.
_REVENUE_COL = "Sales"
_PROFIT_COL = "Profit"
_ORDER_ID_COL = "Order ID"
_CUSTOMER_COL = "Customer Name"
_DATE_COL = "Order Date"


def _pct_delta(current: float, previous: float) -> float:
    """Return signed percentage change from previous → current."""
    if previous in (0, 0.0) or pd.isna(previous):
        return 0.0
    return round(((current - previous) / previous) * 100, 1)


def _compute_kpi(df: pd.DataFrame) -> KpiSummary:
    if df.empty or _DATE_COL not in df.columns:
        return KpiSummary()

    # Coerce types once.
    dates = pd.to_datetime(df[_DATE_COL], errors="coerce")
    working = df.assign(_period=dates.dt.to_period("M")).dropna(subset=["_period"])
    if working.empty:
        return KpiSummary()

    periods_sorted = working["_period"].sort_values().unique()
    current_period = periods_sorted[-1]
    previous_period = periods_sorted[-2] if len(periods_sorted) >= 2 else None

    cur = working[working["_period"] == current_period]
    prev = working[working["_period"] == previous_period] if previous_period is not None else working.iloc[0:0]

    def _sum(frame: pd.DataFrame, col: str) -> float:
        return float(frame[col].sum()) if col in frame.columns else 0.0

    def _orders(frame: pd.DataFrame) -> int:
        if _ORDER_ID_COL in frame.columns:
            return int(frame[_ORDER_ID_COL].nunique())
        return int(len(frame))

    def _customers(frame: pd.DataFrame) -> int:
        if _CUSTOMER_COL in frame.columns:
            return int(frame[_CUSTOMER_COL].nunique())
        return 0

    revenue_cur, revenue_prev = _sum(cur, _REVENUE_COL), _sum(prev, _REVENUE_COL)
    profit_cur, profit_prev = _sum(cur, _PROFIT_COL), _sum(prev, _PROFIT_COL)
    orders_cur, orders_prev = _orders(cur), _orders(prev)
    customers_cur, customers_prev = _customers(cur), _customers(prev)

    return KpiSummary(
        revenue=round(revenue_cur, 2),
        profit=round(profit_cur, 2),
        orders=orders_cur,
        customers=customers_cur,
        revenue_delta_pct=_pct_delta(revenue_cur, revenue_prev),
        profit_delta_pct=_pct_delta(profit_cur, profit_prev),
        orders_delta_pct=_pct_delta(orders_cur, orders_prev),
        customers_delta_pct=_pct_delta(customers_cur, customers_prev),
    )


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    df, path, is_sample = load_dataframe()
    return DashboardResponse(
        dataset=dataset_meta(path, df, is_sample),
        kpi=_compute_kpi(df),
        trend=[],
        categories=[],
        regions=[],
        top_products=[],
    )
