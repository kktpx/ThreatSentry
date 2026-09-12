import secrets
from urllib.parse import urlsplit, urlunsplit

from bs4 import BeautifulSoup
import httpx

from backend.scanner.findings import Finding


async def scan_reflected_xss_for_parameter(
    client: httpx.AsyncClient,
    url: str,
    parameter: str,
    method: str = "GET",
) -> Finding | None:
    """Probes for Reflected Cross-Site Scripting using a unique harmless marker and context evaluation."""
    parsed = urlsplit(url)
    clean_base_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))

    marker = f"ts_probe_{secrets.token_hex(4)}"
    probe_payload = f'"><script>{marker}</script>'

    try:
        if method.upper() == "POST":
            response = await client.post(clean_base_url, data={parameter: probe_payload})
        else:
            response = await client.get(clean_base_url, params={parameter: probe_payload})
    except Exception:
        return None

    body = response.text
    if marker not in body:
        return None

    # Determine context & encoding
    # If the unencoded script tag appears verbatim, HTML escaping failed!
    unencoded_tag = f"<script>{marker}</script>"
    if unencoded_tag in body or f"<{marker}>" in body or ("<script>" in body and marker in body):
        return Finding(
            title="Reflected Cross-Site Scripting (XSS) Detected",
            category="REFLECTED_XSS",
            severity="HIGH",
            endpoint=clean_base_url,
            parameter=parameter,
            description=f"Input in parameter '{parameter}' was reflected directly into the HTML response without adequate context-aware encoding or sanitization.",
            recommendation="Apply context-aware output encoding (such as HTML entity encoding) before rendering untrusted input in HTML documents.",
            detection_method="ACTIVE",
            confidence="CONFIRMED",
            evidence={
                "marker": marker,
                "probe_payload": probe_payload,
                "reflected_snippet": unencoded_tag,
                "status_code": str(response.status_code),
            },
            http_method=method.upper(),
            subtype="XSS_TAG_INJECTION",
        )

    # Check if reflected inside attribute without quote escaping
    if f'"{marker}' in body or f"'{marker}" in body or f'>{marker}' in body:
        return Finding(
            title="Potential Reflected XSS (Attribute Context)",
            category="REFLECTED_XSS",
            severity="MEDIUM",
            endpoint=clean_base_url,
            parameter=parameter,
            description=f"Input in parameter '{parameter}' was reflected into an HTML attribute context.",
            recommendation="Ensure HTML attributes are properly quoted and input is attribute-encoded.",
            detection_method="ACTIVE",
            confidence="LIKELY",
            evidence={
                "marker": marker,
                "probe_payload": probe_payload,
            },
            http_method=method.upper(),
            subtype="XSS_ATTRIBUTE_CONTEXT",
        )

    return None
