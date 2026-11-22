"""End-to-end recommendation orchestration (Phase 4).

Flow: validate prefs → load processed data → filter → (optional) Groq LLM → response.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Any, Mapping

import pandas as pd

from src.config import Settings, get_settings
from src.filtering.models import UserPreferences
from src.filtering.restaurant_filter import filter_restaurants
from src.llm.recommender import recommend_from_candidates
from src.llm.schemas import RecommendationMeta, RecommendationResponse, RecommendationResult

logger = logging.getLogger(__name__)

_RESTAURANTS_CACHE: pd.DataFrame | None = None
_RESTAURANTS_CACHE_PATH: Path | None = None


def clear_restaurant_cache() -> None:
    """Drop the in-memory processed dataset cache (useful in tests)."""
    global _RESTAURANTS_CACHE, _RESTAURANTS_CACHE_PATH
    _RESTAURANTS_CACHE = None
    _RESTAURANTS_CACHE_PATH = None


def load_restaurants(
    settings: Settings | None = None,
    *,
    path: Path | str | None = None,
    force_reload: bool = False,
) -> pd.DataFrame:
    """
    Load the processed restaurant store, caching by absolute path.

    Raises:
        FileNotFoundError: if the processed parquet/CSV is missing.
    """
    global _RESTAURANTS_CACHE, _RESTAURANTS_CACHE_PATH

    settings = settings or get_settings()
    data_path = Path(path) if path is not None else settings.processed_data_path
    if not data_path.is_absolute():
        data_path = settings.project_root / data_path
    data_path = data_path.resolve()

    if (
        not force_reload
        and _RESTAURANTS_CACHE is not None
        and _RESTAURANTS_CACHE_PATH == data_path
    ):
        return _RESTAURANTS_CACHE

    if not data_path.exists():
        raise FileNotFoundError(
            f"Processed restaurant data not found: {data_path}. "
            "Run: python -m src.ingestion.preprocess"
        )

    suffix = data_path.suffix.lower()
    if suffix == ".parquet":
        df = pd.read_parquet(data_path)
    elif suffix in {".csv", ".tsv"}:
        df = pd.read_csv(data_path, sep="\t" if suffix == ".tsv" else ",")
    else:
        raise ValueError(f"Unsupported processed data format: {data_path.suffix}")

    _RESTAURANTS_CACHE = df
    _RESTAURANTS_CACHE_PATH = data_path
    logger.info("Loaded %s restaurants from %s", len(df), data_path)
    return df


def recommend(
    prefs: UserPreferences | Mapping[str, Any],
    settings: Settings | None = None,
    *,
    df: pd.DataFrame | None = None,
    dry_run: bool | None = None,
) -> RecommendationResponse:
    """
    Run the full recommend pipeline for one preference payload.

    Empty filter shortlists skip the LLM and return a structured no-match result.
    """
    settings = settings or get_settings()
    if isinstance(prefs, Mapping):
        prefs = UserPreferences.model_validate(prefs)

    restaurants = df if df is not None else load_restaurants(settings)
    filter_result = filter_restaurants(restaurants, prefs, settings=settings)

    logger.info(
        "filter done location=%r budget=%s cuisine=%s matches=%s candidates=%s capped=%s",
        prefs.location,
        prefs.budget,
        prefs.cuisine_list(),
        filter_result.match_count_before_cap,
        filter_result.candidate_count,
        filter_result.capped,
    )

    if filter_result.empty or not filter_result.has_candidates:
        logger.info(
            "empty shortlist — skipping LLM reason=%s",
            filter_result.empty_reason,
        )
        return RecommendationResult(
            summary=None,
            items=[],
            meta=RecommendationMeta(
                candidate_count=0,
                match_count_before_cap=filter_result.match_count_before_cap,
                capped=False,
                filters_applied=filter_result.filters_applied,
                empty=True,
                empty_reason=filter_result.empty_reason,
                suggestions=list(filter_result.suggestions),
                source="empty",
                parse_success=False,
                grounded=True,
                model=settings.llm_model,
                message=filter_result.empty_reason,
            ),
        )

    llm_result = recommend_from_candidates(
        filter_result.restaurants,
        prefs,
        settings=settings,
        top_k=prefs.top_k,
        dry_run=dry_run,
    )

    # Merge filter diagnostics onto LLM meta (architecture §5.3).
    merged = llm_result.meta.model_copy(
        update={
            "candidate_count": filter_result.candidate_count,
            "match_count_before_cap": filter_result.match_count_before_cap,
            "capped": filter_result.capped,
            "filters_applied": filter_result.filters_applied,
            "empty": False,
            "empty_reason": None,
            "suggestions": [],
        }
    )

    logger.info(
        "recommend done source=%s parse_success=%s returned=%s latency_ms=%s",
        merged.source,
        merged.parse_success,
        len(llm_result.items),
        merged.latency_ms,
    )

    return RecommendationResult(
        summary=llm_result.summary,
        items=llm_result.items,
        meta=merged,
    )


def format_recommendation_report(result: RecommendationResponse) -> str:
    """Pretty-print a recommendation response for the CLI."""
    lines: list[str] = []
    meta = result.meta

    if meta.empty:
        lines.append("No matching restaurants found.")
        if meta.empty_reason:
            lines.append(f"Reason: {meta.empty_reason}")
        if meta.suggestions:
            lines.append("Suggestions:")
            for tip in meta.suggestions:
                lines.append(f"  - {tip}")
        lines.append(f"Filters applied: {meta.filters_applied}")
        return "\n".join(lines)

    lines.append(
        f"Found {meta.candidate_count} candidates "
        f"(matches before cap: {meta.match_count_before_cap}"
        f"{', capped' if meta.capped else ''})."
    )
    lines.append(
        f"Source: {meta.source} | parse_success={meta.parse_success} "
        f"| latency_ms={meta.latency_ms}"
    )
    if meta.message:
        lines.append(f"Note: {meta.message}")
    if result.summary:
        lines.append(f"\nSummary: {result.summary}")

    lines.append("\nRecommendations:")
    for item in result.items:
        lines.append(f"\n  #{item.rank}  {item.name}")
        lines.append(f"      Cuisine:  {item.cuisine or '—'}")
        lines.append(f"      Rating:   {item.rating}")
        lines.append(f"      Cost:     {item.estimated_cost or '—'}")
        lines.append(f"      Why:      {item.explanation}")

    lines.append(f"\nFilters applied: {meta.filters_applied}")
    return "\n".join(lines)


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Recommend Bangalore restaurants: hard-filter the Zomato dataset, "
            "then rank/explain with Groq."
        )
    )
    parser.add_argument("--location", required=True, help="Locality or city (e.g. Bangalore)")
    parser.add_argument(
        "--budget",
        required=True,
        choices=["low", "medium", "high"],
        help="Budget bucket",
    )
    parser.add_argument(
        "--cuisine",
        default="",
        help="Cuisine filter (comma-separated OK); empty = any",
    )
    parser.add_argument(
        "--min-rating",
        type=float,
        default=0.0,
        dest="min_rating",
        help="Minimum rating (0–5)",
    )
    parser.add_argument(
        "--additional-preferences",
        default="",
        dest="additional_preferences",
        help="Soft preferences for the LLM (free text)",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=None,
        dest="top_k",
        help="Number of recommendations (default: TOP_K from settings)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip Groq; use rating-sorted mock explanations",
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=None,
        help="Optional path to processed parquet/CSV (overrides settings)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable INFO logging",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """CLI entry point for ``python -m src.pipeline``."""
    parser = _build_arg_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(levelname)s %(name)s: %(message)s",
    )

    settings = get_settings()
    top_k = args.top_k if args.top_k is not None else settings.top_k

    try:
        prefs = UserPreferences(
            location=args.location,
            budget=args.budget,
            cuisine=args.cuisine,
            min_rating=args.min_rating,
            additional_preferences=args.additional_preferences,
            top_k=top_k,
        )
    except Exception as exc:  # noqa: BLE001 — show clean CLI validation errors
        print(f"Invalid preferences: {exc}", file=sys.stderr)
        return 2

    try:
        df = load_restaurants(settings, path=args.data) if args.data else load_restaurants(settings)
        result = recommend(prefs, settings=settings, df=df, dry_run=args.dry_run or None)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        logger.exception("Pipeline failed")
        print(f"Pipeline error: {exc}", file=sys.stderr)
        return 1

    print(format_recommendation_report(result))
    return 0 if not result.meta.empty else 0


if __name__ == "__main__":
    raise SystemExit(main())
