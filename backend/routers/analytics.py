"""Analytics router — paginated rows + column typing + summary stats.

Accepts search, sort, per-column filters, page + page_size. Reuses the
existing data_loader so no new loading logic is introduced.
"""
from __future__ import annotations

import json
import math
from typing import Literal, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from models.schemas import AnalyticsResponse, AnalyticsSummary, ColumnMeta
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["analytics"])


# --------------------------------- Helpers --------------------------------- #

def _detect_column_type(series: pd.Series) -> Literal["date", "numeric", "category", "text"]:
    """Best-effort type inference used to badge columns in the UI."""
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_bool_dtype(series):
        return "category"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    # Object columns: try a small parse sample as date, then fall back to
    # category/text based on cardinality.
    sample = series.dropna().astype(str).head(60)
    if not sample.empty:
        # Skip pure-numeric strings — otherwise "12345" would be parsed as a
        # POSIX date. Only try date parse when there's a separator.
        looks_like_date = sample.str.contains(r"[-/:T\s]").mean() > 0.5
        if looks_like_date:
            parsed = pd.to_datetime(sample, errors="coerce")
            if parsed.notna().mean() >= 0.85:
                return "date"

    non_null = series.dropna()
    if non_null.empty:
        return "text"
    nunique = int(non_null.nunique())
    ratio = nunique / len(non_null)
    if nunique <= 25 or ratio < 0.1:
        return "category"
    return "text"


def _build_columns(df: pd.DataFrame) -> list[ColumnMeta]:
    out: list[ColumnMeta] = []
    for col in df.columns:
        series = df[col]
        out.append(
            ColumnMeta(
                name=str(col),
                dtype=_detect_column_type(series),
                missing=int(series.isna().sum()),
                unique=int(series.nunique(dropna=True)),
            )
        )
    return out


def _build_summary(df: pd.DataFrame, columns: list[ColumnMeta]) -> AnalyticsSummary:
    return AnalyticsSummary(
        total_rows=int(len(df)),
        total_columns=int(len(df.columns)),
        numeric_columns=sum(1 for c in columns if c.dtype == "numeric"),
        categorical_columns=sum(1 for c in columns if c.dtype == "category"),
        date_columns=sum(1 for c in columns if c.dtype == "date"),
        text_columns=sum(1 for c in columns if c.dtype == "text"),
        missing_values=int(df.isna().sum().sum()) if not df.empty else 0,
        duplicate_rows=int(df.duplicated().sum()) if not df.empty else 0,
    )


def _apply_filters(df: pd.DataFrame, filters: dict[str, str]) -> pd.DataFrame:
    """Case-insensitive substring match per column."""
    if not filters or df.empty:
        return df
    out = df
    for col, needle in filters.items():
        if not needle or col not in out.columns:
            continue
        out = out[out[col].astype(str).str.contains(str(needle), case=False, na=False)]
    return out


def _sanitize_rows(df: pd.DataFrame) -> list[dict]:
    """JSON-safe row records. Replaces NaN with '', ensures Python primitives."""
    if df.empty:
        return []
    safe = df.replace({np.nan: None}).where(df.notna(), None)
    # Convert datetime columns to ISO strings for stable JSON.
    for col in safe.columns:
        if pd.api.types.is_datetime64_any_dtype(safe[col]):
            safe[col] = safe[col].astype(str)
    records = safe.to_dict(orient="records")
    # None → "" for cleaner display; numeric NaN already handled.
    return [{k: ("" if v is None else v) for k, v in row.items()} for row in records]


# ---------------------------------- Route ---------------------------------- #

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: Literal["asc", "desc"] = "asc",
    filters: Optional[str] = Query(None, description='JSON object of {column: value} filters'),
):
    df, path, is_sample = load_dataframe()

    # Column metadata + summary are always calculated from the FULL dataset
    # so the summary strip and dtype chips remain stable while filtering.
    all_columns = _build_columns(df)
    summary = _build_summary(df, all_columns)

    filter_map: dict[str, str] = {}
    if filters:
        try:
            parsed = json.loads(filters)
            if isinstance(parsed, dict):
                filter_map = {str(k): str(v) for k, v in parsed.items() if v not in (None, "")}
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="`filters` must be valid JSON")

    work = df
    if not work.empty:
        if search:
            mask = work.astype(str).apply(
                lambda col: col.str.contains(search, case=False, na=False)
            ).any(axis=1)
            work = work[mask]
        work = _apply_filters(work, filter_map)
        if sort_by and sort_by in work.columns:
            work = work.sort_values(
                by=sort_by,
                ascending=(sort_dir == "asc"),
                kind="mergesort",
                na_position="last",
            )

    total = int(len(work))
    total_pages = max(1, math.ceil(total / page_size)) if total else 1
    page = min(page, total_pages)
    start = (page - 1) * page_size
    end = start + page_size

    return AnalyticsResponse(
        dataset=dataset_meta(path, df, is_sample),
        columns=all_columns,
        rows=_sanitize_rows(work.iloc[start:end]),
        total=total,
        summary=summary,
    )
