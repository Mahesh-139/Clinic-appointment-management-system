"""
Role-gating dependencies, layered on top of get_current_user.

Usage in a router:
    @router.get("/patients/me")
    def read_own_profile(current_user: User = Depends(require_patient)):
        ...

Keeping this in one file means every "doctor-only" or "patient-only" check
in the API is expressed the same way, and adding a role later only means
adding one function here.
"""

from fastapi import Depends, HTTPException, status

from app.models.user import User, UserRole
from app.auth.dependencies import get_current_user


def require_patient(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action is only available to patients.",
        )
    return current_user


def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action is only available to doctors.",
        )
    return current_user
