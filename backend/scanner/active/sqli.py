import re
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx

from backend.scanner.baseline import BaselineResponse, capture_baseline
from backend.scanner.findings import Finding

SQL_ERROR_PATTERNS = (
    re.compile(r"you have an error in your sql syntax", re.IGNORECASE),
    re.compile(r"check the manual that corresponds to your mysql server", re.IGNORECASE),
    re.compile(r"syntax error at or near", re.IGNORECASE),
    re.compile(r"postgresql.*query failed", re.IGNORECASE),
    re.compile(r"unterminated quoted string", re.IGNORECASE),
    re.compile(r"sqlite3\.operationalerror", re.IGNORECASE),
    re.compile(r"unrecognized token:", re.IGNORECASE),
    re.compile(r"unclosed quotation mark after the character string", re.IGNORECASE),
    re.compile(r"ora-01756", re.IGNORECASE),
    re.compile(r"ora-00933", re.IGNORECASE),
    re.compile(r"warning:\s+mysql_", re.IGNORECASE),
    re.compile(r"sqlstate\[\d+\]", re.IGNORECASE),
)


def detect_sql_error(body: str) -> str | None:
    for pattern in SQL_ERROR_PATTERNS:
        match = pattern.search(body)
        if match:
            return match.group(0)
    return None


async def scan_sqli_for_parameter(
    client: httpx.AsyncClient,
    url: str,
    parameter: str,
    original_value: str = "test",
    method: str = "GET",
) -> Finding | None:
    """Probes a specific parameter with controlled SQLi variations and returns a finding if detected."""
    parsed = urlsplit(url)
    clean_base_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))

    # 1. Baseline
    base_params = {parameter: original_value}
    try:
        baseline = await capture_baseline(client, clean_base_url, method=method, params=base_params)
    except Exception:
        return None

    # 2. Test single quote probe: '
    error_probe_value = f"{original_value}'"
    try:
        if method.upper() == "POST":
            res_error = await client.post(clean_base_url, data={parameter: error_probe_value})
        else:
            res_error = await client.get(clean_base_url, params={parameter: error_probe_value})
    except Exception:
        return None

    db_error = detect_sql_error(res_error.text)
    if db_error:
        # Check recovery probe: ''
        recovery_value = f"{original_value}''"
        try:
            if method.upper() == "POST":
                res_recovery = await client.post(clean_base_url, data={parameter: recovery_value})
            else:
                res_recovery = await client.get(clean_base_url, params={parameter: recovery_value})
            recovered = detect_sql_error(res_recovery.text) is None
        except Exception:
            recovered = False

        confidence = "CONFIRMED" if recovered else "LIKELY"
        representative_payload = f"{original_value}' OR '1'='1 --"
        return Finding(
            title="SQL Injection Vulnerability Detected",
            category="SQL_INJECTION",
            severity="CRITICAL",
            endpoint=clean_base_url,
            parameter=parameter,
            description=f"Parameter '{parameter}' is vulnerable to SQL injection as evidenced by database syntax error messages.",
            recommendation="Use parameterized queries / prepared statements (e.g. PDO, SQLAlchemy, or query placeholders) and never concatenate untrusted inputs into SQL commands.",
            detection_method="ACTIVE",
            confidence=confidence,
            evidence={
                "error_pattern": db_error,
                "probe_payload": representative_payload,
                "trigger_probe": error_probe_value,
                "status_code": str(res_error.status_code),
                "recovered_on_quote_pair": str(recovered),
            },
            http_method=method.upper(),
            subtype="SQLI_ERROR_BASED",
        )

    # 3. Status change anomaly (e.g. baseline 200 -> probe 500 without exposed error string)
    if baseline.status_code == 200 and res_error.status_code == 500:
        return Finding(
            title="Potential SQL Injection (Server Error Anomaly)",
            category="SQL_INJECTION",
            severity="HIGH",
            endpoint=clean_base_url,
            parameter=parameter,
            description=f"Parameter '{parameter}' triggered an unhandled HTTP 500 Internal Server Error when injected with SQL metacharacters.",
            recommendation="Validate server-side input handling and ensure prepared statements are used for all database queries.",
            detection_method="ACTIVE",
            confidence="POTENTIAL",
            evidence={
                "baseline_status": "200",
                "probe_status": "500",
                "probe_payload": error_probe_value,
            },
            http_method=method.upper(),
            subtype="SQLI_ANOMALY",
        )

    return None
