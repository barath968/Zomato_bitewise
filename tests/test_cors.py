"""CORS helper unit tests."""

from src.api.cors import cors_origin_regex, parse_cors_origins


def test_parse_cors_origins_defaults():
    origins = parse_cors_origins("")
    assert "http://localhost:3000" in origins
    assert "http://127.0.0.1:3000" in origins


def test_parse_cors_origins_merges_custom():
    origins = parse_cors_origins(
        "https://bitewise.vercel.app, https://*.vercel.app"
    )
    assert "https://bitewise.vercel.app" in origins
    assert "http://localhost:3000" in origins
    assert all("*" not in o for o in origins)


def test_cors_origin_regex_vercel_wildcard():
    regex = cors_origin_regex("https://*.vercel.app")
    assert regex is not None
    assert "vercel" in regex
