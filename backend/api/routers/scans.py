import asyncio
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from backend.api.deps.auth import get_current_user_id
from backend.api.routers.websites import _owned_website, get_database
from backend.api.scan_policy import ScanAuthorizationError, require_verified_website
from backend.core.config import Settings, get_settings
from backend.scanner.jobs import ScanStatus
from backend.scanner.runner import cancel_job_in_memory, run_scan_job
from backend.scanner.ssrf import BlockedTargetError, ensure_public_host, resolve_host
from backend.scanner.target_validation import TargetValidationError, normalize_target

router = APIRouter(tags=["scans"])


@router.post("/api/websites/{website_id}/scans", status_code=status.HTTP_201_CREATED)
async def create_scan(
    website_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    website = _owned_website(database, website_id, user_id)

    # 1. Require VERIFIED status
    try:
        require_verified_website(website.get("verification_status", ""))
    except ScanAuthorizationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    # 2. Revalidate SSRF & target safety at scan initiation
    try:
        target = normalize_target(website["url"], allow_local=settings.scan_allow_local)
        await ensure_public_host(target.host, resolver=resolve_host, allow_local=settings.scan_allow_local)
    except (TargetValidationError, BlockedTargetError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target host resolution failed public network validation.",
        ) from exc

    # 3. Enforce one active scan per website
    existing_active = (
        database.table("scan_jobs")
        .select("id")
        .eq("website_id", website_id)
        .in_("status", [ScanStatus.PENDING.value, ScanStatus.RUNNING.value])
        .execute()
    )
    if existing_active.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active scan already exists for this website.",
        )

    # 4. Insert pending scan job record
    record = {
        "user_id": user_id,
        "website_id": website_id,
        "scan_type": "DEEP_SCAN",
        "status": ScanStatus.PENDING.value,
        "current_stage": "VALIDATING_TARGET",
        "progress": 0,
        "summary": {},
    }
    response = database.table("scan_jobs").insert(record).execute()
    created_scan = response.data[0]

    # 5. Kick off in-process runner task
    asyncio.create_task(
        run_scan_job(
            scan_id=created_scan["id"],
            target_url=website["url"],
            website_id=website_id,
            user_id=user_id,
            database=database,
        )
    )

    return created_scan


@router.get("/api/scans/{scan_id}")
def get_scan(
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
) -> dict[str, Any]:
    response = (
        database.table("scan_jobs")
        .select("*")
        .eq("id", scan_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")
    return response.data[0]


@router.post("/api/scans/{scan_id}/cancel")
def cancel_scan(
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
) -> dict[str, Any]:
    response = (
        database.table("scan_jobs")
        .select("*")
        .eq("id", scan_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    scan = response.data[0]
    if scan.get("status") in {ScanStatus.COMPLETED.value, ScanStatus.FAILED.value, ScanStatus.CANCELLED.value}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan has already finished and cannot be cancelled.",
        )

    cancel_job_in_memory(scan_id)
    now_iso = datetime.now(UTC).isoformat()
    updated = (
        database.table("scan_jobs")
        .update({
            "status": ScanStatus.CANCELLED.value,
            "finished_at": now_iso,
        })
        .eq("id", scan_id)
        .eq("user_id", user_id)
        .execute()
    )
    return updated.data[0]


@router.get("/api/websites/{website_id}/scans")
def list_website_scans(
    website_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
) -> list[dict[str, Any]]:
    _owned_website(database, website_id, user_id)
    response = (
        database.table("scan_jobs")
        .select("*")
        .eq("website_id", website_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data
