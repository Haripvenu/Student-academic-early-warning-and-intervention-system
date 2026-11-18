import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Academic Risk Monitor"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "dev-secret-key-academic-risk-monitor-2026-super-secure"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://localhost"
    ]
    
    # Database URL: default SQLite for instant zero-dependency local runs and tests
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./academic_risk.db")
    
    # Storage directories
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    ARTIFACTS_DIR: str = os.getenv("ARTIFACTS_DIR", os.path.join(BASE_DIR, "ml", "artifacts"))
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data"))
    
    # Worker & Scoring
    JOB_LEASE_SECONDS: int = 300
    WORKER_POLL_INTERVAL: int = 5
    DEFAULT_CHECKPOINT: str = "W4"
    DEMO_TERM_CODE: str = "2014J"
    ANOMALY_CORROBORATION_PERCENTILE: float = 90.0

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
