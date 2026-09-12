from fastapi.testclient import TestClient

from labs.vulnerable_app import app


def test_vulnerable_lab_home() -> None:
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "ThreatSentry Test Lab Target" in response.text


def test_vulnerable_lab_verification_token() -> None:
    client = TestClient(app)
    # Set token
    set_resp = client.get("/set-token?token=test_token_123")
    assert set_resp.status_code == 200

    # Get challenge
    challenge_resp = client.get("/.well-known/threatsentry.txt")
    assert challenge_resp.status_code == 200
    assert challenge_resp.text.strip() == "threatsentry-verification=test_token_123"


def test_vulnerable_lab_verification_header_echo() -> None:
    client = TestClient(app)
    # Header-based challenge resolution
    resp = client.get(
        "/.well-known/threatsentry.txt",
        headers={"X-ThreatSentry-Token": "dynamic_ts_token_xyz987"},
    )
    assert resp.status_code == 200
    assert resp.text.strip() == "threatsentry-verification=dynamic_ts_token_xyz987"


def test_vulnerable_lab_reflected_xss() -> None:
    client = TestClient(app)
    marker = "<ts_probe_test>"
    response = client.get(f"/search?q={marker}")
    assert response.status_code == 200
    # Verifies unencoded reflection
    assert marker in response.text


def test_vulnerable_lab_sqli_error() -> None:
    client = TestClient(app)
    # Safe query
    safe_resp = client.get("/products?id=1")
    assert safe_resp.status_code == 200
    assert "Secure Laptop Stand" in safe_resp.text

    # Injected query triggers sqlite3.OperationalError
    injected_resp = client.get("/products?id=1'")
    assert injected_resp.status_code == 500
    assert "sqlite3.OperationalError" in injected_resp.text
