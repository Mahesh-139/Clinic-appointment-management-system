"""
Doctor search/profile logic, plus the doctor-side "view a patient" lookups
used by the Patient Details page. A doctor may only view a patient they've
actually had at least one appointment with — enforced in
get_patient_for_doctor below, not left to the frontend to respect.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User
from app.models.appointment import Appointment
from app.schemas.doctor import DoctorProfileUpdate


def _to_public_dict(doctor: Doctor, user: User) -> dict:
    return {
        "id": doctor.id,
        "full_name": user.full_name,
        "specialization": doctor.specialization,
        "qualification": doctor.qualification,
        "experience_years": doctor.experience_years,
        "consultation_info": doctor.consultation_info,
        "photo_url": doctor.photo_url,
    }


def search_doctors(
    db: Session,
    query: str | None = None,
    specialization: str | None = None,
    min_experience: int | None = None,
    available_day: int | None = None,
    sort_by: str | None = None,
) -> list[dict]:
    stmt = select(Doctor, User).join(User, User.id == Doctor.id).where(User.is_active.is_(True))
    if query:
        like = f"%{query.strip()}%"
        stmt = stmt.where(or_(User.full_name.ilike(like), Doctor.specialization.ilike(like)))
    if specialization:
        spec_like = f"%{specialization.strip()}%"
        stmt = stmt.where(Doctor.specialization.ilike(spec_like))
    if min_experience is not None:
        stmt = stmt.where(Doctor.experience_years >= min_experience)
    if available_day is not None:
        from app.models.availability import DoctorAvailability
        stmt = stmt.join(DoctorAvailability, DoctorAvailability.doctor_id == Doctor.id).where(
            DoctorAvailability.day_of_week == available_day
        ).distinct()

    if sort_by == "experience_desc":
        stmt = stmt.order_by(Doctor.experience_years.desc())
    elif sort_by == "experience_asc":
        stmt = stmt.order_by(Doctor.experience_years.asc())
    elif sort_by == "name_desc":
        stmt = stmt.order_by(User.full_name.desc())
    else:
        stmt = stmt.order_by(User.full_name.asc())

    rows = db.execute(stmt).all()
    return [_to_public_dict(doctor, user) for doctor, user in rows]


def get_public_profile(db: Session, doctor_id: uuid.UUID) -> dict:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")
    return _to_public_dict(doctor, doctor.user)


def get_own_profile(current_user: User) -> dict:
    doctor = current_user.doctor_profile
    if doctor is None:
        return {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "specialization": None,
            "qualification": None,
            "experience_years": None,
            "consultation_info": None,
            "photo_url": None,
        }
    return {
        **_to_public_dict(doctor, current_user),
        "email": current_user.email,
        "phone": current_user.phone,
    }


def update_own_profile(db: Session, current_user: User, payload: DoctorProfileUpdate) -> dict:
    doctor = current_user.doctor_profile
    if doctor is None:
        doctor = Doctor(id=current_user.id)
        db.add(doctor)
        db.flush()

    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.specialization is not None:
        doctor.specialization = payload.specialization
    if payload.qualification is not None:
        doctor.qualification = payload.qualification
    if payload.experience_years is not None:
        doctor.experience_years = payload.experience_years
    if payload.consultation_info is not None:
        doctor.consultation_info = payload.consultation_info
    if payload.photo_url is not None:
        doctor.photo_url = payload.photo_url

    db.commit()
    db.refresh(current_user)
    db.refresh(doctor)
    return get_own_profile(current_user)



def get_patient_for_doctor(db: Session, doctor_id: uuid.UUID, patient_id: uuid.UUID) -> dict:
    shared_appointment = db.execute(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor_id, Appointment.patient_id == patient_id
        )
    ).first()
    if shared_appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No shared appointment history with this patient.",
        )

    patient = db.get(Patient, patient_id)
    user = db.get(User, patient_id)
    return {
        "id": patient_id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "date_of_birth": patient.date_of_birth if patient else None,
        "gender": patient.gender if patient else None,
        "address": patient.address if patient else None,
    }
