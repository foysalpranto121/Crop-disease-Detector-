"""Application settings, read from environment variables / backend/.env."""

from __future__ import annotations

import secrets
from functools import cached_property
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    # Storage
    database_url: str = f"sqlite:///{(DATA_DIR / 'app.db').as_posix()}"
    upload_dir: Path = DATA_DIR / "uploads"
    model_dir: Path = BACKEND_DIR / "model"
    frontend_dist: Path = PROJECT_DIR / "frontend" / "dist"
    frontend_public: Path = PROJECT_DIR / "frontend" / "public"  # reference disease photos live here

    # Security
    secret_key: str = ""  # empty -> a random key is generated once and kept in data/.secret_key
    token_ttl_hours: int = 72
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Diagnosis
    low_confidence_threshold: float = 0.6  # below this the result is "uncertain" and chemical doses are hidden
    min_plant_ratio: float = 0.06  # share of plant-coloured pixels below which the photo is "not a leaf"
    max_upload_mb: int = 10

    # Admin login (always created) + demo farmer account (development only — SEED_DEMO_USERS=false in production)
    seed_demo_users: bool = True
    admin_email: str = "admin@demo.com"
    admin_password: str = "admin123"

    # AI chatbot (EURI, OpenAI-compatible)
    euri_api_key: str = ""
    euri_model: str = "gemini-2.5-flash-lite"  # ~0.9 s to first words vs ~7 s for gemini-2.5-flash (measured)
    euri_base_url: str = "https://api.euron.one/api/v1/euri"

    @cached_property
    def jwt_secret(self) -> str:
        if self.secret_key:
            return self.secret_key
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        key_file = DATA_DIR / ".secret_key"
        if not key_file.exists():
            key_file.write_text(secrets.token_urlsafe(48), encoding="utf-8")
        return key_file.read_text(encoding="utf-8").strip()


settings = Settings()
