# Implementation Plan — AI-Powered Restaurant Recommendation System

Phase-wise plan for building the system described in `problemStatement.md` and `architecture.md`.

**MVP stack:** Python 3.11+ · pandas · Hugging Face datasets · LLM API · Streamlit  
**Later (optional):** FastAPI service · richer frontend · SQLite / cached store

---

## Phase Map

| Phase | Name | Outcome |
| --- | --- | --- |
| 0 | Project setup | Runnable repo skeleton and config |
| 1 | Data ingestion | Clean, queryable restaurant dataset |
| 2 | Filtering layer | Preference → candidate shortlist |
| 3 | LLM recommendation engine | Ranked results with explanations |
| 4 | End-to-end orchestration | Single recommend pipeline |
| 5 | UI (MVP) | User can submit prefs and see results |
| 6 | Hardening & quality | Fallbacks, tests, logging |
| 7 | Optional API / production path | FastAPI + deployment readiness |

Each phase has **goals**, **tasks**, **deliverables**, and **exit criteria**. Do not start the next phase until exit criteria are met.

---

## Phase 0 — Project Setup

### Goals

- Establish a clean, reproducible project structure
- Lock dependencies and environment configuration

### Tasks

1. Create the folder layout from architecture (`src/`, `data/`, `tests/`, `docs/`)
2. Add `requirements.txt` (or `pyproject.toml`) with:
   - `pandas`, `datasets`, `python-dotenv`
   - LLM client (e.g. `openai` or provider SDK)
   - `streamlit` (for Phase 5)
   - `pytest` (for Phase 6)
3. Add `.env.example` for `LLM_API_KEY`, `LLM_MODEL`, `CANDIDATE_CAP`, `TOP_K`
4. Add settings loader (`src/config.py`) that reads env vars with safe defaults
5. Add a minimal `README.md` with setup steps (install, env, run)

### Deliverables

- Repo skeleton matching architecture module layout
- Working virtualenv + installable dependencies
- Config module and `.env.example`

### Exit criteria

- [ ] `pip install -r requirements.txt` succeeds
- [ ] App can load settings without crashing when `.env` is present
- [ ] Empty package modules import cleanly

---

## Phase 1 — Data Ingestion & Preprocessing

### Goals

- Load the Zomato dataset from Hugging Face
- Produce a stable processed restaurant store for filtering

### Tasks

1. Identify and document the exact Hugging Face dataset URL/id in docs
2. Implement `src/ingestion/load_dataset.py`
   - Download/load dataset
   - Optionally cache raw files under `data/raw/`
3. Implement `src/ingestion/preprocess.py`
   - Keep/map fields: name, location, cuisine(s), cost, rating (+ optional votes, rest_type)
   - Coerce rating to numeric; drop or impute invalid rows
   - Normalize location/cuisine strings
   - Map `approx_cost` → `budget_bucket` (`low` / `medium` / `high`)
4. Write processed output to `data/processed/restaurants.parquet` (or CSV)
5. Add a small CLI or script: `python -m src.ingestion.preprocess` (or equivalent)

### Deliverables

- Preprocessing script
- Processed dataset artifact
- Short data dictionary note (column names + types) in docs or code comments

### Exit criteria

- [ ] Processed file exists and loads into a DataFrame
- [ ] Required columns present: `name`, `location`, `cuisines`, `rating`, `budget_bucket`
- [ ] Spot-check: Bangalore (or chosen city) rows exist with valid ratings
- [ ] Row count after cleaning is documented (before → after)

---

## Phase 2 — Preference Filtering (Integration Layer, Part A)

### Goals

- Convert user preferences into a grounded candidate shortlist
- Handle empty-match cases without calling the LLM

### Tasks

1. Define preference model / typed dict / pydantic model:
   - `location`, `budget`, `cuisine`, `min_rating`, `additional_preferences`, `top_k`
2. Implement `src/filtering/restaurant_filter.py`
   - Hard filters: location, budget bucket, cuisine containment, rating ≥ min
   - Candidate cap: keep top N by rating/votes (configurable `CANDIDATE_CAP`)
3. Return metadata: `candidate_count`, filters applied, empty-result reason
4. Unit-test filter logic with a tiny fixture DataFrame

### Deliverables

- Filter module with clear function signature, e.g. `filter_restaurants(df, prefs) -> FilterResult`
- Fixture-based tests for match / no-match / cuisine / rating edge cases

### Exit criteria

- [ ] Given sample prefs, returns only matching restaurants
- [ ] Empty shortlist path returns a structured “no matches” result
- [ ] Candidate list never exceeds configured cap
- [ ] Filter tests pass

---

## Phase 3 — LLM Recommendation Engine (Integration Layer, Part B)

### Goals

- Rank shortlisted restaurants with an LLM
- Produce structured explanations for each recommendation

### Tasks

1. Define response schema in `src/llm/schemas.py` (JSON shape from architecture)
2. Implement `src/llm/prompt_builder.py`
   - System prompt: recommend only from candidates; return JSON
   - User prompt: preferences + compact candidate list + `top_k`
3. Implement `src/llm/recommender.py`
   - Call LLM API
   - Prefer JSON / structured output mode
   - Parse and validate against schema
4. Implement fallbacks:
   - Parse failure → one retry
   - Still failing → rating-sorted shortlist + template explanations
5. Add a dry-run / mock mode for offline development (optional but recommended)

### Deliverables

- Prompt builder + recommender modules
- Validated structured recommendation objects
- Fallback path that never invents restaurants

### Exit criteria

- [ ] LLM returns parseable JSON for a known shortlist
- [ ] All recommended names exist in the candidate set
- [ ] Each item includes name, cuisine, rating, estimated cost, explanation
- [ ] Fallback works when API key is missing or response is invalid (in mock/fallback mode)

---

## Phase 4 — End-to-End Orchestration

### Goals

- Wire ingestion → filter → prompt → LLM → response into one pipeline
- Make the core use case callable without a UI

### Tasks

1. Implement orchestrator, e.g. `src/pipeline.py` / `recommend(prefs) -> RecommendationResponse`
2. Load processed dataset once (module-level or simple cache)
3. Flow:
   - validate prefs → filter → if empty return early → build prompt → LLM → attach meta
4. Add a CLI demo:
   - `python -m src.pipeline --location Bangalore --budget medium --cuisine Italian --min-rating 4.0`
5. Log key metrics: candidate count, LLM latency, parse success

### Deliverables

- Single entry-point recommend function
- CLI demo script
- Console-printed top recommendations with explanations

### Exit criteria

- [ ] One command produces ranked recommendations end-to-end
- [ ] Empty filter path skips LLM and prints a helpful message
- [ ] Meta includes `candidate_count` and applied filters
- [ ] Optional summary field supported when LLM provides it

---

## Phase 5 — MVP User Interface

### Goals

- Let a user enter preferences and see clear recommendation cards
- Match the Output Display requirements from the problem statement

### Tasks

1. Build Streamlit app in `src/ui/app.py` (or `app.py` at root)
2. Input controls:
   - Location (text or select from unique locations)
   - Budget (low / medium / high)
   - Cuisine (text or select)
   - Minimum rating (slider)
   - Additional preferences (text area)
   - Top K (slider)
3. On submit, call orchestrator and render results:
   - Restaurant Name, Cuisine, Rating, Estimated Cost, AI explanation
   - Optional overall summary
4. Empty-state UX: suggest relaxing filters
5. Show applied filters / candidate count for transparency

### Deliverables

- Runnable Streamlit UI
- README section: `streamlit run ...`

### Exit criteria

- [ ] User can complete a full recommend flow in the browser
- [ ] Results show all required output fields
- [ ] Empty and error states are readable (no raw stack traces in UI)
- [ ] Soft preferences visibly influence explanations (spot-check)

---

## Phase 6 — Hardening, Tests & Quality

### Goals

- Make the system reliable, grounded, and maintainable
- Cover critical paths with automated tests

### Tasks

1. Expand unit tests:
   - preprocessing helpers (budget bucketing, rating parse)
   - filters (combinations, caps)
   - prompt builder (contains prefs + candidates; excludes bulky fields)
   - JSON parse / schema validation
2. Add integration test with mocked LLM response
3. Enforce grounding check: reject LLM items not in candidate set
4. Improve logging and basic error messages
5. Document known limits (city coverage, cost bucket thresholds, model dependency)

### Deliverables

- `tests/` suite runnable via `pytest`
- Grounding validation in recommender pipeline
- Updated README troubleshooting section

### Exit criteria

- [ ] `pytest` passes
- [ ] Hallucinated restaurant names are dropped or trigger fallback
- [ ] Latency/cost knobs (`CANDIDATE_CAP`, `TOP_K`) documented and effective
- [ ] Happy path + no-match + LLM-failure paths all verified

---

## Phase 7 — Optional API & Production Path

### Goals

- Expose recommendations as an HTTP API
- Prepare for a non-Streamlit client if needed

### Tasks

1. Implement FastAPI app in `src/api/main.py`
   - `POST /recommend` with request/response models matching architecture schemas
2. Reuse the same orchestrator (no duplicated logic)
3. Add health endpoint and basic request validation errors
4. Optional: load processed data at startup; consider SQLite if dataset grows
5. Optional: containerize (`Dockerfile`) and document deploy steps
6. Optional: replace Streamlit with a React client consuming the API

### Deliverables

- FastAPI service with OpenAPI docs
- Shared pipeline used by both UI and API
- Deployment notes (local + optional container)

### Exit criteria

- [ ] `POST /recommend` returns schema-valid JSON
- [ ] Streamlit (or new client) can call the API interchangeably with in-process calls
- [ ] Startup fails clearly if processed data or API key is missing (as configured)

---

## Suggested Build Order (Checklist)

```text
Phase 0  Setup
   │
Phase 1  Dataset load + preprocess          ← grounded data
   │
Phase 2  Preference filters                 ← shortlist
   │
Phase 3  Prompts + LLM rank/explain         ← intelligence
   │
Phase 4  Pipeline + CLI demo                ← vertical slice
   │
Phase 5  Streamlit UI                       ← usable MVP
   │
Phase 6  Tests, fallbacks, grounding        ← solid MVP
   │
Phase 7  FastAPI / production (optional)
```

---

## Definition of Done (Project MVP)

The project is MVP-complete when:

1. Zomato data is loaded from Hugging Face and preprocessed locally
2. User preferences (location, budget, cuisine, min rating, extras) are accepted
3. Hard filters produce a real candidate shortlist from the dataset
4. An LLM ranks candidates and explains each pick in natural language
5. UI shows: name, cuisine, rating, estimated cost, AI explanation
6. Empty matches and LLM failures degrade gracefully
7. Recommendations are grounded in the filtered dataset (no invented restaurants)

---

## Tracking Notes

| Item | Location |
| --- | --- |
| Problem context | `docs/problemStatement.md` |
| System design | `docs/architecture.md` |
| This plan | `docs/implementation-plan.md` |

Update this plan if dataset choice, UI framework, or LLM provider decisions change during Phase 0–1.
