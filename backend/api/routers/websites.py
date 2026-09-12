from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from supabase import Client, create_client

from backend.api.deps.auth import get_current_user_id
from backend.api.websites import create_website_record
from backend.api.website_verification import verification_update
from backend.core.config import Settings, get_settings
from backend.scanner.target_validation import TargetValidationError
from backend.scanner.ssrf import BlockedTargetError
from backend.scanner.verification_fetch import verify_ownership_document

router = APIRouter(prefix="/api/websites", tags=["websites"])


class WebsiteCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=1, max_length=2048)


class WebsiteUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)


def get_database(settings: Settings = Depends(get_settings)) -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Database service is not configured")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _owned_website(database: Client, website_id: str, user_id: str) -> dict[str, Any]:
    response = database.table("websites").select("*").eq("id", website_id).eq("user_id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Website not found")
    return response.data[0]


@router.get("")
def list_websites(user_id: str = Depends(get_current_user_id), database: Client = Depends(get_database)) -> list[dict[str, Any]]:
    return database.table("websites").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data


@router.post("", status_code=status.HTTP_201_CREATED)
def add_website(
    request: WebsiteCreateRequest,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        record = create_website_record(request.name, request.url, allow_local=settings.scan_allow_local)
    except (TargetValidationError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        # Check for duplicate normalized origin for this user
        existing = (
            database.table("websites")
            .select("id")
            .eq("user_id", user_id)
            .eq("normalized_origin", record["normalized_origin"])
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A website with origin '{record['normalized_origin']}' is already registered in your inventory. You can manage or re-verify it from the dashboard.",
            )

        response = database.table("websites").insert({**record, "user_id": user_id}).execute()
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        error_msg = str(exc)
        if "duplicate" in error_msg.lower() or "unique" in error_msg.lower() or "23505" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A website with origin '{record['normalized_origin']}' is already registered in your inventory.",
            ) from exc
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save website record.") from exc



@router.get("/{website_id}")
def get_website(
    website_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
) -> dict[str, Any]:
    return _owned_website(database, website_id, user_id)


@router.patch("/{website_id}")
def update_website(
    website_id: str,
    request: WebsiteUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
) -> dict[str, Any]:
    _owned_website(database, website_id, user_id)
    response = database.table("websites").update(request.model_dump(exclude_none=True)).eq("id", website_id).eq("user_id", user_id).execute()
    return response.data[0]


@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_website(
    website_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
) -> Response:
    _owned_website(database, website_id, user_id)
    database.table("websites").delete().eq("id", website_id).eq("user_id", user_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{website_id}/verify")
async def verify_website(
    website_id: str,
    user_id: str = Depends(get_current_user_id),
    database: Client = Depends(get_database),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    website = _owned_website(database, website_id, user_id)
    try:
        is_verified = await verify_ownership_document(
            website["normalized_origin"],
            website["verification_token"],
            allow_local=settings.scan_allow_local,
        )
    except (BlockedTargetError, TargetValidationError, Exception):
        is_verified = False
    update = verification_update(is_verified, now=datetime.now(UTC))
    response = database.table("websites").update(update).eq("id", website_id).eq("user_id", user_id).execute()
    return response.data[0]
