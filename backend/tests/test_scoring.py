from backend.scanner.scoring import FindingForScore, calculate_score


def test_score_deduplicates_findings_by_fingerprint() -> None:
    result = calculate_score(
        [
            FindingForScore(fingerprint="headers:csp", severity="MEDIUM"),
            FindingForScore(fingerprint="headers:csp", severity="MEDIUM"),
            FindingForScore(fingerprint="xss:search:q", severity="HIGH"),
        ]
    )

    assert result.score == 85
    assert result.grade == "B"
    assert result.deduplicated_finding_count == 2


def test_score_is_clamped_at_zero() -> None:
    result = calculate_score(
        [FindingForScore(fingerprint=f"critical:{index}", severity="CRITICAL") for index in range(10)]
    )

    assert result.score == 0
    assert result.grade == "F"
