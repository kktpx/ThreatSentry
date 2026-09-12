import secrets


VERIFICATION_PREFIX = "threatsentry-verification="


def create_verification_token() -> str:
    """Create an unguessable token suitable for a public ownership challenge."""
    return secrets.token_urlsafe(32)


def expected_verification_file(token: str) -> str:
    return f"{VERIFICATION_PREFIX}{token}\n"


def matches_verification_file(content: str, token: str) -> bool:
    """Accept only the challenge line after leading/trailing whitespace normalization."""
    return content.strip() == expected_verification_file(token).strip()
