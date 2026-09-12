import pytest

from backend.scanner.target_validation import TargetValidationError, normalize_target


def test_normalize_target_builds_a_canonical_origin() -> None:
    target = normalize_target("HTTPS://Example.COM:443/search?q=alerts#section")

    assert target.origin == "https://example.com"
    assert target.url == "https://example.com/search?q=alerts"


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com",
        "https://user:password@example.com",
        "http://127.0.0.1:8000",
        "http://[::1]/",
        "http://169.254.169.254/latest/meta-data",
    ],
)
def test_normalize_target_rejects_unsafe_or_unsupported_targets(url: str) -> None:
    with pytest.raises(TargetValidationError):
        normalize_target(url)
