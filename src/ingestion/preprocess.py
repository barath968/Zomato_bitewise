"""Clean and normalize restaurant records; write the processed store."""

from __future__ import annotations

import argparse
import json
import logging
import re
from pathlib import Path

import pandas as pd

from src.config import Settings, get_settings
from src.ingestion.load_dataset import load_raw_dataframe

logger = logging.getLogger(__name__)

# INR cost-for-two thresholds (documented in docs/data-dictionary.md)
BUDGET_LOW_MAX = 500.0
BUDGET_MEDIUM_MAX = 1000.0

PROCESSED_COLUMNS = (
    "id",
    "name",
    "location",
    "cuisines",
    "rating",
    "votes",
    "approx_cost",
    "budget_bucket",
    "rest_type",
    "listed_in_city",
)


def normalize_text(value: object) -> str:
    """Trim and collapse whitespace; return empty string for nulls."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_cuisines(value: object) -> str:
    """Normalize cuisine list: trim tokens, collapse spaces around commas."""
    text = normalize_text(value)
    if not text:
        return ""
    parts = [normalize_text(p) for p in text.split(",")]
    parts = [p for p in parts if p]
    return ", ".join(parts)


def parse_rating(value: object) -> float | None:
    """
    Parse Zomato-style ratings such as ``4.1/5``.

    Returns None for NEW, -, blank, or unparseable values.
    """
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        number = float(value)
        return number if 0.0 <= number <= 5.0 else None

    text = normalize_text(value)
    if not text:
        return None
    upper = text.upper()
    if upper in {"NEW", "-", "NAN", "NONE", "NULL"}:
        return None

    # Accept "4.1/5" or bare "4.1"
    match = re.match(r"^(\d+(?:\.\d+)?)\s*(?:/\s*5)?$", text)
    if not match:
        return None
    number = float(match.group(1))
    if number < 0.0 or number > 5.0:
        return None
    return number


def parse_cost(value: object) -> float | None:
    """Parse approx cost for two; strip commas and currency noise."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        number = float(value)
        return number if number >= 0 else None

    text = normalize_text(value)
    if not text:
        return None
    text = text.replace(",", "")
    text = re.sub(r"[^\d.]", "", text)
    if not text:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return number if number >= 0 else None


def budget_bucket(approx_cost: float) -> str:
    """Map numeric cost-for-two (INR) to low/medium/high."""
    if approx_cost < BUDGET_LOW_MAX:
        return "low"
    if approx_cost <= BUDGET_MEDIUM_MAX:
        return "medium"
    return "high"


def _make_id(name: str, location: str) -> str:
    key_name = re.sub(r"\s+", " ", name.strip().lower())
    key_loc = re.sub(r"\s+", " ", location.strip().lower())
    return f"{key_name}::{key_loc}"


def preprocess_dataframe(raw: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Transform raw Zomato rows into the processed restaurant schema.

    Returns (processed_frame, summary_stats).
    """
    before = len(raw)
    working = raw.copy()

    working["name"] = working["name"].map(normalize_text)
    working["location"] = working["location"].map(normalize_text)
    working["cuisines"] = working["cuisines"].map(normalize_cuisines)
    if "rest_type" in working.columns:
        working["rest_type"] = working["rest_type"].map(normalize_text)
    else:
        working["rest_type"] = ""
    if "listed_in(city)" in working.columns:
        working["listed_in_city"] = working["listed_in(city)"].map(normalize_text)
    else:
        working["listed_in_city"] = ""

    working["rating"] = working["rate"].map(parse_rating)
    working["approx_cost"] = working["approx_cost(for two people)"].map(parse_cost)
    working["votes"] = pd.to_numeric(working.get("votes"), errors="coerce").fillna(0).astype(int)

    dropped_missing = working[
        (working["name"] == "")
        | (working["location"] == "")
        | (working["cuisines"] == "")
    ]
    working = working.drop(index=dropped_missing.index)

    before_rating = len(working)
    working = working.dropna(subset=["rating"])
    dropped_rating = before_rating - len(working)

    before_cost = len(working)
    working = working.dropna(subset=["approx_cost"])
    dropped_cost = before_cost - len(working)

    working["budget_bucket"] = working["approx_cost"].map(budget_bucket)
    working["id"] = [
        _make_id(n, loc) for n, loc in zip(working["name"], working["location"], strict=True)
    ]

    # Deduplicate on name+location; keep highest votes then rating.
    before_dedupe = len(working)
    working = working.sort_values(
        by=["votes", "rating"], ascending=[False, False], kind="mergesort"
    )
    working = working.drop_duplicates(subset=["name", "location"], keep="first")
    dropped_dupes = before_dedupe - len(working)

    processed = working.loc[:, list(PROCESSED_COLUMNS)].reset_index(drop=True)
    after = len(processed)

    summary = {
        "rows_before": before,
        "rows_after": after,
        "dropped_missing_core_fields": int(len(dropped_missing)),
        "dropped_invalid_rating": int(dropped_rating),
        "dropped_invalid_cost": int(dropped_cost),
        "dropped_duplicates": int(dropped_dupes),
        "budget_bucket_counts": processed["budget_bucket"].value_counts().to_dict(),
        "unique_locations": int(processed["location"].nunique()),
    }
    return processed, summary


def save_processed(
    frame: pd.DataFrame,
    settings: Settings | None = None,
    summary: dict | None = None,
) -> Path:
    """Write parquet (+ optional summary JSON) under data/processed."""
    settings = settings or get_settings()
    out_path = settings.processed_data_path
    out_path.parent.mkdir(parents=True, exist_ok=True)

    frame.to_parquet(out_path, index=False)
    logger.info("Wrote processed store to %s (%s rows)", out_path, len(frame))

    if summary is not None:
        summary_path = out_path.parent / "preprocess_summary.json"
        summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        logger.info("Wrote summary to %s", summary_path)

    return out_path


def run_preprocess(
    settings: Settings | None = None,
    *,
    use_raw_cache: bool = True,
) -> tuple[pd.DataFrame, dict, Path]:
    """Load → clean → save. Returns frame, summary, output path."""
    settings = settings or get_settings()
    raw = load_raw_dataframe(settings=settings, cache_csv=use_raw_cache)
    processed, summary = preprocess_dataframe(raw)
    if processed.empty:
        raise RuntimeError(
            "No usable restaurants after cleaning. Check dataset source and cleaning rules."
        )
    path = save_processed(processed, settings=settings, summary=summary)
    return processed, summary, path


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Load and preprocess the Zomato Hugging Face dataset."
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Ignore existing data/raw CSV cache and reload from Hugging Face.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    settings = get_settings()
    if args.no_cache:
        cache = settings.raw_data_dir / "zomato_bangalore_raw.csv"
        if cache.exists():
            cache.unlink()
            logger.info("Removed raw cache %s", cache)

    frame, summary, path = run_preprocess(settings=settings, use_raw_cache=not args.no_cache)

    print("Preprocess complete")
    print(f"  Dataset : {settings.hf_dataset_id}")
    print(f"  Output  : {path}")
    print(f"  Rows    : {summary['rows_before']} → {summary['rows_after']}")
    print(f"  Dropped : missing={summary['dropped_missing_core_fields']}, "
          f"rating={summary['dropped_invalid_rating']}, "
          f"cost={summary['dropped_invalid_cost']}, "
          f"dupes={summary['dropped_duplicates']}")
    print(f"  Budgets : {summary['budget_bucket_counts']}")
    print(f"  Locations: {summary['unique_locations']}")
    bangalore_like = frame["location"].str.contains("Bangalore|Bengaluru", case=False, na=False)
    # Dataset locations are localities inside Bangalore; spot-check sample.
    sample = frame.head(3)[["name", "location", "cuisines", "rating", "budget_bucket"]]
    print("  Sample  :")
    print(sample.to_string(index=False))
    print(f"  Locality rows (non-empty): {(~(frame['location'] == '')).sum()}")
    _ = bangalore_like  # locations are Bangalore localities by dataset design
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
