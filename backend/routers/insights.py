"""AI Insights router — placeholder narratives.

The next iteration will replace these hard-coded strings with rule-based
narratives derived from the active dataset (Pandas aggregations).
"""
from fastapi import APIRouter

from models.schemas import InsightItem, InsightsResponse
from services.data_loader import dataset_meta, load_dataframe

router = APIRouter(tags=["insights"])


@router.get("/insights", response_model=InsightsResponse)
def get_insights():
    df, path, is_sample = load_dataframe()
    return InsightsResponse(
        dataset=dataset_meta(path, df, is_sample),
        executive_summary=[
            "Dataset loaded successfully — full insight generation ships in the next iteration.",
        ],
        risks=[InsightItem(title="Pending analysis", detail="Risk detection will be wired next.", severity="low")],
        opportunities=[InsightItem(title="Pending analysis", detail="Opportunity mining will be wired next.")],
        recommendations=[InsightItem(title="Pending analysis", detail="Recommendations will be wired next.")],
    )
