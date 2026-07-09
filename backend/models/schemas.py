"""Pydantic response schemas shared across routers.

Kept intentionally flat — routers stay skinny and services return dicts
that match these shapes.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class DatasetMeta(BaseModel):
    filename: str
    rows: int
    columns: List[str]
    uploaded_at: str
    is_sample: bool = True


class KpiSummary(BaseModel):
    revenue: float = 0.0
    profit: float = 0.0
    orders: int = 0
    customers: int = 0
    revenue_delta_pct: float = 0.0
    profit_delta_pct: float = 0.0
    orders_delta_pct: float = 0.0
    customers_delta_pct: float = 0.0


class TrendPoint(BaseModel):
    date: str
    revenue: float
    profit: float


class CategoryBreakdown(BaseModel):
    category: str
    revenue: float
    share: float


class RegionBreakdown(BaseModel):
    region: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    product: str
    category: str
    revenue: float
    profit: float
    quantity: int


class DashboardFilterOptions(BaseModel):
    regions: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    segments: List[str] = Field(default_factory=list)
    date_min: Optional[str] = None
    date_max: Optional[str] = None


class ExecutiveInsights(BaseModel):
    executive_summary: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    dataset: DatasetMeta
    kpi: KpiSummary
    salesTrend: List[TrendPoint] = Field(default_factory=list)
    categoryRevenue: List[CategoryBreakdown] = Field(default_factory=list)
    regions: List[RegionBreakdown] = Field(default_factory=list)
    topProducts: List[TopProduct] = Field(default_factory=list)
    filters: DashboardFilterOptions = Field(default_factory=DashboardFilterOptions)
    insights: ExecutiveInsights = Field(default_factory=ExecutiveInsights)


class AnalyticsResponse(BaseModel):
    dataset: DatasetMeta
    columns: List[str]
    rows: List[dict]
    total: int


class InsightItem(BaseModel):
    title: str
    detail: str
    severity: Optional[Literal["low", "medium", "high"]] = None


class InsightsResponse(BaseModel):
    dataset: DatasetMeta
    executive_summary: List[str]
    risks: List[InsightItem]
    opportunities: List[InsightItem]
    recommendations: List[InsightItem]


class ValidationReport(BaseModel):
    ok: bool
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    dataset: DatasetMeta
    preview: List[dict]
    validation: ValidationReport
