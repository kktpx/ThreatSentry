import re
from typing import Literal

Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


class ExposureFinding:
    __slots__ = ("category", "severity", "recommendation", "evidence")

    def __init__(self, category: str, severity: Severity, recommendation: str, evidence: dict[str, str]) -> None:
        self.category = category
        self.severity = severity
        self.recommendation = recommendation
        self.evidence = evidence


STACK_TRACE_PATTERNS = (
    (re.compile(r"Traceback \(most recent call last\):", re.IGNORECASE), "Python traceback detected"),
    (re.compile(r"Fatal error:.*?in\s+/\S+\.php", re.IGNORECASE), "PHP Fatal error with path leakage"),
    (re.compile(r"at\s+[\w\.\$]+\([\w\.]+\.java:\d+\)", re.IGNORECASE), "Java stack trace detected"),
    (re.compile(r"at\s+(?:async\s+)?[\w\.\$]+\s+\([^)]+:\d+:\d+\)", re.IGNORECASE), "Node.js stack trace detected"),
    (re.compile(r"System\.NullReferenceException:", re.IGNORECASE), ".NET exception stack trace detected"),
)

DIRECTORY_LISTING_PATTERNS = (
    re.compile(r"<title>Index of /", re.IGNORECASE),
    re.compile(r"<h1>Index of /", re.IGNORECASE),
    re.compile(r"Directory Listing For /", re.IGNORECASE),
)


def evaluate_content_exposure(body: str, status_code: int) -> list[ExposureFinding]:
    findings: list[ExposureFinding] = []

    # 1. Stack trace detection
    for pattern, desc in STACK_TRACE_PATTERNS:
        match = pattern.search(body)
        if match:
            findings.append(
                ExposureFinding(
                    category="STACK_TRACE_EXPOSURE",
                    severity="HIGH",
                    recommendation="Disable public debug mode and return generic error pages instead of detailed stack traces.",
                    evidence={"match": desc, "status_code": str(status_code)},
                )
            )
            break

    # 2. Directory listing detection
    for pattern in DIRECTORY_LISTING_PATTERNS:
        if pattern.search(body):
            findings.append(
                ExposureFinding(
                    category="DIRECTORY_LISTING",
                    severity="MEDIUM",
                    recommendation="Disable directory indexing / directory listing on web server configuration.",
                    evidence={"snippet": "Directory index page title observed."},
                )
            )
            break

    return findings
