from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dayflow.db"
    jwt_secret: str = "change-me-in-production"
    cors_origins: str = "http://localhost:3000"
    access_token_minutes: int = 60 * 24

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
