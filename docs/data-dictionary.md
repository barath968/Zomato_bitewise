# Data Dictionary — Processed Restaurants

## Source dataset

| Item | Value |
| --- | --- |
| Hugging Face id | `jason1966/absin7_zomato-bangalore-dataset` |
| URL | https://huggingface.co/datasets/jason1966/absin7_zomato-bangalore-dataset |
| Origin | Zomato Bangalore restaurants (Kaggle / community mirror) |
| Coverage | Bangalore localities |

Configured via `HF_DATASET_ID` in `.env` (default above).

## Processed artifact

| Item | Value |
| --- | --- |
| Path | `data/processed/restaurants.parquet` (override with `PROCESSED_DATA_PATH`) |
| Raw cache | Hugging Face `datasets` cache + optional CSV under `data/raw/` |

## Columns

| Column | Type | Description |
| --- | --- | --- |
| `id` | string | Stable id: `{normalized_name}::{normalized_location}` |
| `name` | string | Restaurant name |
| `location` | string | Locality / area (e.g. Banashankari) |
| `cuisines` | string | Comma-separated cuisine list (normalized spacing) |
| `rating` | float | Numeric rating on a 0–5 scale |
| `votes` | int | Number of rating votes (0 if missing) |
| `approx_cost` | float | Approximate cost for two (INR) |
| `budget_bucket` | string | `low` \| `medium` \| `high` from `approx_cost` |
| `rest_type` | string | Restaurant type (e.g. Casual Dining), may be empty |
| `listed_in_city` | string | Listed-in city/area from source, may be empty |

## Budget bucket thresholds (INR, cost for two)

| Bucket | Rule |
| --- | --- |
| `low` | `approx_cost < 500` |
| `medium` | `500 <= approx_cost <= 1000` |
| `high` | `approx_cost > 1000` |

## Cleaning rules

- Drop rows missing `name`, `location`, or `cuisines`
- Parse `rate` values like `4.1/5`; drop `NEW`, `-`, blank, and non-numeric
- Parse `approx_cost(for two people)` (strip commas); drop unparseable costs
- Normalize whitespace/case on location and cuisine tokens
- Deduplicate on `(name, location)` keeping the highest `votes` row

## Row counts (latest preprocess)

| Stage | Count |
| --- | --- |
| Raw rows | 51,717 |
| After cleaning / dedupe | 9,216 |
| Unique locations | 92 |

Drop breakdown (approx.): missing core fields 45 · invalid rating 10,018 · invalid cost 244 · duplicates 32,194.

See also `data/processed/preprocess_summary.json` after each run.
