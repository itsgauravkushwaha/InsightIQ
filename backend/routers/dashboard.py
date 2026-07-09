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
    ExecutiveInsights,
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
_DISCOUNT_COL = "Discount"


# Business thresholds used by _compute_insights. Kept as module-level
# constants so they're easy to tweak without touching insight logic.
_LOW_MARGIN_PCT = 20.0        # profit margin below this → flagged as risk
_HIGH_DISCOUNT_PCT = 12.0     # average discount above this → flagged as risk
_REGION_CONCENTRATION = 40.0  # top region share above this → concentration risk


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


def _compute_insights(
    df: pd.DataFrame,
    kpi: KpiSummary,
    categories: list[CategoryBreakdown],
    top_products: list[TopProduct],
) -> ExecutiveInsights:
    """Rule-based executive narratives derived from already-computed structures
    plus a few cheap extra groupbys (region, segment, per-category monthly).
    Every rule is optional — missing columns or empty data are skipped safely.
    """
    if df.empty:
        return ExecutiveInsights()

    # --- Extra aggregations (one pass each, no duplicates with _compute) ----
    region_rev: pd.Series = (
        df.groupby(_REGION_COL)[_REVENUE_COL].sum().sort_values(ascending=False)
        if _REGION_COL in df.columns and _REVENUE_COL in df.columns
        else pd.Series(dtype=float)
    )
    region_profit: pd.Series = (
        df.groupby(_REGION_COL)[_PROFIT_COL].sum().sort_values(ascending=False)
        if _REGION_COL in df.columns and _PROFIT_COL in df.columns
        else pd.Series(dtype=float)
    )
    segment_rev: pd.Series = (
        df.groupby(_SEGMENT_COL)[_REVENUE_COL].sum().sort_values(ascending=False)
        if _SEGMENT_COL in df.columns and _REVENUE_COL in df.columns
        else pd.Series(dtype=float)
    )
    avg_discount_pct: Optional[float] = (
        float(df[_DISCOUNT_COL].mean() * 100)
        if _DISCOUNT_COL in df.columns and not df[_DISCOUNT_COL].dropna().empty
        else None
    )

    # Per-category month-over-month movement (one groupby).
    cat_delta: dict[str, float] = {}
    if (
        _DATE_COL in df.columns
        and _CATEGORY_COL in df.columns
        and _REVENUE_COL in df.columns
    ):
        dates = pd.to_datetime(df[_DATE_COL], errors="coerce")
        work = df.assign(_p=dates.dt.to_period("M")).dropna(subset=["_p"])
        if not work.empty:
            pivot = (
                work.groupby(["_p", _CATEGORY_COL])[_REVENUE_COL]
                .sum()
                .unstack(fill_value=0.0)
                .sort_index()
            )
            if len(pivot) >= 2:
                cur, prev = pivot.iloc[-1], pivot.iloc[-2]
                for cat in pivot.columns:
                    cat_delta[str(cat)] = _pct_delta(float(cur[cat]), float(prev[cat]))

    # ------------------------------ Executive Summary --------------------------
    summary: list[str] = []
    if kpi.revenue > 0:
        if kpi.revenue_delta_pct > 0:
            summary.append(f"Revenue is up {kpi.revenue_delta_pct:.1f}% vs the previous month.")
        elif kpi.revenue_delta_pct < 0:
            summary.append(f"Revenue is down {abs(kpi.revenue_delta_pct):.1f}% vs the previous month.")
        else:
            summary.append("Revenue is flat vs the previous month.")

    if categories:
        top_cat = categories[0]
        summary.append(
            f"{top_cat.category} is the highest revenue category, contributing "
            f"{top_cat.share * 100:.1f}% of total sales."
        )

    if not region_profit.empty:
        top_region = str(region_profit.index[0])
        summary.append(f"{top_region} region generated the highest profit.")

    if kpi.orders > 0:
        aov = kpi.revenue / kpi.orders
        # AOV month-over-month approximation using KPI deltas.
        aov_hint = ""
        if kpi.revenue_delta_pct != kpi.orders_delta_pct:
            aov_hint = " and improved" if kpi.revenue_delta_pct > kpi.orders_delta_pct else " and declined"
        summary.append(f"Average order value is {aov:,.0f}{aov_hint} month-over-month.")

    if top_products:
        summary.append(f"{top_products[0].product} is the best-selling product by revenue.")

    summary = summary[:5]

    # -------------------------------- Risks -----------------------------------
    risks: list[str] = []
    # Falling monthly sales
    if kpi.revenue_delta_pct < 0:
        risks.append(
            f"Monthly revenue fell {abs(kpi.revenue_delta_pct):.1f}% — review pricing and demand drivers."
        )
    # Declining category
    declining = sorted(
        [(c, d) for c, d in cat_delta.items() if d < -5.0],
        key=lambda x: x[1],
    )
    if declining:
        cat_name, cat_dec = declining[0]
        risks.append(f"{cat_name} revenue declined {abs(cat_dec):.1f}% month-over-month.")
    # Low profit margin
    if kpi.revenue > 0:
        margin = (kpi.profit / kpi.revenue) * 100
        if margin < _LOW_MARGIN_PCT:
            risks.append(
                f"Profit margin is thin at {margin:.1f}% — evaluate cost structure and discounting."
            )
    # High discount impact
    if avg_discount_pct is not None and avg_discount_pct > _HIGH_DISCOUNT_PCT:
        risks.append(
            f"Average discount is {avg_discount_pct:.1f}% — high discounts may be eroding margin."
        )
    # Region concentration
    if not region_rev.empty:
        total = float(region_rev.sum()) or 1.0
        top_share = float(region_rev.iloc[0]) / total * 100
        if top_share > _REGION_CONCENTRATION and len(region_rev) > 1:
            risks.append(
                f"{region_rev.index[0]} contributes {top_share:.0f}% of revenue — "
                "consider diversifying regional exposure."
            )
    risks = risks[:3]

    # ---------------------------- Opportunities -------------------------------
    opportunities: list[str] = []
    # Fast-growing category
    growing = sorted(
        [(c, d) for c, d in cat_delta.items() if d > 5.0],
        key=lambda x: -x[1],
    )
    if growing:
        cat_name, cat_grw = growing[0]
        opportunities.append(f"{cat_name} is up {cat_grw:.1f}% MoM — a candidate for expanded investment.")
    # High-performing region
    if not region_rev.empty:
        top_region = str(region_rev.index[0])
        opportunities.append(
            f"{top_region} leads regional revenue — a strong base for targeted campaigns."
        )
    # Strong customer segment
    if not segment_rev.empty:
        top_segment = str(segment_rev.index[0])
        opportunities.append(
            f"{top_segment} is the top-performing customer segment — focus retention here."
        )
    # Best-selling product
    if top_products:
        opportunities.append(
            f"{top_products[0].product} is the highest-revenue product — a natural cross-sell anchor."
        )
    opportunities = opportunities[:3]

    # --------------------------- Recommendations ------------------------------
    recommendations: list[str] = []
    if categories:
        recommendations.append(
            f"Increase inventory and merchandising for {categories[0].category} to protect top-line growth."
        )
    if avg_discount_pct is not None and avg_discount_pct > _HIGH_DISCOUNT_PCT:
        # Prefer low-margin category if we can identify one.
        low_margin_cat: Optional[str] = None
        if _CATEGORY_COL in df.columns and _REVENUE_COL in df.columns and _PROFIT_COL in df.columns:
            cat_margins = (
                df.groupby(_CATEGORY_COL)
                .apply(
                    lambda g: (g[_PROFIT_COL].sum() / g[_REVENUE_COL].sum() * 100)
                    if g[_REVENUE_COL].sum() > 0
                    else 100.0,
                    include_groups=False,
                )
                .sort_values()
            )
            if not cat_margins.empty:
                low_margin_cat = str(cat_margins.index[0])
        if low_margin_cat:
            recommendations.append(
                f"Reduce discount depth on {low_margin_cat} — margin pressure is the highest there."
            )
        else:
            recommendations.append("Review discount strategy — average promo depth is above healthy range.")
    if not region_rev.empty:
        recommendations.append(
            f"Concentrate marketing spend in {region_rev.index[0]} to compound its lead."
        )
    if top_products:
        recommendations.append(
            f"Promote {top_products[0].product} bundles to lift average order value."
        )
    recommendations = recommendations[:4]

    return ExecutiveInsights(
        executive_summary=summary,
        risks=risks,
        opportunities=opportunities,
        recommendations=recommendations,
    )


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
    insights = _compute_insights(filtered, kpi, category_revenue, top_products)

    return DashboardResponse(
        dataset=dataset_meta(path, filtered, is_sample),
        kpi=kpi,
        salesTrend=sales_trend,
        categoryRevenue=category_revenue,
        regions=[],
        topProducts=top_products,
        filters=filter_options,
        insights=insights,
    )
