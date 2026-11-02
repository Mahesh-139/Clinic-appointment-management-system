"""
Application configuration.

All environment-dependent values (database URL, JWT secret, CORS origins)
are read here via pydantic-settings, never hardcoded elsewhere in the app.
See ../../.env.example (at the project root) for the variables this expects.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "Clinic Appointment Management System"
    environment: str = "development"
    debug: bool = True

    # --- Database ---
    database_url: str = "postgresql://clinic_user:clinic_password@localhost:5432/clinic_db"

    # --- Auth / JWT ---
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_SECRET_KEY_32_CHARS_MIN"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # --- CORS ---
    cors_allowed_origins: str = "http://localhost:5173"

    # --- Appointments ---
    default_slot_duration_minutes: int = 30

    # --- Admin Authorization (Doctor Registration) ---
    admin_email: str = "maheshmbiradar5@gmail.com"
    admin_password_hash: str = "$2b$12$sUhqZ38e6MTzSIgiV7.PLOAb56J/29KPHCTm74aD0XrRPSsbJ4sfy"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — import and call this, don't instantiate Settings() directly."""
    return Settings()
