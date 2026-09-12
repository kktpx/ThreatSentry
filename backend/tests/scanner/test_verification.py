from backend.scanner.verification import (
    create_verification_token,
    expected_verification_file,
    matches_verification_file,
)


def test_verification_tokens_are_unique_url_safe_values() -> None:
    first = create_verification_token()
    second = create_verification_token()

    assert first != second
    assert len(first) >= 40
    assert first.replace("-", "").replace("_", "").isalnum()


def test_verification_file_requires_the_exact_token_after_whitespace_normalization() -> None:
    token = "example-token"

    assert expected_verification_file(token) == "threatsentry-verification=example-token\n"
    assert matches_verification_file("  threatsentry-verification=example-token \r\n", token)
    assert not matches_verification_file("threatsentry-verification=other-token\n", token)
    assert not matches_verification_file("prefix-threatsentry-verification=example-token", token)
