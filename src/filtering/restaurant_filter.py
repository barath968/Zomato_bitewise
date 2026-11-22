"""Filter restaurants by user preferences (Phase 2)."""

from __future__ import annotations

import re
from typing import Iterable

import pandas as pd

from src.config import Settings, get_settings
from src.filtering.models import FilterResult, UserPreferences

# Dataset is Bangalore-centric; city-level queries match all localities.
CITY_ALIASES = frozenset(
    {
        "bangalore",
        "bengaluru",
        "bangaluru",
        "blr",
    }
)

REQUIRED_COLUMNS = (
    "name",
    "location",
    "cuisines",
    "rating",
    "budget_bucket",
)


def _normalize_token(value: object) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def _cuisine_tokens(cuisines: object) -> set[str]:
    text = _normalize_token(cuisines)
    if not text:
        return set()
    return {_normalize_token(part) for part in text.split(",") if _normalize_token(part)}


def _requested_cuisines(prefs: UserPreferences) -> list[str]:
    return [_normalize_token(c) for c in prefs.cuisine_list() if _normalize_token(c)]


def _location_mask(series: pd.Series, location_pref: str) -> pd.Series:
    pref = _normalize_token(location_pref)
    if not pref:
        return pd.Series(False, index=series.index)

    if pref in CITY_ALIASES:
        # Entire dataset is Bangalore restaurants / localities.
        return pd.Series(True, index=series.index)

    normalized = series.map(_normalize_token)
    # Exact locality match, or either side contains the other (e.g. "Koramangala"
    # vs "Koramangala 5th Block").
    return (
        (normalized == pref)
        | normalized.str.contains(re.escape(pref), na=False)
        | pd.Series([pref in loc for loc in normalized], index=series.index)
    )


def _cuisine_mask(series: pd.Series, wanted: Iterable[str]) -> pd.Series:
    wanted_set = {w for w in wanted if w}
    if not wanted_set:
        return pd.Series(True, index=series.index)

    def matches(cell: object) -> bool:
        tokens = _cuisine_tokens(cell)
        # Token equality avoids naive substring false positives (e.g. "Indian"
        # inside unrelated compound names when tokens are split properly).
        return any(w in tokens for w in wanted_set)

    return series.map(matches)


def _empty_suggestions(prefs: UserPreferences, *, matched_location: bool) -> list[str]:
    tips = [
        "Lower the minimum rating",
        "Broaden or clear the cuisine filter",
        "Try a different budget tier (low / medium / high)",
    ]
    if not matched_location and _normalize_token(prefs.location) not in CITY_ALIASES:
        tips.insert(
            0,
            "Try a Bangalore locality name (e.g. Indiranagar, BTM, Whitefield) "
            "or use 'Bangalore' for city-wide search",
        )
    return tips


def _row_to_dict(row: pd.Series) -> dict:
    record = row.to_dict()
    # Ensure JSON-serializable primitives for later LLM/API stages.
    for key, value in list(record.items()):
        if pd.isna(value):
            record[key] = None
        elif hasattr(value, "item"):
            try:
                record[key] = value.item()
            except (ValueError, AttributeError):
                record[key] = value
    return record


def filter_restaurants(
    df: pd.DataFrame,
    prefs: UserPreferences | dict,
    settings: Settings | None = None,
    *,
    candidate_cap: int | None = None,
) -> FilterResult:
    """
    Apply hard preference filters and return a capped candidate shortlist.

    Soft preferences (``additional_preferences``) are not applied here; they
    are passed through via ``filters_applied`` for the LLM stage.
    """
    settings = settings or get_settings()
    if isinstance(prefs, dict):
        prefs = UserPreferences.model_validate(prefs)

    cap = candidate_cap if candidate_cap is not None else settings.candidate_cap
    cap = max(1, int(cap))

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"DataFrame missing required columns: {missing}")

    filters_applied = {
        "location": prefs.location,
        "budget": prefs.budget,
        "cuisine": prefs.cuisine_list(),
        "min_rating": prefs.min_rating,
        "additional_preferences": prefs.additional_preferences,
        "top_k": prefs.top_k,
        "candidate_cap": cap,
    }

    working = df.copy()

    # Drop rows with empty budget buckets (edge F-07).
    working = working[
        working["budget_bucket"].map(_normalize_token).isin({"low", "medium", "high"})
    ]

    location_hits = _location_mask(working["location"], prefs.location)
    matched_any_location = bool(location_hits.any())
    working = working.loc[location_hits]

    working = working.loc[
        working["budget_bucket"].map(_normalize_token) == _normalize_token(prefs.budget)
    ]

    cuisine_wanted = _requested_cuisines(prefs)
    working = working.loc[_cuisine_mask(working["cuisines"], cuisine_wanted)]

    working = working.loc[working["rating"] >= float(prefs.min_rating)]

    match_count = len(working)
    if match_count == 0:
        reason = "No restaurants matched the hard filters"
        if not matched_any_location:
            reason = f"No restaurants found for location '{prefs.location}'"
        elif cuisine_wanted:
            reason = (
                f"No restaurants matched location/budget/rating with cuisine "
                f"{cuisine_wanted}"
            )
        return FilterResult(
            restaurants=[],
            candidate_count=0,
            match_count_before_cap=0,
            capped=False,
            filters_applied=filters_applied,
            empty=True,
            empty_reason=reason,
            suggestions=_empty_suggestions(prefs, matched_location=matched_any_location),
        )

    # Stable sort for deterministic caps (edge F-09).
    sort_cols = [c for c in ("votes", "rating", "name", "id") if c in working.columns]
    ascending = [False if c in {"votes", "rating"} else True for c in sort_cols]
    working = working.sort_values(by=sort_cols, ascending=ascending, kind="mergesort")

    capped = match_count > cap
    shortlist = working.head(cap)
    restaurants = [_row_to_dict(row) for _, row in shortlist.iterrows()]

    return FilterResult(
        restaurants=restaurants,
        candidate_count=len(restaurants),
        match_count_before_cap=match_count,
        capped=capped,
        filters_applied=filters_applied,
        empty=False,
        empty_reason=None,
        suggestions=[],
    )
