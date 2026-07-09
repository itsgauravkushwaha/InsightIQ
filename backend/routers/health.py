"""Health check router — used by uptime pings and the frontend boot check."""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok", "service": "insightiq-api"}


@router.get("/")
def root():
    return {"service": "InsightIQ API", "docs": "/docs", "health": "/api/health"}
