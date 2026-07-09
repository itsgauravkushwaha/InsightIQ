"""Upload router — accepts CSV/Excel uploads and persists them to /uploads.

Actual preview/validation logic will be fleshed out in the next iteration.
For now the endpoint accepts the file, saves it, and returns dataset meta.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from models.schemas import UploadResponse, ValidationReport
from services.data_loader import UPLOAD_DIR, dataset_meta, load_dataframe

router = APIRouter(tags=["upload"])

ALLOWED_EXT = {".csv", ".xlsx", ".xls"}
MAX_BYTES = 25 * 1024 * 1024  # 25MB — plenty for portfolio-scale files


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Use CSV or Excel.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = UPLOAD_DIR / filename

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 25MB.")
    dest.write_bytes(contents)

    df, path, is_sample = load_dataframe(dest)
    meta = dataset_meta(path, df, is_sample)
    preview = df.head(10).fillna("").to_dict(orient="records") if not df.empty else []
    return {
        "dataset": meta,
        "preview": preview,
        "validation": ValidationReport(ok=True).model_dump(),
    }
