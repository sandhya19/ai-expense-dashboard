from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the receipt processor."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "local"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_receipts_bucket: str = "receipts"
    supabase_receipts_table: str = "receipts"
    supabase_receipt_items_table: str = "receipt_items"

    ocr_provider: Literal["mock", "google_vision"] = "mock"
    ocr_timeout_seconds: float = 20
    ocr_max_retries: int = 2

    embedding_provider: Literal["mock"] = "mock"
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, gt=0)
    repository_backend: Literal["memory", "supabase"] = "memory"
    storage_backend: Literal["memory", "supabase"] = "memory"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings loaded from environment variables."""
    return Settings()
