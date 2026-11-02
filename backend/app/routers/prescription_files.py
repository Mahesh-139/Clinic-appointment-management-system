"""
Router for file-based patient prescriptions.

Endpoints:
  GET  /prescription-files/patients?q=   — doctor searches for patients (by name/email)
  POST /prescription-files/patient/{patient_id}  — doctor uploads prescription file to patient
  GET  /prescription-files/my-files      — patient sees their own prescription files
  GET  /prescription-files/issued-by-me  — doctor sees all files they issued
"""

import uuid

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.permissions import require_doctor, require_patient
from app.models.patient import Patient
from app.schemas.prescription_file import PrescriptionFileOut
from app.services import prescription_file_service
from app.utils.file_upload import save_prescription_file

router = APIRouter(prefix="/prescription-files", tags=["prescription-files"])


@router.get("/patients", response_model=list[dict])
def search_patients_for_prescription(
    q: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(require_doctor),
):
    """Doctor searches for registered patients by name or email."""
    if len(q.strip()) < 2:
        return []
    return prescription_file_service.search_patients(db, q)


@router.post("/patient/{patient_id}", response_model=PrescriptionFileOut, status_code=status.HTTP_201_CREATED)
async def upload_prescription_to_patient(
    patient_id: uuid.UUID,
    file: UploadFile = File(...),
    notes: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_doctor),
):
    """Doctor uploads a prescription file (PDF/image) directly to a patient."""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    file_url, original_filename = await save_prescription_file(file)

    result = prescription_file_service.upload_prescription(
        db,
        doctor_id=current_user.id,
        patient_id=patient_id,
        file_url=file_url,
        original_filename=original_filename,
        notes=notes,
    )

    from app.services import notification_service
    notification_service.notify_prescription_added(
        db,
        patient_id=patient_id,
        doctor_name=current_user.full_name,
        filename=original_filename,
    )

    return result


@router.get("/my-files", response_model=list[PrescriptionFileOut])
def get_my_prescription_files(
    db: Session = Depends(get_db),
    current_user=Depends(require_patient),
):
    """Patient retrieves all prescription files issued to them."""
    return prescription_file_service.get_patient_prescriptions(db, current_user.id)


@router.get("/issued-by-me", response_model=list[PrescriptionFileOut])
def get_issued_by_me(
    db: Session = Depends(get_db),
    current_user=Depends(require_doctor),
):
    """Doctor retrieves all prescription files they have issued."""
    return prescription_file_service.get_doctor_issued(db, current_user.id)
