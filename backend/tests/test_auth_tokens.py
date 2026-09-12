import pytest

from backend.api.deps.auth import AuthenticationError, authenticate_token, extract_bearer_token


def test_extract_bearer_token_accepts_a_bearer_header() -> None:
    assert extract_bearer_token("Bearer signed.jwt.token") == "signed.jwt.token"


@pytest.mark.parametrize("header", [None, "", "Basic abc", "Bearer "])
def test_extract_bearer_token_rejects_missing_or_malformed_headers(header: str | None) -> None:
    with pytest.raises(AuthenticationError):
        extract_bearer_token(header)


def test_authenticate_token_returns_the_authenticated_user_id() -> None:
    class User:
        id = "0a23c480-168e-4d4b-ae3c-23b08d6b4d5c"

    assert authenticate_token("signed.jwt.token", lambda token: User()) == User.id


def test_authenticate_token_rejects_a_token_without_a_user() -> None:
    with pytest.raises(AuthenticationError, match="invalid or expired"):
        authenticate_token("bad.token", lambda token: None)
