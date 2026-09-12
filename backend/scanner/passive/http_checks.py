import re
from typing import Literal, Mapping

Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


class HttpCheckFinding:
    __slots__ = ("category", "severity", "recommendation", "evidence")

    def __init__(self, category: str, severity: Severity, recommendation: str, evidence: dict[str, str]) -> None:
        self.category = category
        self.severity = severity
        self.recommendation = recommendation
        self.evidence = evidence


# Patterns indicating version numbers leaked in Server or X-Powered-By
VERSION_PATTERN = re.compile(r"(\d+\.\d+(?:\.\d+)?)")


def evaluate_http_protocol(url: str) -> list[HttpCheckFinding]:
    findings: list[HttpCheckFinding] = []
    if url.startswith("http://"):
        findings.append(
            HttpCheckFinding(
                category="UNENCRYPTED_HTTP",
                severity="MEDIUM",
                recommendation="Enforce HTTPS across all application routes and redirect HTTP to HTTPS.",
                evidence={"scheme": "http", "url": url},
            )
        )
    return findings


def evaluate_server_banners(headers: Mapping[str, str]) -> list[HttpCheckFinding]:
    findings: list[HttpCheckFinding] = []
    normalized = {k.lower(): v for k, v in headers.items()}

    server = normalized.get("server", "").strip()
    if server and VERSION_PATTERN.search(server):
        findings.append(
            HttpCheckFinding(
                category="SERVER_BANNER_LEAKAGE",
                severity="LOW",
                recommendation="Disable detailed server banner version information in server configuration.",
                evidence={"header": "server", "value": server},
            )
        )

    x_powered_by = normalized.get("x-powered-by", "").strip()
    if x_powered_by:
        findings.append(
            HttpCheckFinding(
                category="X_POWERED_BY_LEAKAGE",
                severity="LOW",
                recommendation="Remove X-Powered-By header to prevent exposing framework and runtime technology details.",
                evidence={"header": "x-powered-by", "value": x_powered_by},
            )
        )

    return findings
