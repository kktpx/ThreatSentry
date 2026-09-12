import pytest
import respx
from httpx import Response

from backend.scanner.verification_fetch import verify_ownership_document


@pytest.mark.asyncio
@respx.mock
async def test_verify_ownership_document_accepts_the_expected_well_known_file() -> None:
    token = "ownership-token"
    respx.get("https://example.com/.well-known/threatsentry.txt").mock(
        return_value=Response(200, text=f"threatsentry-verification={token}\n")
    )

    assert await verify_ownership_document(
        "https://example.com", token, resolver=lambda host: _public_address()
    ) is True


@pytest.mark.asyncio
@respx.mock
async def test_verify_ownership_document_rejects_wrong_content() -> None:
    respx.get("https://example.com/.well-known/threatsentry.txt").mock(return_value=Response(200, text="wrong"))

    assert await verify_ownership_document(
        "https://example.com", "ownership-token", resolver=lambda host: _public_address()
    ) is False


async def _public_address() -> tuple[str, ...]:
    return ("93.184.216.34",)
