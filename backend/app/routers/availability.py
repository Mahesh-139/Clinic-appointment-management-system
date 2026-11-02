"""
Two audiences: the doctor configuring their own schedule (PUT /me), and
anyone checking what's bookable (GET /{doctor_id}/slots) — kept public
since browsing availability doesn't require an account, only booking does.
"""

import uuid
from datetime import date as date_type

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.availability import AvailabilityUpdate, AvailabilityOut, AvailableSlotsResponse
from app.auth.permissions import require_doctor
from app.services import availability_service

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("/me", response_model=AvailabilityOut)
def get_my_availability(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return availability_service.get_doctor_availability(db, current_user.id)


@router.put("/me", status_code=204)
def set_my_availability(
    payload: AvailabilityUpdate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    availability_service.set_doctor_availability(db, current_user.id, payload)
    return None


@router.get("/{doctor_id}/slots", response_model=AvailableSlotsResponse)
def get_available_slots(
    doctor_id: uuid.UUID,
    date: date_type = Query(...),
    db: Session = Depends(get_db),
):
    slots, all_slots = availability_service.get_slots_detail(db, doctor_id, date)
    return AvailableSlotsResponse(doctor_id=doctor_id, date=date, slots=slots, all_slots=all_slots)
