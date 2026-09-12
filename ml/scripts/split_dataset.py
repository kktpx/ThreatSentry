import json
import logging
from pathlib import Path
from sklearn.model_selection import GroupShuffleSplit

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("split_dataset")


def main() -> None:
    processed_dir = Path("ml/dataset/processed")
    unified_file = processed_dir / "unified_dataset.jsonl"
    splits_dir = Path("ml/dataset/splits")
    splits_dir.mkdir(parents=True, exist_ok=True)

    if not unified_file.exists():
        raise FileNotFoundError(f"Unified dataset not found at {unified_file}")

    records = []
    with open(unified_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))

    logger.info("Loaded %d records from %s", len(records), unified_file)

    groups = [r["group_id"] for r in records]

    # Split 1: 70% train, 30% temp
    gss1 = GroupShuffleSplit(n_splits=1, train_size=0.70, random_state=42)
    train_idx, temp_idx = next(gss1.split(records, groups=groups))

    train_records = [records[i] for i in train_idx]
    temp_records = [records[i] for i in temp_idx]
    temp_groups = [temp_records[i]["group_id"] for i in range(len(temp_records))]

    # Split 2: 50% val, 50% test of the 30% temp (each 15% of total)
    gss2 = GroupShuffleSplit(n_splits=1, train_size=0.50, random_state=42)
    val_rel_idx, test_rel_idx = next(gss2.split(temp_records, groups=temp_groups))

    val_records = [temp_records[i] for i in val_rel_idx]
    test_records = [temp_records[i] for i in test_rel_idx]

    # Verification: Zero group leakage
    train_g = set(r["group_id"] for r in train_records)
    val_g = set(r["group_id"] for r in val_records)
    test_g = set(r["group_id"] for r in test_records)

    overlap_train_val = train_g.intersection(val_g)
    overlap_train_test = train_g.intersection(test_g)
    overlap_val_test = val_g.intersection(test_g)

    if overlap_train_val or overlap_train_test or overlap_val_test:
        raise ValueError(
            f"Data leakage detected! Overlaps: "
            f"train-val: {len(overlap_train_val)}, "
            f"train-test: {len(overlap_train_test)}, "
            f"val-test: {len(overlap_val_test)}"
        )

    logger.info("Data leakage verification PASSED (Zero group overlap)")

    # Save splits
    for name, split_data in [("train", train_records), ("val", val_records), ("test", test_records)]:
        split_path = splits_dir / f"{name}.jsonl"
        with open(split_path, "w", encoding="utf-8") as f:
            for r in split_data:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        logger.info("Saved %s split: %d records to %s", name, len(split_data), split_path)

    def count_labels(data):
        counts = {"NORMAL": 0, "SQLI": 0, "XSS": 0}
        for r in data:
            counts[r["label"]] = counts.get(r["label"], 0) + 1
        return counts

    manifest = {
        "status": "leakage_free",
        "total_records": len(records),
        "unique_groups": len(set(groups)),
        "splits": {
            "train": {
                "records": len(train_records),
                "unique_groups": len(train_g),
                "distribution": count_labels(train_records),
            },
            "val": {
                "records": len(val_records),
                "unique_groups": len(val_g),
                "distribution": count_labels(val_records),
            },
            "test": {
                "records": len(test_records),
                "unique_groups": len(test_g),
                "distribution": count_labels(test_records),
            },
        },
    }

    manifest_path = splits_dir / "split_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info("Splits manifest written to %s", manifest_path)


if __name__ == "__main__":
    main()
