import hashlib
import html
import json
import logging
from pathlib import Path
import re
from urllib.parse import unquote_plus

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("build_dataset")


def categorize_sqli(payload: str) -> str:
    lower = payload.lower()
    if "union" in lower:
        return "crs-942-union"
    if any(k in lower for k in ("or '1'='1", "or 1=1", "and 1=1", "and 1=2", "'--", "'/*")):
        return "crs-942-tautology"
    if any(k in lower for k in ("extractvalue", "updatexml", "convert", "sleep", "pg_sleep")):
        return "crs-942-blind-error"
    if any(k in lower for k in ("order by", "group by", "having")):
        return "crs-942-orderby"
    if any(k in lower for k in ("drop table", "exec", "xp_cmdshell", "shutdown")):
        return "crs-942-stacked"
    return "crs-942-generic"


def categorize_xss(payload: str) -> str:
    lower = payload.lower()
    if "<script" in lower:
        return "crs-941-script-tag"
    if "<svg" in lower:
        return "crs-941-svg-vector"
    if any(k in lower for k in ("onerror=", "onload=", "onmouseover=", "onclick=", "onfocus=")):
        return "crs-941-event-handler"
    if "javascript:" in lower:
        return "crs-941-pseudoprotocol"
    if any(k in lower for k in ("<iframe", "<details", "<marquee", "<body")):
        return "crs-941-html5-element"
    return "crs-941-attribute-breakout"


def normalize_payload(text: str) -> str:
    # 1. URL unquote
    try:
        text = unquote_plus(text)
    except Exception:
        pass
    # 2. HTML unescape
    text = html.unescape(text)
    # 3. Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def compute_group_id(payload: str, attack_family: str) -> str:
    """Computes a stable group ID based on structural fingerprint to prevent leakage."""
    # Replace digits and specific variable names with placeholders
    structural = re.sub(r"\d+", "N", payload)
    structural = re.sub(r"['\"][a-zA-Z0-9_]+['\"]", "'S'", structural)
    token = f"{attack_family}:{structural[:30]}"
    return hashlib.md5(token.encode("utf-8")).hexdigest()[:12]


def main() -> None:
    raw_dir = Path("ml/dataset/raw")
    processed_dir = Path("ml/dataset/processed")
    processed_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    seen_payloads: set[str] = set()

    # 1. Process SQLi samples
    sqli_file = raw_dir / "owasp-crs" / "sqli_samples.txt"
    if sqli_file.exists():
        with open(sqli_file, "r", encoding="utf-8") as f:
            for line in f:
                raw_text = line.strip()
                if not raw_text:
                    continue
                clean_text = normalize_payload(raw_text)
                if not clean_text or clean_text in seen_payloads:
                    continue
                seen_payloads.add(clean_text)

                family = categorize_sqli(clean_text)
                group = compute_group_id(clean_text, family)
                records.append({
                    "payload": clean_text,
                    "label": "SQLI",
                    "source": "owasp-crs-942",
                    "attack_family": family,
                    "group_id": group,
                })

    # 2. Process XSS samples
    xss_file = raw_dir / "owasp-crs" / "xss_samples.txt"
    if xss_file.exists():
        with open(xss_file, "r", encoding="utf-8") as f:
            for line in f:
                raw_text = line.strip()
                if not raw_text:
                    continue
                clean_text = normalize_payload(raw_text)
                if not clean_text or clean_text in seen_payloads:
                    continue
                seen_payloads.add(clean_text)

                family = categorize_xss(clean_text)
                group = compute_group_id(clean_text, family)
                records.append({
                    "payload": clean_text,
                    "label": "XSS",
                    "source": "owasp-crs-941",
                    "attack_family": family,
                    "group_id": group,
                })

    # 3. Process Normal samples
    normal_file = raw_dir / "csic2010" / "normal_samples.txt"
    if normal_file.exists():
        with open(normal_file, "r", encoding="utf-8") as f:
            for line in f:
                raw_text = line.strip()
                if not raw_text:
                    continue
                clean_text = normalize_payload(raw_text)
                if not clean_text or clean_text in seen_payloads:
                    continue
                seen_payloads.add(clean_text)

                family = "benign-web-param"
                group = compute_group_id(clean_text, family)
                records.append({
                    "payload": clean_text,
                    "label": "NORMAL",
                    "source": "csic2010-benign",
                    "attack_family": family,
                    "group_id": group,
                })

    output_path = processed_dir / "unified_dataset.jsonl"
    with open(output_path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Metadata & class counts
    class_counts = {"NORMAL": 0, "SQLI": 0, "XSS": 0}
    for r in records:
        class_counts[r["label"]] += 1

    unique_groups = len({r["group_id"] for r in records})

    metadata = {
        "dataset_version": "v1.1.0",
        "total_records": len(records),
        "unique_groups": unique_groups,
        "class_distribution": class_counts,
        "schema": ["payload", "label", "source", "attack_family", "group_id"],
    }

    meta_path = processed_dir / "dataset_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Unified dataset created at %s with %d records (%d unique groups)", output_path, len(records), unique_groups)
    logger.info("Class distribution: %s", class_counts)


if __name__ == "__main__":
    main()
