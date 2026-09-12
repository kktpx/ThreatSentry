import pytest
from fastapi.testclient import TestClient

from backend.api.deps.auth import get_current_user_id
from backend.api.routers.websites import get_database
from backend.core.config import Settings
from backend.main import create_app
from backend.tests.scanner.test_runner import MockDatabase


@pytest.fixture
def mock_db() -> MockDatabase:
    return MockDatabase({
        "websites": [
            {
                "id": "web-1",
                "user_id": "user-1",
                "name": "My Web",
                "url": "https://example.com",
                "normalized_origin": "https://example.com",
                "verification_status": "VERIFIED",
                "last_score": 85,
            },
            {
                "id": "web-2",
                "user_id": "user-2",
                "name": "Other Web",
                "url": "https://other.com",
                "normalized_origin": "https://other.com",
                "verification_status": "VERIFIED",
                "last_score": 90,
            },
        ],
        "scan_jobs": [
            {
                "id": "scan-1",
                "user_id": "user-1",
                "website_id": "web-1",
                "scan_type": "DEEP_SCAN",
                "status": "COMPLETED",
                "score": 85,
                "created_at": "2026-09-12T04:00:00+00:00",
            },
            {
                "id": "scan-2",
                "user_id": "user-2",
                "website_id": "web-2",
                "scan_type": "DEEP_SCAN",
                "status": "COMPLETED",
                "score": 90,
                "created_at": "2026-09-12T04:00:00+00:00",
            },
        ],
        "findings": [
            {
                "id": "find-1",
                "user_id": "user-1",
                "website_id": "web-1",
                "scan_id": "scan-1",
                "title": "Missing CSP Header",
                "category": "SECURITY_HEADERS",
                "severity": "MEDIUM",
                "endpoint": "https://example.com/",
                "parameter": None,
                "description": "Content-Security-Policy is missing.",
                "evidence": {"header": "content-security-policy"},
                "recommendation": "Set Content-Security-Policy header.",
                "detection_method": "PASSIVE",
                "confidence": "CONFIRMED",
                "fingerprint": "ts1:abc",
                "status": "NEW",
                "created_at": "2026-09-12T04:05:00+00:00",
            },
            {
                "id": "find-2",
                "user_id": "user-2",
                "website_id": "web-2",
                "scan_id": "scan-2",
                "title": "Missing HSTS Header",
                "category": "SECURITY_HEADERS",
                "severity": "MEDIUM",
                "endpoint": "https://other.com/",
                "parameter": None,
                "description": "HSTS header is missing.",
                "evidence": {"header": "strict-transport-security"},
                "recommendation": "Set HSTS header.",
                "detection_method": "PASSIVE",
                "confidence": "CONFIRMED",
                "fingerprint": "ts1:def",
                "status": "NEW",
                "created_at": "2026-09-12T04:05:00+00:00",
            },
        ],
    })


@pytest.fixture
def client(mock_db: MockDatabase) -> TestClient:
    app = create_app(Settings(app_env="test", allowed_origins=["http://localhost:3000"]))
    app.dependency_overrides[get_current_user_id] = lambda: "user-1"
    app.dependency_overrides[get_database] = lambda: mock_db
    return TestClient(app)


def test_list_scan_findings_owned(client: TestClient) -> None:
    res = client.get("/api/scans/scan-1/findings")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == "find-1"
    assert data[0]["title"] == "Missing CSP Header"


def test_list_scan_findings_unowned_returns_404(client: TestClient) -> None:
    res = client.get("/api/scans/scan-2/findings")
    assert res.status_code == 404


def test_list_website_findings_owned(client: TestClient) -> None:
    res = client.get("/api/websites/web-1/findings")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == "find-1"


def test_list_website_findings_unowned_returns_404(client: TestClient) -> None:
    res = client.get("/api/websites/web-2/findings")
    assert res.status_code == 404


def test_get_finding_owned(client: TestClient) -> None:
    res = client.get("/api/findings/find-1")
    assert res.status_code == 200
    assert res.json()["title"] == "Missing CSP Header"


def test_get_finding_unowned_returns_404(client: TestClient) -> None:
    res = client.get("/api/findings/find-2")
    assert res.status_code == 404
