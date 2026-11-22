"""FastAPI application for BiteWise recommendations (Phase 7)."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

from src.api.cors import cors_origin_regex, parse_cors_origins
from src.api.options import (
    ANY_CUISINE,
    CITY_OPTION,
    cuisine_options,
    location_options,
    resolve_cuisine,
    resolve_location,
)
from src.config import get_settings
from src.filtering.models import TOP_K_MAX, TOP_K_MIN, UserPreferences
from src.llm.schemas import RecommendationResponse
from src.pipeline import load_restaurants, recommend

logger = logging.getLogger(__name__)

BudgetLevel = Literal["low", "medium", "high"]


class RecommendRequest(BaseModel):
    """HTTP body for POST /recommend."""

    location: str = Field(default=CITY_OPTION, min_length=1)
    budget: BudgetLevel = "medium"
    cuisine: str = Field(default=ANY_CUISINE)
    min_rating: float = Field(default=4.0, ge=0.0, le=5.0)
    additional_preferences: str = ""
    top_k: int = Field(default=5, ge=TOP_K_MIN, le=TOP_K_MAX)
    dry_run: bool | None = None


class OptionsResponse(BaseModel):
    locations: list[str]
    cuisines: list[str]
    restaurant_count: int
    city_option: str = CITY_OPTION
    any_cuisine: str = ANY_CUISINE
    budget_labels: dict[str, str]
    top_k_min: int = TOP_K_MIN
    top_k_max: int = TOP_K_MAX


class HealthResponse(BaseModel):
    status: str
    restaurant_count: int | None = None
    model: str | None = None
    dry_run: bool = False
    has_llm_key: bool = False
    detail: str | None = None
    git_commit: str | None = None
    railway_environment: str | None = None


def _runtime_commit() -> str | None:
    """Commit SHA injected by Railway on GitHub-triggered deploys."""
    for key in (
        "RAILWAY_GIT_COMMIT_SHA",
        "RAILWAY_GIT_COMMIT",
        "GIT_COMMIT_SHA",
    ):
        value = os.getenv(key, "").strip()
        if value:
            return value
    return None


_BUDGET_LABELS = {
    "low": "Low · under ₹500 for two",
    "medium": "Medium · ₹500–1,000 for two",
    "high": "High · ₹1,000+ for two",
}

_df: pd.DataFrame | None = None
_load_error: str | None = None


def _get_df() -> pd.DataFrame:
    if _df is None:
        raise HTTPException(
            status_code=503,
            detail=_load_error
            or "Restaurant data unavailable. Run: python -m src.ingestion.preprocess",
        )
    return _df


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _df, _load_error
    settings = get_settings()
    try:
        _df = load_restaurants(settings, force_reload=True)
        _load_error = None
        logger.info("API loaded %s restaurants", len(_df))
    except Exception as exc:  # noqa: BLE001 — surface on /health
        _df = None
        _load_error = str(exc)
        logger.exception("Failed to load restaurants at API startup")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="BiteWise API",
        description="AI-powered Bangalore restaurant recommendations",
        version="0.1.0",
        lifespan=lifespan,
    )
    origin_regex = cors_origin_regex()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(),
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        commit = _runtime_commit()
        env_name = os.getenv("RAILWAY_ENVIRONMENT_NAME") or os.getenv(
            "RAILWAY_ENVIRONMENT"
        )
        if _df is None:
            return HealthResponse(
                status="degraded",
                model=settings.llm_model,
                dry_run=bool(settings.llm_dry_run),
                has_llm_key=bool(settings.has_llm_api_key),
                detail=_load_error,
                git_commit=commit,
                railway_environment=env_name,
            )
        return HealthResponse(
            status="ok",
            restaurant_count=len(_df),
            model=settings.llm_model,
            dry_run=bool(settings.llm_dry_run),
            has_llm_key=bool(settings.has_llm_api_key),
            git_commit=commit,
            railway_environment=env_name,
        )

    @app.get("/options", response_model=OptionsResponse)
    def options() -> OptionsResponse:
        df = _get_df()
        return OptionsResponse(
            locations=location_options(df),
            cuisines=cuisine_options(df),
            restaurant_count=len(df),
            budget_labels=_BUDGET_LABELS,
        )

    @app.post("/recommend", response_model=RecommendationResponse)
    def recommend_endpoint(body: RecommendRequest) -> RecommendationResponse:
        df = _get_df()
        try:
            prefs = UserPreferences(
                location=resolve_location(body.location),
                budget=body.budget,
                cuisine=resolve_cuisine(body.cuisine),
                min_rating=body.min_rating,
                additional_preferences=body.additional_preferences,
                top_k=body.top_k,
            )
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=exc.errors()) from exc

        try:
            return recommend(prefs, df=df, dry_run=body.dry_run)
        except Exception as exc:  # noqa: BLE001 — stable client error
            logger.exception("Recommend failed")
            raise HTTPException(
                status_code=500,
                detail="Something went wrong while generating recommendations.",
            ) from exc

    @app.get("/")
    def root() -> dict[str, Any]:
        return {
            "name": "BiteWise API",
            "docs": "/docs",
            "health": "/health",
            "options": "/options",
            "recommend": "POST /recommend",
        }

    return app


app = create_app()
