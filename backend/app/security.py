import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Optional
from .config import settings

def hash_password(password: str) -> str:
    salt = settings.SECRET_KEY[:16].encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000).hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    expected = hash_password(plain_password)
    return hmac.compare_digest(expected, hashed_password)

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def calculate_expiry(days: int = 7) -> datetime:
    return datetime.utcnow() + timedelta(days=days)
