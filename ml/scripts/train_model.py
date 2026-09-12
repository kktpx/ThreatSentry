import json
import logging
from pathlib import Path
import joblib
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_model")


def load_split(split_path: Path) -> tuple[list[str], list[str]]:
    texts = []
    labels = []
    with open(split_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                item = json.loads(line)
                texts.append(item["payload"])
                labels.append(item["label"])
    return texts, labels


def main() -> None:
    splits_dir = Path("ml/dataset/splits")
    train_path = splits_dir / "train.jsonl"
    val_path = splits_dir / "val.jsonl"

    if not train_path.exists() or not val_path.exists():
        raise FileNotFoundError(f"Splits not found at {splits_dir}")

    X_train, y_train = load_split(train_path)
    X_val, y_val = load_split(val_path)

    logger.info("Loaded %d train samples and %d validation samples", len(X_train), len(X_val))

    # Candidates
    candidates = {
        "LogisticRegression": LogisticRegression(C=1.0, max_iter=400, random_state=42),
        "CalibratedLinearSVC": CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42), cv=3),
        "SGDClassifier_ModifiedHuber": SGDClassifier(loss="modified_huber", max_iter=1000, random_state=42),
    }

    results = {}
    fitted_pipelines = {}

    for name, clf in candidates.items():
        logger.info("Training candidate: %s ...", name)
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(analyzer="char", ngram_range=(2, 5), min_df=2, sublinear_tf=True)),
            ("clf", clf),
        ])
        pipeline.fit(X_train, y_train)

        val_preds = pipeline.predict(X_val)
        macro_f1 = float(f1_score(y_val, val_preds, average="macro"))
        report = classification_report(y_val, val_preds, output_dict=True)

        logger.info("Candidate %s -> Validation Macro F1: %.4f", name, macro_f1)
        results[name] = {
            "validation_macro_f1": macro_f1,
            "report": report,
        }
        fitted_pipelines[name] = pipeline

    # Select best candidate
    best_candidate_name = max(results.keys(), key=lambda k: results[k]["validation_macro_f1"])
    best_macro_f1 = results[best_candidate_name]["validation_macro_f1"]
    best_pipeline = fitted_pipelines[best_candidate_name]

    logger.info("Selected winning candidate: %s with Macro F1: %.4f", best_candidate_name, best_macro_f1)

    # Output directory
    output_dir = Path("ml/models")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save model artifact
    model_path = output_dir / "web_ids_model_v1.0.0.joblib"
    joblib.dump(best_pipeline, model_path)
    logger.info("Saved serialized model to %s", model_path)

    # Generate metadata
    metadata = {
        "model_version": "v1.0.0",
        "algorithm": best_candidate_name,
        "feature_extractor": "TfidfVectorizer(analyzer=char, ngram_range=(2, 5), min_df=2, sublinear_tf=True)",
        "classes": sorted(list(set(y_train))),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "validation_metrics": {
            "macro_f1": best_macro_f1,
            "classification_report": results[best_candidate_name]["report"],
        },
        "candidate_comparison": {
            k: v["validation_macro_f1"] for k, v in results.items()
        },
    }

    metadata_path = output_dir / "web_ids_model_v1.0.0.metadata.yaml"
    with open(metadata_path, "w", encoding="utf-8") as f:
        yaml.dump(metadata, f, default_flow_style=False)
    logger.info("Saved model metadata to %s", metadata_path)


if __name__ == "__main__":
    main()
