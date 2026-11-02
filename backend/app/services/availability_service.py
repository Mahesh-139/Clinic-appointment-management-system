"""
Owns two responsibilities:

1. Persisting a doctor's weekly availability template + unavailable dates
   (set_doctor_availability).
2. Computing the actual bookable slots for a given date
   (get_available_slots) — this is the function
   app/routers/availability.py calls for the patient-facing "available
   slots" endpoint, and it is also the function
   app/services/appointment_service.py re-checks against right before
   writing a booking. There is exactly one place slots are computed, so
   the two can never disagree.
"""

import uuid
from datetime import date as date_type, time, datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.availability import DoctorAvailability, DoctorUnavailableDate
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.availability import AvailabilityUpdate, WeeklyAvailabilityDay, AvailabilityOut


def get_doctor_availability(db: Session, doctor_id: uuid.UUID) -> AvailabilityOut:
    working = (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.doctor_id == doctor_id)
        .order_by(DoctorAvailability.day_of_week)
        .all()
    )
    unavail = (
        db.query(DoctorUnavailableDate)
        .filter(DoctorUnavailableDate.doctor_id == doctor_id)
        .order_by(DoctorUnavailableDate.date)
        .all()
    )
    return AvailabilityOut(
        doctor_id=doctor_id,
        working_days=[
            WeeklyAvailabilityDay(
                day_of_week=w.day_of_week,
                start_time=w.start_time,
                end_time=w.end_time,
                break_start=w.break_start,
                break_end=w.break_end,
                slot_duration_minutes=w.slot_duration_minutes,
            )
            for w in working
        ],
        unavailable_dates=[u.date for u in unavail],
    )


def set_doctor_availability(db: Session, doctor_id: uuid.UUID, payload: AvailabilityUpdate) -> None:
    # Replace-all semantics: simplest correct approach for a weekly
    # template that's edited as a whole form, not incrementally.
    db.query(DoctorAvailability).filter(DoctorAvailability.doctor_id == doctor_id).delete()
    db.query(DoctorUnavailableDate).filter(DoctorUnavailableDate.doctor_id == doctor_id).delete()

    for day in payload.working_days:
        db.add(
            DoctorAvailability(
                doctor_id=doctor_id,
                day_of_week=day.day_of_week,
                start_time=day.start_time,
                end_time=day.end_time,
                break_start=day.break_start,
                break_end=day.break_end,
                slot_duration_minutes=day.slot_duration_minutes,
            )
        )

    for unavailable_date in payload.unavailable_dates:
        db.add(DoctorUnavailableDate(doctor_id=doctor_id, date=unavailable_date))

    db.commit()


def _time_add_minutes(t: time, minutes: int) -> time:
    combined = datetime.combine(date_type.today(), t) + timedelta(minutes=minutes)
    return combined.time()


def _get_candidate_slots(db: Session, doctor_id: uuid.UUID, target_date: date_type) -> list[tuple[time, time]]:
    # 1. Blocked entirely if the doctor marked this date unavailable.
    is_unavailable = db.execute(
        select(DoctorUnavailableDate).where(
            DoctorUnavailableDate.doctor_id == doctor_id,
            DoctorUnavailableDate.date == target_date,
        )
    ).scalar_one_or_none()
    if is_unavailable:
        return []

    # 2. Find the weekly template for this day of week (Monday = 0).
    day_of_week = target_date.weekday()
    template = db.execute(
        select(DoctorAvailability).where(
            DoctorAvailability.doctor_id == doctor_id,
            DoctorAvailability.day_of_week == day_of_week,
        )
    ).scalar_one_or_none()

    if template is not None:
        start_time = template.start_time
        end_time = template.end_time
        break_start = template.break_start
        break_end = template.break_end
        duration = template.slot_duration_minutes
    elif day_of_week < 5:
        # Default working template for weekdays if doctor has not yet customized availability
        start_time = time(9, 0)
        end_time = time(17, 0)
        break_start = time(13, 0)
        break_end = time(14, 0)
        duration = 30
    else:
        return []  # Weekend off by default

    candidate_slots: list[time] = []
    cursor = start_time
    while True:
        slot_end = _time_add_minutes(cursor, duration)
        if slot_end > end_time:
            break

        in_break = (
            break_start
            and break_end
            and not (slot_end <= break_start or cursor >= break_end)
        )
        if not in_break:
            candidate_slots.append((cursor, slot_end))

        cursor = slot_end

    return candidate_slots


def get_available_slots(db: Session, doctor_id: uuid.UUID, target_date: date_type) -> list[time]:
    candidate_slots = _get_candidate_slots(db, doctor_id, target_date)
    if not candidate_slots:
        return []

    taken_appts = db.execute(
        select(Appointment.start_time, Appointment.end_time).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == target_date,
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    ).all()

    def is_slot_taken(slot_start: time, slot_end: time) -> bool:
        for appt_start, appt_end in taken_appts:
            if not (appt_end <= slot_start or appt_start >= slot_end):
                return True
        return False

    return [slot_start for slot_start, slot_end in candidate_slots if not is_slot_taken(slot_start, slot_end)]


def get_slots_detail(db: Session, doctor_id: uuid.UUID, target_date: date_type) -> tuple[list[time], list[dict]]:
    candidate_slots = _get_candidate_slots(db, doctor_id, target_date)
    if not candidate_slots:
        return [], []

    taken_appts = db.execute(
        select(Appointment.start_time, Appointment.end_time).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == target_date,
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    ).all()

    def is_slot_taken(slot_start: time, slot_end: time) -> bool:
        for appt_start, appt_end in taken_appts:
            if not (appt_end <= slot_start or appt_start >= slot_end):
                return True
        return False

    available_slots = [slot_start for slot_start, slot_end in candidate_slots if not is_slot_taken(slot_start, slot_end)]
    all_slots = [
        {
            "time": slot_start.strftime("%H:%M"),
            "available": not is_slot_taken(slot_start, slot_end),
        }
        for slot_start, slot_end in candidate_slots
    ]

    return available_slots, all_slots
