"""
FastAPI dependencies for authentication. get_current_user is the single
place that turns a bearer token into a User row — every protected route
depends on this (directly or via the role-checking dependencies in
permissions.py) rather than re-implementing token parsing.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.auth.jwt_handler import decode_access_token

# tokenUrl is documentation-only here (Swagger UI); actual login endpoints
# are POST /auth/login/patient and POST /auth/login/doctor.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login/patient", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_error

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise credentials_error

    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError:
        raise credentials_error

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_error

    return user
