# AI-Powered Restaurant Recommendation System (Zomato)

Hybrid restaurant recommender: **filter a real Zomato dataset** by user preferences, then use an **LLM** to rank candidates and explain why they fit.

## Docs

| Doc | Description |
| --- | --- |
| [docs/problemStatement.md](docs/problemStatement.md) | Product context |
| [docs/architecture.md](docs/architecture.md) | System design |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phase-wise build plan |
| [docs/edge-case.md](docs/edge-case.md) | Edge cases & corner scenarios |
| [docs/deployment-plan.md](docs/deployment-plan.md) | Railway (API) + Vercel (Next.js) deploy plan |

## Setup (Phase 0)

### 1. Create a virtual environment

```powershell
cd C:\Users\GVB\Desktop\AI_Projects\Zomato
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment

```powershell
copy .env.example .env
```

Edit `.env` and set `LLM_API_KEY` to your [Groq API key](https://console.groq.com/keys)
(or set `GROQ_API_KEY`). Defaults use Groq (`LLM_BASE_URL=https://api.groq.com/openai/v1`,
`LLM_MODEL=openai/gpt-oss-20b`). Set `LLM_DRY_RUN=true` for offline mock recommendations.

### 4. Verify settings load

```powershell
python -c "from src.config import get_settings; print(get_settings())"
```

### 5. Run smoke tests

```powershell
pytest -q
```

## Project layout

```text
Zomato/
├── data/
│   ├── raw/              # cached Hugging Face downloads (Phase 1)
│   └── processed/        # cleaned restaurant store (Phase 1)
├── docs/
├── src/
│   ├── config.py         # settings loader
│   ├── ingestion/        # Phase 1
│   ├── filtering/        # Phase 2
│   ├── llm/              # Phase 3
│   ├── ui/               # Phase 5 (Streamlit)
│   └── api/              # Phase 7 (FastAPI, optional)
├── tests/
├── .env.example
└── requirements.txt
```

## Dataset

- Hugging Face: [`jason1966/absin7_zomato-bangalore-dataset`](https://huggingface.co/datasets/jason1966/absin7_zomato-bangalore-dataset)
- Field reference: [docs/data-dictionary.md](docs/data-dictionary.md)

## Current status

**Phase 5 + deploy path** — Streamlit BiteWise UI, FastAPI (`src/api`), and Next.js frontend (`frontend/`) ready for Railway + Vercel (see [docs/deployment-plan.md](docs/deployment-plan.md)).

Next: deploy hosts + Phase 6 hardening as needed.

## Run preprocessing (Phase 1)

```powershell
python -m src.ingestion.preprocess
# Force reload from Hugging Face (ignore data/raw cache):
python -m src.ingestion.preprocess --no-cache
```

Output: `data/processed/restaurants.parquet` (+ `preprocess_summary.json`).

## CLI demo (Phase 4)

```powershell
# Live Groq ranking (needs LLM_API_KEY in .env)
python -m src.pipeline --location Bangalore --budget medium --cuisine Italian --min-rating 4.0

# Offline mock explanations
python -m src.pipeline --location Indiranagar --budget medium --cuisine Italian --min-rating 4.0 --dry-run -v

# Soft preferences + top-k
python -m src.pipeline --location Bangalore --budget high --cuisine "North Indian" --min-rating 4.2 --additional-preferences "family friendly" --top-k 3
```

## Streamlit UI (Phase 5) — BiteWise

Dark UI based on Google Stitch mocks in `stitch_bitewise_ai_frontend/` (home, results, empty, error, loading).

```powershell
# From the project root (with .venv activated)
cd C:\Users\GVB\Desktop\AI_Projects\Zomato
streamlit run src/ui/app.py
```

Then open the local URL Streamlit prints (usually `http://localhost:8501`).

Use the form to set location, budget, cuisine, min rating, soft preferences, and top K.
Check **Dry run** to skip Groq and use rating-sorted explanations.

## FastAPI (Phase 7) — Railway target

```powershell
# From the project root (with .venv activated)
python scripts/ensure_data.py
uvicorn src.api.main:app --reload --port 8000
```

- Docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/health  
- Env: set `CORS_ORIGINS` and `LLM_API_KEY` (see `.env.example`).  
- Container: `Dockerfile` + `railway.toml`.

## Next.js frontend — Vercel target

```powershell
# Terminal 1: API on :8000 (above)
# Terminal 2:
cd frontend
copy .env.example .env.local   # if needed; defaults to http://127.0.0.1:8000
npm install
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL` to your Railway URL for production (Vercel Root Directory = `frontend`).
