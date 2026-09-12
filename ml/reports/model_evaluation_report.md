# ThreatSentry ML Model Evaluation Report

**Model Version:** `web_ids_model_v1.0.0`  
**Evaluation Date:** 2026-09-12  
**Dataset Splits:** Group-stratified (OWASP CRS v4.x + CSIC 2010 Benign)  
**Leakage Control:** Zero group overlap between training and test sets  

---

## 1. Executive Summary

The trained machine learning classifier was evaluated against an **untouched test split of 273 samples**.
The model achieved high discrimination accuracy while maintaining zero false positive rate on benign web traffic.

- **Overall Accuracy:** 100.00%
- **Macro F1 Score:** 1.0000
- **Macro Precision:** 1.0000
- **Macro Recall:** 1.0000
- **Benign -> SQLi False Positive Rate:** 0.00%
- **Benign -> XSS False Positive Rate:** 0.00%

---

## 2. Per-Class Performance

| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| **NORMAL** | 1.0000 | 1.0000 | 1.0000 | 83.0 |
| **SQLI** | 1.0000 | 1.0000 | 1.0000 | 77.0 |
| **XSS** | 1.0000 | 1.0000 | 1.0000 | 113.0 |

---

## 3. Confusion Matrix

| Actual \ Predicted | NORMAL | SQLI | XSS | Total |
|---|---|---|---|---|
| **NORMAL** | 83 | 0 | 0 | 83 |
| **SQLI** | 0 | 77 | 0 | 77 |
| **XSS** | 0 | 0 | 113 | 113 |

---

## 4. Leakage Verification & Boundary Integrity

- **Train/Val/Test Leakage:** Verified 0 overlapping structural groups across splits.
- **OWASP Benchmark Separation:** Strict invariant enforced—OWASP Benchmark is NOT included in the training or validation datasets.
- **Deployment Status:** Serialized to `ml/models/web_ids_model_v1.0.0.joblib` and ready for production inference in the FastAPI backend.
