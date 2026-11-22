"""CORS origin parsing for local + Vercel + Railway frontends."""

from __future__ import annotations

import os
import re

_DEFAULT_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8501",
    "http://127.0.0.1:8501",
    "http://localhost:8502",
    "http://127.0.0.1:8502",
)


def parse_cors_origins(raw: str | None = None) -> list[str]:
    """
    Parse CORS_ORIGINS (comma-separated).

    Supports exact origins and a single wildcard host pattern:
    ``https://*.vercel.app`` (matches any https://<sub>.vercel.app).
    FastAPI's allow_origins needs concrete strings; wildcards are expanded
    via ``allow_origin_regex`` separately — this function returns exact origins only.
    """
    text = (raw if raw is not None else os.getenv("CORS_ORIGINS", "")).strip()
    if not text:
        return list(_DEFAULT_ORIGINS)
    origins: list[str] = []
    for part in text.split(","):
        item = part.strip().rstrip("/")
        if not item or "*" in item:
            continue
        origins.append(item)
    # Always keep local defaults for dual-run / Streamlit.
    for default in _DEFAULT_ORIGINS:
        if default not in origins:
            origins.append(default)
    return origins


def cors_origin_regex(raw: str | None = None) -> str | None:
    """Build an origin regex for wildcard entries like https://*.vercel.app."""
    text = (raw if raw is not None else os.getenv("CORS_ORIGINS", "")).strip()
    patterns: list[str] = []
    source = text.split(",") if text else ["https://*.vercel.app"]
    for part in source:
        item = part.strip().rstrip("/")
        if not item or "*" not in item:
            continue
        # Escape then turn *. into a subdomain matcher.
        escaped = re.escape(item).replace(r"\*", r"[a-zA-Z0-9-]+")
        patterns.append(f"^{escaped}$")
    if not patterns:
        # Default: allow Vercel preview/production subdomains when CORS_ORIGINS unset.
        if not text:
            return r"^https://[a-zA-Z0-9-]+\.vercel\.app$"
        return None
    return "|".join(patterns)
