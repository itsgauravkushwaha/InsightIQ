"""Dashboard router — placeholder that returns dataset metadata with empty widgets.

Full aggregation logic (Pandas groupby, deltas vs prior period, top products, etc.)
will be added in the next iteration.
"""
from fastapi import APIRouter

from models.schemas import DashboardResponse, KpiSummary
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    df, path, is_sample = load_dataframe()
    return DashboardResponse(
        dataset=dataset_meta(path, df, is_sample),
        kpi=KpiSummary(),
        trend=[],
        categories=[],
        regions=[],
        top_products=[],
    )
