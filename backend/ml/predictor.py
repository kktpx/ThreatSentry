import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


class MLPredictor:
    def __init__(self, model_path: str | None = None) -> None:
        self.model_path = model_path
        self.model: Any = None
        self.is_ready = False
        self.version = "heuristic-v1.0"
        self._load()

    def _load(self) -> None:
        if self.model_path and os.path.exists(self.model_path):
            try:
                import joblib
                self.model = joblib.load(self.model_path)
                self.is_ready = True
                self.version = os.path.basename(self.model_path).replace(".joblib", "")
                logger.info("Loaded ML model artifact from %s", self.model_path)
            except Exception as exc:
                logger.warning("Failed to load ML model artifact %s: %s", self.model_path, exc)
                self.is_ready = False

    def predict(self, payload: str) -> dict[str, float]:
        """Returns classification probabilities for NORMAL, SQLI, and XSS classes."""
        if self.is_ready and self.model is not None:
            try:
                probs = self.model.predict_proba([payload])[0]
                classes = list(self.model.classes_)
                return {cls: float(prob) for cls, prob in zip(classes, probs)}
            except Exception as exc:
                logger.warning("ML model inference failed: %s", exc)

        # Heuristic fallback
        lower = payload.lower()
        sqli_score = 0.0
        xss_score = 0.0

        if any(tok in lower for tok in ("'", "select", "union", "--", "or 1=1", "drop table")):
            sqli_score += 0.75
        if any(tok in lower for tok in ("<script", "<img", "onerror=", "alert(", "javascript:")):
            xss_score += 0.85

        normal_score = max(0.05, 1.0 - max(sqli_score, xss_score))
        total = normal_score + sqli_score + xss_score
        return {
            "NORMAL": round(normal_score / total, 3),
            "SQLI": round(sqli_score / total, 3),
            "XSS": round(xss_score / total, 3),
        }
