from dataclasses import dataclass
import ipaddress
from urllib.parse import SplitResult, urlsplit, urlunsplit


class TargetValidationError(ValueError):
    """Raised when a target is malformed or outside the public scan boundary."""


@dataclass(frozen=True, slots=True)
class NormalizedTarget:
    url: str
    origin: str
    scheme: str
    host: str
    port: int


def normalize_target(raw_url: str, *, allow_local: bool = False) -> NormalizedTarget:
    """Normalize a public HTTP(S) URL without trusting stored target data."""
    try:
        parsed = urlsplit(raw_url.strip())
        port = parsed.port
    except (AttributeError, ValueError) as error:
        raise TargetValidationError("Target URL is malformed") from error

    scheme = parsed.scheme.lower()
    if scheme not in {"http", "https"}:
        raise TargetValidationError("Only HTTP and HTTPS targets are supported")
    if parsed.username is not None or parsed.password is not None:
        raise TargetValidationError("Target URLs cannot include credentials")
    if not parsed.hostname:
        raise TargetValidationError("Target URL must include a hostname")

    host = _normalize_host(parsed.hostname)
    _reject_non_public_literal_ip(host, allow_local=allow_local)

    effective_port = port or (443 if scheme == "https" else 80)
    authority = host if effective_port == (443 if scheme == "https" else 80) else f"{host}:{effective_port}"
    origin = f"{scheme}://{authority}"
    path = parsed.path or "/"
    normalized_url = urlunsplit(SplitResult(scheme, authority, path, parsed.query, ""))

    return NormalizedTarget(
        url=normalized_url,
        origin=origin,
        scheme=scheme,
        host=host,
        port=effective_port,
    )


def _normalize_host(host: str) -> str:
    try:
        return host.rstrip(".").encode("idna").decode("ascii").lower()
    except UnicodeError as error:
        raise TargetValidationError("Target hostname is invalid") from error


def _reject_non_public_literal_ip(host: str, *, allow_local: bool = False) -> None:
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        return

    if allow_local and address.is_loopback:
        return

    if not address.is_global:
        raise TargetValidationError("Target resolves to a blocked network address")
