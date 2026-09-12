# ThreatSentry — Dataset Documentation

## Overview
ThreatSentry uses a hybrid detection engine combining deterministic protocol checks, response differential analysis, and a character-level Machine Learning classifier for classifying web inputs into three canonical classes:
1. `NORMAL`: Benign web traffic, form values, URL query parameters, pagination, slugs, and everyday input.
2. `SQLI`: Structured Query Language injection payloads across union-based, error-based, boolean-blind, and time-based variants.
3. `XSS`: Cross-Site Scripting vectors across raw tag injections, event handlers, attribute breakouts, and javascript pseudoprotocols.

---

## Data Sources & Licenses

### 1. OWASP Core Rule Set (CRS v4.x)
- **Source:** [OWASP Core Rule Set](https://github.com/coreruleset/coreruleset)
- **License:** Apache 2.0
- **Components Used:**
  - `REQUEST-942-APPLICATION-ATTACK-SQLI`: Regular expressions and regression test payloads for SQL injection patterns.
  - `REQUEST-941-APPLICATION-ATTACK-XSS`: Regular expressions and regression test payloads for cross-site scripting patterns.
- **Role:** Primary source of positive attack vectors and attack family definitions (`crs-942`, `crs-941`).

### 2. CSIC 2010 HTTP Dataset & Benign Web Parameters
- **Source:** Information Security Institute of CSIC (Spanish Research Council)
- **License:** Open Academic / Research Use
- **Role:** Primary source of benign HTTP requests, clean parameter names, and typical web form inputs for the `NORMAL` class.

### 3. HttpParamsDataset
- **Source:** Security research corpus of benign and malicious parameter values.
- **License:** Open Research Use
- **Role:** Additional validation samples for boundary testing.

---

## Ethical Boundaries & Separation Rule
> **Hard Invariant:** The **OWASP Benchmark** is strictly prohibited from participating in any training, validation, or test dataset for the ML model. It is reserved exclusively for black-box evaluation of scanner performance to prevent target memorization and biased benchmark claims.

---

## Data Cleaning & Transformation Pipeline
1. **URL & HTML Entity Decoding:** Raw payloads are normalized to evaluate their effective semantic payload.
2. **Whitespace Normalization:** Unnecessary control characters and repeated whitespace are normalized without altering critical SQL/HTML syntax.
3. **Exact Deduplication:** Identical string occurrences are collapsed into a single record.
4. **Group-Aware Splitting:** Every sample is tagged with an `attack_family` and assigned a deterministic `group_id`. During dataset splitting, samples belonging to the same `group_id` are isolated to either the train, validation, or test split to eliminate data leakage.
