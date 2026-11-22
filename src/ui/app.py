"""BiteWise Streamlit UI — dark theme from stitch_bitewise_ai_frontend."""

from __future__ import annotations

import html
import logging
import sys
from pathlib import Path
from typing import Any

# Streamlit runs this file directly, so the project root may not be on sys.path.
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import pandas as pd
import streamlit as st
from pydantic import ValidationError

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
from src.llm.schemas import RecommendationItem, RecommendationResponse
from src.pipeline import load_restaurants, recommend

logger = logging.getLogger(__name__)

_CSS_PATH = Path(__file__).with_name("bitewise.css")

_BUDGET_LABELS = {
    "low": "Low · under ₹500 for two",
    "medium": "Medium · ₹500–1,000 for two",
    "high": "High · ₹1,000+ for two",
}


@st.cache_data(show_spinner=False)
def _cached_restaurants(path_str: str) -> pd.DataFrame:
    settings = get_settings()
    return load_restaurants(settings, path=path_str, force_reload=True)


def _load_data() -> tuple[pd.DataFrame | None, str | None]:
    settings = get_settings()
    try:
        df = _cached_restaurants(str(settings.processed_data_path))
        return df, None
    except FileNotFoundError as exc:
        return None, str(exc)
    except Exception as exc:  # noqa: BLE001 — show friendly UI error
        logger.exception("Failed to load restaurant data")
        return None, f"Could not load restaurant data: {exc}"


def _inject_theme() -> None:
    css = _CSS_PATH.read_text(encoding="utf-8") if _CSS_PATH.exists() else ""
    st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)


def _esc(value: Any) -> str:
    return html.escape("" if value is None else str(value))


def _cost_label(estimated_cost: str) -> str:
    key = (estimated_cost or "").strip().lower()
    if key in _BUDGET_LABELS:
        return _BUDGET_LABELS[key]
    if key:
        return estimated_cost.strip()
    return "Cost unavailable"


def _render_topbar(restaurant_count: int | None) -> None:
    count_label = f"{restaurant_count:,} curated spots" if restaurant_count is not None else "dataset offline"
    st.markdown(
        f"""
        <div class="bw-topbar">
          <div class="bw-brand">
            <div class="bw-mark">B</div>
            <div>
              <div class="bw-brand-name">BiteWise</div>
              <div class="bw-brand-sub">Bangalore AI Recommender</div>
            </div>
          </div>
          <div class="bw-chip">
            <span class="bw-chip-dot"></span>
            Bangalore · {_esc(count_label)} · AI Ranked
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _render_hero() -> None:
    st.markdown(
        """
        <div class="bw-hero">
          <h1>Curated Bangalore Dining,<br/><span class="accent">Decoded by AI.</span></h1>
          <p>
            Filter real Zomato venues by neighborhood, budget, cuisine, and rating —
            then let the model rank matches and explain why they fit.
          </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _render_sidebar_status(df: pd.DataFrame | None) -> None:
    settings = get_settings()
    with st.sidebar:
        st.markdown("### System")
        if df is not None:
            st.write(f"Restaurants loaded: **{len(df):,}**")
        st.write(f"Model: `{settings.llm_model}`")
        if settings.llm_dry_run:
            st.warning("LLM_DRY_RUN is on — using mock explanations.")
        elif not settings.has_llm_api_key:
            st.warning("No LLM API key — ranking will use rating fallback.")
        else:
            st.success("Groq API key configured.")
        st.caption("Set keys and knobs in `.env`.")


def _preference_form(df: pd.DataFrame) -> UserPreferences | None:
    locs = location_options(df)
    cuisines = cuisine_options(df)
    settings = get_settings()
    default_top_k = min(max(settings.top_k, TOP_K_MIN), TOP_K_MAX)

    st.markdown(
        """
        <div class="bw-panel">
          <div class="bw-panel-title">Preference engine</div>
          <p class="bw-panel-sub">Hard filters first · AI ranking second</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.form("preferences_form", clear_on_submit=False):
        col1, col2 = st.columns(2)
        with col1:
            location = st.selectbox("Bangalore locality", options=locs, index=0)
            budget = st.selectbox(
                "Budget for two",
                options=["low", "medium", "high"],
                format_func=lambda b: _BUDGET_LABELS[b],
                index=1,
            )
            cuisine = st.selectbox("Cuisine", options=cuisines, index=0)
        with col2:
            min_rating = st.slider(
                "Minimum rating",
                min_value=0.0,
                max_value=5.0,
                value=4.0,
                step=0.1,
            )
            top_k = st.slider(
                "Top K recommendations",
                min_value=TOP_K_MIN,
                max_value=TOP_K_MAX,
                value=default_top_k,
                step=1,
            )
        additional = st.text_area(
            "Additional preferences (optional)",
            placeholder="e.g. family-friendly, quiet ambience, craft beer, quick service",
            height=90,
        )
        dry_run = st.checkbox(
            "Dry run (skip Groq, use rating-sorted explanations)",
            value=bool(settings.llm_dry_run),
        )
        submitted = st.form_submit_button(
            "Get recommendations",
            type="primary",
            use_container_width=True,
        )

    if not submitted:
        return None

    try:
        prefs = UserPreferences(
            location=resolve_location(location),
            budget=budget,  # type: ignore[arg-type]
            cuisine=resolve_cuisine(cuisine),
            min_rating=float(min_rating),
            additional_preferences=additional.strip(),
            top_k=int(top_k),
        )
    except ValidationError as exc:
        _render_error(
            "Invalid preferences",
            "Please check your inputs and try again.",
            detail=str(exc),
        )
        return None

    st.session_state["last_dry_run"] = dry_run
    st.session_state["last_prefs"] = prefs
    return prefs


def _filter_summary(prefs: UserPreferences, result: RecommendationResponse) -> None:
    cuisine = prefs.cuisine or "Any cuisine"
    budget = _BUDGET_LABELS.get(prefs.budget, prefs.budget)
    meta = result.meta
    showing = f"Showing {meta.returned_count} of {prefs.top_k} requested"
    source_chip = ""
    if meta.source in {"fallback", "mock"}:
        source_chip = (
            f'<span class="bw-degraded">Degraded · {_esc(meta.source)}</span>'
        )
    elif meta.source == "llm":
        source_chip = '<span class="bw-chip"><span class="bw-chip-dot"></span>AI ranked</span>'

    st.markdown(
        f"""
        <div class="bw-summary">
          <div class="bw-summary-label">Active taste context</div>
          <div class="bw-summary-text">
            {_esc(prefs.location)} · {_esc(budget)} · Min ★{_esc(f"{prefs.min_rating:.1f}")}+ · {_esc(cuisine)}
          </div>
          <div class="bw-summary-meta">{_esc(showing)} · candidates {meta.candidate_count}</div>
          <div style="margin-top:0.5rem;">{source_chip}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _render_restaurant_card(item: RecommendationItem) -> None:
    rank_class = "bw-rank" if item.rank == 1 else "bw-rank secondary"
    card_class = "bw-card rank-1" if item.rank == 1 else "bw-card"
    tags = [
        t.strip()
        for t in (item.cuisine or "").split(",")
        if t.strip()
    ][:6]
    tags_html = "".join(f'<span class="bw-tag">{_esc(t)}</span>' for t in tags) or (
        '<span class="bw-tag">Cuisine n/a</span>'
    )

    st.markdown(
        f"""
        <article class="{card_class}">
          <div class="bw-card-top">
            <span class="{rank_class}">Rank #{item.rank}</span>
            <span class="bw-rating">★ {item.rating:.1f}</span>
          </div>
          <h3 class="bw-card-name">{_esc(item.name)}</h3>
          <div class="bw-card-meta">
            <span class="bw-cost">{_esc(_cost_label(item.estimated_cost))}</span>
          </div>
          <div class="bw-insight">
            <div class="bw-insight-label">Why this fits</div>
            <p>{_esc(item.explanation)}</p>
          </div>
          <div class="bw-tags">{tags_html}</div>
        </article>
        """,
        unsafe_allow_html=True,
    )


def _render_empty(result: RecommendationResponse) -> None:
    reason = result.meta.empty_reason or "No restaurants matched your filters."
    tips = result.meta.suggestions or [
        "Widen cuisine",
        "Lower min rating",
        "Change budget",
    ]
    chips = "".join(f'<span class="bw-suggestion">{_esc(tip)}</span>' for tip in tips)
    st.markdown(
        f"""
        <div class="bw-empty">
          <h2>No matches in this slice of Bangalore</h2>
          <p>{_esc(reason)}</p>
          <div class="bw-suggestions">{chips}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    with st.expander("Applied filters"):
        st.json(result.meta.filters_applied)


def _render_error(title: str, message: str, detail: str | None = None) -> None:
    detail_html = (
        f'<span>{_esc(detail)}</span>' if detail else "<span>Try again, or enable dry-run fallback.</span>"
    )
    st.markdown(
        f"""
        <div class="bw-error">
          <h2>{_esc(title)}</h2>
          <div class="bw-error-banner">
            <div>
              <strong>{_esc(message)}</strong>
              {detail_html}
            </div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _render_loading() -> None:
    st.markdown(
        """
        <div class="bw-loading">
          <div class="bw-loading-title">Filtering matches · Asking the AI…</div>
          <p class="bw-loading-sub">Hard filters first, then ranking and explanations.</p>
          <div class="bw-skeleton"></div>
          <div class="bw-skeleton"></div>
          <div class="bw-skeleton"></div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _render_meta(result: RecommendationResponse) -> None:
    meta = result.meta
    cols = st.columns(4)
    cols[0].metric("Candidates", meta.candidate_count)
    cols[1].metric("Returned", meta.returned_count)
    cols[2].metric("Source", meta.source)
    latency = f"{meta.latency_ms:.0f} ms" if meta.latency_ms is not None else "—"
    cols[3].metric("LLM latency", latency)

    with st.expander("Applied filters", expanded=False):
        st.json(meta.filters_applied)
        if meta.match_count_before_cap:
            st.caption(
                f"Matches before candidate cap: {meta.match_count_before_cap}"
                + (" (capped)" if meta.capped else "")
            )
        if meta.message and meta.source != "empty":
            st.info(meta.message)


def _render_results(prefs: UserPreferences, result: RecommendationResponse) -> None:
    if result.meta.empty:
        _render_empty(result)
        return

    _filter_summary(prefs, result)
    _render_meta(result)

    if result.summary:
        st.markdown(
            f"""
            <div class="bw-panel" style="margin-top:0.5rem;">
              <div class="bw-panel-title">AI summary</div>
              <p class="bw-panel-sub" style="margin:0;color:#F2F4F8;">{_esc(result.summary)}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    if not result.items:
        st.warning("No recommendations to display.")
        return

    st.markdown(
        """
        <div class="bw-section-head">
          <h2>Curated recommendations</h2>
          <span>Ranked by preference fit</span>
        </div>
        """,
        unsafe_allow_html=True,
    )
    for item in result.items:
        _render_restaurant_card(item)


def _run_recommend(prefs: UserPreferences, df: pd.DataFrame) -> RecommendationResponse | None:
    dry_run = bool(st.session_state.get("last_dry_run", False))
    placeholder = st.empty()
    with placeholder.container():
        _render_loading()
    try:
        with st.spinner(""):
            result = recommend(prefs, df=df, dry_run=dry_run if dry_run else None)
        placeholder.empty()
        return result
    except FileNotFoundError as exc:
        placeholder.empty()
        _render_error("Dataset missing", "Processed restaurant data was not found.", str(exc))
        return None
    except ValidationError as exc:
        placeholder.empty()
        _render_error(
            "Response validation failed",
            "Could not validate recommendation response.",
            str(exc),
        )
        return None
    except Exception as exc:  # noqa: BLE001 — never show raw stack traces in UI
        logger.exception("Recommend failed in UI")
        placeholder.empty()
        _render_error(
            "Recommendation engine interrupted",
            "Something went wrong while generating recommendations.",
            str(exc),
        )
        return None


def _render_footer() -> None:
    st.markdown(
        """
        <div class="bw-footer">
          <span>BiteWise AI · Urban culinary intelligence</span>
          <span>Indiranagar · Koramangala · Whitefield · CBD</span>
        </div>
        """,
        unsafe_allow_html=True,
    )


def main() -> None:
    st.set_page_config(
        page_title="BiteWise · Bangalore AI Recommender",
        page_icon="🍽️",
        layout="wide",
        initial_sidebar_state="collapsed",
    )
    _inject_theme()

    df, load_error = _load_data()
    _render_topbar(len(df) if df is not None else None)
    _render_sidebar_status(df)
    _render_hero()

    if load_error:
        _render_error(
            "Restaurant data unavailable",
            load_error,
            "Run preprocessing first: python -m src.ingestion.preprocess",
        )
        _render_footer()
        return

    assert df is not None
    prefs = _preference_form(df)

    if prefs is None:
        last = st.session_state.get("last_result")
        last_prefs = st.session_state.get("last_prefs")
        if isinstance(last, RecommendationResponse) and isinstance(last_prefs, UserPreferences):
            _render_results(last_prefs, last)
        else:
            st.caption("Submit preferences to see ranked recommendations with AI explanations.")
        _render_footer()
        return

    result = _run_recommend(prefs, df)
    if result is not None:
        st.session_state["last_result"] = result
        _render_results(prefs, result)

    _render_footer()


if __name__ == "__main__":
    main()
