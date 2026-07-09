"""Resolves the "active" dataset used by the analytics endpoints.

Rules
-----
1. The active dataset is whichever file the user most recently uploaded
   to `backend/uploads/`. If no user upload exists, the packaged
   sample_retail_sales.csv is used automatically.
2. This module purposely avoids caching parsed DataFrames — analytics
   endpoints are cheap on our expected volumes (<= tens of thousands
   of rows) and staying stateless keeps deployment trivial.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
SAMPLE_FILENAME = "sample_retail_sales.csv"

SUPPORTED_EXTS = {".csv", ".xlsx", ".xls"}


def _sample_path() -> Path:
    return UPLOAD_DIR / SAMPLE_FILENAME


def _list_user_uploads() -> list[Path]:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return sorted(
        (p for p in UPLOAD_DIR.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS and p.name != SAMPLE_FILENAME),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )


def resolve_active_file() -> Tuple[Path, bool]:
    """Return (path, is_sample). Falls back to the sample dataset."""
    for candidate in _list_user_uploads():
        return candidate, False
    return _sample_path(), True


def load_dataframe(path: Optional[Path] = None) -> Tuple[pd.DataFrame, Path, bool]:
    """Load the active (or provided) file into a DataFrame."""
    if path is None:
        path, is_sample = resolve_active_file()
    else:
        is_sample = path.name == SAMPLE_FILENAME

    if not path.exists():
        # Return an empty frame with no columns so downstream code can
        # short-circuit safely with a helpful metadata payload.
        return pd.DataFrame(), path, is_sample

    ext = path.suffix.lower()
    if ext == ".csv":
        df = pd.read_csv(path)
    else:
        df = pd.read_excel(path)

    return df, path, is_sample


def dataset_meta(path: Path, df: pd.DataFrame, is_sample: bool) -> dict:
    stat = path.stat() if path.exists() else None
    uploaded_at = (
        datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
        if stat
        else datetime.now(timezone.utc).isoformat()
    )
    return {
        "filename": path.name,
        "rows": int(len(df)),
        "columns": list(df.columns.astype(str)),
        "uploaded_at": uploaded_at,
        "is_sample": is_sample,
    }


def clear_user_uploads() -> int:
    """Delete every user-uploaded file (keeps the sample intact)."""
    removed = 0
    for p in _list_user_uploads():
        try:
            os.remove(p)
            removed += 1
        except OSError:
            continue
    return removed
