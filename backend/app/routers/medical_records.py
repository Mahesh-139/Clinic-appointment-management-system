"""
Consultation records. Patients can only ever read their own; doctors can
read what they've written, update records, and create new records against
their own appointments (enforced in app/services/medical_record_service.py).
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordOut
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_patient, require_doctor
from app.services import medical_record_service

router = APIRouter(prefix="/medical-records", tags=["medical-records"])


@router.get("/me", response_model=list[MedicalRecordOut])
def my_medical_records(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    return medical_record_service.get_patient_medical_records(db, current_user.id)


@router.get("/issued-by-me", response_model=list[MedicalRecordOut])
def records_i_issued(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return medical_record_service.get_doctor_issued_records(db, current_user.id)


@router.get("/appointment/{appointment_id}", response_model=MedicalRecordOut | None)
def record_for_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return medical_record_service.get_record_by_appointment(db, appointment_id, current_user.id)


@router.post("/appointments/{appointment_id}", response_model=MedicalRecordOut, status_code=201)
def create_medical_record(
    appointment_id: uuid.UUID,
    payload: MedicalRecordCreate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    record = medical_record_service.create_medical_record(
        db, current_user.id, appointment_id, payload
    )
    return medical_record_service.to_out_dict(db, record)


@router.put("/{record_id}", response_model=MedicalRecordOut)
def update_medical_record(
    record_id: uuid.UUID,
    payload: MedicalRecordUpdate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    record = medical_record_service.update_medical_record(
        db, current_user.id, record_id, payload
    )
    return medical_record_service.to_out_dict(db, record)
