from fastapi.testclient import TestClient

from backend.core.config import Settings
from backend.main import create_app


def test_get_model_info() -> None:
    client = TestClient(create_app(Settings(_env_file=None)))
    response = client.get("/api/model")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "metadata" in data
    assert "test_metrics" in data


def test_predict_endpoint_sqli() -> None:
    client = TestClient(create_app(Settings(_env_file=None)))
    response = client.post("/api/model/predict", json={"payload": "1' OR '1'='1"})

    assert response.status_code == 200
    data = response.json()
    assert data["payload"] == "1' OR '1'='1"
    assert data["prediction"] in {"SQLI", "XSS", "NORMAL"}
    assert "probabilities" in data
    assert "SQLI" in data["probabilities"]
    assert "NORMAL" in data["probabilities"]
    assert "XSS" in data["probabilities"]


def test_predict_endpoint_xss() -> None:
    client = TestClient(create_app(Settings(_env_file=None)))
    response = client.post("/api/model/predict", json={"payload": "<script>alert(1)</script>"})

    assert response.status_code == 200
    data = response.json()
    assert data["payload"] == "<script>alert(1)</script>"
    assert data["prediction"] in {"SQLI", "XSS", "NORMAL"}
    assert data["probabilities"]["XSS"] > 0.5
