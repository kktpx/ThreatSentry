from dataclasses import dataclass
from http.cookies import SimpleCookie
from typing import Literal

Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


@dataclass(frozen=True, slots=True)
class CookieFinding:
    cookie_name: str
    category: str
    severity: Severity
    recommendation: str
    evidence: dict[str, str]


def evaluate_cookies(cookie_headers: list[str], *, is_https: bool = True) -> list[CookieFinding]:
    """Inspects Set-Cookie headers for security flags without storing cookie values."""
    findings: list[CookieFinding] = []

    for raw_header in cookie_headers:
        cookie = SimpleCookie()
        try:
            cookie.load(raw_header)
        except Exception:
            continue

        for name, morsel in cookie.items():
            flags = {k.lower(): v for k, v in morsel.items()}
            # 1. Check Secure flag on HTTPS
            if is_https and not flags.get("secure"):
                findings.append(
                    CookieFinding(
                        cookie_name=name,
                        category="COOKIE_MISSING_SECURE",
                        severity="MEDIUM",
                        recommendation=f"Set the Secure attribute on cookie '{name}' to ensure it is transmitted only over HTTPS.",
                        evidence={"cookie_name": name, "flag": "secure"},
                    )
                )

            # 2. Check HttpOnly flag
            if not flags.get("httponly"):
                findings.append(
                    CookieFinding(
                        cookie_name=name,
                        category="COOKIE_MISSING_HTTPONLY",
                        severity="LOW",
                        recommendation=f"Set the HttpOnly attribute on cookie '{name}' to protect it from unauthorized JavaScript access.",
                        evidence={"cookie_name": name, "flag": "httponly"},
                    )
                )

            # 3. Check SameSite flag
            samesite = flags.get("samesite")
            if not samesite or samesite.lower() not in {"lax", "strict", "none"}:
                findings.append(
                    CookieFinding(
                        cookie_name=name,
                        category="COOKIE_MISSING_SAMESITE",
                        severity="LOW",
                        recommendation=f"Set the SameSite attribute (Lax or Strict) on cookie '{name}' to mitigate CSRF attacks.",
                        evidence={"cookie_name": name, "flag": "samesite"},
                    )
                )

    return findings
