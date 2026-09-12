import html
import httpx
import pytest

from backend.scanner.active.reflected_xss import scan_reflected_xss_for_parameter
from backend.scanner.active.sqli import scan_sqli_for_parameter


@pytest.mark.asyncio
async def test_sqli_detected_on_db_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        param = request.url.params.get("id", "")
        if "'" in param:
            return httpx.Response(500, text="Fatal error: sqlite3.OperationalError: unrecognized token")
        return httpx.Response(200, text="User profile: Alice")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        finding = await scan_sqli_for_parameter(
            client=client,
            url="https://example.com/user?id=1",
            parameter="id",
            original_value="1",
        )

    assert finding is not None
    assert finding.category == "SQL_INJECTION"
    assert finding.severity == "CRITICAL"
    assert finding.confidence in {"CONFIRMED", "LIKELY"}
    assert "sqlite3.operationalerror" in finding.evidence["error_pattern"].lower()


@pytest.mark.asyncio
async def test_sqli_safe_endpoint_returns_none() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="User profile: Safe")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        finding = await scan_sqli_for_parameter(
            client=client,
            url="https://example.com/user?id=1",
            parameter="id",
            original_value="1",
        )

    assert finding is None


@pytest.mark.asyncio
async def test_reflected_xss_detected_when_unencoded() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        q = request.url.params.get("q", "")
        # VULNERABLE: reflection without encoding
        return httpx.Response(200, headers={"content-type": "text/html"}, text=f"Search results for: {q}")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        finding = await scan_reflected_xss_for_parameter(
            client=client,
            url="https://example.com/search?q=test",
            parameter="q",
        )

    assert finding is not None
    assert finding.category == "REFLECTED_XSS"
    assert finding.severity == "HIGH"
    assert finding.confidence == "CONFIRMED"


@pytest.mark.asyncio
async def test_reflected_xss_safe_when_html_encoded() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        q = request.url.params.get("q", "")
        # SAFE: properly escaped HTML
        safe_q = html.escape(q)
        return httpx.Response(200, headers={"content-type": "text/html"}, text=f"Search results for: {safe_q}")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        finding = await scan_reflected_xss_for_parameter(
            client=client,
            url="https://example.com/search?q=test",
            parameter="q",
        )

    assert finding is None
