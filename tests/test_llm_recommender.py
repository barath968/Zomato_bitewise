"""Phase 3: prompt builder, JSON parse, grounding, and fallback tests."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any

import pytest

from src.config import Settings
from src.filtering.models import UserPreferences
from src.llm.prompt_builder import (
    CANDIDATE_PROMPT_FIELDS,
    build_prompt,
    build_user_prompt,
    serialize_candidates,
)
from src.llm.recommender import (
    build_fallback_recommendations,
    ground_recommendations,
    parse_llm_json,
    recommend_from_candidates,
)
from src.llm.schemas import LLMRecommendationPayload


def _prefs(**overrides: Any) -> UserPreferences:
    base = {
        "location": "Indiranagar",
        "budget": "medium",
        "cuisine": "Italian",
        "min_rating": 4.0,
        "additional_preferences": "quiet ambience",
        "top_k": 3,
    }
    base.update(overrides)
    return UserPreferences.model_validate(base)


def _candidates() -> list[dict[str, Any]]:
    return [
        {
            "name": "Pasta Palace",
            "location": "Indiranagar",
            "cuisines": "Italian, Continental",
            "rating": 4.5,
            "votes": 200,
            "approx_cost": 800,
            "budget_bucket": "medium",
            "rest_type": "Casual Dining",
            "reviews_list": "SHOULD_NOT_APPEAR " * 50,
        },
        {
            "name": "Noodle Nest",
            "location": "Indiranagar",
            "cuisines": "Italian, Asian",
            "rating": 4.2,
            "votes": 150,
            "approx_cost": 700,
            "budget_bucket": "medium",
        },
        {
            "name": "Trattoria Trails",
            "location": "Indiranagar",
            "cuisines": "Italian",
            "rating": 4.8,
            "votes": 90,
            "approx_cost": 900,
            "budget_bucket": "medium",
        },
    ]


def _settings(**overrides: Any) -> Settings:
    base = dict(
        llm_api_key="test-key",
        llm_model="openai/gpt-oss-20b",
        llm_base_url="https://api.groq.com/openai/v1",
        llm_dry_run=False,
        candidate_cap=25,
        top_k=5,
        processed_data_path=__import__("pathlib").Path("data/processed/restaurants.parquet"),
        raw_data_dir=__import__("pathlib").Path("data/raw"),
        project_root=__import__("pathlib").Path("."),
        hf_dataset_id="jason1966/absin7_zomato-bangalore-dataset",
    )
    base.update(overrides)
    return Settings(**base)


def test_prompt_contains_prefs_and_candidates_excludes_bulky_fields():
    prefs = _prefs()
    prompt = build_prompt(prefs, _candidates(), top_k=2)

    assert "recommend ONLY" in prompt["system"].lower() or "ONLY restaurants" in prompt["system"]
    assert "Indiranagar" in prompt["user"]
    assert "quiet ambience" in prompt["user"]
    assert "Pasta Palace" in prompt["user"]
    assert "Trattoria Trails" in prompt["user"]
    assert '"top_k": 2' in prompt["user"] or "top 2" in prompt["user"]
    assert "SHOULD_NOT_APPEAR" not in prompt["user"]
    assert "reviews_list" not in prompt["user"]

    compact = serialize_candidates(_candidates())
    assert set(compact[0].keys()) <= set(CANDIDATE_PROMPT_FIELDS)


def test_parse_llm_json_accepts_fenced_and_plain():
    body = {
        "summary": "Great Italian picks",
        "recommendations": [
            {
                "restaurant_name": "Pasta Palace",
                "cuisine": "Italian",
                "rating": 4.5,
                "estimated_cost": "medium",
                "rank": 1,
                "explanation": "Fits budget and cuisine.",
            }
        ],
    }
    raw = "```json\n" + json.dumps(body) + "\n```"
    payload = parse_llm_json(raw)
    assert payload.summary == "Great Italian picks"
    assert len(payload.recommendations) == 1


def test_grounding_drops_hallucinated_names():
    prefs = _prefs()
    payload = LLMRecommendationPayload.model_validate(
        {
            "summary": "Mix",
            "recommendations": [
                {
                    "restaurant_name": "Invented Cafe",
                    "cuisine": "Italian",
                    "rating": 5.0,
                    "estimated_cost": "medium",
                    "rank": 1,
                    "explanation": "Fake place.",
                },
                {
                    "restaurant_name": "Pasta Palace",
                    "cuisine": "Italian",
                    "rating": 4.5,
                    "estimated_cost": "medium",
                    "rank": 2,
                    "explanation": "Real match for Italian in Indiranagar.",
                },
            ],
        }
    )
    items = ground_recommendations(payload, _candidates(), prefs, top_k=3)
    assert len(items) == 1
    assert items[0].name == "Pasta Palace"
    assert items[0].rank == 1


def test_fallback_never_invents_and_sorts_by_rating():
    prefs = _prefs(top_k=2)
    result = build_fallback_recommendations(
        _candidates(), prefs, top_k=2, source="fallback", message="test"
    )
    assert result.meta.source == "fallback"
    assert [i.name for i in result.items] == ["Trattoria Trails", "Pasta Palace"]
    assert all(i.explanation for i in result.items)
    assert {i.name for i in result.items} <= {c["name"] for c in _candidates()}


def test_dry_run_skips_api():
    result = recommend_from_candidates(
        _candidates(),
        _prefs(top_k=2),
        settings=_settings(llm_dry_run=True),
        dry_run=True,
    )
    assert result.meta.source == "mock"
    assert len(result.items) == 2
    assert result.meta.parse_success is False


def test_missing_api_key_uses_fallback():
    result = recommend_from_candidates(
        _candidates(),
        _prefs(top_k=2),
        settings=_settings(llm_api_key="", llm_dry_run=False),
    )
    assert result.meta.source == "fallback"
    assert "missing" in (result.meta.message or "").lower()
    assert len(result.items) == 2


class _FakeCompletions:
    def __init__(self, texts: list[str]) -> None:
        self._texts = list(texts)
        self.calls = 0

    def create(self, **_kwargs: Any) -> Any:
        self.calls += 1
        text = self._texts.pop(0) if self._texts else "{}"
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=text))]
        )


class _FakeChat:
    def __init__(self, texts: list[str]) -> None:
        self.completions = _FakeCompletions(texts)


class _FakeClient:
    def __init__(self, texts: list[str]) -> None:
        self.chat = _FakeChat(texts)


def test_llm_success_with_fake_client():
    body = {
        "summary": "Top Italian spots",
        "recommendations": [
            {
                "restaurant_name": "Trattoria Trails",
                "cuisine": "Italian",
                "rating": 4.8,
                "estimated_cost": "medium",
                "rank": 1,
                "explanation": "Highest rating and pure Italian focus.",
            },
            {
                "restaurant_name": "Pasta Palace",
                "cuisine": "Italian, Continental",
                "rating": 4.5,
                "estimated_cost": "medium",
                "rank": 2,
                "explanation": "Popular Italian option within budget.",
            },
        ],
    }
    client = _FakeClient([json.dumps(body)])
    result = recommend_from_candidates(
        _candidates(),
        _prefs(top_k=2),
        settings=_settings(),
        client=client,  # type: ignore[arg-type]
    )
    assert result.meta.source == "llm"
    assert result.meta.parse_success is True
    assert result.summary == "Top Italian spots"
    assert [i.name for i in result.items] == ["Trattoria Trails", "Pasta Palace"]
    assert client.chat.completions.calls == 1


def test_invalid_json_retries_then_falls_back():
    client = _FakeClient(["not-json", "still-not-json"])
    result = recommend_from_candidates(
        _candidates(),
        _prefs(top_k=2),
        settings=_settings(),
        client=client,  # type: ignore[arg-type]
    )
    assert result.meta.source == "fallback"
    assert result.meta.retried is True
    assert client.chat.completions.calls == 2
    assert len(result.items) == 2


def test_user_prompt_helper():
    text = build_user_prompt(_prefs(), _candidates(), top_k=1)
    assert "Candidate restaurants" in text
    assert "Pasta Palace" in text


def test_empty_candidates():
    result = recommend_from_candidates([], _prefs(), settings=_settings(llm_dry_run=True))
    assert result.items == []
    assert result.meta.candidate_count == 0
