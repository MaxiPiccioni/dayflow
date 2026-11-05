from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "change-me-in-production"
MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    environment: Literal["development", "production"] = "development"
    database_url: str = "sqlite:///./dayflow.db"
    jwt_secret: str = DEFAULT_JWT_SECRET
    cors_origins: str = "http://localhost:3000"
    access_token_minutes: int = 60 * 24
    # Cantidad de proxies de confianza delante de la app (Render = 1). Se usa para
    # leer la IP real del cliente desde X-Forwarded-For. 0 = sin proxy (local).
    trusted_proxy_hops: int = 0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        # En producción no se arranca con un secreto público o débil: preferimos
        # que el deploy falle a firmar sesiones con una clave conocida.
        if self.is_production and (self.jwt_secret == DEFAULT_JWT_SECRET or len(self.jwt_secret) < MIN_JWT_SECRET_LENGTH):
            raise ValueError(
                f"JWT_SECRET inválido para producción: debe definirse y tener al menos {MIN_JWT_SECRET_LENGTH} caracteres."
            )
        return self


settings = Settings()
