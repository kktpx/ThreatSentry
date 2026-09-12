import json
import os
from pathlib import Path
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
import yaml

from backend.ml.loader import get_ml_predictor

router = APIRouter(tags=["model"])


class PredictRequest(BaseModel):
    payload: str


class PredictResponse(BaseModel):
    payload: str
    prediction: str
    probabilities: dict[str, float]
    model_version: str


@router.get("/api/model")
def get_model_info() -> dict[str, Any]:
    predictor = get_ml_predictor()
    metadata_path = Path("ml/models/web_ids_model_v1.0.0.metadata.yaml")
    metrics_path = Path("ml/reports/model_evaluation_metrics.json")

    metadata: dict[str, Any] = {}
    if metadata_path.exists():
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = yaml.safe_load(f) or {}
        except Exception:
            pass

    test_metrics: dict[str, Any] = {}
    if metrics_path.exists():
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                test_metrics = json.load(f) or {}
        except Exception:
            pass

    return {
        "status": "ready" if predictor.is_ready else "heuristic",
        "version": predictor.version,
        "metadata": metadata,
        "test_metrics": test_metrics,
    }


@router.post("/api/model/predict", response_model=PredictResponse)
def test_prediction(request: PredictRequest) -> PredictResponse:
    predictor = get_ml_predictor()
    probs = predictor.predict(request.payload)
    best_label = max(probs.keys(), key=lambda k: probs[k])
    return PredictResponse(
        payload=request.payload,
        prediction=best_label,
        probabilities=probs,
        model_version=predictor.version,
    )
