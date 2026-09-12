from typing import Any, Mapping

import httpx

from backend.scanner.findings import Finding
from backend.scanner.passive.cookie_checks import evaluate_cookies
from backend.scanner.passive.exposure import evaluate_content_exposure
from backend.scanner.passive.header_checks import evaluate_security_headers
from backend.scanner.passive.http_checks import evaluate_http_protocol, evaluate_server_banners


def run_passive_checks_for_response(
    url: str,
    headers: Mapping[str, str],
    body: str,
    status_code: int,
    raw_cookies: list[str],
) -> list[Finding]:
    findings: list[Finding] = []
    is_https = url.startswith("https://")

    # 1. Protocol checks
    for proto in evaluate_http_protocol(url):
        findings.append(
            Finding(
                title="Unencrypted HTTP Scheme In Use",
                category=proto.category,
                severity=proto.severity,
                endpoint=url,
                description="The target application communicates over plain unencrypted HTTP.",
                recommendation=proto.recommendation,
                detection_method="PASSIVE",
                confidence="CONFIRMED",
                evidence=proto.evidence,
                subtype=proto.category,
            )
        )

    # 2. Server banner leakage
    for banner in evaluate_server_banners(headers):
        findings.append(
            Finding(
                title=f"Server Information Disclosure ({banner.category})",
                category=banner.category,
                severity=banner.severity,
                endpoint=url,
                description="The server leaks software version details in HTTP response headers.",
                recommendation=banner.recommendation,
                detection_method="PASSIVE",
                confidence="CONFIRMED",
                evidence=banner.evidence,
                subtype=banner.category,
            )
        )

    # 3. Security headers
    for header in evaluate_security_headers(headers):
        findings.append(
            Finding(
                title=f"Missing Security Header: {header.category}",
                category=header.category,
                severity=header.severity,
                endpoint=url,
                description=f"The application does not provide the recommended security header ({header.evidence.get('header')}).",
                recommendation=header.recommendation,
                detection_method="PASSIVE",
                confidence="CONFIRMED",
                evidence=header.evidence,
                subtype=header.category,
            )
        )

    # 4. Cookies
    for cookie in evaluate_cookies(raw_cookies, is_https=is_https):
        findings.append(
            Finding(
                title=f"Insecure Cookie Configuration: {cookie.category}",
                category=cookie.category,
                severity=cookie.severity,
                endpoint=url,
                parameter=cookie.cookie_name,
                description=f"Cookie '{cookie.cookie_name}' lacks recommended security flag.",
                recommendation=cookie.recommendation,
                detection_method="PASSIVE",
                confidence="CONFIRMED",
                evidence=cookie.evidence,
                subtype=cookie.category,
            )
        )

    # 5. Content exposure
    for exposure in evaluate_content_exposure(body, status_code):
        findings.append(
            Finding(
                title=f"Sensitive Exposure: {exposure.category}",
                category=exposure.category,
                severity=exposure.severity,
                endpoint=url,
                description="The response content contains sensitive error or directory listing indicators.",
                recommendation=exposure.recommendation,
                detection_method="PASSIVE",
                confidence="CONFIRMED",
                evidence=exposure.evidence,
                subtype=exposure.category,
            )
        )

    return findings
