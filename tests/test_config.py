"""Phase 0: settings loader smoke tests."""

from src.config import (
    DEFAULT_GROQ_BASE_URL,
    DEFAULT_GROQ_MODEL,
    Settings,
    get_settings,
)


def test_get_settings_loads_without_crash():
    settings = get_settings()
    assert isinstance(settings, Settings)
    assert settings.candidate_cap >= 1
    assert settings.top_k >= 1
    assert settings.top_k <= settings.candidate_cap
    assert settings.llm_model
    assert settings.llm_base_url
    assert isinstance(settings.llm_dry_run, bool)
    assert settings.processed_data_path.name.endswith(".parquet")
    assert settings.project_root.exists()
    assert settings.hf_dataset_id


def test_groq_defaults_are_documented():
    assert DEFAULT_GROQ_BASE_URL.startswith("https://api.groq.com/")
    assert DEFAULT_GROQ_MODEL
