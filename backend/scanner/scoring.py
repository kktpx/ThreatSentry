from dataclasses import dataclass
from typing import Literal


Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]

DEDUCTIONS: dict[Severity, int] = {
    "CRITICAL": 20,
    "HIGH": 10,
    "MEDIUM": 5,
    "LOW": 2,
    "INFO": 0,
}


@dataclass(frozen=True, slots=True)
class FindingForScore:
    fingerprint: str
    severity: Severity


@dataclass(frozen=True, slots=True)
class ScoreResult:
    score: int
    grade: str
    deduplicated_finding_count: int
    formula_version: str = "v1"


def calculate_score(findings: list[FindingForScore]) -> ScoreResult:
    """Calculate the stable v1 score without double-penalizing duplicate issues."""
    unique_findings = {finding.fingerprint: finding for finding in findings}
    score = max(0, 100 - sum(DEDUCTIONS[finding.severity] for finding in unique_findings.values()))
    return ScoreResult(
        score=score,
        grade=_grade_for(score),
        deduplicated_finding_count=len(unique_findings),
    )


def _grade_for(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"
