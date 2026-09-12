from datetime import UTC, datetime

from backend.api.website_verification import verification_update


def test_verification_update_marks_a_successful_challenge_verified() -> None:
    now = datetime(2026, 9, 12, 4, 30, tzinfo=UTC)

    assert verification_update(True, now=now) == {
        "verification_status": "VERIFIED",
        "verified_at": "2026-09-12T04:30:00+00:00",
    }


def test_verification_update_marks_a_failed_challenge_without_a_verified_time() -> None:
    assert verification_update(False, now=datetime.now(UTC)) == {
        "verification_status": "FAILED",
        "verified_at": None,
    }
