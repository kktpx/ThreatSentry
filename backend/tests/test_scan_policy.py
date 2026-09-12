import pytest

from backend.api.scan_policy import ScanAuthorizationError, require_verified_website


def test_require_verified_website_accepts_verified_assets() -> None:
    require_verified_website("VERIFIED")


@pytest.mark.parametrize("status", ["UNVERIFIED", "PENDING", "FAILED"])
def test_require_verified_website_rejects_unverified_assets(status: str) -> None:
    with pytest.raises(ScanAuthorizationError, match="verified"):
        require_verified_website(status)
