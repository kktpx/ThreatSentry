# ThreatSentry — Complete Master Development Plan

> **Project type:** Graduation / portfolio-grade web security scanner for websites owned and verified by the user.
>
> **Core safety rule:** Active SQL Injection and Reflected XSS testing is allowed **only** for targets whose ownership has been successfully verified inside ThreatSentry. Unverified, failed, private/internal, or third-party targets must never enter the active scan pipeline.
>
> **Scan mode:** `DEEP_SCAN` only. There is no Quick Scan.

---

## 1. Project Goal

Build ThreatSentry from zero as a full-stack web application that lets a user:

1. Register and sign in.
2. Add a website that they own.
3. Verify ownership using a challenge file.
4. Start a Deep Scan only after successful verification.
5. Crawl the verified website within strict safety limits.
6. Perform passive security checks.
7. Discover forms, input fields, query parameters, routes, and methods.
8. Create safe baseline requests.
9. Perform controlled SQL Injection and Reflected XSS detection on verified scope only.
10. Combine response evidence, deterministic rules, and ML classification.
11. Produce findings with evidence, confidence, severity, remediation, and a deterministic fingerprint.
12. Calculate a security score.
13. Keep scan history and compare rescans as `NEW`, `FIXED`, or `UNCHANGED`.
14. Train, evaluate, version, package, and load an ML model reproducibly.
15. Benchmark the scanner separately from ML classification metrics.
16. Deploy the dashboard, API/scanner, database/auth, and model in a production-ready architecture.

Primary user flow:

`Register / Login → Add Website → Verify Website Ownership → Deep Scan → Crawl → Passive Checks → Discover Inputs → Baseline → SQLi → Reflected XSS → Rules + ML + Response Analysis → Findings → Security Score → Evidence + Remediation → Scan History → Scan Again → NEW/FIXED/UNCHANGED`

---

## 2. Scope

### In scope

- User registration, login, logout, password reset, session persistence.
- Protected React routes.
- Supabase PostgreSQL + Auth + Row Level Security.
- Website CRUD.
- URL normalization and target validation.
- SSRF defense and redirect revalidation.
- Ownership verification with `/.well-known/threatsentry.txt`.
- Deep Scan job lifecycle.
- Same-origin bounded crawler.
- Passive checks for HTTP, TLS, headers, cookies, DNS, technology hints, and common accidental exposure.
- Form / input / query parameter discovery.
- Baseline response collection.
- Controlled active SQLi scanner for verified targets.
- Reflected XSS scanner using harmless unique markers and context analysis.
- Hybrid detection using response evidence + rules + ML.
- Findings engine and deduplication.
- Security score.
- Scan history and fingerprint-based comparison.
- Reproducible ML dataset pipeline.
- Character TF-IDF ML classifier for `NORMAL`, `SQLI`, `XSS`.
- Model comparison, validation, final test evaluation, versioning, metadata.
- Controlled vulnerable/safe lab endpoints.
- Scanner benchmark.
- Automated backend/frontend tests.
- Production hardening, monitoring, rollback, and deployment documentation.

### Deep Scan safety boundary

Every active scan path must require all of the following:

- Authenticated user.
- Website belongs to authenticated user.
- Website verification status is `VERIFIED`.
- Target URL passes SSRF and scheme validation.
- DNS resolution is public and allowed.
- Every redirect target is revalidated.
- Requests remain within configured verified scope.
- Scan limits have not been exceeded.

---

## 3. Out of Scope

Do not implement these in the first complete version:

- Quick Scan.
- Anonymous scans.
- Arbitrary third-party website scanning.
- Network/port scanning.
- Brute force authentication testing.
- Credential stuffing.
- Password cracking.
- Stored XSS scanning.
- DOM XSS scanning.
- CSRF exploitation.
- SSRF exploitation.
- Command injection exploitation.
- RCE testing.
- Destructive database operations.
- Automatic login-form brute force.
- Checkout/payment interaction.
- Multi-domain aggressive crawling.
- Browser automation unless later required for a separate feature.
- Using OWASP Benchmark as ML training data.
- Fabricated ML metrics or benchmark results.

---

## 4. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide
- Recharts
- Supabase JS
- Vitest

### Backend

- Python
- FastAPI
- Uvicorn
- HTTPX
- Pydantic
- BeautifulSoup4
- dnspython
- tldextract

### Database / Auth

- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security

### Machine Learning

- pandas
- numpy
- scikit-learn
- joblib
- matplotlib
- PyYAML

### Testing

- pytest
- pytest-asyncio
- Vitest

### Local development

- React/Vite: port `3000`
- FastAPI: port `8000`
- Python: `venv + pip`

---

## 5. Repository Structure

Recommended monorepo structure:

```text
threatsentry/
├─ apps/
│  └─ dashboard/
│     ├─ public/
│     ├─ src/
│     │  ├─ api/
│     │  ├─ components/
│     │  ├─ features/
│     │  │  ├─ auth/
│     │  │  ├─ dashboard/
│     │  │  ├─ websites/
│     │  │  ├─ scans/
│     │  │  ├─ findings/
│     │  │  └─ model/
│     │  ├─ hooks/
│     │  ├─ layouts/
│     │  ├─ lib/
│     │  ├─ pages/
│     │  ├─ routes/
│     │  ├─ types/
│     │  ├─ utils/
│     │  ├─ App.tsx
│     │  └─ main.tsx
│     ├─ tests/
│     ├─ .env.example
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ vite.config.ts
│     └─ vercel.json
├─ backend/
│  ├─ api/
│  │  ├─ deps/
│  │  └─ routes/
│  │     ├─ auth.py
│  │     ├─ websites.py
│  │     ├─ verification.py
│  │     ├─ scans.py
│  │     ├─ findings.py
│  │     └─ model.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ logging.py
│  │  ├─ security.py
│  │  └─ constants.py
│  ├─ db/
│  │  ├─ supabase.py
│  │  ├─ repositories/
│  │  └─ schemas/
│  ├─ scanner/
│  │  ├─ target_validation.py
│  │  ├─ ssrf.py
│  │  ├─ verification.py
│  │  ├─ crawler.py
│  │  ├─ discovery.py
│  │  ├─ baseline.py
│  │  ├─ passive/
│  │  │  ├─ http_checks.py
│  │  │  ├─ tls_checks.py
│  │  │  ├─ header_checks.py
│  │  │  ├─ cookie_checks.py
│  │  │  ├─ dns_checks.py
│  │  │  ├─ technology.py
│  │  │  └─ exposure.py
│  │  ├─ active/
│  │  │  ├─ sqli.py
│  │  │  └─ reflected_xss.py
│  │  ├─ analysis/
│  │  │  ├─ rules.py
│  │  │  ├─ response_diff.py
│  │  │  ├─ hybrid.py
│  │  │  └─ confidence.py
│  │  ├─ findings.py
│  │  ├─ scoring.py
│  │  └─ jobs.py
│  ├─ ml/
│  │  ├─ loader.py
│  │  ├─ preprocessing.py
│  │  ├─ predictor.py
│  │  └─ metadata.py
│  ├─ models/
│  ├─ services/
│  ├─ tests/
│  ├─ main.py
│  ├─ requirements.txt
│  └─ .env.example
├─ ml/
│  ├─ dataset/
│  │  ├─ raw/
│  │  │  ├─ csic2010/
│  │  │  ├─ httpparams/
│  │  │  └─ owasp-crs/
│  │  ├─ lab/
│  │  ├─ processed/
│  │  └─ splits/
│  ├─ scripts/
│  │  ├─ download_datasets.py
│  │  ├─ build_dataset.py
│  │  ├─ split_dataset.py
│  │  ├─ train_model.py
│  │  └─ evaluate_model.py
│  ├─ models/
│  └─ reports/
├─ labs/
│  ├─ app/
│  ├─ tests/
│  └─ README.md
├─ supabase/
│  ├─ migrations/
│  ├─ seed/
│  └─ policies/
├─ docs/
│  ├─ architecture.md
│  ├─ datasets.md
│  ├─ scanner.md
│  ├─ ml.md
│  ├─ benchmark.md
│  ├─ security.md
│  ├─ deployment.md
│  └─ graduation-project.md
├─ .gitignore
├─ README.md
└─ LICENSE
```

Repository rules:

- Scanner code belongs in `backend/scanner`, not in React.
- ML training scripts belong in top-level `ml/`, not in the production API path.
- Production backend loads only packaged model artifacts and preprocessing logic.
- Controlled vulnerable code belongs in `labs/` and must be visibly marked `TEST / BENCHMARK ONLY`.
- Supabase schema and RLS policies must be versioned as migrations.

---

# Implementation Phases

## Phase 1 — Project Initialization

### 6. Project Initialization

Create the repository, frontend, backend, Python environment, and baseline development configuration.

### Frontend initialization

- Create React + TypeScript + Vite app in `apps/dashboard`.
- Configure Vite dev server to port `3000`.
- Install React Router, Tailwind CSS, Lucide, Recharts, Supabase JS, Vitest.
- Create a basic application shell and error boundary.
- Configure aliases if useful, but avoid unnecessary build complexity.

### Backend initialization

- Create Python virtual environment.
- Create `backend/requirements.txt` with FastAPI, Uvicorn, HTTPX, Pydantic, BeautifulSoup4, dnspython, tldextract, Supabase client dependencies, pytest, pytest-asyncio, and ML runtime dependencies required in production.
- Create `backend/main.py`.
- Add `GET /health` returning API state and model-load status placeholder.
- Configure development Uvicorn on port `8000`.

### Environment files

Create `.env.example` files, never real secrets.

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
```

Backend:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_ORIGINS=http://localhost:3000
MODEL_PATH=
```

### `.gitignore`

Must cover:

- `.env*` except `.env.example`
- Python venv
- `__pycache__`
- node_modules
- frontend build output
- raw ML datasets
- processed ML datasets
- train/validation/test files
- local reports if large
- generated models if not intentionally versioned
- local Supabase/temp files

### Acceptance criteria

- `npm run dev` starts dashboard on port 3000.
- `uvicorn backend.main:app --reload --port 8000` starts API.
- `GET /health` returns HTTP 200.
- `.env.example` files exist.
- No real secrets are committed.
- Frontend production build succeeds.
- Backend import succeeds.

---

## Phase 2 — Dataset Acquisition and Documentation

### 7. Dataset Download

Create `ml/scripts/download_datasets.py`.

The downloader must be reproducible, idempotent where practical, and fail honestly when a source is unavailable.

Download / prepare:

- **CSIC 2010**: use `NORMAL` samples primarily as benign traffic.
- **HttpParamsDataset**: map benign/NORMAL, SQLI, XSS.
- **OWASP Core Rule Set**: obtain SQLi/XSS detection rule material from `REQUEST-941` and `REQUEST-942` for rule engineering / grouping / analysis.
- **ThreatSentry lab dataset folder**: reserve for samples collected from controlled labs.
- **OWASP Benchmark**: download/store separately for scanner benchmark experiments only.

**Hard rule:** OWASP Benchmark must not be used as ML training data.

Required structure:

```text
ml/
  dataset/
    raw/
      csic2010/
      httpparams/
      owasp-crs/
    lab/
    processed/
    splits/
  scripts/
    download_datasets.py
    build_dataset.py
    split_dataset.py
    train_model.py
    evaluate_model.py
  models/
  reports/
```

Downloader requirements:

- Retry transient download failures.
- Use checksums when official/reliable checksums are available.
- Never silently create fake sample files when download fails.
- Log source, destination, status, and error.
- Make source URLs configurable where appropriate.
- Separate acquisition from transformation.

### 8. Dataset Documentation

Create `docs/datasets.md` and record for every dataset:

- Name.
- Source organization/project.
- Source URL.
- License and attribution requirements.
- Original format.
- Fields used.
- Class mapping.
- Cleaning decisions.
- Whether it participates in training, validation, final test, rules, or benchmark.
- Known limitations.

### 9. Git/Data Safety

Never commit:

- `.env`
- Secrets
- Raw datasets
- Processed datasets
- Train/validation/test splits
- API tokens
- Supabase service role key
- Generated models unless intentionally approved for release/versioning

Add README instructions explaining how another developer reproduces the datasets locally.

Acceptance criteria:

- Dataset folders are created.
- Downloader script can be run from a clean environment.
- Failures are visible rather than fabricated.
- OWASP Benchmark is physically/logically separated from ML training inputs.
- Dataset documentation exists before model training.

---

## Phase 3 — Supabase Data Model and Isolation

### 10. Supabase Database

Create migrations for at least these tables.

#### `profiles`

Suggested fields:

- `id uuid primary key` references authenticated user.
- `display_name text nullable`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `websites`

Suggested fields:

- `id uuid primary key`
- `user_id uuid not null`
- `name text`
- `url text`
- `normalized_origin text`
- `verification_token text`
- `verification_status text`
- `verified_at timestamptz nullable`
- `last_score integer nullable`
- `created_at`
- `updated_at`

Verification status:

- `UNVERIFIED`
- `PENDING`
- `VERIFIED`
- `FAILED`

#### `scan_jobs`

Suggested fields:

- `id uuid primary key`
- `user_id uuid not null`
- `website_id uuid not null`
- `scan_type text default 'DEEP_SCAN'`
- `status text`
- `current_stage text`
- `progress integer`
- `started_at`
- `finished_at`
- `error_code nullable`
- `error_message_safe nullable`
- `model_version nullable`
- `score nullable`
- `summary jsonb`
- `created_at`

Status:

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

#### `findings`

Suggested fields:

- `id uuid primary key`
- `user_id uuid not null`
- `website_id uuid not null`
- `scan_id uuid not null`
- `title`
- `category`
- `severity`
- `endpoint`
- `parameter nullable`
- `description`
- `evidence jsonb`
- `recommendation`
- `detection_method`
- `confidence`
- `fingerprint`
- `status`
- `created_at`

#### `model_versions`

Suggested fields:

- `id uuid primary key`
- `version text unique`
- `dataset_version text`
- `algorithm text`
- `dataset_size integer`
- `class_distribution jsonb`
- `training_date timestamptz`
- `metrics jsonb`
- `artifact_name text`
- `is_active boolean`
- `created_at`

Indexes:

- `websites(user_id)`
- `scan_jobs(user_id, created_at desc)`
- `scan_jobs(website_id, created_at desc)`
- `findings(scan_id)`
- `findings(website_id, fingerprint)`
- `findings(user_id, severity)`
- `model_versions(version)`

Foreign keys must be explicit and use safe delete behavior.

### 11. Supabase RLS

Mandatory invariant:

> User A must never read, update, or delete User B's data.

Enable RLS on all user-owned tables.

Policies should enforce ownership using `auth.uid()` against `user_id` or a joined owner relation.

Test cases:

- User A reads own website: allowed.
- User A reads User B website: denied.
- User A edits User B website: denied.
- User A reads User B scans/findings: denied.
- Anonymous access to private application tables: denied.
- Backend service-role operations are restricted to trusted server-side code only.

Acceptance criteria:

- RLS is enabled.
- Cross-user isolation tests pass.
- Service role key never appears in frontend assets.

---

## Phase 4 — Authentication and Protected UI

### 12. Authentication

Implement:

- Register.
- Login.
- Logout.
- Forgot password.
- Session persistence.
- Protected routes.

Frontend routes:

- `/register`
- `/login`
- `/forgot-password`

Behavior:

- Authenticated users navigating to auth-only pages may be redirected to dashboard.
- Unauthenticated users trying to access protected routes go to login.
- Session restoration must not flash protected content incorrectly.
- API calls requiring a user must send a valid Supabase access token.
- Backend validates token/identity before accessing user-owned data.

Acceptance criteria:

- Register/login/logout work.
- Refresh preserves valid session.
- Expired/invalid session returns user to login safely.
- Protected routes cannot be used without authentication.

---

## Phase 5 — Website Management and Target Safety

### 13. Website Management

Implement:

- Add website.
- Edit website metadata.
- Delete website.
- Website detail page.
- URL normalization.

Normalization rules should:

- Require `http` or preferably `https` scheme.
- Normalize host casing.
- Remove irrelevant fragments.
- Normalize default ports.
- Store a canonical origin for same-origin checks.
- Reject malformed URLs.
- Never trust a URL merely because it was previously stored.

### 14. SSRF Protection

Create a central target validation layer and use it before verification, crawling, and every network request.

Block:

- `localhost` and localhost aliases.
- IPv4 loopback.
- IPv6 loopback.
- Private IPv4 ranges.
- Private IPv6 ranges.
- Link-local.
- Multicast.
- Reserved/unspecified ranges.
- Cloud metadata endpoints.
- Hostnames resolving to blocked IPs.
- Redirects that move to blocked IPs.
- DNS rebinding attempts as far as practical through repeated resolution/validation.

Network limits:

- Connect/read timeout.
- Maximum redirect count.
- Maximum response body size.
- Safe HTTP methods by default.
- Bounded concurrency.

Critical implementation rule:

> Validate the resolved destination before the request and revalidate every redirect destination before following it.

Acceptance criteria:

- Public controlled target is allowed.
- `localhost` is blocked.
- Private IPv4/IPv6 is blocked.
- Link-local/cloud metadata is blocked.
- Redirect public → private is blocked.
- Oversized response is truncated/rejected safely.
- Timeouts fail safely.

---

## Phase 6 — Website Ownership Verification

### 15. Website Ownership Verification

Verification method:

```text
https://target/.well-known/threatsentry.txt
```

Expected content:

```text
threatsentry-verification=<TOKEN>
```

Status:

- `UNVERIFIED`
- `PENDING`
- `VERIFIED`
- `FAILED`

Flow:

1. User adds website.
2. Backend generates cryptographically random verification token.
3. UI displays exact file path and content.
4. User uploads/serves the file on their own website.
5. User clicks Verify.
6. Backend revalidates target with SSRF controls.
7. Backend fetches only the well-known verification resource with strict timeout/size limits.
8. Backend compares expected token exactly after defined whitespace normalization.
9. Save status and `verified_at` on success.

Rules:

- Unverified target cannot Deep Scan.
- Changing the website's canonical origin invalidates previous verification.
- Failed verification must not leak low-level network internals to the user.
- Redirects during verification must be revalidated.

Acceptance criteria:

- Correct token → `VERIFIED`.
- Missing file → `FAILED`.
- Wrong token → `FAILED`.
- Private target → blocked before verification fetch.
- Public → private redirect → blocked.
- Deep Scan API rejects any status other than `VERIFIED`.

---

## Phase 7 — Deep Scan Job System

### 16. Scan Job System

Only one scan type in this version:

- `DEEP_SCAN`

Status:

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

Progress stages:

1. validating target
2. crawling
3. TLS
4. headers
5. cookies
6. DNS
7. technology
8. exposure
9. discovering inputs
10. baseline
11. SQLi
12. XSS
13. analysis
14. findings
15. scoring
16. complete

Implementation:

- Create scan record before processing.
- Re-check authentication, ownership, verification, and SSRF safety at scan start.
- Persist stage/progress updates.
- Keep user-facing errors safe and concise.
- Log technical failure with scan ID, not secrets.
- Support cancellation checks between stages and within long loops.
- Prevent excessive concurrent scans per user/system.

For MVP, a simple in-process/background task approach is acceptable if deployment constraints permit, but code structure must allow migration to a dedicated worker later without rewriting scanner logic.

Acceptance criteria:

- Scan lifecycle is visible in UI.
- Failed stages mark job `FAILED`.
- Cancellation marks `CANCELLED`.
- Completed job stores result summary, score, and model version.

---

## Phase 8 — Safe Crawler and Attack Surface

### 17. Safe Crawler

Defaults:

- Max pages: `30`
- Max depth: `3`
- Concurrency: `5`
- Same-origin only

Discover:

- Pages.
- Routes.
- Forms.
- Inputs.
- Query parameters.
- HTTP methods declared in forms.
- External domains as informational references only.

Avoid routes/actions containing high-risk semantics such as:

- logout
- delete
- remove
- destroy
- checkout
- payment

Crawler requirements:

- Normalize URLs before dedupe.
- Ignore fragments.
- Restrict to verified canonical origin.
- Revalidate each fetched target through SSRF protections.
- Respect max pages/depth.
- Use safe concurrency.
- Do not submit discovered forms during crawl.
- Do not follow obvious destructive action links.
- Apply response-size and timeout limits.
- Parse HTML only when content type is appropriate.

### 18. Attack Surface Summary

Store/display a summary such as:

- Pages crawled.
- Unique routes.
- Forms found.
- GET/POST form counts.
- Query parameters.
- Input names/types.
- External domains observed.
- Technologies hinted.
- Pages skipped due to limits/safety.

Acceptance criteria:

- Crawler stays same-origin.
- It never follows blocked private redirects.
- It does not invoke destructive routes.
- Repeated URLs are deduplicated.
- Attack surface is saved for scan result rendering.

---

## Phase 9 — Passive Security Checks

### 19. Passive Security Checks

All passive checks operate without attempting exploitation.

### HTTP

Collect/evaluate:

- Status.
- HTTPS usage.
- Redirect chain.
- Content type.
- Server information exposure.

### TLS

Check:

- Certificate availability/validity.
- Expiry.
- Hostname match.
- Protocol/cipher information available from the chosen implementation.

### Security headers

Check presence/configuration of:

- CSP
- HSTS
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- COOP
- CORP

Rules must distinguish missing, weak, and informational configurations where feasible.

### Cookies

For observed cookies, inspect:

- Secure
- HttpOnly
- SameSite
- Domain
- Path
- Expiration

Never log sensitive cookie values.

### DNS

Collect:

- A
- AAAA
- CNAME
- MX
- TXT
- SPF
- DMARC
- CAA

DNS results should be informational unless a clear rule supports a finding.

### Technology Detection

Infer cautiously from:

- Headers.
- HTML metadata.
- Generator tags.
- Asset paths.
- Script names.
- Cookie names.

Do not claim certainty from weak indicators.

### Exposure

Detect likely accidental exposure such as:

- Mixed content.
- Server/framework version leakage.
- Debug page indicators.
- Stack trace indicators.
- Directory listing indicators.
- Source map exposure.

Acceptance criteria:

- Each passive finding contains clear evidence and remediation.
- Sensitive values are redacted.
- Weak heuristics use lower confidence/severity rather than false certainty.

---

## Phase 10 — Baseline Engine

### 20. Baseline Engine

Before active variations, collect a baseline for each eligible endpoint/parameter.

Store:

- Status code.
- Response body or bounded/redacted analysis representation.
- Response length.
- Selected headers.
- Response time.

Baseline requirements:

- Use the same request path/method and stable parameters as the active comparison.
- Apply timeout and response-size limits.
- Avoid persisting sensitive form values.
- Normalize volatile content where feasible for comparison.
- Support repeated baseline measurements if needed to estimate natural variability.

Response comparison features may include:

- Status changed/not changed.
- Length delta/ratio.
- Text similarity/difference.
- Known error signature appearance.
- Timing difference within a bounded safe test.
- Reproducibility across controlled repeats.

Acceptance criteria:

- Active analyzers cannot run without a valid baseline object.
- Comparison data is deterministic enough to test.
- Timing checks are bounded and never unbounded sleep-based stress tests.

---

## Phase 11 — SQL Injection Scanner

### 21. SQL Injection Scanner

Flow:

`parameter → baseline → controlled test variations → response comparison → rules → ML → finding`

Analyze multiple signals:

- HTTP status changes.
- Database error patterns.
- Body/content differences.
- Response length differences.
- Bounded timing anomaly.
- Consistency/reproducibility.

Confidence levels:

- `POTENTIAL`
- `LIKELY`
- `CONFIRMED`

Hard rule:

> ML alone must never produce `CONFIRMED` SQL Injection.

Safety requirements:

- Run only for verified owner-controlled targets.
- Use a small predefined family of controlled, non-destructive test variations.
- Do not enumerate or extract database contents.
- Do not modify database state.
- Bound request count per parameter.
- Apply timeout/rate/concurrency limits.
- Do not scan risky routes excluded by policy.

Suggested confirmation logic:

- `POTENTIAL`: one weak signal or ML/rule suspicion without strong response evidence.
- `LIKELY`: multiple independent signals or reproducible DB-error/body-difference evidence.
- `CONFIRMED`: strong reproducible non-destructive evidence from response behavior/rules, optionally strengthened by ML; never ML alone.

Finding evidence should store safe summaries, not raw secrets.

Acceptance criteria:

- Vulnerable SQLi lab endpoint is detected reliably.
- Safe lab endpoint does not produce an unacceptable false-positive rate.
- Scanner never runs SQLi tests on unverified target.

---

## Phase 12 — Reflected XSS Scanner

### 22. Reflected XSS Scanner

Start with a harmless unique marker.

Analyze reflection in context:

- HTML text context.
- Attribute context.
- URL context.
- JavaScript context.
- Encoding/escaping behavior.

Workflow:

1. Identify eligible parameter.
2. Record baseline.
3. Send harmless unique marker.
4. Search response for marker or transformed variants.
5. Parse surrounding HTML/context.
6. Determine whether the reflection is safely encoded.
7. Apply rules and ML as supporting signals.
8. Create finding only when evidence is meaningful.

Out of scope for this version:

- Stored XSS.
- DOM XSS.

Safety:

- Do not execute browser script in a real user's session.
- Do not store payloads that could become active in ThreatSentry's own dashboard without escaping.
- Sanitize/escape all finding evidence when rendering.

Acceptance criteria:

- Controlled vulnerable reflected-XSS lab is identified.
- Safe encoded lab endpoint is not incorrectly flagged at an unacceptable rate.
- Reflection alone is not automatically treated as confirmed XSS if encoding/context is safe.

---

## Phase 13 — Finding Engine

### 23. Finding Engine

Required fields:

- `title`
- `category`
- `severity`
- `endpoint`
- `parameter`
- `description`
- `evidence`
- `recommendation`
- `detection_method`
- `confidence`
- `fingerprint`
- `status`

Severity:

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`
- `INFO`

Detection method:

- `PASSIVE`
- `ACTIVE`
- `RULE`
- `ML`
- `HYBRID`

Finding requirements:

- Evidence must be minimal and safe.
- Sensitive values must be redacted.
- Endpoint should be normalized for stable fingerprinting.
- Fingerprint should be deterministic across rescans for the same logical issue.
- Recommendation must be actionable.
- Finding status is used for history comparison.

Suggested fingerprint inputs:

- Website canonical origin.
- Category.
- Normalized endpoint path/method.
- Parameter name if relevant.
- Rule/finding subtype.

Do not include volatile evidence in fingerprint.

---

## Phase 14 — Security Score

### 24. Security Score

Start at `100`.

Initial deductions:

- Critical: `-20`
- High: `-10`
- Medium: `-5`
- Low: `-2`
- Info: `0`

Grade:

- A: `90–100`
- B: `80–89`
- C: `70–79`
- D: `60–69`
- F: `<60`

Rules:

- Deduplicate findings before scoring.
- Clamp score to `0–100`.
- Store score formula/version so future changes are auditable.
- Findings that represent the same issue across multiple duplicate crawl URLs should not be counted repeatedly unless they are genuinely distinct exposure points.

Acceptance criteria:

- Deterministic same findings → same score.
- Duplicate findings do not double-penalize.
- Score and grade display in website and scan views.

---

## Phase 15 — Unified ML Dataset

### 25. Build Unified ML Dataset

Classes:

- `NORMAL`
- `SQLI`
- `XSS`

Unified schema:

- `payload`
- `label`
- `source`
- `attack_family`
- `group_id`

Processing pipeline:

1. Load each allowed source.
2. Map source labels to the three canonical labels.
3. URL decode where appropriate.
4. HTML entity decode where appropriate.
5. Normalize text consistently.
6. Remove empty samples.
7. Remove malformed unusable samples.
8. Exact dedupe.
9. Near-duplicate grouping.
10. Preserve source metadata.
11. Assign stable `group_id`.
12. Write processed dataset and a dataset metadata report.

Do not erase meaningful syntax required to distinguish SQLi/XSS.

### 26. Data Leakage Prevention

Samples belonging to the same semantic family must share a `group_id` and must not be distributed across training and final test splits.

Group together when samples derive from the same:

- CRS rule.
- Attack template.
- Test case.
- Generated family.
- Near-duplicate cluster.

The goal is to prevent memorization of trivial variations from inflating test metrics.

Acceptance criteria:

- Exact duplicates never cross splits.
- Known near-duplicate families never cross splits.
- Split audit report shows no `group_id` overlap.

---

## Phase 16 — Dataset Split

### 27. Dataset Split

Approximate ratios:

- Train: `70%`
- Validation: `15%`
- Test: `15%`

Use:

- `GroupShuffleSplit`, or
- another explicitly group-aware split strategy.

Rules:

- Split by `group_id`, not individual rows.
- Preserve class coverage where possible.
- Record random seed.
- Validation is used for model selection.
- Final test is used only after model/hyperparameter choice is frozen.

Acceptance criteria:

- No group overlap.
- Split sizes/class distributions are documented.
- Running with same seed reproduces the same split.

---

## Phase 17 — ML Feature Extraction and Training

### 28. Feature Extraction

Primary feature representation:

- Character TF-IDF.
- Character n-gram range: `2–5`.

Pipeline should be packaged together with the classifier when possible so training and production preprocessing remain consistent.

### 29. Train Models

Compare at minimum:

- Logistic Regression.
- LinearSVC + probability calibration.
- SGDClassifier + probability calibration.

Model selection metric:

- Validation `Macro F1`.

Rules:

- Do not use the final test split to choose a model.
- Record training configuration and random seed.
- Save validation comparison table.
- If calibrated models are used, fit calibration using proper training/validation procedure without leaking the final test set.

Acceptance criteria:

- All candidate models train from the same reproducible data split.
- Validation report identifies selected model based on Macro F1.
- Selected model and preprocessing pipeline can be serialized with joblib.

---

## Phase 18 — Final ML Evaluation

### 30. Final ML Evaluation

After model choice is frozen, evaluate once on the untouched test split.

Metrics:

- Accuracy.
- Precision.
- Recall.
- F1.
- Macro F1.
- False Positive Rate.
- False Negative Rate.
- Confusion Matrix.

Report per class:

- NORMAL.
- SQLI.
- XSS.

Explicitly emphasize false positives:

- `NORMAL → SQLI`
- `NORMAL → XSS`

Create:

- Machine-readable metrics JSON/YAML.
- Human-readable Markdown report.
- Confusion matrix image using matplotlib.

Hard rule:

> Never fabricate metrics. Reports must be generated from a real execution of the evaluation script.

---

## Phase 19 — Model Versioning and Packaging

### 31. Model Versioning

Example artifact:

```text
ml/models/web_ids_model_v1.0.0.joblib
```

Store metadata:

- Model version.
- Dataset version.
- Algorithm.
- Dataset size.
- Class distribution.
- Training date.
- Random seed/config.
- Validation metrics.
- Final test metrics.
- Feature extraction settings.

Recommended files:

```text
ml/models/
  web_ids_model_v1.0.0.joblib
  web_ids_model_v1.0.0.metadata.yaml
```

Production model release should be intentional and traceable to Git revision / dataset version.

---

## Phase 20 — FastAPI ML Integration

### 32. FastAPI ML Integration

Rules:

- Load `.joblib` once during backend startup/lifespan.
- Do not create a separate ML microservice in this version.
- Fail health/readiness clearly if required model cannot load.
- Validate that preprocessing expected by the model is included or version-matched.

Backend ML interface should expose an internal service such as:

- `predict(payload) -> class probabilities / decision data`
- `model_version`

Do not expose a public endpoint that lets anonymous users use ThreatSentry as an unrestricted attack-payload classifier unless specifically required later.

Acceptance criteria:

- API starts with valid model.
- Health endpoint shows model ready state.
- Prediction path uses same preprocessing as training.
- Model version is attached to scans/findings where ML contributed.

---

## Phase 21 — Hybrid Detection

### 33. Hybrid Detection

Decision inputs:

`Response Evidence + Rules + ML`

Principles:

- Response evidence has highest value for actual vulnerability confirmation.
- Rules provide deterministic known-pattern evidence.
- ML provides classification support and prioritization.
- ML alone must not declare a vulnerability confirmed.

Create a documented decision matrix for SQLi and XSS.

Example high-level policy:

- Strong response evidence + matching rules → likely/confirmed.
- Strong response evidence + ML agreement → increase confidence.
- Rule + ML without response evidence → potential/likely depending on rule strength, never automatic confirmed.
- ML only → supporting signal or no finding, depending on threshold and context.

Thresholds must be configurable and validated against controlled labs/benchmark.

---

## Phase 22 — React Dashboard

### 34. React Dashboard

Routes:

- `/register`
- `/login`
- `/forgot-password`
- `/dashboard`
- `/websites`
- `/websites/:id`
- `/scans/:id`
- `/findings/:id`
- `/model`

### Dashboard

Show:

- Number of websites.
- Current/latest security scores.
- Open findings.
- Recent scans.
- Findings by severity chart.

### Website Detail

Show:

- URL/name.
- Verification status.
- Verification instructions/token state.
- Latest score/grade.
- Deep Scan button only when verified.
- Attack surface summary.
- Findings.
- Scan history.

### Scan Progress

Show:

- Status.
- Current stage.
- Progress.
- Start time.
- Cancel action if allowed.
- Safe failure message.

### Scan Result

Show:

- Score and grade.
- Summary cards.
- Findings by severity/category.
- Attack surface.
- Passive results.
- Active results.
- Model version.
- Comparison with previous scan.

### Finding Detail

Show:

- Title/category/severity/confidence.
- Endpoint/parameter.
- Description.
- Safe evidence rendering.
- Detection method.
- Remediation.
- History state.

### Model Metrics

Show only real generated model metadata/metrics:

- Version.
- Algorithm.
- Dataset version/size.
- Macro F1.
- Per-class metrics.
- Confusion matrix if available.

Never hardcode fake percentages.

Frontend security:

- Escape all scanner-generated strings.
- Never render evidence using unsafe HTML injection.
- Never expose service role key.
- Handle auth expiration centrally.

---

## Phase 23 — Scan History and Compare

### 35. Scan History / Compare

Use deterministic finding fingerprint.

States:

- `NEW`
- `FIXED`
- `UNCHANGED`

Comparison logic for current scan vs previous completed scan on same website:

- Current fingerprint absent previously → `NEW`.
- Current fingerprint present previously → `UNCHANGED`.
- Previous fingerprint absent from current scan → historical item reported as `FIXED`.

Do not treat failed/incomplete scans as authoritative proof that a finding is fixed.

Acceptance criteria:

- Two successful scans can be compared.
- Fixed findings remain visible in history.
- Failed scan does not mark everything fixed.

---

## Phase 24 — Controlled Security Labs

### 36. Controlled Security Labs

Create explicit local/controlled test application with endpoints:

SQLi:

- `/vulnerable/products`
- `/safe/products`

Reflected XSS:

- `/vulnerable/search`
- `/safe/search`

Every lab page and README must be marked:

`TEST / BENCHMARK ONLY`

Rules:

- Labs run only in controlled environment.
- Safe endpoints implement proper parameterization/encoding.
- Vulnerable endpoints are minimal and intentionally isolated.
- Never deploy vulnerable labs on the public production domain without access control/isolation.

### 37. Lab Dataset Collection

Collect labeled examples from controlled lab executions.

Requirements:

- Include source metadata `ThreatSentry Lab`.
- Capture NORMAL, SQLI, XSS examples generated by controlled test scenarios.
- Assign `group_id` by scenario/template.
- Keep lab data separate until explicitly merged by `build_dataset.py`.
- Do not include secrets or real user data.

---

## Phase 25 — Scanner Benchmark

### 38. Scanner Benchmark

Measure scanner detection independently from ML text classification.

Metrics:

- TP
- TN
- FP
- FN
- Precision
- Recall
- F1
- Detection Rate
- False Positive Rate

Separate experiments:

- **Experiment A = ML Classification**
- **Experiment B = Vulnerability Scanner**

**Never combine these metrics into one result.**

Benchmark procedure:

- Define a fixed controlled target set.
- Define expected vulnerable/safe labels.
- Run scanner under frozen configuration.
- Record findings and map them to expected cases.
- Compute TP/TN/FP/FN.
- Generate a reproducible report.

OWASP Benchmark, if used, remains benchmark-only and not training data.

Hard rule:

> Never fabricate benchmark results. Only report actual executed measurements.

---

## Phase 26 — Automated Testing

### 39. Automated Testing

### Backend tests

Cover:

- Authentication identity validation.
- Authorization/user isolation.
- Website ownership.
- SSRF blocking.
- URL validation.
- Verification success/failure.
- Redirect safety.
- Crawler same-origin and limits.
- Passive checks.
- Baseline engine.
- SQLi analyzer logic.
- XSS analyzer logic.
- Findings dedupe/fingerprint.
- Scoring.
- ML preprocessing.
- Model loading.
- Hybrid decision logic.
- Scan history compare.

Use mocks/test servers where appropriate so CI does not depend on arbitrary external websites.

### Frontend tests

Cover:

- Auth screens.
- Protected routes.
- Website management.
- Verification UI.
- Deep Scan eligibility.
- Scan progress rendering.
- Result rendering.
- Finding detail escaping.
- History compare rendering.

Acceptance criteria:

- `pytest` passes.
- `npm test` / Vitest passes.
- Critical safety controls have regression tests.

---

## Phase 27 — Production Hardening

### 40. Production Hardening

Implement/configure:

- Per-user rate limit.
- IP rate limit.
- Maximum concurrent scans.
- Maximum scan duration.
- Maximum pages.
- Maximum crawl depth.
- Maximum redirects.
- Maximum response size.
- Safe scanner concurrency.
- Scan cancellation.
- Same-origin enforcement.
- Distinct scanner User-Agent.
- Safe structured logging.

Never log:

- Passwords.
- Access tokens.
- Refresh tokens.
- API keys.
- Supabase service role key.
- Sensitive form values.
- Raw authentication cookies.

Recommended operational defaults should be conservative and configurable through backend settings.

---

## Phase 28 — Environment Variables

### 41. Environment Variables

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
```

Backend:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_ORIGINS=
MODEL_PATH=
```

Additional optional safe configuration may include:

```env
SCANNER_MAX_PAGES=30
SCANNER_MAX_DEPTH=3
SCANNER_CONCURRENCY=5
SCANNER_MAX_REDIRECTS=5
SCANNER_MAX_RESPONSE_BYTES=
SCANNER_REQUEST_TIMEOUT_SECONDS=
SCANNER_MAX_SCAN_SECONDS=
```

Hard rule:

> `SUPABASE_SERVICE_ROLE_KEY` is backend-only and must never be embedded into the frontend bundle.

---

# Deployment Phases

## Phase 29 — Deployment Architecture

### 42. Deployment Architecture

Target architecture:

```text
GitHub
├─ Vercel → React + TypeScript + Vite dashboard
├─ Railway → FastAPI + Scanner + ML
│  └─ Render can be used as an alternative backend host
└─ Supabase → PostgreSQL + Auth
```

Recommended production domains:

- `threatsentry.example.com` → Vercel
- `api.threatsentry.example.com` → Railway

Important operational note:

The backend platform must support the scan duration, memory footprint, network egress, and model artifact size required by the scanner. If a hosting limit makes long-running in-process scans unreliable, keep the scanner/service boundaries clean so jobs can later move to a worker architecture.

---

## Phase 30 — Pre-Deployment Frontend

### 43. Pre-Deployment Frontend

Run/check:

- `npm ci`
- `npm run build`
- TypeScript has no errors.
- No localhost hardcoding.
- No real secrets in source/build.
- Correct production `VITE_API_URL`.
- Supabase public URL/anon key configured.
- SPA routes work when directly opened/refreshed.
- Scanner evidence is escaped safely.

---

## Phase 31 — Pre-Deployment Backend

### 44. Pre-Deployment Backend

Run/check:

- Install from `requirements.txt` in a clean environment.
- `pytest` passes.
- Production-style Uvicorn boot succeeds.
- `/health` succeeds.
- ML model loads.
- Supabase connection works.
- Auth validation works.
- CORS is production-safe.
- Scan limits are configured.
- SSRF controls are enabled.
- Logs do not reveal secrets.

---

## Phase 32 — Production ML Packaging

### 45. Production ML Packaging

Production must contain:

- Final `.joblib` model.
- Model metadata.
- Production preprocessing/predictor code.

Production does not need:

- Raw datasets.
- `train.csv`.
- `validation.csv`.
- `test.csv`.
- Training notebooks/intermediate artifacts unless intentionally retained elsewhere.

Validate model artifact checksum/version during deployment where practical.

---

## Phase 33 — Secret Review

### 46. Secret Review

Before deploy, inspect Git history/current tree and deployment config for:

- `.env`
- Supabase service role key
- API keys
- Passwords
- Tokens

If a secret was ever committed, remove it from active use and rotate it; merely deleting the file in a later commit is not sufficient.

---

## Phase 34 — Supabase Production Setup

### 47. Supabase Production Setup

Perform:

- Apply migrations.
- Create indexes.
- Validate foreign keys.
- Enable RLS.
- Apply/test RLS policies.
- Configure Auth.
- Configure password reset/redirect URLs.
- Validate production site URL.
- Test User A/User B isolation against production configuration.

Do not continue deployment with disabled RLS merely to simplify debugging.

---

## Phase 35 — Deploy FastAPI

### 48. Deploy FastAPI

Primary recommendation: **Railway**.

Alternative: **Render**.

Start command:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Deploy requirements:

- Backend env vars configured in hosting secrets.
- Model artifact available at `MODEL_PATH`.
- Health endpoint externally reachable.
- Production scanner limits set.
- Correct CORS origin set.
- Logs available.

---

## Phase 36 — Deploy React/Vite

### 49. Deploy React/Vite

Use Vercel.

Root directory:

```text
apps/dashboard
```

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

---

## Phase 37 — SPA Routing

### 50. SPA Routing

Vercel must rewrite application routes back to `index.html` so React Router handles them.

Examples that must survive direct navigation/refresh:

- `/websites/123`
- `/scans/123`
- `/findings/123`

Create `vercel.json` or equivalent routing configuration for SPA fallback without breaking static assets.

---

## Phase 38 — Production CORS

### 51. Production CORS

Allow only the production frontend origin(s) required by the application.

Do not use `*` unless there is a specific justified endpoint that does not use credentials and safely supports it.

Local development origins should not remain accidentally enabled in strict production configuration unless intentionally required.

---

## Phase 39 — Domain and DNS

### 52. Domain / DNS

Example:

- `threatsentry.example.com` → Vercel.
- `api.threatsentry.example.com` → Railway.

After custom domains are configured, update:

- `VITE_API_URL`.
- `ALLOWED_ORIGINS`.
- Supabase Auth redirect URLs.
- Documentation/screenshots if they contain old hostnames.

Verify TLS on both frontend and API domains.

---

## Phase 40 — Production Verification Test

### 53. Production Verification Test

Test against controlled websites only:

- Correct token.
- Missing verification file.
- Wrong token.
- Invalid/private target.
- Redirect safety.

Expected:

- Correct public controlled target can reach `VERIFIED`.
- All invalid/private/unsafe cases are blocked.
- Verification errors are safe for users and useful in logs.

---

## Phase 41 — Production Deep Scan Smoke Test

### 54. Production Deep Scan Smoke Test

Use a **Controlled Verified Website only**.

Test end-to-end:

- Crawler.
- Passive checks.
- Attack surface.
- Baseline.
- SQLi lab.
- XSS lab.
- Findings.
- Score.
- History.
- Rescan compare.

Confirm:

- Unverified target cannot scan.
- Verified controlled target can scan.
- Progress updates render.
- Scan completes or fails safely.
- Result is persisted.

---

## Phase 42 — Production Security Checklist

### 55. Production Security Checklist

Verify:

- Authentication.
- RLS.
- Service role key backend-only.
- SSRF protection.
- Private IP blocking.
- Redirect revalidation.
- Verified-target-only active scan.
- Rate limits.
- Scan concurrency limits.
- CORS.
- Safe errors.
- Safe logging.
- Correct model version.
- Evidence rendering is escaped.
- No sensitive form values are stored unnecessarily.

Deployment is not considered complete until these controls are tested, not merely configured.

---

## Phase 43 — Monitoring

### 56. Monitoring

Start with:

- Railway/Render logs.
- Supabase logs.

Record safe operational events:

- Scan ID.
- Website ID.
- Stage.
- Start/end time.
- Duration.
- Failure category.
- Model version.

Do not store sensitive request bodies, passwords, auth tokens, API keys, or sensitive form values in logs.

Useful operational alerts later may include:

- Repeated scan failures.
- Model load failure.
- Database connectivity failure.
- Excessive scan duration.
- Unusual rate-limit activity.

---

## Phase 44 — Rollback Plan

### 57. Rollback Plan

Prepare:

- Stable Git tag.
- Previous frontend deployment.
- Previous backend deployment.
- Previous ML model.
- Migration history.

If a new model causes failures or unacceptable behavior:

1. Change `MODEL_PATH` back to the previous stable artifact.
2. Redeploy/restart backend.
3. Confirm health and smoke tests.
4. Record incident and model rollback in documentation.

Database migrations should be designed with rollback/forward-fix strategy appropriate to Supabase/Postgres.

---

## Phase 45 — Deployment Documentation

### 58. Deployment Documentation

Create:

```text
docs/deployment.md
```

Include:

- Architecture.
- Required accounts/services.
- Supabase setup.
- Railway setup.
- Render alternative.
- Vercel setup.
- Environment variables.
- CORS.
- Build/start commands.
- Domain/DNS.
- Verification smoke test.
- Deep Scan smoke test.
- Monitoring.
- Rollback.
- Secret rotation guidance.

Documentation must reflect the real implementation and commands.

---

## Phase 46 — README

### 59. README

Top-level `README.md` should contain:

- What ThreatSentry is.
- Safety/authorization boundary.
- Architecture overview.
- Technology stack.
- Local setup.
- Frontend/backend startup commands.
- Supabase requirements.
- Dataset setup commands.
- ML training/evaluation commands.
- Lab usage warning.
- Testing commands.
- Deployment links to `docs/deployment.md`.
- Project limitations.

Do not advertise ThreatSentry as a tool for scanning arbitrary sites.

---

## Phase 47 — Graduation Project Documentation

### 60. Graduation Project Documentation

Create a dedicated report source, for example:

```text
docs/graduation-project.md
```

Required sections:

- Problem Statement.
- Objectives.
- Scope.
- Architecture.
- Authentication.
- Ownership Verification.
- SSRF Protection.
- Crawler.
- Passive Scanner.
- SQL Injection Detection.
- Reflected XSS Detection.
- Dataset Sources and Preparation.
- ML Feature Extraction.
- Model Comparison.
- ML Metrics.
- Hybrid Detection.
- Security Score.
- Scanner Benchmark.
- Deployment.
- Limitations.
- Future Work.

Clearly separate:

- ML classifier evaluation.
- Vulnerability scanner benchmark.

Do not report generated/fake experimental results.

---

# 61. Final Acceptance Criteria / Definition of Done

ThreatSentry is considered complete only when all applicable criteria below are satisfied by the real implementation.

### Authentication and isolation

- Register works.
- Login works.
- Logout works.
- Forgot password works.
- Session persistence works.
- Protected routes work.
- User isolation works.
- User A cannot access User B data.

### Website management and verification

- Add Website works.
- Edit/delete/detail works.
- URL normalization works.
- SSRF protection works.
- Correct verification token works.
- Missing/wrong token fails.
- Unverified target cannot scan.
- Verified target can scan.
- Redirect safety works.

### Deep Scan

- Only `DEEP_SCAN` exists in the user flow.
- Scan lifecycle/status/progress works.
- Cancellation works.
- Crawler works.
- Same-origin and crawl limits work.
- Passive scanner works.
- Attack surface summary works.
- Baseline engine works.
- SQLi works on controlled vulnerable lab.
- Reflected XSS works on controlled vulnerable lab.
- Safe lab is not incorrectly reported at an unacceptable rate.
- Active SQLi/XSS is never run on unverified or unauthorized targets.

### Findings and scoring

- Findings are persisted.
- Findings include evidence and remediation.
- Evidence is rendered safely.
- Fingerprint is deterministic.
- Findings are deduplicated before score.
- Security Score works.
- Grade works.
- History/Compare works.
- `NEW/FIXED/UNCHANGED` logic works.

### ML pipeline

- Dataset downloader is reproducible.
- Dataset sources/licenses/roles are documented.
- OWASP Benchmark is not used as training data.
- Unified dataset is reproducible.
- No train/test group leakage exists.
- Group-aware split works.
- Character TF-IDF 2–5 pipeline works.
- Candidate models train reproducibly.
- Model selection uses validation Macro F1.
- Final test is not used for model selection.
- Final metrics are generated from real execution.
- False-positive metrics for NORMAL→SQLI/XSS are reported.
- Model version/metadata are saved.
- FastAPI loads the model once at startup.
- Production prediction uses matching preprocessing.
- Hybrid Detection works.
- ML alone cannot confirm a vulnerability.

### Benchmark

- Controlled labs exist.
- Lab data contains no real sensitive user data.
- Scanner benchmark works.
- TP/TN/FP/FN are computed from real runs.
- ML classification metrics and scanner benchmark metrics remain separate.

### Tests and production

- Automated backend tests pass.
- Automated frontend tests pass.
- Production frontend build passes.
- Backend clean install/start passes.
- Supabase configuration is complete.
- Vercel configuration is complete.
- Railway deployment configuration is complete.
- Production CORS is restricted.
- Production smoke test passes on a controlled verified target.
- Monitoring is prepared.
- Rollback is prepared.
- Documentation matches the real implementation.

---

# Implementation Order Summary

Use this order because each phase depends on controls/data established earlier:

1. Initialize repository/frontend/backend.
2. Create `.env.example`, `.gitignore`, `/health`.
3. Prepare dataset folder structure and downloader.
4. Document dataset sources/licenses/roles.
5. Create Supabase schema/migrations.
6. Implement RLS and cross-user isolation tests.
7. Implement Auth and protected routes.
8. Implement Website CRUD and URL normalization.
9. Implement centralized SSRF/target validation.
10. Implement ownership verification.
11. Implement Deep Scan job model/status/progress.
12. Implement safe crawler and discovery.
13. Implement passive checks.
14. Implement attack-surface summary.
15. Implement baseline engine.
16. Build controlled labs.
17. Implement SQLi analyzer against lab.
18. Implement Reflected XSS analyzer against lab.
19. Implement finding engine/fingerprint/deduplication.
20. Implement security scoring.
21. Build unified ML dataset.
22. Add group leakage prevention and split.
23. Train candidate models.
24. Choose model using validation Macro F1.
25. Run final untouched test evaluation.
26. Version/package model and metadata.
27. Load model in FastAPI.
28. Implement hybrid detection.
29. Connect scanner results to findings/score.
30. Build dashboard pages and scan progress.
31. Implement history/rescan comparison.
32. Collect controlled lab dataset where useful.
33. Run scanner benchmark separately from ML metrics.
34. Complete backend/frontend automated tests.
35. Apply production hardening and limits.
36. Complete frontend/backend pre-deployment checks.
37. Configure Supabase production.
38. Deploy FastAPI to Railway (Render alternative).
39. Deploy React/Vite to Vercel.
40. Configure SPA routing, CORS, domains, DNS.
41. Run production verification tests.
42. Run controlled production Deep Scan smoke test.
43. Verify monitoring and rollback.
44. Finish README, deployment docs, and graduation-project documentation.
45. Run the complete Definition of Done checklist.

---

# Suggested API Surface

This is a planning target; adjust naming to match the final implementation.

### Health

- `GET /health`

### Websites

- `GET /api/websites`
- `POST /api/websites`
- `GET /api/websites/{website_id}`
- `PATCH /api/websites/{website_id}`
- `DELETE /api/websites/{website_id}`

### Verification

- `POST /api/websites/{website_id}/verification/reset`
- `POST /api/websites/{website_id}/verify`

### Scans

- `POST /api/websites/{website_id}/scans`
- `GET /api/scans/{scan_id}`
- `POST /api/scans/{scan_id}/cancel`
- `GET /api/websites/{website_id}/scans`

### Findings

- `GET /api/scans/{scan_id}/findings`
- `GET /api/findings/{finding_id}`

### Model

- `GET /api/model`

All user-owned endpoints must derive the user identity from the validated auth token and then enforce ownership server-side. Never trust a client-supplied `user_id` as authorization.

---

# Scanner Safety Invariants

These should be treated like architecture-level tests:

1. No active scan without authenticated user.
2. No active scan without verified ownership.
3. No active scan if canonical origin changed after verification.
4. No request to a blocked/private/reserved IP.
5. No unsafe redirect follow.
6. No crawl beyond same-origin.
7. No crawl beyond configured page/depth/concurrency limits.
8. No active testing of routes excluded by destructive-action policy.
9. No unbounded timing payloads.
10. No DB extraction or destructive SQL testing.
11. No browser-executed XSS against real user sessions.
12. No sensitive request data in logs/findings.
13. No ML-only vulnerability confirmation.
14. No scanner evidence rendered as trusted HTML.
15. No service role key in frontend.

---

# Recommended Finding Confidence Matrix

Use configuration rather than hardcoding the exact numeric thresholds permanently.

| Evidence | Rules | ML | Result guidance |
|---|---|---|---|
| weak/none | none | positive | supporting signal only; usually no confirmed finding |
| weak | positive | positive | POTENTIAL |
| reproducible moderate | positive | optional | LIKELY |
| strong reproducible | strong | optional | CONFIRMED may be allowed |
| strong reproducible | none | positive | LIKELY/CONFIRMED only if response evidence itself is sufficient |

For SQLi and XSS, define category-specific decision rules rather than one universal threshold.

---

# Error Handling Strategy

User-facing errors should be safe and actionable:

- `TARGET_NOT_VERIFIED`
- `TARGET_BLOCKED`
- `TARGET_RESOLUTION_FAILED`
- `VERIFICATION_FILE_MISSING`
- `VERIFICATION_TOKEN_MISMATCH`
- `SCAN_LIMIT_EXCEEDED`
- `SCAN_CANCELLED`
- `SCAN_TIMEOUT`
- `MODEL_NOT_READY`
- `INTERNAL_SCAN_ERROR`

Internal logs may contain stack traces, but must not contain secrets or sensitive payload values.

---

# Codex Working Rules

Codex must follow these rules while implementing the project:

1. **Implement the real system, not only a plan.**
2. Work phase-by-phase according to dependency order.
3. Before modifying code, inspect the current repository and understand existing structure.
4. Do not rewrite working sections unnecessarily.
5. After each major phase, run relevant tests/build checks.
6. Fix obvious errors before continuing to the next dependent phase.
7. Keep security invariants centralized rather than duplicating inconsistent logic.
8. Never fabricate datasets.
9. Never fabricate ML metrics.
10. Never fabricate benchmark results.
11. Never weaken authentication, authorization, RLS, SSRF, ownership verification, or scan restrictions just to make a test pass.
12. Never enable Deep Scan for arbitrary third-party websites.
13. Active SQLi/XSS must require successful ownership verification.
14. If Supabase credentials are unavailable, implement migrations/config/code/tests that do not require the secret, then clearly document what credential/config must be supplied later.
15. If deployment credentials are unavailable, prepare production configuration/documentation and report the remaining credential-only step.
16. If a dataset source is unavailable, downloader should retry reasonable transient failures and then report the failure honestly.
17. Do not substitute fake local data while claiming it is the real dataset.
18. Keep OWASP Benchmark separate from training data.
19. Preserve group-aware leakage prevention.
20. Do not use the final test set to select the model.
21. Do not report a vulnerability as confirmed from ML output alone.
22. Keep lab vulnerabilities isolated and clearly marked `TEST / BENCHMARK ONLY`.
23. Never log passwords, tokens, API keys, sensitive form data, or raw authentication cookies.
24. Keep the Supabase service role key backend-only.
25. Update README/docs to match the implementation that actually exists.
26. Use real commands/results when documenting tests, model metrics, benchmark results, or deployment validation.
27. If an implementation choice must differ from this plan due to a real technical constraint, document the reason rather than silently changing security semantics.

---

# Recommended Phase Completion Checklist for Codex

At the end of every major phase, Codex should report:

- Files created/changed.
- What was implemented.
- Tests/build commands run.
- Actual result of those commands.
- Remaining known issues.
- Whether the next phase's prerequisites are satisfied.

Do not claim a test passed unless it was actually executed successfully.

---

# Final Deliverables

A complete project should end with at least:

```text
apps/dashboard/                 # React + TS + Vite UI
backend/                        # FastAPI + scanner + ML runtime
ml/                             # reproducible dataset/train/evaluate pipeline
labs/                           # controlled vulnerable/safe targets
supabase/migrations/            # schema + RLS
ml/models/*.joblib              # final approved production model
ml/models/*.metadata.yaml       # model metadata
ml/reports/                     # real ML reports
reports/ or docs/benchmark*     # real scanner benchmark output
README.md
docs/datasets.md
docs/architecture.md
docs/scanner.md
docs/ml.md
docs/benchmark.md
docs/security.md
docs/deployment.md
docs/graduation-project.md
```

The final repository must demonstrate not only that ThreatSentry can detect issues in controlled verified targets, but also that it enforces authorization, ownership verification, SSRF protection, scan limits, reproducible ML methodology, honest metrics, and production-safe deployment practices.
