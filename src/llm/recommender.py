"""Groq-backed LLM recommender with parse retry and grounded fallback (Phase 3)."""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Mapping, Sequence

from openai import OpenAI
from pydantic import ValidationError

from src.config import Settings, get_settings
from src.filtering.models import UserPreferences
from src.llm.prompt_builder import build_prompt
from src.llm.schemas import (
    LLMRecommendationPayload,
    RecommendationItem,
    RecommendationMeta,
    RecommendationResult,
)

logger = logging.getLogger(__name__)

_JSON_FENCE_RE = re.compile(
    r"```(?:json)?\s*(.*?)\s*```",
    re.DOTALL | re.IGNORECASE,
)


def _normalize_name(value: object) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip().lower())


def _candidate_index(
    candidates: Sequence[Mapping[str, Any]],
) -> dict[str, Mapping[str, Any]]:
    """Map normalized restaurant name → original candidate row (first wins)."""
    index: dict[str, Mapping[str, Any]] = {}
    for row in candidates:
        key = _normalize_name(row.get("name"))
        if key and key not in index:
            index[key] = row
    return index


def _extract_json_text(raw: str) -> str:
    """Strip optional markdown fences and isolate a JSON object."""
    text = (raw or "").strip()
    if not text:
        raise ValueError("Empty LLM response")

    fence = _JSON_FENCE_RE.search(text)
    if fence:
        text = fence.group(1).strip()

    if text.startswith("{") and text.endswith("}"):
        return text

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return text[start : end + 1]

    raise ValueError("No JSON object found in LLM response")


def parse_llm_json(raw: str) -> LLMRecommendationPayload:
    """Parse and lightly validate the LLM JSON payload."""
    payload = json.loads(_extract_json_text(raw))
    if not isinstance(payload, dict):
        raise ValueError("LLM JSON root must be an object")
    return LLMRecommendationPayload.model_validate(payload)


def _row_cuisine(row: Mapping[str, Any]) -> str:
    value = row.get("cuisines")
    if value is None:
        return ""
    return str(value).strip()


def _row_estimated_cost(row: Mapping[str, Any]) -> str:
    bucket = row.get("budget_bucket")
    if bucket:
        return str(bucket).strip()
    cost = row.get("approx_cost")
    if cost is None:
        return ""
    return str(cost).strip()


def _row_rating(row: Mapping[str, Any]) -> float:
    try:
        return float(row.get("rating") or 0.0)
    except (TypeError, ValueError):
        return 0.0


def _template_explanation(
    row: Mapping[str, Any],
    prefs: UserPreferences,
) -> str:
    cuisine = _row_cuisine(row) or "its listed cuisines"
    location = str(row.get("location") or prefs.location).strip()
    rating = _row_rating(row)
    budget = prefs.budget
    extras = prefs.additional_preferences
    base = (
        f"Strong match in {location} for a {budget} budget, offering {cuisine} "
        f"with a {rating:.1f} rating."
    )
    if extras:
        return f"{base} Also aligns with: {extras}."
    return base


def build_fallback_recommendations(
    candidates: Sequence[Mapping[str, Any]],
    prefs: UserPreferences,
    *,
    top_k: int | None = None,
    source: str = "fallback",
    message: str | None = None,
    retried: bool = False,
    model: str | None = None,
) -> RecommendationResult:
    """
    Rating-sorted shortlist with template explanations.

    Never invents restaurants — only uses the provided candidate set.
    """
    k = int(top_k if top_k is not None else prefs.top_k)
    k = max(1, min(k, len(candidates)))

    ranked = sorted(
        [c for c in candidates if c.get("name")],
        key=lambda r: (
            -_row_rating(r),
            -float(r.get("votes") or 0),
            str(r.get("name") or ""),
        ),
    )[:k]

    items: list[RecommendationItem] = []
    for i, row in enumerate(ranked, start=1):
        items.append(
            RecommendationItem(
                name=str(row["name"]).strip(),
                cuisine=_row_cuisine(row),
                rating=_row_rating(row),
                estimated_cost=_row_estimated_cost(row),
                rank=i,
                explanation=_template_explanation(row, prefs),
            )
        )

    summary = (
        f"Top {len(items)} restaurants sorted by rating "
        f"(LLM unavailable — showing filter shortlist)."
        if source == "fallback"
        else f"Mock ranking of top {len(items)} candidates by rating."
    )

    return RecommendationResult(
        summary=summary,
        items=items,
        meta=RecommendationMeta(
            candidate_count=len(candidates),
            source=source,  # type: ignore[arg-type]
            parse_success=False,
            retried=retried,
            grounded=True,
            model=model,
            message=message,
        ),
    )


def ground_recommendations(
    payload: LLMRecommendationPayload,
    candidates: Sequence[Mapping[str, Any]],
    prefs: UserPreferences,
    *,
    top_k: int | None = None,
) -> list[RecommendationItem]:
    """
    Keep only LLM items whose names exist in the candidate set.

    Fill cuisine/rating/cost from the candidate row when missing or mismatched.
    """
    index = _candidate_index(candidates)
    k = int(top_k if top_k is not None else prefs.top_k)
    k = max(1, k)

    items: list[RecommendationItem] = []
    seen: set[str] = set()

    for raw in payload.recommendations:
        if not isinstance(raw, dict):
            continue
        name = raw.get("restaurant_name") or raw.get("name") or ""
        key = _normalize_name(name)
        if not key or key in seen:
            continue
        row = index.get(key)
        if row is None:
            logger.warning("Dropping hallucinated restaurant: %r", name)
            continue
        seen.add(key)

        explanation = str(
            raw.get("explanation") or _template_explanation(row, prefs)
        ).strip()
        if not explanation:
            explanation = _template_explanation(row, prefs)

        try:
            rating = float(raw.get("rating")) if raw.get("rating") is not None else None
        except (TypeError, ValueError):
            rating = None

        items.append(
            RecommendationItem(
                name=str(row["name"]).strip(),
                cuisine=str(raw.get("cuisine") or _row_cuisine(row)).strip(),
                rating=rating if rating is not None else _row_rating(row),
                estimated_cost=str(
                    raw.get("estimated_cost") or _row_estimated_cost(row)
                ).strip(),
                rank=len(items) + 1,
                explanation=explanation,
            )
        )
        if len(items) >= k:
            break

    # Re-number ranks in final order.
    for i, item in enumerate(items, start=1):
        item.rank = i
    return items


def _call_groq(
    client: OpenAI,
    *,
    model: str,
    system: str,
    user: str,
) -> str:
    """Invoke Groq chat completions with JSON response mode."""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Groq returned empty message content")
    return content


def _make_client(settings: Settings) -> OpenAI:
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )


def recommend_from_candidates(
    candidates: Sequence[Mapping[str, Any]],
    prefs: UserPreferences | Mapping[str, Any],
    settings: Settings | None = None,
    *,
    top_k: int | None = None,
    dry_run: bool | None = None,
    client: OpenAI | None = None,
) -> RecommendationResult:
    """
    Rank a filtered shortlist with Groq and return structured recommendations.

    Fallbacks:
    - ``dry_run`` / ``LLM_DRY_RUN`` → mock rating-sorted explanations (no API)
    - missing API key → same as fallback
    - parse failure → one retry, then rating-sorted template fallback
    - all LLM names fail grounding → fallback
    """
    settings = settings or get_settings()
    if isinstance(prefs, Mapping):
        prefs = UserPreferences.model_validate(prefs)

    candidate_list = [dict(c) for c in candidates if c.get("name")]
    k = int(top_k if top_k is not None else prefs.top_k)
    k = max(1, k)
    use_dry_run = settings.llm_dry_run if dry_run is None else dry_run

    if not candidate_list:
        return RecommendationResult(
            summary=None,
            items=[],
            meta=RecommendationMeta(
                candidate_count=0,
                source="fallback",
                parse_success=False,
                grounded=True,
                message="No candidates provided",
            ),
        )

    if use_dry_run:
        return build_fallback_recommendations(
            candidate_list,
            prefs,
            top_k=k,
            source="mock",
            message="dry_run=True — skipped Groq API call",
            model=settings.llm_model,
        )

    if not settings.has_llm_api_key:
        return build_fallback_recommendations(
            candidate_list,
            prefs,
            top_k=k,
            source="fallback",
            message="LLM_API_KEY / GROQ_API_KEY missing — using rating fallback",
            model=settings.llm_model,
        )

    prompt = build_prompt(prefs, candidate_list, top_k=k)
    api_client = client or _make_client(settings)

    raw_text: str | None = None
    retried = False
    last_error: str | None = None
    started = time.perf_counter()

    for attempt in range(2):
        try:
            raw_text = _call_groq(
                api_client,
                model=settings.llm_model,
                system=prompt["system"],
                user=prompt["user"],
            )
            payload = parse_llm_json(raw_text)
            items = ground_recommendations(
                payload, candidate_list, prefs, top_k=k
            )
            latency_ms = (time.perf_counter() - started) * 1000.0

            if not items:
                last_error = "No grounded recommendations after LLM parse"
                if attempt == 0:
                    retried = True
                    continue
                break

            return RecommendationResult(
                summary=payload.summary,
                items=items,
                meta=RecommendationMeta(
                    candidate_count=len(candidate_list),
                    source="llm",
                    parse_success=True,
                    retried=retried,
                    grounded=True,
                    model=settings.llm_model,
                    latency_ms=round(latency_ms, 2),
                ),
            )
        except (json.JSONDecodeError, ValidationError, ValueError, OSError) as exc:
            last_error = str(exc)
            logger.warning("LLM attempt %s failed: %s", attempt + 1, exc)
            if attempt == 0:
                retried = True
                continue
        except Exception as exc:  # noqa: BLE001 — degrade gracefully for API errors
            last_error = str(exc)
            logger.exception("Groq API call failed")
            if attempt == 0:
                retried = True
                continue

    return build_fallback_recommendations(
        candidate_list,
        prefs,
        top_k=k,
        source="fallback",
        message=f"LLM failed after retry: {last_error}",
        retried=retried,
        model=settings.llm_model,
    )


# Phase plan alias.
def recommend(*args: Any, **kwargs: Any) -> RecommendationResult:
    """Alias for ``recommend_from_candidates``."""
    return recommend_from_candidates(*args, **kwargs)
