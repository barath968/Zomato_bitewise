"""Phase 4: end-to-end orchestrator tests."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
import pytest

from src.config import Settings
from src.filtering.models import UserPreferences
from src.pipeline import (
    clear_restaurant_cache,
    format_recommendation_report,
    load_restaurants,
    main,
    recommend,
)


@pytest.fixture
def sample_df() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": "1",
                "name": "Pasta Palace",
                "location": "Indiranagar",
                "cuisines": "Italian, Continental",
                "rating": 4.5,
                "votes": 200,
                "approx_cost": 800,
                "budget_bucket": "medium",
                "rest_type": "Casual Dining",
            },
            {
                "id": "2",
                "name": "Trattoria Trails",
                "location": "Indiranagar",
                "cuisines": "Italian",
                "rating": 4.8,
                "votes": 90,
                "approx_cost": 900,
                "budget_bucket": "medium",
                "rest_type": "Casual Dining",
            },
            {
                "id": "3",
                "name": "Budget Bites",
                "location": "BTM",
                "cuisines": "North Indian",
                "rating": 4.1,
                "votes": 50,
                "approx_cost": 300,
                "budget_bucket": "low",
                "rest_type": "Quick Bites",
            },
        ]
    )


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        llm_api_key="",
        llm_model="openai/gpt-oss-20b",
        llm_base_url="https://api.groq.com/openai/v1",
        llm_dry_run=True,
        candidate_cap=25,
        top_k=5,
        processed_data_path=tmp_path / "restaurants.parquet",
        raw_data_dir=tmp_path / "raw",
        project_root=tmp_path,
        hf_dataset_id="test/dataset",
    )


def test_recommend_happy_path_includes_meta(sample_df: pd.DataFrame, settings: Settings):
    prefs = UserPreferences(
        location="Indiranagar",
        budget="medium",
        cuisine="Italian",
        min_rating=4.0,
        top_k=2,
    )
    result = recommend(prefs, settings=settings, df=sample_df, dry_run=True)

    assert result.meta.empty is False
    assert result.meta.candidate_count == 2
    assert result.meta.filters_applied["location"] == "Indiranagar"
    assert result.meta.filters_applied["budget"] == "medium"
    assert result.meta.source in {"mock", "fallback", "llm"}
    assert len(result.items) == 2
    assert {i.name for i in result.items} <= {"Pasta Palace", "Trattoria Trails"}
    names = {i.name for i in result.items}
    assert "Budget Bites" not in names


def test_recommend_empty_skips_llm(sample_df: pd.DataFrame, settings: Settings):
    prefs = UserPreferences(
        location="Mars Colony",
        budget="high",
        cuisine="Italian",
        min_rating=4.9,
        top_k=3,
    )
    result = recommend(prefs, settings=settings, df=sample_df, dry_run=True)

    assert result.meta.empty is True
    assert result.meta.source == "empty"
    assert result.meta.candidate_count == 0
    assert result.items == []
    assert result.meta.empty_reason
    assert result.meta.filters_applied
    assert result.meta.suggestions


def test_format_report_empty_and_success(sample_df: pd.DataFrame, settings: Settings):
    empty = recommend(
        UserPreferences(location="Nowhere", budget="low", cuisine="", top_k=1),
        settings=settings,
        df=sample_df,
        dry_run=True,
    )
    text = format_recommendation_report(empty)
    assert "No matching restaurants" in text
    assert "Suggestions:" in text

    ok = recommend(
        UserPreferences(location="Indiranagar", budget="medium", cuisine="Italian", top_k=1),
        settings=settings,
        df=sample_df,
        dry_run=True,
    )
    report = format_recommendation_report(ok)
    assert "Recommendations:" in report
    assert "Filters applied:" in report
    assert ok.items[0].name in report


def test_load_restaurants_caches(
    sample_df: pd.DataFrame, settings: Settings, tmp_path: Path
):
    clear_restaurant_cache()
    path = tmp_path / "restaurants.parquet"
    sample_df.to_parquet(path, index=False)
    settings_local = Settings(
        llm_api_key=settings.llm_api_key,
        llm_model=settings.llm_model,
        llm_base_url=settings.llm_base_url,
        llm_dry_run=settings.llm_dry_run,
        candidate_cap=settings.candidate_cap,
        top_k=settings.top_k,
        processed_data_path=path,
        raw_data_dir=settings.raw_data_dir,
        project_root=tmp_path,
        hf_dataset_id=settings.hf_dataset_id,
    )

    df1 = load_restaurants(settings_local)
    df2 = load_restaurants(settings_local)
    assert len(df1) == 3
    assert df1 is df2  # same cached object
    clear_restaurant_cache()


def test_cli_dry_run_end_to_end(
    sample_df: pd.DataFrame, settings: Settings, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
):
    clear_restaurant_cache()
    path = tmp_path / "restaurants.parquet"
    sample_df.to_parquet(path, index=False)

    monkeypatch.setattr(
        "src.pipeline.get_settings",
        lambda: Settings(
            llm_api_key="",
            llm_model=settings.llm_model,
            llm_base_url=settings.llm_base_url,
            llm_dry_run=True,
            candidate_cap=25,
            top_k=2,
            processed_data_path=path,
            raw_data_dir=tmp_path / "raw",
            project_root=tmp_path,
            hf_dataset_id="test/dataset",
        ),
    )

    code = main(
        [
            "--location",
            "Indiranagar",
            "--budget",
            "medium",
            "--cuisine",
            "Italian",
            "--min-rating",
            "4.0",
            "--dry-run",
            "--data",
            str(path),
        ]
    )
    assert code == 0
    out = capsys.readouterr().out
    assert "Recommendations:" in out
    assert "Pasta Palace" in out or "Trattoria Trails" in out


def test_cli_empty_path_message(
    sample_df: pd.DataFrame, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
):
    clear_restaurant_cache()
    path = tmp_path / "restaurants.parquet"
    sample_df.to_parquet(path, index=False)

    monkeypatch.setattr(
        "src.pipeline.get_settings",
        lambda: Settings(
            llm_api_key="",
            llm_model="openai/gpt-oss-20b",
            llm_base_url="https://api.groq.com/openai/v1",
            llm_dry_run=True,
            candidate_cap=25,
            top_k=2,
            processed_data_path=path,
            raw_data_dir=tmp_path / "raw",
            project_root=tmp_path,
            hf_dataset_id="test/dataset",
        ),
    )

    code = main(
        [
            "--location",
            "Atlantis",
            "--budget",
            "high",
            "--cuisine",
            "Italian",
            "--min-rating",
            "4.9",
            "--dry-run",
            "--data",
            str(path),
        ]
    )
    assert code == 0
    out = capsys.readouterr().out
    assert "No matching restaurants" in out
