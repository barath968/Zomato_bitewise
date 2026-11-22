"""Phase 5: UI helper unit tests (no browser required)."""

from __future__ import annotations

import pandas as pd

from src.ui.app import (
    ANY_CUISINE,
    CITY_OPTION,
    cuisine_options,
    location_options,
    resolve_cuisine,
    resolve_location,
)


def test_location_and_cuisine_options():
    df = pd.DataFrame(
        {
            "location": ["Indiranagar", "BTM", "Indiranagar"],
            "cuisines": ["Italian, Continental", "North Indian", "Chinese, Italian"],
        }
    )
    locs = location_options(df)
    assert locs[0] == CITY_OPTION
    assert "Indiranagar" in locs
    assert "BTM" in locs

    cuisines = cuisine_options(df)
    assert cuisines[0] == ANY_CUISINE
    assert "Italian" in cuisines
    assert "North Indian" in cuisines
    assert "Chinese" in cuisines


def test_resolve_helpers():
    assert resolve_location(CITY_OPTION) == "Bangalore"
    assert resolve_location("Koramangala") == "Koramangala"
    assert resolve_cuisine(ANY_CUISINE) == ""
    assert resolve_cuisine("Italian") == "Italian"
