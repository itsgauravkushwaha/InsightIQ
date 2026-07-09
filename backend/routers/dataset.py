"""Dataset metadata + reset endpoints."""
from fastapi import APIRouter

from models.schemas import DatasetMeta
from services.data_loader import (
    clear_user_uploads,
    dataset_meta,
    load_dataframe,
    resolve_active_file,
)

router = APIRouter(tags=["dataset"])


@router.get("/dataset", response_model=DatasetMeta)
def get_dataset():
    df, path, is_sample = load_dataframe()
    return dataset_meta(path, df, is_sample)


@router.post("/dataset/reset", response_model=DatasetMeta)
def reset_dataset():
    """Delete user uploads and fall back to the packaged sample dataset."""
    clear_user_uploads()
    path, is_sample = resolve_active_file()
    df, _, _ = load_dataframe(path)
    return dataset_meta(path, df, is_sample)
