"""
Prescriptions, mirroring medical_records.py: patients read their own,
doctors read what they've issued and create new ones against their own
appointments.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut
from app.auth.permissions import require_patient, require_doctor
from app.services import prescription_service

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.get("/me", response_model=list[PrescriptionOut])
def my_prescriptions(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    return prescription_service.get_patient_prescriptions(db, current_user.id)


@router.get("/issued-by-me", response_model=list[PrescriptionOut])
def prescriptions_i_issued(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    return prescription_service.get_doctor_issued_prescriptions(db, current_user.id)


@router.post("/appointments/{appointment_id}", response_model=PrescriptionOut, status_code=201)
def create_prescription(
    appointment_id: uuid.UUID,
    payload: PrescriptionCreate,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    prescription = prescription_service.create_prescription(
        db, current_user.id, appointment_id, payload
    )
    return prescription_service.to_out_dict(db, prescription)
