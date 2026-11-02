"""
JWT creation and decoding using PyJWT. Tokens carry the user id (`sub`) and role
(`role`) so downstream dependencies can authorize without a DB round trip
just to check role.
"""

import uuid
from datetime import datetime, timedelta, timezone

import jwt

from app.utils.config import get_settings

settings = get_settings()


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None

