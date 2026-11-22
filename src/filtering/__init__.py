"""Preference-based restaurant filtering."""

from src.filtering.models import FilterResult, UserPreferences
from src.filtering.restaurant_filter import filter_restaurants

__all__ = [
    "FilterResult",
    "UserPreferences",
    "filter_restaurants",
]
