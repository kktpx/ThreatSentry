import os
from backend.core.config import get_settings
from backend.ml.predictor import MLPredictor

_global_predictor: MLPredictor | None = None


def get_ml_predictor() -> MLPredictor:
    global _global_predictor
    if _global_predictor is None:
        settings = get_settings()
        default_model_path = os.path.join("ml", "models", "web_ids_model_v1.0.0.joblib")
        model_path = settings.model_path or (default_model_path if os.path.exists(default_model_path) else None)
        _global_predictor = MLPredictor(model_path=model_path)
    return _global_predictor
