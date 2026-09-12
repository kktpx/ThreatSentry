import httpx
import pytest

from backend.scanner.crawler import SafeCrawler, is_destructive_path


def test_is_destructive_path() -> None:
    assert is_destructive_path("https://example.com/logout") is True
    assert is_destructive_path("https://example.com/api/delete-user") is True
    assert is_destructive_path("https://example.com/checkout/pay") is True
    assert is_destructive_path("https://example.com/blog/posts") is False
    assert is_destructive_path("https://example.com/search?q=test") is False


@pytest.mark.asyncio
async def test_crawler_same_origin_and_discovery() -> None:
    html_home = """
    <html>
      <body>
        <a href="/about">About Us</a>
        <a href="/search?q=security">Search</a>
        <a href="https://external.com/privacy">External Privacy</a>
        <a href="/admin/delete-item">Delete Item</a>
        <form action="/login" method="POST">
          <input type="text" name="username" />
          <input type="password" name="password" />
        </form>
      </body>
    </html>
    """
    html_about = """
    <html>
      <body>
        <p>This is about page.</p>
        <a href="/">Home</a>
      </body>
    </html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if url == "https://example.com/":
            return httpx.Response(200, headers={"content-type": "text/html"}, text=html_home)
        elif url == "https://example.com/about":
            return httpx.Response(200, headers={"content-type": "text/html"}, text=html_about)
        elif url == "https://example.com/search?q=security":
            return httpx.Response(200, headers={"content-type": "text/html"}, text="<html>Search</html>")
        return httpx.Response(404, text="Not Found")

    async def mock_resolver(host: str) -> list[str]:
        return ["93.184.216.34"]

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        crawler = SafeCrawler(
            "https://example.com",
            max_pages=5,
            resolver=mock_resolver,
            client=client,
        )
        surface = await crawler.crawl()

    # Pages crawled
    assert "https://example.com/" in surface.pages_crawled
    assert "https://example.com/about" in surface.pages_crawled
    assert "https://example.com/search?q=security" in surface.pages_crawled

    # Destructive path skipped
    assert any("delete-item" in url for url in surface.skipped_urls)
    assert not any("delete-item" in url for url in surface.pages_crawled)

    # External domain recorded
    assert "external.com" in surface.external_domains
    assert not any("external.com" in url for url in surface.pages_crawled)

    # Forms discovered
    assert len(surface.forms) == 1
    assert surface.forms[0].action_url == "https://example.com/login"
    assert surface.forms[0].method == "POST"
    input_names = [inp.name for inp in surface.forms[0].inputs]
    assert "username" in input_names
    assert "password" in input_names

    # Endpoints discovered
    endpoint_urls = [ep.url for ep in surface.endpoints]
    assert "https://example.com/login" in endpoint_urls
