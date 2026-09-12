from typing import TypedDict

from backend.scanner.target_validation import normalize_target
from backend.scanner.verification import create_verification_token


class WebsiteInsert(TypedDict):
    name: str
    url: str
    normalized_origin: str
    verification_token: str
    verification_status: str


def create_website_record(name: str, raw_url: str, *, allow_local: bool = False) -> WebsiteInsert:
    """Build a safe initial website record for an authenticated user."""
    display_name = name.strip()
    if not 1 <= len(display_name) <= 120:
        raise ValueError("Website name must contain between 1 and 120 characters")
    target = normalize_target(raw_url, allow_local=allow_local)
    return {
        "name": display_name,
        "url": target.url,
        "normalized_origin": target.origin,
        "verification_token": create_verification_token(),
        "verification_status": "UNVERIFIED",
    }
