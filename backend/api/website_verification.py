from datetime import datetime


def verification_update(is_verified: bool, *, now: datetime) -> dict[str, str | None]:
    """Produce the only persisted states permitted by a verification attempt."""
    if is_verified:
        return {"verification_status": "VERIFIED", "verified_at": now.isoformat()}
    return {"verification_status": "FAILED", "verified_at": None}
