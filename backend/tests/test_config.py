import pytest
from pydantic import ValidationError

from app.config import DEFAULT_JWT_SECRET, Settings

STRONG_SECRET = "x" * 48


def make_settings(**overrides) -> Settings:
    # _env_file=None evita que un .env local pise los valores del test.
    return Settings(_env_file=None, **overrides)


def test_development_allows_default_secret():
    assert make_settings(environment="development").jwt_secret == DEFAULT_JWT_SECRET


def test_production_rejects_default_secret():
    with pytest.raises(ValidationError):
        make_settings(environment="production")


def test_production_rejects_short_secret():
    with pytest.raises(ValidationError):
        make_settings(environment="production", jwt_secret="corto")


def test_production_accepts_strong_secret():
    settings = make_settings(environment="production", jwt_secret=STRONG_SECRET)
    assert settings.is_production


def test_unknown_environment_is_rejected():
    with pytest.raises(ValidationError):
        make_settings(environment="staging")
