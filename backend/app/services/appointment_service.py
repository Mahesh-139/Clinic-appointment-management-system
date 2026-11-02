"""
Core appointment business logic. Every write here re-validates against
app/services/availability_service.get_available_slots immediately before
touching the database — the DB's partial unique index
(uq_active_appointment_slot, see app/models/appointment.py) is the final
backstop against a race between two near-simultaneous bookings, but this
service is what turns that into a clean error message instead of a raw
IntegrityError.
"""

import uuid
from datetime import date as date_type, time, timedelta, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentRescheduleRequest
from app.services.availability_service import get_available_slots
from app.services import notification_service

# Forward-only lifecycle. CANCELLED is reachable separately (see
# cancel_appointment) from any non-terminal state.
ALLOWED_TRANSITIONS = {
    AppointmentStatus.BOOKED: {AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED},
    AppointmentStatus.CONFIRMED: {AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED},
    AppointmentStatus.IN_CONSULTATION: {AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED},
    AppointmentStatus.COMPLETED: set(),
    AppointmentStatus.CANCELLED: set(),
}


def _slot_end_time(doctor_id: uuid.UUID, db: Session, target_date: date_type, start: time) -> time:
    # Slot length comes from the doctor's weekly template for that day;
    # default_slot_duration_minutes (settings) is only a fallback if, for
    # some reason, no template row exists (shouldn't happen if the slot
    # was actually offered by get_available_slots).
    from app.models.availability import DoctorAvailability

    template = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor_id,
            DoctorAvailability.day_of_week == target_date.weekday(),
        )
        .first()
    )
    duration = template.slot_duration_minutes if template else 30
    combined = datetime.combine(target_date, start) + timedelta(minutes=duration)
    return combined.time()


def book_appointment(db: Session, patient: Patient, payload: AppointmentCreate) -> Appointment:
    available = get_available_slots(db, payload.doctor_id, payload.date)
    if payload.slot not in available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That slot is no longer available. Please choose a different time.",
        )

    end_time = _slot_end_time(payload.doctor_id, db, payload.date, payload.slot)

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=payload.doctor_id,
        appointment_date=payload.date,
        start_time=payload.slot,
        end_time=end_time,
        status=AppointmentStatus.BOOKED,
        reason_for_visit=payload.reason_for_visit,
    )
    db.add(appointment)
    try:
        db.commit()
    except IntegrityError:
        # Someone else took the exact same slot between our check and the
        # insert — the partial unique index caught it. Surface the same
        # friendly error rather than a 500.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That slot was just booked by someone else. Please choose a different time.",
        )
    db.refresh(appointment)

    notification_service.notify_appointment_confirmation(db, appointment)
    return appointment


def reschedule_appointment(
    db: Session, appointment: Appointment, payload: AppointmentRescheduleRequest
) -> Appointment:
    if appointment.status not in (AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only booked or confirmed appointments can be rescheduled.",
        )

    available = get_available_slots(db, appointment.doctor_id, payload.date)
    if payload.slot not in available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That slot is no longer available. Please choose a different time.",
        )

    appointment.appointment_date = payload.date
    appointment.start_time = payload.slot
    appointment.end_time = _slot_end_time(appointment.doctor_id, db, payload.date, payload.slot)
    appointment.status = AppointmentStatus.BOOKED  # back to the start of the lifecycle

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That slot was just booked by someone else. Please choose a different time.",
        )
    db.refresh(appointment)

    notification_service.notify_appointment_rescheduled(db, appointment)
    return appointment


def cancel_appointment(db: Session, appointment: Appointment) -> Appointment:
    if appointment.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment can no longer be cancelled.",
        )

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appointment)

    notification_service.notify_appointment_cancellation(db, appointment)
    return appointment


def update_status(db: Session, appointment: Appointment, new_status: AppointmentStatus) -> Appointment:
    allowed = ALLOWED_TRANSITIONS.get(appointment.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move an appointment from {appointment.status.value} to {new_status.value}.",
        )

    appointment.status = new_status
    db.commit()
    db.refresh(appointment)

    notification_service.notify_appointment_status_update(db, appointment, new_status.value)
    return appointment


# --- Read side ---------------------------------------------------------
#
# Both patient and doctor views reuse the same Appointment row and the
# same AppointmentOut shape; only "who is the counterpart" differs, which
# is why every read here goes through to_out_dict rather than returning
# the ORM object directly to a schema that doesn't know about roles.

def to_out_dict(db: Session, appointment: Appointment, viewer_role: str) -> dict:
    counterpart_user_id = appointment.doctor_id if viewer_role == "patient" else appointment.patient_id
    counterpart_user = db.get(User, counterpart_user_id)
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "counterpart_name": counterpart_user.full_name if counterpart_user else "Unknown",
        "date": appointment.appointment_date,
        "time": appointment.start_time,
        "status": appointment.status,
        "reason_for_visit": appointment.reason_for_visit,
        "created_at": appointment.created_at,
    }


def get_for_patient(db: Session, appointment_id: uuid.UUID, patient_id: uuid.UUID) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.patient_id != patient_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    return appointment


def get_for_doctor(db: Session, appointment_id: uuid.UUID, doctor_id: uuid.UUID) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.doctor_id != doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    return appointment


def list_for_patient(db: Session, patient_id: uuid.UUID, scope: str | None) -> list[dict]:
    query = select(Appointment).where(Appointment.patient_id == patient_id)
    today = date_type.today()

    if scope == "upcoming":
        query = query.where(
            Appointment.appointment_date >= today,
            Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]),
        )
    elif scope == "history":
        query = query.where(
            (Appointment.appointment_date < today)
            | (Appointment.status.in_([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]))
        )

    query = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
    appointments = list(db.execute(query).scalars())
    return [to_out_dict(db, appt, "patient") for appt in appointments]


def list_for_doctor(db: Session, doctor_id: uuid.UUID, scope: str | None) -> list[dict]:
    query = select(Appointment).where(Appointment.doctor_id == doctor_id)
    today = date_type.today()

    if scope == "today":
        query = query.where(Appointment.appointment_date == today)
    elif scope == "upcoming":
        query = query.where(
            Appointment.appointment_date > today,
            Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]),
        )
    elif scope == "completed":
        query = query.where(Appointment.status == AppointmentStatus.COMPLETED)
    elif scope == "cancelled":
        query = query.where(Appointment.status == AppointmentStatus.CANCELLED)
    elif scope == "pending":
        query = query.where(Appointment.status == AppointmentStatus.BOOKED)

    query = query.order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc())
    appointments = list(db.execute(query).scalars())
    return [to_out_dict(db, appt, "doctor") for appt in appointments]


def list_history_for_doctor_patient(
    db: Session, doctor_id: uuid.UUID, patient_id: uuid.UUID
) -> list[dict]:
    """Appointment history restricted to visits the two of them actually
    shared — used by the doctor's Patient Details page."""
    query = (
        select(Appointment)
        .where(Appointment.doctor_id == doctor_id, Appointment.patient_id == patient_id)
        .order_by(Appointment.appointment_date.desc())
    )
    appointments = list(db.execute(query).scalars())
    return [to_out_dict(db, appt, "doctor") for appt in appointments]
