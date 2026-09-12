from typing import Any
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

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
                "id": "web-verified",
                "user_id": "user-1",
                "name": "Verified Web",
                "url": "https://example.com",
                "normalized_origin": "https://example.com",
                "verification_status": "VERIFIED",
                "last_score": None,
            },
            {
                "id": "web-unverified",
                "user_id": "user-1",
                "name": "Unverified Web",
                "url": "https://unverified.com",
                "normalized_origin": "https://unverified.com",
                "verification_status": "UNVERIFIED",
                "last_score": None,
            },
            {
                "id": "web-other-user",
                "user_id": "user-2",
                "name": "Other Web",
                "url": "https://other.com",
                "normalized_origin": "https://other.com",
                "verification_status": "VERIFIED",
                "last_score": None,
            },
        ],
        "scan_jobs": [
            {
                "id": "scan-running",
                "user_id": "user-1",
                "website_id": "web-active-scan",
                "scan_type": "DEEP_SCAN",
                "status": "RUNNING",
                "current_stage": "CRAWLING",
                "progress": 30,
                "created_at": "2026-09-12T04:00:00+00:00",
            },
            {
                "id": "scan-completed",
                "user_id": "user-1",
                "website_id": "web-verified",
                "scan_type": "DEEP_SCAN",
                "status": "COMPLETED",
                "current_stage": "COMPLETE",
                "progress": 100,
                "finished_at": "2026-09-12T04:10:00+00:00",
                "created_at": "2026-09-12T04:05:00+00:00",
            },
            {
                "id": "scan-other-user",
                "user_id": "user-2",
                "website_id": "web-other-user",
                "scan_type": "DEEP_SCAN",
                "status": "RUNNING",
                "current_stage": "CRAWLING",
                "progress": 25,
                "created_at": "2026-09-12T04:00:00+00:00",
            },
        ],
    })


@pytest.fixture
def app(mock_db: MockDatabase) -> FastAPI:
    app = create_app(Settings(_env_file=None))
    app.dependency_overrides[get_current_user_id] = lambda: "user-1"
    app.dependency_overrides[get_database] = lambda: mock_db
    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)


def test_create_scan_rejects_unowned_website(client: TestClient) -> None:
    response = client.post("/api/websites/web-other-user/scans")
    assert response.status_code == 404


def test_create_scan_rejects_unverified_website(client: TestClient) -> None:
    response = client.post("/api/websites/web-unverified/scans")
    assert response.status_code == 403
    assert "verified" in response.json()["detail"].lower()


def test_create_scan_rejects_when_active_scan_exists(client: TestClient, mock_db: MockDatabase) -> None:
    # Add a website that already has an active scan
    mock_db.table("websites").rows.append({
        "id": "web-active-scan",
        "user_id": "user-1",
        "name": "Active Web",
        "url": "https://active.com",
        "normalized_origin": "https://active.com",
        "verification_status": "VERIFIED",
    })

    response = client.post("/api/websites/web-active-scan/scans")
    assert response.status_code == 409
    assert "active scan" in response.json()["detail"].lower()


def test_create_scan_revalidates_ssrf(client: TestClient, mock_db: MockDatabase, monkeypatch: pytest.MonkeyPatch) -> None:
    mock_db.table("websites").rows.append({
        "id": "web-internal",
        "user_id": "user-1",
        "name": "Internal Target",
        "url": "https://internal.test",
        "normalized_origin": "https://internal.test",
        "verification_status": "VERIFIED",
    })

    async def mock_blocked_resolver(host: str) -> list[str]:
        return ["192.168.1.1"]

    monkeypatch.setattr("backend.api.routers.scans.resolve_host", mock_blocked_resolver)

    response = client.post("/api/websites/web-internal/scans")
    assert response.status_code == 422
    assert "blocked" in response.json()["detail"].lower() or "public" in response.json()["detail"].lower()


def test_create_scan_succeeds_for_verified_target(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    async def mock_public_resolver(host: str) -> list[str]:
        return ["93.184.216.34"]

    monkeypatch.setattr("backend.api.routers.scans.resolve_host", mock_public_resolver)

    response = client.post("/api/websites/web-verified/scans")
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["website_id"] == "web-verified"
    assert data["progress"] == 0
    assert data["current_stage"] == "VALIDATING_TARGET"


def test_get_scan_returns_details_for_owner(client: TestClient) -> None:
    response = client.get("/api/scans/scan-completed")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "scan-completed"
    assert data["status"] == "COMPLETED"


def test_get_scan_returns_404_for_unowned_scan(client: TestClient) -> None:
    response = client.get("/api/scans/scan-other-user")
    assert response.status_code == 404


def test_cancel_scan_succeeds_for_running_scan(client: TestClient) -> None:
    response = client.post("/api/scans/scan-running/cancel")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CANCELLED"
    assert data["finished_at"] is not None


def test_cancel_scan_rejects_already_completed_scan(client: TestClient) -> None:
    response = client.post("/api/scans/scan-completed/cancel")
    assert response.status_code == 400
    assert "finished" in response.json()["detail"].lower() or "cannot be cancelled" in response.json()["detail"].lower()


def test_list_scans_for_website_returns_scans(client: TestClient) -> None:
    response = client.get("/api/websites/web-verified/scans")
    assert response.status_code == 200
    scans = response.json()
    assert isinstance(scans, list)
    assert len(scans) == 1
    assert scans[0]["id"] == "scan-completed"


def test_list_scans_for_unowned_website_returns_404(client: TestClient) -> None:
    response = client.get("/api/websites/web-other-user/scans")
    assert response.status_code == 404
