import pytest

from backend.scanner.ssrf import BlockedTargetError, ensure_public_host


@pytest.mark.asyncio
async def test_ensure_public_host_returns_only_public_addresses() -> None:
    async def resolve(_: str) -> tuple[str, ...]:
        return ("93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946")

    addresses = await ensure_public_host("example.com", resolver=resolve)

    assert addresses == ("93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946")


@pytest.mark.asyncio
async def test_ensure_public_host_blocks_a_mixed_public_private_dns_answer() -> None:
    async def resolve(_: str) -> tuple[str, ...]:
        return ("93.184.216.34", "10.0.0.8")

    with pytest.raises(BlockedTargetError, match="blocked network"):
        await ensure_public_host("rebound.example", resolver=resolve)
