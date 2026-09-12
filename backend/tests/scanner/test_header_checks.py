from backend.scanner.passive.header_checks import evaluate_security_headers


def test_missing_content_security_policy_creates_a_remediable_finding() -> None:
    findings = evaluate_security_headers({"server": "example"})

    csp = next(finding for finding in findings if finding.category == "MISSING_CSP")
    assert csp.severity == "MEDIUM"
    assert "Content-Security-Policy" in csp.recommendation


def test_present_security_headers_do_not_create_missing_findings() -> None:
    findings = evaluate_security_headers(
        {
            "content-security-policy": "default-src 'self'",
            "strict-transport-security": "max-age=31536000; includeSubDomains",
            "x-content-type-options": "nosniff",
            "x-frame-options": "DENY",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "cross-origin-opener-policy": "same-origin",
            "cross-origin-resource-policy": "same-origin",
        }
    )

    assert not findings
