from dataclasses import dataclass, field
from typing import Any, Literal
from urllib.parse import urlsplit

from backend.scanner.fingerprints import finding_fingerprint

Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
Confidence = Literal["POTENTIAL", "LIKELY", "CONFIRMED"]
DetectionMethod = Literal["PASSIVE", "ACTIVE", "RULE", "ML", "HYBRID"]
FindingStatus = Literal["NEW", "UNCHANGED"]


@dataclass
class Finding:
    title: str
    category: str
    severity: Severity
    endpoint: str
    description: str
    recommendation: str
    detection_method: DetectionMethod
    confidence: Confidence
    evidence: dict[str, Any] = field(default_factory=dict)
    parameter: str | None = None
    fingerprint: str = ""
    status: FindingStatus = "NEW"
    http_method: str = "GET"
    subtype: str = ""

    def ensure_fingerprint(self, origin: str) -> str:
        if not self.fingerprint:
            subtype = self.subtype or self.category
            self.fingerprint = finding_fingerprint(
                origin=origin,
                category=self.category,
                method=self.http_method,
                endpoint=self.endpoint,
                parameter=self.parameter,
                subtype=subtype,
            )
        return self.fingerprint

    def to_dict(self, *, user_id: str, website_id: str, scan_id: str, origin: str) -> dict[str, Any]:
        fp = self.ensure_fingerprint(origin)
        return {
            "user_id": user_id,
            "website_id": website_id,
            "scan_id": scan_id,
            "title": self.title,
            "category": self.category,
            "severity": self.severity,
            "endpoint": self.endpoint,
            "parameter": self.parameter,
            "description": self.description,
            "evidence": self.evidence,
            "recommendation": self.recommendation,
            "detection_method": self.detection_method,
            "confidence": self.confidence,
            "fingerprint": fp,
            "status": self.status,
        }


def deduplicate_findings(findings: list[Finding], origin: str) -> list[Finding]:
    """Deduplicates findings by fingerprint so each unique issue is reported once per scan."""
    unique: dict[str, Finding] = {}
    for finding in findings:
        fp = finding.ensure_fingerprint(origin)
        if fp not in unique:
            unique[fp] = finding
    return list(unique.values())
