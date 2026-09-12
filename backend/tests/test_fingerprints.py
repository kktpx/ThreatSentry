from backend.scanner.fingerprints import finding_fingerprint


def test_fingerprint_ignores_volatile_query_values() -> None:
    first = finding_fingerprint(
        origin="https://example.com",
        category="MISSING_CSP",
        method="GET",
        endpoint="/search?q=first",
        parameter=None,
        subtype="header",
    )
    second = finding_fingerprint(
        origin="https://example.com",
        category="MISSING_CSP",
        method="GET",
        endpoint="/search?q=second",
        parameter=None,
        subtype="header",
    )

    assert first == second
