from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from supabase import create_client

from backend.core.config import Settings, get_settings


class AuthenticationError(ValueError):
    """Raised before a malformed bearer token reaches an authorization boundary."""


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AuthenticationError("Authorization header is required")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AuthenticationError("Authorization header must use a bearer token")
    return token.strip()


def authenticate_token(token: str, get_user: Callable[[str], object | None]) -> str:
    """Return the authenticated Supabase user ID or reject the request."""
    try:
        user = get_user(token)
    except Exception as exc:
        raise AuthenticationError("Bearer token is invalid or expired") from exc
    user_id = getattr(user, "id", None)
    if not isinstance(user_id, str) or not user_id:
        raise AuthenticationError("Bearer token is invalid or expired")
    return user_id


def get_current_user_id(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> str:
    try:
        token = extract_bearer_token(authorization)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured",
        )
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    try:
        return authenticate_token(token, lambda value: client.auth.get_user(value).user)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
