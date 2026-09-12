from collections.abc import Awaitable, Callable, Sequence

import httpx

from backend.scanner.ssrf import ensure_public_host
from backend.scanner.target_validation import normalize_target
from backend.scanner.verification import matches_verification_file

Resolver = Callable[[str], Awaitable[Sequence[str]]]
MAX_VERIFICATION_BYTES = 64 * 1024


async def verify_ownership_document(
    origin: str,
    token: str,
    *,
    resolver: Resolver | None = None,
    client: httpx.AsyncClient | None = None,
    allow_local: bool = False,
) -> bool:
    """Fetch the fixed ownership challenge path after DNS safety validation.

    Redirects are deliberately not followed here; a future redirect handler must
    validate every next location before any network request is made.
    """
    target = normalize_target(origin, allow_local=allow_local)
    await ensure_public_host(target.host, resolver=resolver, allow_local=allow_local)
    challenge_url = f"{target.origin}/.well-known/threatsentry.txt"
    timeout = httpx.Timeout(connect=5, read=8, write=5, pool=5)

    headers = {"Accept": "text/plain", "X-ThreatSentry-Token": token}
    try:
        if client is not None:
            async with client.stream("GET", challenge_url, headers=headers) as response:
                if response.status_code != 200:
                    return False
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > MAX_VERIFICATION_BYTES:
                        return False
            return matches_verification_file(body.decode("utf-8", errors="replace"), token)

        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as http_client:
            async with http_client.stream("GET", challenge_url, headers=headers) as response:
                if response.status_code != 200:
                    return False
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > MAX_VERIFICATION_BYTES:
                        return False
        return matches_verification_file(body.decode("utf-8", errors="replace"), token)
    except httpx.HTTPError:
        return False
