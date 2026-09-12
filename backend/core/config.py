from typing import Literal
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed settings with secure production defaults."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        extra="ignore",
        enable_decoding=False,
    )

    app_env: Literal["development", "test", "production"] = Field(
        default="development", validation_alias="APP_ENV"
    )
    allowed_origins: tuple[str, ...] = Field(
        default=("http://localhost:3000",), validation_alias="ALLOWED_ORIGINS"
    )
    supabase_url: str | None = Field(default=None, validation_alias="SUPABASE_URL")
    supabase_anon_key: str | None = Field(default=None, validation_alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str | None = Field(
        default=None, validation_alias="SUPABASE_SERVICE_ROLE_KEY"
    )
    model_path: str | None = Field(default=None, validation_alias="MODEL_PATH")
    scan_allow_local: bool = Field(default=False, validation_alias="SCAN_ALLOW_LOCAL")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())
        return value

    @model_validator(mode="after")
    def validate_production_cors(self) -> "Settings":
        if self.app_env == "production":
            if any(origin == "*" or "localhost" in origin for origin in self.allowed_origins):
                raise ValueError("Production ALLOWED_ORIGINS cannot include wildcard or localhost origins")
            if self.scan_allow_local:
                raise ValueError("Production mode cannot enable SCAN_ALLOW_LOCAL")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
