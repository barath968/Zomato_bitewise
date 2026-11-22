"""Preference and filter-result models for the recommendation pipeline."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

BudgetLevel = Literal["low", "medium", "high"]

TOP_K_MIN = 1
TOP_K_MAX = 10
DEFAULT_MIN_RATING = 0.0


class UserPreferences(BaseModel):
    """User recommendation preferences.

    Hard filters: location, budget, cuisine, min_rating.
    Soft signal: additional_preferences (used by the LLM in Phase 3).
    """

    location: str = Field(..., min_length=1, description="Locality or city name")
    budget: BudgetLevel
    cuisine: str | list[str] = Field(
        default="",
        description="Cuisine name or list; empty means any cuisine",
    )
    min_rating: float = Field(default=DEFAULT_MIN_RATING, ge=0.0, le=5.0)
    additional_preferences: str = Field(default="")
    top_k: int = Field(default=5, ge=TOP_K_MIN, le=TOP_K_MAX)

    @field_validator("location")
    @classmethod
    def _strip_location(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("location is required")
        return text

    @field_validator("cuisine", mode="before")
    @classmethod
    def _normalize_cuisine_input(cls, value: Any) -> str | list[str]:
        if value is None:
            return ""
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        text = str(value).strip()
        return text

    @field_validator("additional_preferences", mode="before")
    @classmethod
    def _strip_additional(cls, value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip()

    @model_validator(mode="after")
    def _clamp_top_k(self) -> UserPreferences:
        # Defensive clamp even if constructed outside Field bounds.
        object.__setattr__(
            self,
            "top_k",
            max(TOP_K_MIN, min(TOP_K_MAX, int(self.top_k))),
        )
        return self

    def cuisine_list(self) -> list[str]:
        """Return normalized cuisine tokens requested by the user."""
        if isinstance(self.cuisine, list):
            raw = self.cuisine
        elif not self.cuisine:
            return []
        else:
            raw = [p.strip() for p in self.cuisine.split(",")]
        return [c for c in (p.strip() for p in raw) if c]


class FilterResult(BaseModel):
    """Structured shortlist returned by the filter layer."""

    model_config = {"arbitrary_types_allowed": True}

    restaurants: list[dict[str, Any]] = Field(default_factory=list)
    candidate_count: int = 0
    match_count_before_cap: int = 0
    capped: bool = False
    filters_applied: dict[str, Any] = Field(default_factory=dict)
    empty: bool = False
    empty_reason: str | None = None
    suggestions: list[str] = Field(default_factory=list)

    @property
    def has_candidates(self) -> bool:
        return self.candidate_count > 0
