import pytest
import httpx

from backend.api.websites import create_website_record
from backend.scanner.target_validation import normalize_target
from backend.scanner.verification_fetch import verify_ownership_document
from backend.scanner.crawler import SafeCrawler


def test_local_target_normalization_with_allow_local() -> None:
    # When allow_local is True, 127.0.0.1:8080 and localhost:8080 are accepted
    target_loopback = normalize_target("http://127.0.0.1:8080/search?q=test", allow_local=True)
    assert target_loopback.origin == "http://127.0.0.1:8080"
    assert target_loopback.host == "127.0.0.1"
    assert target_loopback.port == 8080

    target_localhost = normalize_target("http://localhost:8080", allow_local=True)
    assert target_localhost.origin == "http://localhost:8080"
    assert target_localhost.host == "localhost"

    rec = create_website_record("Local Lab", "http://localhost:8080", allow_local=True)
    assert rec["name"] == "Local Lab"
    assert rec["normalized_origin"] == "http://localhost:8080"
    assert rec["verification_status"] == "UNVERIFIED"
    assert rec["verification_token"].startswith("ts_") or len(rec["verification_token"]) > 10


@pytest.mark.asyncio
async def test_local_verification_fetch_with_mock() -> None:
    token = "test_challenge_token_999"

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/.well-known/threatsentry.txt":
            return httpx.Response(200, text=f"threatsentry-verification={token}\n")
        return httpx.Response(404)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        # Resolver that resolves localhost to 127.0.0.1
        async def resolve_local(_: str) -> tuple[str, ...]:
            return ("127.0.0.1",)

        verified = await verify_ownership_document(
            "http://localhost:8080",
            token,
            resolver=resolve_local,
            client=client,
            allow_local=True,
        )
        assert verified is True


@pytest.mark.asyncio
async def test_allow_local_still_rejects_private_lan_addresses() -> None:
    from backend.scanner.ssrf import BlockedTargetError, ensure_public_host
    from backend.scanner.target_validation import TargetValidationError

    # Literal private IP in target URL
    with pytest.raises(TargetValidationError, match="blocked network address"):
        normalize_target("http://192.168.1.100:8080", allow_local=True)

    # DNS resolution resolving to a private IP
    async def resolve_private(_: str) -> tuple[str, ...]:
        return ("192.168.1.50",)

    with pytest.raises(BlockedTargetError, match="blocked network address"):
        await ensure_public_host("internal.router.local", resolver=resolve_private, allow_local=True)


@pytest.mark.asyncio
async def test_local_verification_passes_token_in_header() -> None:
    token = "dynamic_token_777"
    received_header = None

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal received_header
        received_header = request.headers.get("X-ThreatSentry-Token")
        if request.url.path == "/.well-known/threatsentry.txt" and received_header == token:
            return httpx.Response(200, text=f"threatsentry-verification={received_header}\n")
        return httpx.Response(400)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        async def resolve_local(_: str) -> tuple[str, ...]:
            return ("127.0.0.1",)

        verified = await verify_ownership_document(
            "http://localhost:8080",
            token,
            resolver=resolve_local,
            client=client,
            allow_local=True,
        )
        assert verified is True
        assert received_header == token
