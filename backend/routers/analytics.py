"""Analytics router — returns paginated rows from the active dataset.

Full sort/filter/search wiring will land in the next iteration; this stub
proves the endpoint contract used by the frontend TanStack table.
"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Query

from models.schemas import AnalyticsResponse
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: Literal["asc", "desc"] = "asc",
):
    df, path, is_sample = load_dataframe()
    total = len(df)

    if not df.empty:
        if search:
            mask = df.astype(str).apply(lambda col: col.str.contains(search, case=False, na=False)).any(axis=1)
            df = df[mask]
            total = len(df)
        if sort_by and sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=(sort_dir == "asc"))

        start = (page - 1) * page_size
        end = start + page_size
        page_df = df.iloc[start:end].fillna("")
        rows = page_df.to_dict(orient="records")
    else:
        rows = []

    return AnalyticsResponse(
        dataset=dataset_meta(path, df, is_sample),
        columns=list(df.columns.astype(str)),
        rows=rows,
        total=total,
    )
