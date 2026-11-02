"""
The central appointment endpoints. Booking/reschedule/cancel are
patient-initiated; status advancement is doctor-initiated. GET /{id} is
shared by both roles (the patient confirmation page and both dashboards
hit the same endpoint), so it resolves ownership against whichever role
the caller has rather than assuming one.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentRescheduleRequest,
    AppointmentStatusUpdate,
    AppointmentOut,
)
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_patient, require_doctor
from app.services import appointment_service

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    appointment = appointment_service.book_appointment(db, current_user.patient_profile, payload)
    return appointment_service.to_out_dict(db, appointment, "patient")


@router.get("/me", response_model=list[AppointmentOut])
def my_appointments(
    scope: str | None = Query(default=None),
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    return appointment_service.list_for_patient(db, current_user.id, scope)


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment_details(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.PATIENT:
        appointment = appointment_service.get_for_patient(db, appointment_id, current_user.id)
        return appointment_service.to_out_dict(db, appointment, "patient")

    appointment = appointment_service.get_for_doctor(db, appointment_id, current_user.id)
    return appointment_service.to_out_dict(db, appointment, "doctor")


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentRescheduleRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    appointment = appointment_service.get_for_patient(db, appointment_id, current_user.id)
    updated = appointment_service.reschedule_appointment(db, appointment, payload)
    return appointment_service.to_out_dict(db, updated, "patient")


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.PATIENT:
        appointment = appointment_service.get_for_patient(db, appointment_id, current_user.id)
        viewer_role = "patient"
    else:
        appointment = appointment_service.get_for_doctor(db, appointment_id, current_user.id)
        viewer_role = "doctor"

    updated = appointment_service.cancel_appointment(db, appointment)
    return appointment_service.to_out_dict(db, updated, viewer_role)


@router.patch("/{appointment_id}/status", response_model=AppointmentOut)
def update_appointment_status(
    appointment_id: uuid.UUID,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    appointment = appointment_service.get_for_doctor(db, appointment_id, current_user.id)
    updated = appointment_service.update_status(db, appointment, payload.status)
    return appointment_service.to_out_dict(db, updated, "doctor")
