"""
Public doctor directory + doctor-only "my" endpoints.

Route ordering matters here: the literal /me... routes are declared before
the dynamic /{doctor_id} route so "me" is never accidentally parsed as a
UUID path parameter.
"""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.doctor import DoctorPublicOut, DoctorProfileOut, DoctorProfileUpdate
from app.schemas.appointment import AppointmentOut
from app.schemas.patient import PatientProfileOut
from app.schemas.medical_record import MedicalRecordOut
from app.auth.permissions import require_doctor
from app.services import doctor_service, appointment_service, medical_record_service

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[DoctorPublicOut])
def search_doctors(
    q: str | None = Query(default=None),
    specialization: str | None = Query(default=None),
    min_experience: int | None = Query(default=None),
    available_day: int | None = Query(default=None),
    sort_by: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return doctor_service.search_doctors(
        db,
        query=q,
        specialization=specialization,
        min_experience=min_experience,
        available_day=available_day,
        sort_by=sort_by,
    )



@router.get("/me", response_model=DoctorProfileOut)
def read_my_profile(current_user: User = Depends(require_doctor)):
    return doctor_service.get_own_profile(current_user)


@router.put("/me", response_model=DoctorProfileOut)
def update_my_profile(
    payload: DoctorProfileUpdate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return doctor_service.update_own_profile(db, current_user, payload)


@router.post("/me/photo", response_model=dict)
async def upload_my_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    from app.utils.file_upload import save_profile_photo
    from app.models.doctor import Doctor

    photo_url = await save_profile_photo(file, prefix=f"doctor_{current_user.id}")
    profile = current_user.doctor_profile
    if profile is None:
        profile = Doctor(id=current_user.id)
        db.add(profile)
        db.flush()

    profile.photo_url = photo_url
    db.commit()
    return {"photo_url": photo_url}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_doctor_account(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    from app.services import auth_service
    auth_service.delete_user_account(db, current_user.id)
    return None


@router.get("/me/stats", response_model=dict)
def doctor_stats(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    from datetime import date
    from app.models.appointment import Appointment, AppointmentStatus
    from app.models.prescription_file import PatientPrescriptionFile
    today = date.today()
    today_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.appointment_date == today,
        Appointment.status != AppointmentStatus.CANCELLED,
    ).count()
    upcoming_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.appointment_date > today,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]),
    ).count()
    completed_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == AppointmentStatus.COMPLETED,
    ).count()
    pending_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == AppointmentStatus.BOOKED,
    ).count()
    distinct_patients = db.query(Appointment.patient_id).filter(
        Appointment.doctor_id == current_user.id,
    ).distinct().count()
    prescriptions_count = db.query(PatientPrescriptionFile).filter(
        PatientPrescriptionFile.doctor_id == current_user.id,
    ).count()

    return {
        "today_count": today_count,
        "upcoming_count": upcoming_count,
        "completed_count": completed_count,
        "pending_count": pending_count,
        "total_patients": distinct_patients,
        "total_prescriptions": prescriptions_count,
    }


@router.get("/me/appointments", response_model=list[AppointmentOut])
def my_appointments(
    scope: str | None = Query(default=None),
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return appointment_service.list_for_doctor(db, current_user.id, scope)


@router.get("/me/patients/{patient_id}", response_model=PatientProfileOut)
def patient_details(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return doctor_service.get_patient_for_doctor(db, current_user.id, patient_id)


@router.get("/me/patients/{patient_id}/appointments", response_model=list[AppointmentOut])
def patient_appointment_history(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return appointment_service.list_history_for_doctor_patient(db, current_user.id, patient_id)


@router.get("/me/patients/{patient_id}/medical-history", response_model=list[MedicalRecordOut])
def patient_medical_history(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return medical_record_service.get_patient_medical_history_for_doctor(
        db, current_user.id, patient_id
    )


@router.get("/{doctor_id}", response_model=DoctorPublicOut)
def read_public_profile(doctor_id: uuid.UUID, db: Session = Depends(get_db)):
    return doctor_service.get_public_profile(db, doctor_id)
