from fastapi.testclient import TestClient

from backend.core.config import Settings
from backend.main import create_app


def test_health_reports_api_and_model_readiness() -> None:
    response = TestClient(create_app(Settings(_env_file=None))).get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "threatsentry-api"
    assert data["model"]["status"] in {"ready", "heuristic", "not_ready"}


def test_health_allows_the_configured_dashboard_origin() -> None:
    response = TestClient(create_app(Settings(_env_file=None))).options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_health_allows_a_private_lan_dashboard_origin_in_development() -> None:
    response = TestClient(create_app(Settings(_env_file=None))).options(
        "/health",
        headers={
            "Origin": "http://192.168.1.6:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://192.168.1.6:3000"
