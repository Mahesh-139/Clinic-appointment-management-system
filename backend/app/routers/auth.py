"""
Registration, login (patient/doctor), logout, and "who am I".

Logout is a no-op on the server for a stateless JWT setup — the frontend
just discards the token (see frontend/src/services/authService.js). The
endpoint still exists so the client always has a single place to call and
so a future token-blocklist could be added here without changing the
frontend contract.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.auth import (
    RegisterRequest,
    DoctorRegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
)
from app.services import auth_service
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@router.post("/register/patient", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = auth_service.register_patient(db, payload)
    return user


@router.post("/register/doctor", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: DoctorRegisterRequest, db: Session = Depends(get_db)):
    user = auth_service.register_doctor(db, payload)
    return user



@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user, token = auth_service.login_user(db, payload)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login/patient", response_model=TokenResponse)
def login_patient(payload: LoginRequest, db: Session = Depends(get_db)):
    user, token = auth_service.login_patient(db, payload)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login/doctor", response_model=TokenResponse)
def login_doctor(payload: LoginRequest, db: Session = Depends(get_db)):
    user, token = auth_service.login_doctor(db, payload)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    # Stateless JWT: nothing to invalidate server-side in this phase.
    return None


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.delete_user_account(db, current_user.id)
    return None
