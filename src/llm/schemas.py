"""Pydantic schemas for LLM recommendation request/response payloads (Phase 3)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

BudgetLevel = Literal["low", "medium", "high"]


class RecommendationItem(BaseModel):
    """One ranked restaurant recommendation for UI / API consumers."""

    name: str = Field(..., min_length=1)
    cuisine: str = ""
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    estimated_cost: str = ""
    rank: int = Field(default=1, ge=1)
    explanation: str = Field(..., min_length=1)

    @field_validator("name", "cuisine", "estimated_cost", "explanation", mode="before")
    @classmethod
    def _strip_text(cls, value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip()


class LLMRecommendationPayload(BaseModel):
    """JSON shape expected from the LLM (architecture §3.4)."""

    summary: str | None = None
    recommendations: list[dict[str, Any]] = Field(default_factory=list)

    @field_validator("summary", mode="before")
    @classmethod
    def _normalize_summary(cls, value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None


class RecommendationMeta(BaseModel):
    """Diagnostics attached to a recommendation response."""

    candidate_count: int = 0
    returned_count: int = 0
    match_count_before_cap: int = 0
    capped: bool = False
    filters_applied: dict[str, Any] = Field(default_factory=dict)
    empty: bool = False
    empty_reason: str | None = None
    suggestions: list[str] = Field(default_factory=list)
    source: Literal["llm", "fallback", "mock", "empty"] = "llm"
    parse_success: bool = False
    retried: bool = False
    grounded: bool = True
    model: str | None = None
    latency_ms: float | None = None
    message: str | None = None


class RecommendationResult(BaseModel):
    """Validated recommendation bundle returned by the recommender / pipeline."""

    summary: str | None = None
    items: list[RecommendationItem] = Field(default_factory=list)
    meta: RecommendationMeta = Field(default_factory=RecommendationMeta)

    @model_validator(mode="after")
    def _sync_returned_count(self) -> RecommendationResult:
        object.__setattr__(
            self.meta,
            "returned_count",
            len(self.items),
        )
        return self


# Architecture / Phase 4 alias.
RecommendationResponse = RecommendationResult


# Alias matching architecture naming in prompts / docs.
LLM_JSON_SCHEMA_HINT = {
    "summary": "optional overall blurb",
    "recommendations": [
        {
            "restaurant_name": "string",
            "cuisine": "string",
            "rating": 4.2,
            "estimated_cost": "medium",
            "rank": 1,
            "explanation": "why this fits the user",
        }
    ],
}
