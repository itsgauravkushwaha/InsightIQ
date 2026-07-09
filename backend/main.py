"""InsightIQ FastAPI application entrypoint.

The app is intentionally database-free — all analytics run against the
active CSV/Excel file inside `backend/uploads/`. See services/data_loader
for how the "active" dataset is resolved.
"""
from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from routers import analytics, dashboard, dataset, health, insights, upload

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("insightiq")


def create_app() -> FastAPI:
    application = FastAPI(
        title="InsightIQ API",
        version="0.1.0",
        description="File-based analytics API. No database required.",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # All routers are mounted under /api so they play well with the
    # Kubernetes ingress that forwards /api → backend.
    application.include_router(health.router, prefix="/api")
    application.include_router(dataset.router, prefix="/api")
    application.include_router(upload.router, prefix="/api")
    application.include_router(dashboard.router, prefix="/api")
    application.include_router(analytics.router, prefix="/api")
    application.include_router(insights.router, prefix="/api")

    return application


app = create_app()
