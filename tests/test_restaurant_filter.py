"""Fixture-based tests for Phase 2 preference filtering."""

import pandas as pd
import pytest
from pydantic import ValidationError

from src.filtering import UserPreferences, filter_restaurants


@pytest.fixture
def sample_df() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": "jalsa::banashankari",
                "name": "Jalsa",
                "location": "Banashankari",
                "cuisines": "North Indian, Chinese",
                "rating": 4.1,
                "votes": 775,
                "approx_cost": 800.0,
                "budget_bucket": "medium",
                "rest_type": "Casual Dining",
                "listed_in_city": "Banashankari",
            },
            {
                "id": "truffles::koramangala",
                "name": "Truffles",
                "location": "Koramangala 5th Block",
                "cuisines": "Cafe, American, Burger",
                "rating": 4.7,
                "votes": 9000,
                "approx_cost": 800.0,
                "budget_bucket": "medium",
                "rest_type": "Cafe",
                "listed_in_city": "Koramangala",
            },
            {
                "id": "cheap bites::btm",
                "name": "Cheap Bites",
                "location": "BTM",
                "cuisines": "South Indian",
                "rating": 3.5,
                "votes": 50,
                "approx_cost": 200.0,
                "budget_bucket": "low",
                "rest_type": "Quick Bites",
                "listed_in_city": "BTM",
            },
            {
                "id": "fancy::indiranagar",
                "name": "Fancy Place",
                "location": "Indiranagar",
                "cuisines": "Italian, Continental",
                "rating": 4.5,
                "votes": 400,
                "approx_cost": 1500.0,
                "budget_bucket": "high",
                "rest_type": "Fine Dining",
                "listed_in_city": "Indiranagar",
            },
            {
                "id": "no-budget::btm",
                "name": "Mystery Spot",
                "location": "BTM",
                "cuisines": "Italian",
                "rating": 4.0,
                "votes": 10,
                "approx_cost": None,
                "budget_bucket": "",
                "rest_type": "Cafe",
                "listed_in_city": "BTM",
            },
        ]
    )


def test_match_returns_only_matching_restaurants(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="Banashankari",
        budget="medium",
        cuisine="Chinese",
        min_rating=4.0,
        top_k=5,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=25)

    assert not result.empty
    assert result.candidate_count == 1
    assert result.restaurants[0]["name"] == "Jalsa"
    assert result.filters_applied["budget"] == "medium"


def test_empty_shortlist_is_structured(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="BTM",
        budget="low",
        cuisine="Italian",
        min_rating=4.0,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=25)

    assert result.empty
    assert result.candidate_count == 0
    assert result.empty_reason
    assert result.suggestions
    assert result.restaurants == []


def test_candidate_cap_never_exceeded(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="Bangalore",
        budget="medium",
        cuisine="",
        min_rating=0.0,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=1)

    assert result.candidate_count == 1
    assert result.match_count_before_cap == 2  # Jalsa + Truffles
    assert result.capped is True
    # Highest votes among medium should win.
    assert result.restaurants[0]["name"] == "Truffles"


def test_min_rating_inclusive(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="BTM",
        budget="low",
        cuisine="South Indian",
        min_rating=3.5,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=10)
    assert result.candidate_count == 1
    assert result.restaurants[0]["name"] == "Cheap Bites"


def test_cuisine_token_match_not_substring_false_positive(sample_df: pd.DataFrame):
    # "Indian" should match "North Indian" / "South Indian" tokens only when
    # the token equals "indian" — our tokens are full phrases, so "Indian"
    # alone should NOT match "North Indian".
    prefs = UserPreferences(
        location="Banashankari",
        budget="medium",
        cuisine="Indian",
        min_rating=0.0,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=10)
    assert result.empty


def test_city_alias_matches_all_localities(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="Bengaluru",
        budget="high",
        cuisine="Italian",
        min_rating=4.0,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=10)
    assert result.candidate_count == 1
    assert result.restaurants[0]["name"] == "Fancy Place"


def test_partial_location_match(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="Koramangala",
        budget="medium",
        cuisine="American",
        min_rating=4.0,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=10)
    assert result.candidate_count == 1
    assert result.restaurants[0]["name"] == "Truffles"


def test_empty_budget_bucket_excluded(sample_df: pd.DataFrame):
    prefs = UserPreferences(
        location="BTM",
        budget="medium",
        cuisine="Italian",
        min_rating=0.0,
    )
    result = filter_restaurants(sample_df, prefs, candidate_cap=10)
    assert all(r["name"] != "Mystery Spot" for r in result.restaurants)


def test_invalid_preferences_rejected():
    with pytest.raises(ValidationError):
        UserPreferences(location="  ", budget="medium")
    with pytest.raises(ValidationError):
        UserPreferences(location="BTM", budget="luxury")  # type: ignore[arg-type]
    with pytest.raises(ValidationError):
        UserPreferences(location="BTM", budget="low", min_rating=9.0)


def test_dict_prefs_accepted(sample_df: pd.DataFrame):
    result = filter_restaurants(
        sample_df,
        {
            "location": "Indiranagar",
            "budget": "high",
            "cuisine": ["Italian", "Chinese"],
            "min_rating": 4.0,
            "top_k": 3,
        },
        candidate_cap=5,
    )
    assert result.candidate_count == 1
    assert result.filters_applied["top_k"] == 3
