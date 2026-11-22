"""Unit tests for Phase 1 preprocessing helpers."""

import pandas as pd

from src.ingestion.preprocess import (
    budget_bucket,
    normalize_cuisines,
    normalize_text,
    parse_cost,
    parse_rating,
    preprocess_dataframe,
)


def test_parse_rating_accepts_slash_format():
    assert parse_rating("4.1/5") == 4.1
    assert parse_rating("3.0 / 5") == 3.0


def test_parse_rating_rejects_sentinels():
    assert parse_rating("NEW") is None
    assert parse_rating("-") is None
    assert parse_rating("") is None
    assert parse_rating(None) is None


def test_parse_cost_strips_commas():
    assert parse_cost("1,200") == 1200.0
    assert parse_cost("800") == 800.0


def test_budget_bucket_boundaries():
    assert budget_bucket(499.0) == "low"
    assert budget_bucket(500.0) == "medium"
    assert budget_bucket(1000.0) == "medium"
    assert budget_bucket(1000.01) == "high"


def test_normalize_cuisines():
    assert normalize_cuisines(" North Indian, Chinese ") == "North Indian, Chinese"
    assert normalize_text("  Banashankari  ") == "Banashankari"


def test_preprocess_dataframe_happy_path():
    raw = pd.DataFrame(
        {
            "name": ["Jalsa", "Jalsa", "Cafe A", "Bad Row", "No Rate"],
            "location": ["Banashankari", "Banashankari", "BTM", "", "BTM"],
            "cuisines": ["North Indian, Chinese", "North Indian, Chinese", "Cafe", "Italian", "Cafe"],
            "rate": ["4.1/5", "4.0/5", "3.8/5", "4.5/5", "NEW"],
            "votes": [775, 10, 100, 5, 1],
            "approx_cost(for two people)": ["800", "800", "300", "500", "400"],
            "rest_type": ["Casual Dining", "Casual Dining", "Cafe", "Casual Dining", "Cafe"],
            "listed_in(city)": ["Banashankari"] * 5,
        }
    )

    processed, summary = preprocess_dataframe(raw)

    assert set(["name", "location", "cuisines", "rating", "budget_bucket"]).issubset(
        processed.columns
    )
    # Duplicate Jalsa kept once (higher votes).
    assert (processed["name"] == "Jalsa").sum() == 1
    assert summary["rows_after"] == 2  # Jalsa + Cafe A
    assert "Bad Row" not in set(processed["name"])  # missing location
    assert "No Rate" not in set(processed["name"])
    jalsa = processed.loc[processed["name"] == "Jalsa"].iloc[0]
    assert jalsa["budget_bucket"] == "medium"
    assert jalsa["rating"] == 4.1
