# Deployment Plan — BiteWise (Railway + Vercel)

Deploy the **entire product** as two services:

| Layer | Stack | Host | Role |
| --- | --- | --- | --- |
| **Backend** | FastAPI (`src/api/main.py`) + pandas + Groq | **Railway** | Filter dataset, call LLM, return JSON |
| **Frontend** | Next.js (`frontend/`) BiteWise dark UI | **Vercel** | Preference form + results; calls Railway API |

Local **Streamlit** (`src/ui/app.py`) remains a MVP/dev UI. Production traffic should go **Vercel → Railway**.

```text
┌─────────────────────┐         HTTPS          ┌──────────────────────────┐
│  Vercel (Next.js)   │ ─────────────────────▶ │  Railway (FastAPI)       │
│  bitewise.vercel…   │   /options /recommend  │  api.up.railway.app      │
│  NEXT_PUBLIC_API_URL│ ◀───────────────────── │  Groq + restaurants.parquet   │
└─────────────────────┘                        └──────────────────────────┘
```

---

## 0. Current readiness & gaps

### Ready today

- FastAPI app: `GET /health`, `GET /options`, `POST /recommend`
- Pipeline shared with Streamlit/CLI (`src.pipeline.recommend`)
- Processed artifact exists locally: `data/processed/restaurants.parquet`
- Next.js scaffold: `frontend/` (App Router + Tailwind + TypeScript)

### Gaps closed in code (ready to configure hosts)

| # | Gap | Status |
| --- | --- | --- |
| G1 | BiteWise Next UI | **Done** — `frontend/` App Router + components call `/options` + `/recommend` |
| G2 | Processed parquet for Railway | **Done** — track `data/processed/restaurants.parquet` (gitignore exception) + `scripts/ensure_data.py` preprocess fallback in Docker/`Procfile` |
| G3 | CORS for Vercel | **Done** — `CORS_ORIGINS` + `src/api/cors.py` (exact origins + `*.vercel.app` regex) |
| G4 | Docker / start command | **Done** — `Dockerfile`, `railway.toml`, `Procfile` |
| G5 | Frontend API URL | **Done** — `NEXT_PUBLIC_API_URL` via `frontend/.env.example` + `src/lib/api.ts` |
| G6 | Secrets on Railway | **Ops** — set `LLM_API_KEY` (etc.) in Railway dashboard; never commit `.env` |

**Remaining ops:** push repo → deploy Railway → set Vercel env → set `CORS_ORIGINS` to the Vercel domain → smoke-test.

---

## 1. Target architecture decisions

### 1.1 Why this split

- **Railway** fits long-lived Python workers, pandas memory, and Groq latency.
- **Vercel** fits static/SSR Next.js with global CDN and preview deploys.
- Keep **one recommendation pipeline** on the backend; frontend never talks to Groq directly.

### 1.2 Data on Railway

Choose **one** strategy (prefer A for MVP):

| Option | Approach | Pros | Cons |
| --- | --- | --- | --- |
| **A — Bake parquet** | Copy `data/processed/restaurants.parquet` into the deploy image / release commit | Fast cold start; no HF at runtime | Image ~few MB larger; refresh needs redeploy |
| **B — Build step** | `python -m src.ingestion.preprocess` in Railway start/release command | Always fresh from Hugging Face | Longer deploy; HF rate limits; needs network |
| **C — Volume / object storage** | Store parquet on S3/R2; download on boot | Clean CI; versioned data | Extra infra |

**MVP recommendation:** Option **A** — track a release copy (e.g. force-add `data/processed/restaurants.parquet` for deploy, or `COPY` it in Docker from a CI artifact). Keep regenerating via preprocess locally when the dataset changes.

### 1.3 Monorepo layout for two hosts

```text
Zomato/
├── src/                 # Railway root (Python)
├── data/processed/      # needed on Railway (see §1.2)
├── requirements.txt
├── Dockerfile           # to add
├── frontend/            # Vercel Root Directory = frontend
│   ├── package.json
│   └── ...
└── docs/deployment-plan.md
```

- **Railway:** root = repo root (or Docker build context = repo root).
- **Vercel:** Root Directory = `frontend`.

---

## 2. Pre-deploy checklist (code)

### 2.1 Backend (Railway)

- [ ] Confirm `uvicorn` can start: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add `Dockerfile` (recommended) **or** Nixpacks-friendly start command
- [ ] Expand CORS via env, e.g. `CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000`
- [ ] Ensure `/health` returns `status: ok` and a non-null `restaurant_count` after boot
- [ ] Guard Groq: production `LLM_DRY_RUN=false` + valid `LLM_API_KEY`
- [ ] Optional: request timeout / max body size; structured logging
- [ ] Optional: pin Python `3.11` or `3.12` in Docker/runtime

**Suggested `Dockerfile` shape (to implement):**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY data/processed ./data/processed
ENV PROCESSED_DATA_PATH=data/processed/restaurants.parquet
EXPOSE 8000
CMD ["sh", "-c", "uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Suggested Railway start (no Docker):**

```text
uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

### 2.2 Frontend (Vercel)

- [ ] Finish BiteWise pages/components (home, loading, results, empty, error)
- [ ] `lib/api.ts`: `GET ${API}/options`, `POST ${API}/recommend`
- [ ] `NEXT_PUBLIC_API_URL=https://<railway-public-url>` (no trailing slash)
- [ ] Loading / empty / error UX matching Stitch mocks
- [ ] `npm run build` succeeds locally
- [ ] Do **not** put `LLM_API_KEY` in Vercel — browser must never see Groq secrets

### 2.3 Repo / CI hygiene

- [ ] `.env` stays gitignored; use `.env.example` for names only
- [ ] Decide whether `frontend/node_modules` is ignored (must be)
- [ ] If baking parquet: either stop ignoring that one file for release, or inject via Docker/CI artifact
- [ ] Add smoke tests: `GET /health`, `POST /recommend` with dry-run in CI if desired

---

## 3. Railway — backend deploy

### 3.1 One-time setup

1. Push the repo to GitHub/GitLab (Railway connects via Git).
2. Create a Railway project → **New Service** → Deploy from repo.
3. Set **Root Directory** to `/` (repo root).
4. Choose **Dockerfile** (preferred) or Railpack/Nixpacks with custom start command.
5. Attach a **public domain** (Railway generates `*.up.railway.app`; optional custom domain later).

### 3.2 Environment variables (Railway)

| Variable | Example / notes |
| --- | --- |
| `LLM_API_KEY` | Groq key (required for live ranking) |
| `LLM_MODEL` | `openai/gpt-oss-20b` (or current Groq model) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
| `LLM_DRY_RUN` | `false` in prod; `true` only for demos without Groq |
| `CANDIDATE_CAP` | `25` |
| `TOP_K` | `5` |
| `PROCESSED_DATA_PATH` | `data/processed/restaurants.parquet` |
| `HF_DATASET_ID` | only if using preprocess-on-start (option B) |
| `CORS_ORIGINS` | `https://<vercel-domain>,https://<preview>.vercel.app,http://localhost:3000` |
| `PORT` | Railway injects automatically — do not hardcode |

### 3.3 Build / start

- **Docker:** Railway builds Dockerfile; `CMD` uses `$PORT`.
- **Nixpacks:** set install `pip install -r requirements.txt`; start `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`.
- If using option B: release command  
  `python -m src.ingestion.preprocess && uvicorn ...`

### 3.4 Verify Railway

```bash
curl https://<railway-url>/health
curl https://<railway-url>/options
curl -X POST https://<railway-url>/recommend \
  -H "Content-Type: application/json" \
  -d "{\"location\":\"Indiranagar\",\"budget\":\"medium\",\"cuisine\":\"Italian\",\"min_rating\":4.0,\"top_k\":3}"
```

Expect: `health.status == "ok"`, options lists non-empty, recommend returns `items` or structured empty meta.

OpenAPI: `https://<railway-url>/docs`

### 3.5 Railway scaling notes

- Memory: pandas + ~9k rows is light; still prefer **≥512 MB** RAM.
- Cold starts: keep one replica always on for demos if free tier sleeps.
- Timeouts: Groq can take several seconds — raise proxy/request timeouts if Railway/edge limits bite.
- Do not enable public write endpoints beyond recommend/options/health without auth if abused (optional API key header later).

---

## 4. Vercel — frontend deploy

### 4.1 One-time setup

1. Import the same Git repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Next.js**.
4. Build command: `npm run build` (default).
5. Output: Next default (no change).
6. Install command: `npm install`.

### 4.2 Environment variables (Vercel)

| Variable | Environment | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Production | `https://<railway-public-host>` (no trailing `/`) |
| `NEXT_PUBLIC_API_URL` | Preview | Same Railway URL **or** a Railway staging service |

Redeploy after changing env vars (Next inlines `NEXT_PUBLIC_*` at build time).

### 4.3 Verify Vercel

1. Open the Vercel URL — BiteWise home / preference form loads.
2. Submit preferences → network tab shows `POST <API>/recommend` → 200.
3. Empty filters → empty state; kill API → error state with retry.
4. Confirm no `LLM_API_KEY` in browser bundles.

### 4.4 Preview deployments

- Each PR gets a `*.vercel.app` URL.
- Ensure Railway `CORS_ORIGINS` includes preview hosts (wildcard support in app code, or temporarily use a permissive list for previews).

---

## 5. Connect frontend ↔ backend

1. Deploy Railway first; copy public HTTPS URL.
2. Set Vercel `NEXT_PUBLIC_API_URL` to that URL.
3. Update Railway `CORS_ORIGINS` to the Vercel production domain (+ previews).
4. Redeploy both if either URL changes.
5. End-to-end test from the Vercel domain only (not only localhost).

**Local dual-run (dev):**

```powershell
# Terminal 1 — API
.\.venv\Scripts\Activate.ps1
uvicorn src.api.main:app --reload --port 8000

# Terminal 2 — Next
cd frontend
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
npm run dev
```

Streamlit can keep calling the pipeline in-process; optional later: Streamlit → HTTP API for parity.

---

## 6. Secrets & security

| Do | Don't |
| --- | --- |
| Store Groq key only on Railway | Commit `.env` or keys to Git |
| Use HTTPS Railway + Vercel URLs | Expose Groq key as `NEXT_PUBLIC_*` |
| Restrict CORS to known frontends | `allow_origins=["*"]` with credentials in prod |
| Rotate Groq key if leaked | Log full user free-text prefs if sensitive |
| Keep `/docs` public only if comfortable | Skip auth forever if API gets scraped |

Optional hardening (post-MVP): shared `X-API-Key` between Vercel server routes and Railway; rate limiting; move recommend calls through Next Route Handlers so the Railway URL stays private.

---

## 7. Deployment sequence (first go-live)

```text
1. Code: wire Next BiteWise UI + API client (G1, G5)
2. Code: CORS_ORIGINS + Dockerfile/Procfile (G3, G4)
3. Data: bake or generate parquet for Railway (G2)
4. Push to Git remote
5. Deploy Railway → verify /health /options /recommend
6. Create Vercel project (root = frontend)
7. Set NEXT_PUBLIC_API_URL → redeploy Vercel
8. Set CORS_ORIGINS to Vercel URL → redeploy Railway
9. Smoke-test production URL
10. Document URLs in README
```

---

## 8. Post-deploy operations

| Task | Cadence | Notes |
| --- | --- | --- |
| Refresh restaurant parquet | When dataset updates | Re-run preprocess; redeploy Railway (option A) |
| Rotate Groq key | As needed | Update Railway env only |
| Monitor `/health` | Continuous | UptimeRobot / Railway metrics |
| Watch Groq errors / latency | Weekly | `meta.source` fallback vs `llm` in responses |
| Vercel + Railway spend | Monthly | Stay within free/hobby limits for demos |

### Rollback

- **Vercel:** promote previous deployment in dashboard.
- **Railway:** redeploy previous successful commit; keep last-known-good parquet in image.

### Dual-UI note

Until Next is feature-complete, keep Streamlit for demos locally:

```powershell
streamlit run src/ui/app.py
```

Do not deploy Streamlit to Vercel. If you need a hosted Streamlit backup, use Railway as a **second** service (separate from the API) — not required for the primary plan.

---

## 8.1 GitHub deployment verification

GitHub does **not** show Railway’s internal “SUCCESS” by default. This repo adds:

- Workflow: `.github/workflows/verify-railway-deploy.yml`
- On every push to `main`, it probes `https://zomatobitewise-production.up.railway.app/health`
- Creates a GitHub **Deployment** for environment `production` and marks it success/failure
- `/health` also returns `git_commit` (from `RAILWAY_GIT_COMMIT_SHA`) when Railway injects it

**Where to look on GitHub after a push:**

1. Repo → **Actions** → workflow **Verify Railway Deploy**
2. Commit page → green check / **Checks**
3. Repo → **Environments** → `production` (or **Deployments**)

Optional in Railway: enable **Wait for CI** so Railway deploys only after GitHub checks pass (Service Settings → Wait for CI). Note: that can deadlock if the only check waits for Railway to be healthy first — keep this verify workflow as a *post-deploy* check, or add a separate fast lint/test workflow for Wait for CI.

---

## 9. Acceptance criteria (production)

- [ ] `GET https://<railway>/health` → `status: "ok"`, `restaurant_count > 0`
- [ ] GitHub Actions **Verify Railway Deploy** is green on `main`
- [ ] `POST /recommend` returns schema-valid JSON with explanations (or structured empty)
- [ ] Vercel UI loads dark BiteWise theme; form submits successfully
- [ ] Empty / error / loading states work against the live API
- [ ] CORS allows the Vercel origin; browser console has no CORS errors
- [ ] No LLM secrets in frontend env or client bundle
- [ ] README lists production URLs + “how to redeploy”

---

## 10. Effort estimate

| Workstream | Estimate |
| --- | --- |
| Finish Next BiteWise UI + API client | 0.5–1.5 days |
| Dockerfile + CORS + parquet packaging | 0.5 day |
| Railway first deploy + debug | 0.5 day |
| Vercel link + CORS + E2E polish | 0.5 day |
| **Total to first public demo** | **~2–3 days** |

---

## 11. Quick reference commands

```powershell
# Local API
uvicorn src.api.main:app --reload --port 8000

# Local Next
cd frontend
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
npm run dev

# Local Streamlit (MVP)
streamlit run src/ui/app.py

# Preprocess (if regenerating data for Railway bake)
python -m src.ingestion.preprocess
```

---

## 12. Doc map

| Doc | Use |
| --- | --- |
| [architecture.md](./architecture.md) | System design |
| [implementation-plan.md](./implementation-plan.md) | Phase 7 API path |
| [data-dictionary.md](./data-dictionary.md) | Parquet columns |
| [edge-case.md](./edge-case.md) | Empty/error behaviors to preserve in prod UI |
| **deployment-plan.md** (this file) | Railway + Vercel go-live |

When implementation catches up (Dockerfile, CORS env, Next client), update §0 gaps to “done” and add the live URLs at the top of this doc.
