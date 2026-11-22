# Edge Cases & Corner Scenarios

Catalog of edge cases and corner scenarios for the AI-Powered Restaurant Recommendation System. Derived from `architecture.md` and `implementation-plan.md`.

**How to use:** Treat each case as a test or acceptance scenario. Severity guides priority during Phase 6 hardening.

| Severity | Meaning |
| --- | --- |
| **P0** | Must handle for MVP; incorrect behavior breaks trust or crashes |
| **P1** | Should handle for solid MVP; degrades UX if ignored |
| **P2** | Nice-to-have / production polish |

---

## 1. Data Ingestion & Preprocessing

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| D-01 | Hugging Face dataset unavailable / network failure | Clear error; do not overwrite a good existing `data/processed` artifact | P0 |
| D-02 | Dataset schema differs from expected column names | Fail fast with a schema mismatch message; document required columns | P0 |
| D-03 | Rating stored as strings (`"4.1/5"`, `"NEW"`, `"-"`, `""`) | Coerce valid ratings to float; drop or flag non-numeric / sentinel values | P0 |
| D-04 | Cost stored as strings with commas (`"1,200"`) or ranges | Parse to numeric; define rule for unparseable costs (drop or `unknown` bucket) | P0 |
| D-05 | Missing `name`, `location`, or `cuisines` | Drop row or exclude from recommendable set; never recommend nameless venues | P0 |
| D-06 | Duplicate restaurant rows (same name + location) | Deduplicate or keep highest-votes / most complete row | P1 |
| D-07 | Empty dataset after cleaning | Abort pipeline with “no usable restaurants”; UI/API must not call LLM | P0 |
| D-08 | Extremely large raw file / memory pressure | Prefer chunked load or Parquet; document min machine requirements | P2 |
| D-09 | Cost exactly on budget bucket boundaries | Deterministic thresholds (document cutoffs); same cost always maps to same bucket | P1 |
| D-10 | Multi-cuisine cell (`"North Indian, Chinese, Italian"`) | Store as list or normalized tokens; filter must match any constituent cuisine | P0 |
| D-11 | Location naming variants (`Bangalore` vs `Bengaluru`, typos, extra spaces) | Normalize case/whitespace; document whether city aliases are supported | P1 |
| D-12 | Cuisine aliases (`"Chiniese"`, `"North-Indian"` vs `"North Indian"`) | Normalize separators/case; optional alias map; do not silently match unrelated cuisines | P1 |
| D-13 | Votes missing when used for candidate ranking | Fall back to rating-only sort; do not crash on NaN votes | P1 |
| D-14 | Re-running preprocess with existing processed file | Idempotent overwrite or versioned output; document which | P2 |
| D-15 | Corrupted / partial processed Parquet or CSV | Detect load failure; force re-preprocess or show actionable error | P0 |

---

## 2. User Input & Validation

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| U-01 | Missing required `location` | Reject with validation error before filtering | P0 |
| U-02 | Missing `budget` | Reject or apply documented default; prefer explicit reject for MVP clarity | P0 |
| U-03 | Invalid budget value (not low/medium/high) | Validation error with allowed values | P0 |
| U-04 | `min_rating` omitted | Apply documented default (e.g. `0` or `3.5`) | P1 |
| U-05 | `min_rating` out of range (`-1`, `6`, `999`) | Clamp to valid scale or reject | P0 |
| U-06 | `min_rating` as string / non-numeric | Validation error | P0 |
| U-07 | Empty cuisine string | Treat as “any cuisine” **or** reject — pick one rule and document it | P1 |
| U-08 | Multiple cuisines requested | Match restaurants containing **any** or **all**? Document; prefer **any** for MVP | P1 |
| U-09 | `top_k` below minimum or above maximum | Clamp to configured bounds (e.g. 3–10) | P0 |
| U-10 | `top_k` > candidate count after filter | Return all candidates (fewer than `top_k`); do not pad with fakes | P0 |
| U-11 | `top_k` = 0 or negative | Reject or clamp to minimum | P0 |
| U-12 | Extremely long `additional_preferences` text | Truncate for prompt size; keep full text out of logs if sensitive | P1 |
| U-13 | Conflicting soft prefs (`"quiet romantic"` + `"loud sports bar vibe"`) | Let LLM reconcile in explanation; do not crash | P2 |
| U-14 | Soft prefs that contradict hard filters (`budget=low` + `"fine dining tasting menu"`) | Hard filters win; explanation may note tradeoff | P1 |
| U-15 | Special characters / injection-like text in free fields | Treat as plain text in prompt; escape/sanitize for UI display | P1 |
| U-16 | Whitespace-only inputs | Trim; treat as empty → validation rules above | P0 |
| U-17 | Case variants in location/cuisine input | Case-insensitive matching after normalization | P0 |

---

## 3. Filtering & Shortlist

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| F-01 | No restaurants match all hard filters | Return structured empty result; **skip LLM**; suggest relaxing filters | P0 |
| F-02 | Only one restaurant matches | Still call LLM (optional) or return single item with explanation; never invent peers | P0 |
| F-03 | Matches exceed `CANDIDATE_CAP` | Keep top N by rating/votes; record that capping occurred in meta | P0 |
| F-04 | Exact `CANDIDATE_CAP` matches | No silent drop; pass all capped set | P1 |
| F-05 | Location matches city but not locality (or vice versa) | Define match granularity (exact locality vs contains city); document coverage limits | P1 |
| F-06 | Cuisine substring false positives (`"Indian"` matching `"Indo-Chinese"` only if intended) | Use token/boundary-aware matching, not naive unchecked substring if it causes bad matches | P1 |
| F-07 | Restaurant has empty `budget_bucket` | Exclude from budget-filtered queries or treat as unmatched | P0 |
| F-08 | Rating equals `min_rating` exactly | Include (`rating >= min_rating`) | P0 |
| F-09 | All candidates have identical rating/votes when capping | Stable secondary sort (e.g. name, id) for deterministic shortlists | P1 |
| F-10 | Filter returns candidates but all lack explanations-critical fields | Do not send incomplete rows to LLM; drop or fill safe defaults | P1 |
| F-11 | User asks for cuisine absent in that location | Empty shortlist + helpful message (try nearby cuisine / lower rating) | P0 |
| F-12 | Very high `min_rating` (e.g. 4.9) in sparse area | Empty or tiny shortlist; UI explains scarcity | P1 |

---

## 4. Prompt Building & Context Packing

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| P-01 | Candidate list would exceed model context window | Enforce candidate cap + compact fields only; never dump raw reviews/menus | P0 |
| P-02 | Restaurant names contain quotes / JSON-breaking characters | Serialize safely (JSON encode); avoid brittle string concat | P0 |
| P-03 | Duplicate names in shortlist (different locations) | Include disambiguators (location / id) in prompt records | P0 |
| P-04 | Soft preferences empty | Prompt still valid; rank on hard prefs + quality signals | P1 |
| P-05 | Soft preferences in non-English | Accept text; quality depends on model; do not crash | P2 |
| P-06 | Prompt accidentally includes API keys or env secrets | Never interpolate secrets into prompts | P0 |

---

## 5. LLM Recommendation Engine

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| L-01 | Missing / invalid API key | Fallback to rating-sorted shortlist + template explanations (or clear config error in strict mode) | P0 |
| L-02 | LLM timeout / network error | Retry policy (documented); then fallback | P0 |
| L-03 | Rate limit / 429 from provider | Backoff or fallback; user-visible “temporary issue” message | P1 |
| L-04 | Non-JSON / malformed JSON response | One retry; then fallback | P0 |
| L-05 | JSON valid but missing required fields | Reject item or full payload; retry/fallback | P0 |
| L-06 | LLM invents restaurant not in candidate list | **Grounding check drops** hallucinated items; if too few remain, refill from sorted shortlist | P0 |
| L-07 | LLM renames restaurant slightly (`"Jalsa"` → `"Jalsa Restaurant"`) | Fuzzy match within candidates or drop; do not accept unbound names | P0 |
| L-08 | LLM returns more than `top_k` items | Truncate to `top_k` after grounding | P1 |
| L-09 | LLM returns fewer than `top_k` but more candidates exist | Accept fewer **or** backfill from leftover candidates with template text — document choice | P1 |
| L-10 | LLM returns duplicate ranks or duplicate restaurants | Deduplicate; resequence ranks 1..n | P1 |
| L-11 | Explanations empty or generic (“Good place”) | Prefer retry once; else keep item with template explanation referencing prefs | P1 |
| L-12 | Explanation contradicts hard filters (claims cheap when budget filter was high only) | Prefer dataset fields for cost/rating display; treat explanation as advisory | P1 |
| L-13 | LLM alters rating/cost away from dataset | **Display dataset values**, not model-overwritten facts; use LLM for rank + explanation only | P0 |
| L-14 | Model returns markdown fences around JSON | Strip fences before parse | P1 |
| L-15 | Partial streaming failure (if streaming used) | Do not show half-parsed UI state; wait for complete payload or fallback | P2 |
| L-16 | Mock / dry-run mode enabled | Deterministic fake structured output from shortlist; no external calls | P1 |
| L-17 | Provider returns content-policy refusal | Fallback path; log reason | P1 |

---

## 6. Orchestration / Pipeline

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| O-01 | Processed dataset file missing at runtime | Fail with “run preprocessing first” guidance | P0 |
| O-02 | Dataset loaded but empty | Same as D-07 / F-01 — no LLM call | P0 |
| O-03 | Concurrent requests (API/UI) mutating shared DataFrame | Use read-only shared frame or copy-on-write; avoid racey filters | P1 |
| O-04 | First request cold-start (load dataset + LLM) | Accept higher latency; optional warm-up at startup | P2 |
| O-05 | Pipeline called with already-validated vs raw prefs | Single validation boundary in orchestrator | P1 |
| O-06 | Meta fields missing in response | Always attach `candidate_count` and `filters_applied` | P1 |
| O-07 | Fallback used — should response indicate it? | Include `meta.degraded=true` or `meta.source=fallback` for UI honesty | P1 |

---

## 7. UI (Streamlit MVP)

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| UI-01 | Submit with empty required fields | Inline validation; no spinner forever | P0 |
| UI-02 | No matches | Friendly empty state + suggestions (widen cuisine, lower rating, change budget) | P0 |
| UI-03 | LLM / pipeline error | Human-readable error; **no raw stack traces** | P0 |
| UI-04 | Long explanations | Wrap/clamp height; full text readable | P2 |
| UI-05 | Special characters in restaurant names | Render safely (no HTML injection) | P1 |
| UI-06 | Double-click submit / rapid resubmit | Disable button while running or debounce | P1 |
| UI-07 | Location dropdown empty (preprocess failed) | Show setup error instead of blank controls | P0 |
| UI-08 | `top_k` slider vs actual fewer results | Label like “Showing 2 of 5 requested” | P1 |
| UI-09 | Soft preference influences not obvious | Spot-check copy; optional “matched soft prefs” hint in explanation | P2 |
| UI-10 | Session rerun reloads huge dataset repeatedly | Cache processed data (`st.cache_data`) | P1 |

---

## 8. API (Phase 7 Optional)

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| A-01 | Invalid JSON body / wrong types | `422` with field errors | P0 |
| A-02 | Extra unknown fields | Ignore or reject per API policy (document) | P2 |
| A-03 | Missing processed data at process start | Fail startup or `/health` unhealthy | P0 |
| A-04 | Oversized request body (huge preferences string) | Size limit + `413`/`422` | P1 |
| A-05 | High request volume | Rate limiting / queue (production); at least fail gracefully | P2 |
| A-06 | CORS / unauthorized browser client | Configure CORS intentionally; do not expose keys | P1 |

---

## 9. Config, Security & Environment

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| C-01 | `.env` missing | Sensible defaults for non-secret knobs; LLM key absence triggers fallback/strict error | P0 |
| C-02 | `CANDIDATE_CAP` < `TOP_K` | Clamp or warn; `top_k` cannot exceed candidates anyway | P1 |
| C-03 | Secrets committed to git | `.gitignore` for `.env`; only `.env.example` committed | P0 |
| C-04 | Logging preference payloads | Avoid logging full free-text if it may contain personal data; log counts/filters | P2 |

---

## 10. Cross-Cutting Corner Scenarios

| ID | Scenario | Expected behavior | Severity |
| --- | --- | --- | --- |
| X-01 | **Filter-first invariant** — LLM never runs on unfiltered full dataset | Always shortlist before prompt | P0 |
| X-02 | **Grounding invariant** — no invented restaurants in final UI/API output | Post-validate every item against candidate set | P0 |
| X-03 | **Fact fidelity** — displayed rating/cost come from dataset | LLM may rank/explain but not rewrite facts | P0 |
| X-04 | **Graceful degradation chain** | Empty filter → no LLM; LLM fail → template ranking; never blank crash | P0 |
| X-05 | Soft preference with no supporting columns in data | LLM may still reason from name/type/cuisine text; avoid fabricating amenities | P1 |
| X-06 | User wants vegetarian / allergen constraints only in free text | Best-effort via LLM; disclaimer that dataset may lack explicit flags | P1 |
| X-07 | Closed / permanently shut restaurants still in dataset | Out of scope unless dataset has status field; document staleness risk | P2 |
| X-08 | Same restaurant listed under multiple localities | May appear once after dedupe or once per locality — document | P2 |

---

## 11. Priority Test Matrix (MVP)

Minimum automated / manual coverage before calling MVP done:

| Priority | Cases to cover |
| --- | --- |
| P0 filters | F-01, F-02, F-03, F-08, F-11 |
| P0 data | D-03, D-04, D-05, D-07, D-10, D-15 |
| P0 input | U-01, U-03, U-05, U-09, U-10, U-16, U-17 |
| P0 LLM | L-01, L-02, L-04, L-06, L-07, L-13 |
| P0 UX/API | UI-02, UI-03, O-01, X-01–X-04 |

---

## 12. Suggested Empty-State Copy Triggers

When F-01 / F-11 / F-12 occur, UI should suggest one or more of:

1. Lower minimum rating  
2. Broaden or clear cuisine  
3. Change budget tier  
4. Try a nearby / alternate location spelling  
5. Remove conflicting soft constraints from free text  

---

## Related Docs

| Doc | Role |
| --- | --- |
| `docs/problemStatement.md` | Product goals |
| `docs/architecture.md` | System design & guardrails |
| `docs/implementation-plan.md` | When to implement/test these cases (esp. Phases 2, 3, 6) |

Update this file when new failure modes are discovered during implementation.
