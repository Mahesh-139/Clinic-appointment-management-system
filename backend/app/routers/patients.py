"""
Self-service endpoints for a logged-in patient's own profile. There is no
"list all patients" endpoint here — that would be an admin capability this
system deliberately doesn't have.
"""

from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientProfileOut, PatientProfileUpdate
from app.auth.permissions import require_patient
from app.services import auth_service
from app.utils.file_upload import save_profile_photo

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me", response_model=PatientProfileOut)
def read_my_profile(current_user: User = Depends(require_patient)):
    profile = current_user.patient_profile
    return PatientProfileOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        date_of_birth=profile.date_of_birth if profile else None,
        gender=profile.gender if profile else None,
        address=profile.address if profile else None,
        photo_url=profile.photo_url if profile else None,
    )


@router.put("/me", response_model=PatientProfileOut)
def update_my_profile(
    payload: PatientProfileUpdate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone

    profile = current_user.patient_profile
    if profile is None:
        profile = Patient(id=current_user.id)
        db.add(profile)
        db.flush()

    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.address is not None:
        profile.address = payload.address
    if payload.photo_url is not None:
        profile.photo_url = payload.photo_url

    db.commit()
    db.refresh(current_user)
    db.refresh(profile)

    return PatientProfileOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        address=profile.address,
        photo_url=profile.photo_url,
    )


@router.get("/me/stats", response_model=dict)
def patient_stats(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    from datetime import date
    from app.models.appointment import Appointment, AppointmentStatus
    from app.models.medical_record import MedicalRecord
    from app.models.prescription_file import PatientPrescriptionFile
    from app.models.notification import Notification

    today = date.today()
    upcoming_count = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.appointment_date >= today,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]),
    ).count()
    history_count = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        (Appointment.appointment_date < today)
        | (Appointment.status.in_([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED])),
    ).count()
    prescriptions_count = db.query(PatientPrescriptionFile).filter(
        PatientPrescriptionFile.patient_id == current_user.id,
    ).count()
    medical_records_count = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == current_user.id,
    ).count()
    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).count()

    return {
        "upcoming_count": upcoming_count,
        "history_count": history_count,
        "prescriptions_count": prescriptions_count,
        "medical_records_count": medical_records_count,
        "unread_notifications_count": unread_notifications,
    }


@router.post("/me/photo", response_model=dict)
async def upload_my_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    photo_url = await save_profile_photo(file, prefix=f"patient_{current_user.id}")
    profile = current_user.patient_profile
    if profile is None:
        profile = Patient(id=current_user.id)
        db.add(profile)
        db.flush()

    profile.photo_url = photo_url
    db.commit()
    return {"photo_url": photo_url}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_patient_account(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    auth_service.delete_user_account(db, current_user.id)
    return None
