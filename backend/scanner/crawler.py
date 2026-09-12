import asyncio
from dataclasses import dataclass, field
import logging
from typing import Any
from urllib.parse import parse_qs, urljoin, urlsplit, urlunsplit

from bs4 import BeautifulSoup
import httpx

from backend.scanner.ssrf import BlockedTargetError, Resolver, ensure_public_host, resolve_host
from backend.scanner.target_validation import TargetValidationError, normalize_target

logger = logging.getLogger(__name__)

DESTRUCTIVE_KEYWORDS = {
    "logout",
    "signout",
    "sign-out",
    "log-out",
    "delete",
    "destroy",
    "remove",
    "checkout",
    "payment",
    "pay",
    "cancel",
    "drop",
}


@dataclass(frozen=True, slots=True)
class FormInput:
    name: str
    input_type: str = "text"
    value: str = ""


@dataclass(frozen=True, slots=True)
class DiscoveredForm:
    action_url: str
    method: str
    inputs: tuple[FormInput, ...]


@dataclass(frozen=True, slots=True)
class DiscoveredEndpoint:
    url: str
    path: str
    method: str
    parameters: tuple[str, ...]


@dataclass
class AttackSurface:
    origin: str
    pages_crawled: list[str] = field(default_factory=list)
    endpoints: list[DiscoveredEndpoint] = field(default_factory=list)
    forms: list[DiscoveredForm] = field(default_factory=list)
    external_domains: list[str] = field(default_factory=list)
    skipped_urls: list[str] = field(default_factory=list)

    def to_summary(self) -> dict[str, Any]:
        return {
            "pages_crawled_count": len(self.pages_crawled),
            "endpoints_count": len(self.endpoints),
            "forms_count": len(self.forms),
            "external_domains_count": len(self.external_domains),
            "pages_crawled": self.pages_crawled,
            "external_domains": self.external_domains,
            "skipped_urls_count": len(self.skipped_urls),
        }


def is_destructive_path(url: str) -> bool:
    parsed = urlsplit(url)
    lower_path = parsed.path.lower()
    for kw in DESTRUCTIVE_KEYWORDS:
        if kw in lower_path:
            return True
    return False


class SafeCrawler:
    def __init__(
        self,
        base_url: str,
        *,
        max_pages: int = 30,
        max_depth: int = 3,
        concurrency: int = 5,
        timeout: float = 5.0,
        max_response_bytes: int = 1_048_576,
        resolver: Resolver | None = None,
        client: httpx.AsyncClient | None = None,
        allow_local: bool = False,
    ) -> None:
        self.allow_local = allow_local
        self.target = normalize_target(base_url, allow_local=allow_local)
        self.origin = self.target.origin
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.concurrency = concurrency
        self.timeout = timeout
        self.max_response_bytes = max_response_bytes
        self.resolver = resolver or resolve_host
        self._custom_client = client

    async def crawl(self) -> AttackSurface:
        surface = AttackSurface(origin=self.origin)
        visited: set[str] = set()
        queue: asyncio.Queue[tuple[str, int]] = asyncio.Queue()

        # Seed the crawler with normalized initial URL
        normalized_root = self.target.url
        queue.put_nowait((normalized_root, 0))

        client = self._custom_client or httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=False,
            headers={"User-Agent": "ThreatSentry-Scanner/0.1.0 (+https://threatsentry.local)"},
        )

        semaphore = asyncio.Semaphore(self.concurrency)

        try:
            while not queue.empty() and len(surface.pages_crawled) < self.max_pages:
                current_url, depth = await queue.get()

                # Clean URL (strip fragment)
                clean_url = _strip_fragment(current_url)
                if clean_url in visited:
                    continue
                visited.add(clean_url)

                if is_destructive_path(clean_url):
                    surface.skipped_urls.append(clean_url)
                    continue

                # SSRF check before requesting
                try:
                    norm = normalize_target(clean_url, allow_local=self.allow_local)
                    if norm.origin != self.origin:
                        parsed = urlsplit(clean_url)
                        if parsed.hostname and parsed.hostname not in surface.external_domains:
                            surface.external_domains.append(parsed.hostname)
                        continue
                    await ensure_public_host(norm.host, resolver=self.resolver, allow_local=self.allow_local)
                except (TargetValidationError, BlockedTargetError):
                    surface.skipped_urls.append(clean_url)
                    continue

                async with semaphore:
                    try:
                        response = await client.get(clean_url)
                    except Exception as exc:
                        logger.warning("Crawler failed to fetch %s: %s", clean_url, exc)
                        surface.skipped_urls.append(clean_url)
                        continue

                surface.pages_crawled.append(clean_url)

                # Record GET endpoint with query parameters
                parsed = urlsplit(clean_url)
                query_params = tuple(parse_qs(parsed.query).keys())
                surface.endpoints.append(
                    DiscoveredEndpoint(
                        url=clean_url,
                        path=parsed.path or "/",
                        method="GET",
                        parameters=query_params,
                    )
                )

                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type:
                    continue

                if len(response.content) > self.max_response_bytes:
                    continue

                # Parse HTML
                links, forms = self._parse_html(response.text, clean_url)
                for form in forms:
                    surface.forms.append(form)
                    # Register form as an endpoint
                    form_params = tuple(inp.name for inp in form.inputs if inp.name)
                    parsed_action = urlsplit(form.action_url)
                    surface.endpoints.append(
                        DiscoveredEndpoint(
                            url=form.action_url,
                            path=parsed_action.path or "/",
                            method=form.method,
                            parameters=form_params,
                        )
                    )

                if depth < self.max_depth:
                    for link in links:
                        link_clean = _strip_fragment(link)
                        if link_clean not in visited and len(visited) < self.max_pages * 2:
                            queue.put_nowait((link_clean, depth + 1))
        finally:
            if self._custom_client is None:
                await client.aclose()

        return surface

    def _parse_html(self, html: str, page_url: str) -> tuple[list[str], list[DiscoveredForm]]:
        soup = BeautifulSoup(html, "html.parser")
        links: list[str] = []
        forms: list[DiscoveredForm] = []

        # Find <a> tags
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if not href or href.startswith(("javascript:", "mailto:", "tel:")):
                continue
            full_url = urljoin(page_url, href)
            links.append(full_url)

        # Find <form> tags
        for form_tag in soup.find_all("form"):
            action = form_tag.get("action", "").strip()
            method = form_tag.get("method", "GET").upper()
            action_url = urljoin(page_url, action) if action else page_url

            inputs: list[FormInput] = []
            for inp in form_tag.find_all(["input", "textarea", "select"]):
                name = inp.get("name", "").strip()
                if not name:
                    continue
                inp_type = inp.get("type", "text").lower() if inp.name == "input" else inp.name
                val = inp.get("value", "")
                inputs.append(FormInput(name=name, input_type=inp_type, value=val))

            forms.append(
                DiscoveredForm(
                    action_url=action_url,
                    method=method,
                    inputs=tuple(inputs),
                )
            )

        return links, forms


def _strip_fragment(url: str) -> str:
    parsed = urlsplit(url)
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))
