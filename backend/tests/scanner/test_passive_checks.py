from backend.scanner.passive.cookie_checks import evaluate_cookies
from backend.scanner.passive.exposure import evaluate_content_exposure
from backend.scanner.passive.http_checks import evaluate_http_protocol, evaluate_server_banners
from backend.scanner.passive.orchestrator import run_passive_checks_for_response


def test_evaluate_cookies() -> None:
    headers = [
        "session_id=12345; Path=/",  # missing Secure, HttpOnly, SameSite
        "secure_cookie=secret; Secure; HttpOnly; SameSite=Strict",
    ]
    findings = evaluate_cookies(headers, is_https=True)
    assert len(findings) == 3
    categories = {f.category for f in findings}
    assert "COOKIE_MISSING_SECURE" in categories
    assert "COOKIE_MISSING_HTTPONLY" in categories
    assert "COOKIE_MISSING_SAMESITE" in categories


def test_evaluate_http_and_banners() -> None:
    http_findings = evaluate_http_protocol("http://insecure.example.com")
    assert len(http_findings) == 1
    assert http_findings[0].category == "UNENCRYPTED_HTTP"

    banner_findings = evaluate_server_banners({
        "server": "nginx/1.18.0",
        "x-powered-by": "PHP/8.1.0",
    })
    assert len(banner_findings) == 2
    categories = {f.category for f in banner_findings}
    assert "SERVER_BANNER_LEAKAGE" in categories
    assert "X_POWERED_BY_LEAKAGE" in categories


def test_evaluate_exposure() -> None:
    traceback = "Traceback (most recent call last):\n  File 'app.py', line 10 in <module>"
    findings = evaluate_content_exposure(traceback, 500)
    assert len(findings) == 1
    assert findings[0].category == "STACK_TRACE_EXPOSURE"


def test_run_passive_checks_for_response() -> None:
    findings = run_passive_checks_for_response(
        url="http://example.com/api",
        headers={"server": "Apache/2.4.41"},
        body="<h1>Welcome</h1>",
        status_code=200,
        raw_cookies=["session=abc; Path=/"],
    )
    categories = {f.category for f in findings}
    assert "UNENCRYPTED_HTTP" in categories
    assert "SERVER_BANNER_LEAKAGE" in categories
    assert "MISSING_CSP" in categories
    assert "COOKIE_MISSING_HTTPONLY" in categories
