from dataclasses import dataclass
import time
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx


@dataclass(frozen=True, slots=True)
class BaselineResponse:
    url: str
    status_code: int
    content_length: int
    elapsed_seconds: float
    body: str


async def capture_baseline(
    client: httpx.AsyncClient,
    url: str,
    method: str = "GET",
    params: dict[str, str] | None = None,
    data: dict[str, str] | None = None,
) -> BaselineResponse:
    """Collects baseline response metrics for stable parameter comparison."""
    start_time = time.monotonic()
    if method.upper() == "POST":
        response = await client.post(url, data=data or {})
    else:
        response = await client.get(url, params=params)
    elapsed = time.monotonic() - start_time

    return BaselineResponse(
        url=url,
        status_code=response.status_code,
        content_length=len(response.content),
        elapsed_seconds=elapsed,
        body=response.text[:65536],  # cap at 64KB for analysis
    )
