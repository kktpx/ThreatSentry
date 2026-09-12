from dataclasses import dataclass
from typing import Literal, Mapping


Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


@dataclass(frozen=True, slots=True)
class HeaderFinding:
    category: str
    severity: Severity
    recommendation: str
    evidence: dict[str, str]


REQUIRED_HEADERS: tuple[tuple[str, str, Severity, str], ...] = (
    ("content-security-policy", "MISSING_CSP", "MEDIUM", "Set a restrictive Content-Security-Policy for application responses."),
    ("strict-transport-security", "MISSING_HSTS", "MEDIUM", "Set Strict-Transport-Security after validating HTTPS coverage."),
    ("x-content-type-options", "MISSING_X_CONTENT_TYPE_OPTIONS", "LOW", "Set X-Content-Type-Options to nosniff."),
    ("x-frame-options", "MISSING_X_FRAME_OPTIONS", "LOW", "Set X-Frame-Options to DENY or SAMEORIGIN."),
    ("referrer-policy", "MISSING_REFERRER_POLICY", "LOW", "Set a Referrer-Policy appropriate for the application."),
    ("permissions-policy", "MISSING_PERMISSIONS_POLICY", "LOW", "Set a restrictive Permissions-Policy."),
    ("cross-origin-opener-policy", "MISSING_COOP", "LOW", "Set Cross-Origin-Opener-Policy for cross-origin isolation."),
    ("cross-origin-resource-policy", "MISSING_CORP", "LOW", "Set Cross-Origin-Resource-Policy for sensitive resources."),
)


def evaluate_security_headers(headers: Mapping[str, str]) -> list[HeaderFinding]:
    normalized = {name.lower(): value for name, value in headers.items()}
    return [
        HeaderFinding(category=category, severity=severity, recommendation=recommendation, evidence={"header": header})
        for header, category, severity, recommendation in REQUIRED_HEADERS
        if not normalized.get(header, "").strip()
    ]
