import asyncio
from collections.abc import Awaitable, Callable, Sequence
import ipaddress
import socket


class BlockedTargetError(ValueError):
    """Raised when DNS resolution crosses the public-network safety boundary."""


Resolver = Callable[[str], Awaitable[Sequence[str]]]


async def ensure_public_host(
    host: str,
    *,
    resolver: Resolver | None = None,
    allow_local: bool = False,
) -> tuple[str, ...]:
    """Resolve a hostname and reject it unless every answer is globally routable."""
    addresses = tuple(await (resolver or resolve_host)(host))
    if not addresses:
        raise BlockedTargetError("Target hostname could not be resolved")

    for raw_address in addresses:
        try:
            address = ipaddress.ip_address(raw_address)
        except ValueError as error:
            raise BlockedTargetError("Target hostname returned an invalid address") from error
        if allow_local and address.is_loopback:
            continue
        if not address.is_global:
            raise BlockedTargetError("Target resolved to a blocked network address")

    return addresses


async def resolve_host(host: str) -> tuple[str, ...]:
    """Resolve both IPv4 and IPv6 records using the operating-system resolver."""
    loop = asyncio.get_running_loop()
    records = await loop.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    return tuple(dict.fromkeys(record[4][0] for record in records))
