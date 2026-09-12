import pytest
from pydantic import ValidationError

from backend.core.config import Settings


def test_development_settings_use_the_local_dashboard_origin() -> None:
    settings = Settings(_env_file=None)

    assert settings.app_env == "development"
    assert settings.allowed_origins == ("http://localhost:3000",)


def test_production_settings_reject_localhost_cors_origin() -> None:
    with pytest.raises(ValidationError, match="localhost"):
        Settings(
            _env_file=None,
            APP_ENV="production",
            ALLOWED_ORIGINS="http://localhost:3000",
        )
