"""Dataset-backed option lists for UI / API clients."""

from __future__ import annotations

import pandas as pd

CITY_OPTION = "Bangalore (all localities)"
ANY_CUISINE = "Any cuisine"


def _unique_sorted(values: list[str]) -> list[str]:
    return sorted({v.strip() for v in values if v and str(v).strip()}, key=str.lower)


def location_options(df: pd.DataFrame) -> list[str]:
    """City-wide option first, then unique localities from the dataset."""
    locs = (
        _unique_sorted(df["location"].astype(str).tolist())
        if "location" in df.columns
        else []
    )
    return [CITY_OPTION, *locs]


def cuisine_options(df: pd.DataFrame) -> list[str]:
    """Flatten comma-separated cuisine strings into selectable tokens."""
    tokens: list[str] = []
    if "cuisines" not in df.columns:
        return [ANY_CUISINE]
    for cell in df["cuisines"].dropna().astype(str):
        for part in cell.split(","):
            part = part.strip()
            if part:
                tokens.append(part)
    return [ANY_CUISINE, *_unique_sorted(tokens)]


def resolve_location(selected: str) -> str:
    if selected == CITY_OPTION or not selected.strip():
        return "Bangalore"
    return selected.strip()


def resolve_cuisine(selected: str) -> str:
    if selected == ANY_CUISINE or not selected.strip():
        return ""
    return selected.strip()
