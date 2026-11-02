"""
Registration and login logic. Patient registration creates both a User
row and its linked Patient profile in one transaction; doctor login just
authenticates against an existing User+Doctor pair (there is no doctor
self-registration endpoint — see project scope notes).
"""
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.auth.password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.schemas.auth import RegisterRequest, DoctorRegisterRequest, LoginRequest


def register_patient(db: Session, payload: RegisterRequest) -> User:
    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=email_clean,
        phone=payload.phone.strip() if payload.phone else None,
        hashed_password=hash_password(payload.password),
        role=UserRole.PATIENT,
    )
    db.add(user)
    db.flush()  # get user.id before creating the dependent Patient row

    db.add(Patient(id=user.id))
    db.commit()
    db.refresh(user)
    return user


def register_doctor(db: Session, payload: DoctorRegisterRequest) -> User:
    from app.utils.config import get_settings
    from app.models.availability import DoctorAvailability
    from datetime import time

    settings = get_settings()
    admin_email_configured = settings.admin_email.strip().lower()
    if (
        payload.admin_email.strip().lower() != admin_email_configured
        or not verify_password(payload.admin_password, settings.admin_password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account can't be created. Admin details are incorrect.",
        )

    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=email_clean,
        phone=payload.phone.strip() if payload.phone else None,
        hashed_password=hash_password(payload.password),
        role=UserRole.DOCTOR,
    )
    db.add(user)
    db.flush()  # get user.id before creating the dependent Doctor row

    doctor_profile = Doctor(
        id=user.id,
        specialization=payload.specialization,
        qualification=payload.qualification,
        experience_years=payload.experience_years,
        consultation_info=payload.consultation_info,
        photo_url=payload.photo_url,
    )
    db.add(doctor_profile)

    # Seed default working availability (Monday-Friday 09:00-17:00, 30m slots, 13:00-14:00 break)
    for day_idx in range(5):
        db.add(
            DoctorAvailability(
                doctor_id=user.id,
                day_of_week=day_idx,
                start_time=time(9, 0),
                end_time=time(17, 0),
                break_start=time(13, 0),
                break_end=time(14, 0),
                slot_duration_minutes=30,
            )
        )

    db.commit()
    db.refresh(user)
    return user



def _authenticate(db: Session, payload: LoginRequest, expected_role: UserRole) -> User:
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise invalid
    if user.role != expected_role:
        # Deliberately the same error as a wrong password — don't reveal
        # that the email exists under a different role.
        raise invalid
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated."
        )
    return user


def login_user(db: Session, payload: LoginRequest) -> tuple[User, str]:
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise invalid
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated."
        )
    token = create_access_token(user.id, user.role.value)
    return user, token


def login_patient(db: Session, payload: LoginRequest) -> tuple[User, str]:
    user = _authenticate(db, payload, UserRole.PATIENT)
    token = create_access_token(user.id, user.role.value)
    return user, token


def login_doctor(db: Session, payload: LoginRequest) -> tuple[User, str]:
    user = _authenticate(db, payload, UserRole.DOCTOR)
    token = create_access_token(user.id, user.role.value)
    return user, token


def delete_user_account(db: Session, user_id: uuid.UUID) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    db.delete(user)
    db.commit()
