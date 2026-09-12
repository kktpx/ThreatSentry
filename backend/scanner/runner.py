import asyncio
from datetime import UTC, datetime
import logging
from typing import Any

import httpx

from backend.ml.predictor import MLPredictor
from backend.scanner.active.reflected_xss import scan_reflected_xss_for_parameter
from backend.scanner.active.sqli import scan_sqli_for_parameter
from backend.scanner.analysis.hybrid import enrich_with_hybrid_analysis
from backend.scanner.crawler import SafeCrawler
from backend.scanner.findings import Finding, deduplicate_findings
from backend.scanner.jobs import ScanJob, ScanJobTransitionError, ScanStatus
from backend.scanner.passive.orchestrator import run_passive_checks_for_response
from backend.scanner.scoring import FindingForScore, calculate_score
from backend.scanner.ssrf import BlockedTargetError, Resolver, ensure_public_host, resolve_host
from backend.scanner.target_validation import TargetValidationError, normalize_target

from backend.core.config import get_settings
from backend.ml.loader import get_ml_predictor

logger = logging.getLogger(__name__)

_active_cancellations: set[str] = set()
_ml_predictor = get_ml_predictor()


def cancel_job_in_memory(scan_id: str) -> None:
    _active_cancellations.add(scan_id)


def is_job_cancelled(scan_id: str, database: Any) -> bool:
    if scan_id in _active_cancellations:
        return True
    try:
        res = database.table("scan_jobs").select("status").eq("id", scan_id).execute()
        if res.data and res.data[0].get("status") == "CANCELLED":
            return True
    except Exception:
        pass
    return False


async def run_scan_job(
    scan_id: str,
    target_url: str,
    website_id: str,
    database: Any,
    *,
    user_id: str | None = None,
    resolver: Resolver | None = None,
    client: httpx.AsyncClient | None = None,
    delay_seconds: float = 0.01,
    allow_local: bool | None = None,
) -> None:
    """Orchestrates an in-process scan job across distinct execution stages."""
    job = ScanJob.create(scan_id)
    effective_resolver = resolver or resolve_host
    settings = get_settings()
    effective_allow_local = settings.scan_allow_local if allow_local is None else allow_local

    # Retrieve user_id from scan_jobs if not supplied
    if not user_id:
        try:
            res = database.table("scan_jobs").select("user_id").eq("id", scan_id).execute()
            if res.data:
                user_id = res.data[0].get("user_id", "")
        except Exception:
            user_id = ""

    # 1. Immediate pre-check for cancellation
    if is_job_cancelled(scan_id, database):
        _finish_cancellation(scan_id, database)
        return

    try:
        job.start()
        database.table("scan_jobs").update({
            "status": ScanStatus.RUNNING.value,
            "started_at": datetime.now(UTC).isoformat(),
            "current_stage": "VALIDATING_TARGET",
            "progress": 5,
        }).eq("id", scan_id).execute()
    except (ScanJobTransitionError, Exception) as exc:
        logger.warning("Failed to start scan job %s: %s", scan_id, exc)
        return

    # 2. SSRF & Target Validation stage
    if is_job_cancelled(scan_id, database):
        _finish_cancellation(scan_id, database)
        return

    try:
        target = normalize_target(target_url, allow_local=effective_allow_local)
        await ensure_public_host(target.host, resolver=effective_resolver, allow_local=effective_allow_local)
    except (TargetValidationError, BlockedTargetError) as exc:
        job.fail()
        database.table("scan_jobs").update({
            "status": ScanStatus.FAILED.value,
            "finished_at": datetime.now(UTC).isoformat(),
            "error_code": "SSRF_VALIDATION_FAILED",
            "error_message_safe": "Target host resolution failed public network validation.",
        }).eq("id", scan_id).execute()
        return
    except Exception as exc:
        logger.exception("Unexpected error validating target %s: %s", target_url, exc)
        job.fail()
        database.table("scan_jobs").update({
            "status": ScanStatus.FAILED.value,
            "finished_at": datetime.now(UTC).isoformat(),
            "error_code": "TARGET_VALIDATION_ERROR",
            "error_message_safe": "Target could not be reached safely.",
        }).eq("id", scan_id).execute()
        return

    # 3. Discovery & Crawling stage
    if is_job_cancelled(scan_id, database):
        _finish_cancellation(scan_id, database)
        return

    job.advance("CRAWLING", 20)
    database.table("scan_jobs").update({
        "current_stage": "CRAWLING",
        "progress": 20,
    }).eq("id", scan_id).execute()

    http_client = client or httpx.AsyncClient(
        timeout=5.0,
        follow_redirects=False,
        headers={"User-Agent": "ThreatSentry-Scanner/0.1.0 (+https://threatsentry.local)"},
    )

    all_findings: list[Finding] = []

    try:
        crawler = SafeCrawler(
            target_url,
            max_pages=20,
            max_depth=2,
            concurrency=3,
            resolver=effective_resolver,
            client=http_client,
            allow_local=effective_allow_local,
        )
        attack_surface = await crawler.crawl()
    except Exception as exc:
        logger.warning("Crawl stage encountered an error for %s: %s", target_url, exc)
        attack_surface = None

    if is_job_cancelled(scan_id, database):
        _finish_cancellation(scan_id, database)
        if client is None:
            await http_client.aclose()
        return

    # 4. Passive Checks stage
    job.advance("PASSIVE_CHECKS", 50)
    database.table("scan_jobs").update({
        "current_stage": "PASSIVE_CHECKS",
        "progress": 50,
    }).eq("id", scan_id).execute()

    pages_to_check = attack_surface.pages_crawled if attack_surface and attack_surface.pages_crawled else [target.url]

    for page_url in pages_to_check:
        if is_job_cancelled(scan_id, database):
            _finish_cancellation(scan_id, database)
            if client is None:
                await http_client.aclose()
            return

        try:
            resp = await http_client.get(page_url)
            cookie_headers = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else []
            passive_res = run_passive_checks_for_response(
                url=page_url,
                headers=dict(resp.headers),
                body=resp.text[:65536],
                status_code=resp.status_code,
                raw_cookies=cookie_headers,
            )
            all_findings.extend(passive_res)
        except Exception as exc:
            logger.debug("Passive check request failed for %s: %s", page_url, exc)

    # 5. Active Analysis stage (SQLi & XSS)
    if is_job_cancelled(scan_id, database):
        _finish_cancellation(scan_id, database)
        if client is None:
            await http_client.aclose()
        return

    job.advance("ACTIVE_CHECKS", 80)
    database.table("scan_jobs").update({
        "current_stage": "ACTIVE_CHECKS",
        "progress": 80,
    }).eq("id", scan_id).execute()

    endpoints_to_probe = attack_surface.endpoints if attack_surface else []
    for endpoint in endpoints_to_probe:
        if is_job_cancelled(scan_id, database):
            _finish_cancellation(scan_id, database)
            if client is None:
                await http_client.aclose()
            return

        for param in endpoint.parameters:
            if not param:
                continue

            # SQLi Check
            try:
                sqli_finding = await scan_sqli_for_parameter(
                    client=http_client,
                    url=endpoint.url,
                    parameter=param,
                    method=endpoint.method,
                )
                if sqli_finding:
                    all_findings.append(sqli_finding)
            except Exception as exc:
                logger.debug("Active SQLi check error on %s (%s): %s", endpoint.url, param, exc)

            # XSS Check
            try:
                xss_finding = await scan_reflected_xss_for_parameter(
                    client=http_client,
                    url=endpoint.url,
                    parameter=param,
                    method=endpoint.method,
                )
                if xss_finding:
                    all_findings.append(xss_finding)
            except Exception as exc:
                logger.debug("Active XSS check error on %s (%s): %s", endpoint.url, param, exc)

    if client is None:
        await http_client.aclose()

    # 6. Hybrid ML Analysis & Deduplication
    if is_job_cancelled(scan_id, database):
        _finish_cancellation(scan_id, database)
        return

    all_findings = enrich_with_hybrid_analysis(all_findings, _ml_predictor)
    unique_findings = deduplicate_findings(all_findings, origin=target.origin)

    # 7. Rescan Comparison (NEW / UNCHANGED / FIXED)
    prev_fingerprints: set[str] = set()
    try:
        prev_scan_res = (
            database.table("scan_jobs")
            .select("id")
            .eq("website_id", website_id)
            .eq("status", "COMPLETED")
            .neq("id", scan_id)
            .order("created_at", desc=True)
            .execute()
        )
        if prev_scan_res.data:
            prev_scan_id = prev_scan_res.data[0]["id"]
            prev_findings_res = (
                database.table("findings")
                .select("fingerprint")
                .eq("scan_id", prev_scan_id)
                .execute()
            )
            prev_fingerprints = {row["fingerprint"] for row in prev_findings_res.data or []}
    except Exception as exc:
        logger.debug("Rescan comparison lookup skipped: %s", exc)

    current_fingerprints: set[str] = set()
    for finding in unique_findings:
        fp = finding.ensure_fingerprint(target.origin)
        current_fingerprints.add(fp)
        if fp in prev_fingerprints:
            finding.status = "UNCHANGED"
        else:
            finding.status = "NEW"

    fixed_count = len(prev_fingerprints - current_fingerprints) if prev_fingerprints else 0

    # 8. Scoring & Persist Findings
    score_result = calculate_score([
        FindingForScore(fingerprint=f.ensure_fingerprint(target.origin), severity=f.severity)
        for f in unique_findings
    ])

    for finding in unique_findings:
        try:
            record = finding.to_dict(
                user_id=user_id or "00000000-0000-0000-0000-000000000000",
                website_id=website_id,
                scan_id=scan_id,
                origin=target.origin,
            )
            database.table("findings").insert(record).execute()
        except Exception as exc:
            logger.warning("Failed to persist finding %s: %s", finding.title, exc)

    # 9. Complete Scan Job
    job.complete()
    now_iso = datetime.now(UTC).isoformat()
    attack_surface_summary = attack_surface.to_summary() if attack_surface else {}

    summary = {
        "grade": score_result.grade,
        "findings_count": score_result.deduplicated_finding_count,
        "new_findings_count": len([f for f in unique_findings if f.status == "NEW"]),
        "unchanged_findings_count": len([f for f in unique_findings if f.status == "UNCHANGED"]),
        "fixed_findings_count": fixed_count,
        "scan_type": "DEEP_SCAN",
        "attack_surface": attack_surface_summary,
    }

    database.table("scan_jobs").update({
        "status": ScanStatus.COMPLETED.value,
        "current_stage": "COMPLETE",
        "progress": 100,
        "finished_at": now_iso,
        "score": score_result.score,
        "score_formula_version": score_result.formula_version,
        "model_version": _ml_predictor.version,
        "summary": summary,
    }).eq("id", scan_id).execute()

    # 10. Persist last_score on website record
    try:
        database.table("websites").update({
            "last_score": score_result.score,
        }).eq("id", website_id).execute()
    except Exception as exc:
        logger.warning("Failed to update website last_score for %s: %s", website_id, exc)

    _active_cancellations.discard(scan_id)


def _finish_cancellation(scan_id: str, database: Any) -> None:
    _active_cancellations.discard(scan_id)
    now_iso = datetime.now(UTC).isoformat()
    try:
        database.table("scan_jobs").update({
            "status": ScanStatus.CANCELLED.value,
            "finished_at": now_iso,
        }).eq("id", scan_id).execute()
    except Exception as exc:
        logger.warning("Failed to update cancellation for scan %s: %s", scan_id, exc)
