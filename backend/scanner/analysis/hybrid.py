from typing import Any

from backend.ml.predictor import MLPredictor
from backend.scanner.findings import Finding


def enrich_with_hybrid_analysis(findings: list[Finding], predictor: MLPredictor) -> list[Finding]:
    """Enriches finding confidence and evidence using the hybrid response + rules + ML decision matrix."""
    for finding in findings:
        payload = ""
        if "probe_payload" in finding.evidence:
            payload = finding.evidence["probe_payload"]

        if not payload:
            continue

        probs = predictor.predict(payload)
        finding.evidence["ml_prediction"] = probs
        finding.evidence["model_version"] = predictor.version

        # Rule: ML alone must NEVER confirm
        if finding.category == "SQL_INJECTION":
            ml_sqli_prob = probs.get("SQLI", 0.0)
            if ml_sqli_prob > 0.6:
                finding.detection_method = "HYBRID"
                if finding.confidence == "POTENTIAL" and ml_sqli_prob > 0.8:
                    finding.confidence = "LIKELY"

        elif finding.category == "REFLECTED_XSS":
            ml_xss_prob = probs.get("XSS", 0.0)
            if ml_xss_prob > 0.6:
                finding.detection_method = "HYBRID"
                if finding.confidence == "POTENTIAL" and ml_xss_prob > 0.8:
                    finding.confidence = "LIKELY"

    return findings
