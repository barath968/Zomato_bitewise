"""Application settings loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

# Groq OpenAI-compatible endpoint (https://console.groq.com/docs/openai)
DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
# Fast, widely available Groq production chat model.
DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b"
DEFAULT_HF_DATASET_ID = "jason1966/absin7_zomato-bangalore-dataset"


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def _env_str(name: str, default: str = "") -> str:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip()


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _resolve_llm_api_key() -> str:
    """Prefer LLM_API_KEY; accept GROQ_API_KEY as a Groq-native alias."""
    key = _env_str("LLM_API_KEY")
    if key:
        return key
    return _env_str("GROQ_API_KEY")


@dataclass(frozen=True)
class Settings:
    """Runtime configuration with safe defaults for non-secret knobs."""

    llm_api_key: str
    llm_model: str
    llm_base_url: str
    llm_dry_run: bool
    candidate_cap: int
    top_k: int
    processed_data_path: Path
    raw_data_dir: Path
    project_root: Path
    hf_dataset_id: str

    @property
    def has_llm_api_key(self) -> bool:
        return bool(self.llm_api_key) and self.llm_api_key != "your_api_key_here"


def get_settings() -> Settings:
    """Load settings from `.env` / process environment."""
    candidate_cap = max(1, _env_int("CANDIDATE_CAP", 25))
    top_k = max(1, _env_int("TOP_K", 5))

    # Keep top_k from exceeding the candidate window when both are set.
    if top_k > candidate_cap:
        top_k = candidate_cap

    processed = _env_str("PROCESSED_DATA_PATH", "data/processed/restaurants.parquet")
    raw_dir = _env_str("RAW_DATA_DIR", "data/raw")

    processed_path = Path(processed)
    if not processed_path.is_absolute():
        processed_path = PROJECT_ROOT / processed_path

    raw_path = Path(raw_dir)
    if not raw_path.is_absolute():
        raw_path = PROJECT_ROOT / raw_path

    return Settings(
        llm_api_key=_resolve_llm_api_key(),
        llm_model=_env_str("LLM_MODEL", DEFAULT_GROQ_MODEL) or DEFAULT_GROQ_MODEL,
        llm_base_url=_env_str("LLM_BASE_URL", DEFAULT_GROQ_BASE_URL)
        or DEFAULT_GROQ_BASE_URL,
        llm_dry_run=_env_bool("LLM_DRY_RUN", False),
        candidate_cap=candidate_cap,
        top_k=top_k,
        processed_data_path=processed_path,
        raw_data_dir=raw_path,
        project_root=PROJECT_ROOT,
        hf_dataset_id=_env_str("HF_DATASET_ID", DEFAULT_HF_DATASET_ID)
        or DEFAULT_HF_DATASET_ID,
    )
