"""Load the Zomato dataset from Hugging Face."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
from huggingface_hub import hf_hub_download

from src.config import Settings, get_settings

logger = logging.getLogger(__name__)

# Columns needed for preprocessing / recommendations.
# Large text fields (reviews_list, menu_item) are intentionally excluded.
REQUIRED_SOURCE_COLUMNS = (
    "name",
    "location",
    "cuisines",
    "rate",
    "votes",
    "approx_cost(for two people)",
    "rest_type",
    "listed_in(city)",
)

OPTIONAL_SOURCE_COLUMNS = (
    "url",
    "address",
    "online_order",
    "book_table",
    "dish_liked",
    "listed_in(type)",
)

SOURCE_CSV_FILENAME = "zomato.csv"
SLIM_CACHE_FILENAME = "zomato_bangalore_raw.csv"


def _usecols_for_file(csv_path: Path) -> list[str]:
    header = pd.read_csv(csv_path, nrows=0).columns.tolist()
    missing = [c for c in REQUIRED_SOURCE_COLUMNS if c not in header]
    if missing:
        raise ValueError(
            "Dataset schema mismatch. Missing required columns: "
            f"{missing}. Found columns: {header}"
        )
    keep = [c for c in REQUIRED_SOURCE_COLUMNS if c in header]
    keep += [c for c in OPTIONAL_SOURCE_COLUMNS if c in header]
    return keep


def _select_columns(frame: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in REQUIRED_SOURCE_COLUMNS if c not in frame.columns]
    if missing:
        raise ValueError(
            "Dataset schema mismatch. Missing required columns: "
            f"{missing}. Found columns: {list(frame.columns)}"
        )
    keep = [c for c in REQUIRED_SOURCE_COLUMNS if c in frame.columns]
    keep += [c for c in OPTIONAL_SOURCE_COLUMNS if c in frame.columns]
    return frame.loc[:, keep].copy()


def download_source_csv(settings: Settings | None = None) -> Path:
    """Download the source CSV from the Hugging Face dataset repo."""
    settings = settings or get_settings()
    settings.raw_data_dir.mkdir(parents=True, exist_ok=True)

    logger.info(
        "Downloading %s from Hugging Face dataset %s",
        SOURCE_CSV_FILENAME,
        settings.hf_dataset_id,
    )
    downloaded = hf_hub_download(
        repo_id=settings.hf_dataset_id,
        filename=SOURCE_CSV_FILENAME,
        repo_type="dataset",
        local_dir=str(settings.raw_data_dir / "hf_download"),
    )
    return Path(downloaded)


def load_raw_dataframe(
    settings: Settings | None = None,
    *,
    cache_csv: bool = True,
) -> pd.DataFrame:
    """
    Load the configured Hugging Face Zomato CSV as a slim pandas DataFrame.

    Only recommendation-relevant columns are read (reviews/menus skipped).
    Optionally writes a slim CSV cache under ``data/raw/``.
    """
    settings = settings or get_settings()
    raw_dir = settings.raw_data_dir
    raw_dir.mkdir(parents=True, exist_ok=True)

    cache_path = raw_dir / SLIM_CACHE_FILENAME
    if cache_csv and cache_path.exists():
        logger.info("Loading slim raw cache from %s", cache_path)
        frame = pd.read_csv(cache_path)
        return _select_columns(frame)

    source_csv = download_source_csv(settings)
    usecols = _usecols_for_file(source_csv)
    logger.info("Reading columns %s from %s", usecols, source_csv)
    frame = pd.read_csv(source_csv, usecols=usecols)
    frame = _select_columns(frame)

    if cache_csv:
        frame.to_csv(cache_path, index=False)
        logger.info("Wrote slim raw cache to %s (%s rows)", cache_path, len(frame))

    return frame


def load_dataset(settings: Settings | None = None) -> pd.DataFrame:
    """Public entry used by preprocessing."""
    return load_raw_dataframe(settings=settings, cache_csv=True)


def raw_cache_path(settings: Settings | None = None) -> Path:
    settings = settings or get_settings()
    return settings.raw_data_dir / SLIM_CACHE_FILENAME
