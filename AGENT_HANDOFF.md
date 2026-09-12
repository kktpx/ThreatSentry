# ThreatSentry — Agent Handoff

Last updated: 2026-09-12

## Goal

Implement `ThreatSentry_COMPLETE_MASTER_PLAN_REACT_TYPESCRIPT.md` as a React/TypeScript dashboard with a FastAPI scanner backend and Supabase auth/data store.

## Run locally

From the repository root:

```powershell
npm run dev
```

This starts:

- Dashboard: `http://localhost:3000`
- API: `http://localhost:8000`
- API health: `http://localhost:8000/health`

The root `package.json` uses `concurrently` and the root virtual environment at `.venv`.

## Environment and Supabase

- `backend/.env` exists locally and is gitignored. Required secrets were populated by the user.
- `apps/dashboard/.env` exists locally and is gitignored. It includes the Supabase URL/anon key and `VITE_API_URL`.
- Do not print, commit, or overwrite secret values.
- Supabase schema and migrations are in `supabase/migrations/0001_initial_schema.sql`.

## Completed Implementation (Phases 1–23)

### 1. Foundation & Authentication (Phases 1–4)
- React/Vite dashboard and FastAPI backend scaffold.
- Supabase email/password sign-in (`/login`), registration (`/register`), and session restoration.
- Protected routes redirect anonymous users without flashing private content.
- Bearer token validation with Supabase in backend dependencies.

### 2. Website Ownership Verification (Phases 5–6)
- Website CRUD with canonical origin normalization.
- Safe verification document fetcher with SSRF prevention and DNS public resolution validation.
- Verification status lifecycle (`UNVERIFIED`, `PENDING`, `VERIFIED`, `FAILED`).
- Active scan initiation strictly gated on `VERIFIED` status.

### 3. Scan Job Orchestrator & Safety Lifecycle (Phase 7)
- `POST /api/websites/{website_id}/scans`, `GET /api/scans/{scan_id}`, `POST /api/scans/{scan_id}/cancel`.
- Strict checks: Ownership, `VERIFIED` status, SSRF revalidation, single-active-scan constraint.
- Multi-stage in-process runner (`backend/scanner/runner.py`) with cancellation support.

### 4. Bounded Crawler & Attack Surface (Phase 8)
- Same-origin bounded crawler (`backend/scanner/crawler.py`).
- Max depth (2-3), max pages (20-30), safe concurrency.
- SSRF revalidation on every crawl request.
- Automatic skipping of destructive links (`/logout`, `/delete`, etc.).
- Extraction of forms, input parameters, query strings, and external domains.

### 5. Passive Security Checks (Phase 9)
- Evaluators in `backend/scanner/passive/`:
  - `http_checks.py`: Unencrypted HTTP scheme, server banner & X-Powered-By leakage.
  - `header_checks.py`: Missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
  - `cookie_checks.py`: Missing Secure, HttpOnly, and SameSite attributes (cookie values redacted).
  - `exposure.py`: Stack traces (Python, PHP, Java, Node.js) and directory listings.
  - `orchestrator.py`: Bundles passive checks into standard `Finding` objects.

### 6. Baseline & Controlled Active Scanners (Phases 10–12)
- Baseline engine (`backend/scanner/baseline.py`) records baseline response status, length, and timing.
- SQL Injection scanner (`backend/scanner/active/sqli.py`):
  - Non-destructive quote probes (`'`, `''`).
  - Error pattern detection across SQLite, MySQL, PostgreSQL, Oracle, and MSSQL.
  - HTTP 500 status differential detection.
- Reflected XSS scanner (`backend/scanner/active/reflected_xss.py`):
  - Unique harmless marker probes (`"><ts_probe_...>`).
  - Context & escaping analysis (distinguishes raw HTML injection from safely encoded reflections).

### 7. Machine Learning Pipeline & Hybrid Analysis (Phases 13–21)
- OWASP CRS & CSIC dataset pipeline:
  - `ml/scripts/download_datasets.py`: Acquires canonical OWASP CRS v4.x patterns (SQLi: `REQUEST-942`, XSS: `REQUEST-941`) and CSIC 2010 benign traffic (2,000 raw samples).
  - `ml/scripts/build_dataset.py`: Normalizes, categorizes, deduplicates, and assigns structural `group_id` hashes to prevent data leakage (1,853 clean samples across 1,046 groups).
  - `ml/scripts/split_dataset.py`: GroupShuffleSplit into Train (1,312), Val (268), and Test (273) with mathematically verified zero group overlap.
- Model training & candidate comparison (`ml/scripts/train_model.py`):
  - Compared LogisticRegression, CalibratedLinearSVC, and SGDClassifier (Modified Huber) on Character TF-IDF (2–5 n-grams).
  - Winning model: `LogisticRegression` (Macro F1: 1.0000).
  - Serialized model: `ml/models/web_ids_model_v1.0.0.joblib` and `web_ids_model_v1.0.0.metadata.yaml`.
- Independent test evaluation (`ml/scripts/evaluate_model.py`):
  - Evaluated on untouched 273 test samples.
  - Test Accuracy: 100%, Macro F1: 1.0000, False Positive Rate: 0.00%.
  - Output report: `ml/reports/model_evaluation_report.md` and `ml/reports/model_evaluation_metrics.json`.
- FastAPI model integration:
  - Real ML loader (`backend/ml/loader.py`) and predictor (`backend/ml/predictor.py`).
  - Model API router (`backend/api/routers/model.py`): `GET /api/model` and `POST /api/model/predict`.
- Hybrid decision matrix (`backend/scanner/analysis/hybrid.py`):
  - Hard safety invariant: ML alone can NEVER confirm a vulnerability without deterministic response proof.
  - Elevates POTENTIAL findings to LIKELY or HYBRID based on probability thresholds.
- Fast, deterministic finding fingerprints (`ts1:<sha256>`) and deduplication.
- Posture score calculation (0–100) and letter grades (A–F).
- Rescan comparison tracking (`NEW`, `UNCHANGED`, and `FIXED` counts).
- Findings API (`backend/api/routers/findings.py`) with full ownership enforcement.

### 8. Frontend UI/UX Redesign (Phases 22–23)
- High-trust security console aesthetics using Gridgeist principles:
  - Slate/charcoal glass cards with responsive layout.
  - Standardized severity color badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`).
  - `DashboardPage.tsx`: Asset metrics summary, posture score averages, and responsive domain cards.
  - `WebsiteDetailPage.tsx`: Deep scan initiation, live progress bar, findings severity filtering, attack surface metrics, and full scan history table.
  - `FindingDetailModal.tsx`: Safe evidence inspector and actionable remediation guidance.
  - `ModelPage.tsx` (`/model`): Dynamic ML model metadata, architecture details, held-out test metrics, decision hierarchy table, and interactive Live Inference Playground.
  - `Navbar.tsx`: Persistent navigation shell with responsive navigation.

### 9. Controlled Vulnerable Test Lab (Phase 24)
- Standalone test target app (`labs/vulnerable_app.py`):
  - Runs on port `8080` via `npm run lab` or `npm run dev:all`.
  - Serves ownership challenge at `/.well-known/threatsentry.txt` with UI input or query parameter `/set-token?token=...`.
  - Realistic vulnerable endpoints:
    - `/search?q=...`: Reflected XSS vulnerability.
    - `/products?id=...`: Error-based SQL Injection vulnerability (in-memory SQLite).
    - `/about`, `/contact`: Benign navigation traffic for crawler discovery.
    - Passive security oversights: Missing CSP/HSTS headers, server banner disclosure, and insecure cookies.
  - Gated by `SCAN_ALLOW_LOCAL` setting, strictly barred in production.

## Verification Status

All tests run and pass cleanly:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
# 83 passed, 3 warnings in ~14s

npm --prefix apps/dashboard run test:run
# 13 passed in 8 test files

npm --prefix apps/dashboard run build
# Production build succeeded without TypeScript or Vite errors in ~19s
```

## Controlled Lab Verification & SSRF Boundary Fix
- **Loopback Only (`backend/scanner/ssrf.py`)**: `allow_local` permits strictly `address.is_loopback` (`127.0.0.1`, `::1`, `localhost`). Non-loopback private networks (`192.168.x.x`, `10.x.x.x`) and cloud metadata (`169.254.169.254`) remain strictly rejected by SSRF validation.
- **Auto-Verification Handshake (`backend/scanner/verification_fetch.py` & `labs/vulnerable_app.py`)**: The verification fetcher sends `X-ThreatSentry-Token: <token>`, which `labs/vulnerable_app.py` echoes dynamically. Clicking "Verify Now" on `http://localhost:8080` verifies the target instantly.


## Useful Files & Commands

- Full system startup (dashboard + backend): `npm run dev`
- Full system startup with test lab: `npm run dev:all`
- Test lab only: `npm run lab`
- Master specification: `ThreatSentry_COMPLETE_MASTER_PLAN_REACT_TYPESCRIPT.md`
- Scanner runner: `backend/scanner/runner.py`
- Crawler: `backend/scanner/crawler.py`
- Passive orchestrator: `backend/scanner/passive/orchestrator.py`
- Active SQLi: `backend/scanner/active/sqli.py`
- Active XSS: `backend/scanner/active/reflected_xss.py`
- Controlled test lab: `labs/vulnerable_app.py`
- ML model: `ml/models/web_ids_model_v1.0.0.joblib`
- ML evaluation report: `ml/reports/model_evaluation_report.md`
- Dataset documentation: `docs/datasets.md`
- Frontend routes: `apps/dashboard/src/App.tsx`
- Dashboard: `apps/dashboard/src/features/dashboard/DashboardPage.tsx`
- Website detail & scans: `apps/dashboard/src/features/websites/WebsiteDetailPage.tsx`
- Finding modal: `apps/dashboard/src/features/findings/FindingDetailModal.tsx`
- ML intelligence page: `apps/dashboard/src/features/model/ModelPage.tsx`
