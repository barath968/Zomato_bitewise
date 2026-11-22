"""Build grounded recommendation prompts for the Groq LLM (Phase 3)."""

from __future__ import annotations

import json
from typing import Any, Mapping, Sequence

from src.filtering.models import UserPreferences
from src.llm.schemas import LLM_JSON_SCHEMA_HINT

# Compact fields only — keep prompts small (architecture §6).
CANDIDATE_PROMPT_FIELDS = (
    "name",
    "location",
    "cuisines",
    "rating",
    "votes",
    "approx_cost",
    "budget_bucket",
    "rest_type",
)

SYSTEM_PROMPT = """\
You are a restaurant recommendation assistant for Bangalore venues from a fixed dataset.

Rules:
1. Recommend ONLY restaurants that appear in the provided candidate list.
2. Do not invent restaurants, ratings, cuisines, or costs.
3. Rank candidates by overall fit to the user's preferences, including soft preferences.
4. Write concise, specific explanations (1–2 sentences) that reference relevant preference factors.
5. Return valid JSON only — no markdown fences, no commentary outside JSON.
6. Follow this JSON shape exactly:
{schema}
""".format(
    schema=json.dumps(LLM_JSON_SCHEMA_HINT, indent=2)
)


def _compact_candidate(row: Mapping[str, Any]) -> dict[str, Any]:
    """Serialize one restaurant row into a prompt-safe record."""
    compact: dict[str, Any] = {}
    for key in CANDIDATE_PROMPT_FIELDS:
        if key not in row:
            continue
        value = row[key]
        if value is None:
            continue
        if isinstance(value, float) and value != value:  # NaN
            continue
        compact[key] = value
    return compact


def serialize_candidates(
    candidates: Sequence[Mapping[str, Any]],
) -> list[dict[str, Any]]:
    """Convert shortlist rows into compact prompt records."""
    return [_compact_candidate(row) for row in candidates if row.get("name")]


def build_system_prompt() -> str:
    """Return the system instructions for the recommendation LLM."""
    return SYSTEM_PROMPT


def build_user_prompt(
    prefs: UserPreferences | Mapping[str, Any],
    candidates: Sequence[Mapping[str, Any]],
    *,
    top_k: int | None = None,
) -> str:
    """
    Build the user/context prompt: preferences + candidates + output instructions.
    """
    if isinstance(prefs, Mapping):
        prefs = UserPreferences.model_validate(prefs)

    k = int(top_k if top_k is not None else prefs.top_k)
    k = max(1, k)

    compact = serialize_candidates(candidates)
    preferences_block = {
        "location": prefs.location,
        "budget": prefs.budget,
        "cuisine": prefs.cuisine_list(),
        "min_rating": prefs.min_rating,
        "additional_preferences": prefs.additional_preferences or None,
        "top_k": k,
    }

    return (
        "User preferences (JSON):\n"
        f"{json.dumps(preferences_block, indent=2, ensure_ascii=False)}\n\n"
        f"Candidate restaurants ({len(compact)} items, JSON array):\n"
        f"{json.dumps(compact, indent=2, ensure_ascii=False)}\n\n"
        f"Return the top {k} recommendations as JSON matching the schema. "
        "Use restaurant_name values copied exactly from the candidate list. "
        "estimated_cost should be the budget_bucket (low/medium/high) when available."
    )


def build_prompt(
    prefs: UserPreferences | Mapping[str, Any],
    candidates: Sequence[Mapping[str, Any]],
    *,
    top_k: int | None = None,
) -> dict[str, str]:
    """
    Assemble chat messages for the LLM.

    Returns:
        ``{"system": ..., "user": ...}``
    """
    return {
        "system": build_system_prompt(),
        "user": build_user_prompt(prefs, candidates, top_k=top_k),
    }
