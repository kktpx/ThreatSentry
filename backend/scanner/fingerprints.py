import hashlib
from urllib.parse import urlsplit


def finding_fingerprint(
    *,
    origin: str,
    category: str,
    method: str,
    endpoint: str,
    parameter: str | None,
    subtype: str,
) -> str:
    """Create a stable finding identity without volatile response or query values."""
    path = urlsplit(endpoint).path or "/"
    components = (origin.rstrip("/"), category, method.upper(), path, parameter or "", subtype)
    digest = hashlib.sha256("\x1f".join(components).encode("utf-8")).hexdigest()
    return f"ts1:{digest}"
