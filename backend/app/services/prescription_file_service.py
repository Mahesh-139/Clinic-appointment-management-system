"""Service layer for file-based patient prescriptions."""

import uuid
from sqlalchemy.orm import Session

from app.models.prescription_file import PatientPrescriptionFile
from app.models.patient import Patient
from app.models.user import User
from app.schemas.prescription_file import PrescriptionFileOut


def _to_out(rx: PatientPrescriptionFile) -> PrescriptionFileOut:
    """Convert ORM row to output schema, resolving display names."""
    patient_name: str | None = None
    doctor_name: str | None = None

    if rx.patient and rx.patient.user:
        patient_name = rx.patient.user.full_name
    if rx.doctor and rx.doctor.user:
        doctor_name = rx.doctor.user.full_name

    return PrescriptionFileOut(
        id=rx.id,
        patient_id=rx.patient_id,
        doctor_id=rx.doctor_id,
        file_url=rx.file_url,
        original_filename=rx.original_filename,
        issued_date=rx.issued_date,
        notes=rx.notes,
        patient_name=patient_name,
        doctor_name=doctor_name,
    )


def upload_prescription(
    db: Session,
    *,
    doctor_id: uuid.UUID,
    patient_id: uuid.UUID,
    file_url: str,
    original_filename: str,
    notes: str | None = None,
) -> PrescriptionFileOut:
    """Create a new prescription file record in the database."""
    rx = PatientPrescriptionFile(
        doctor_id=doctor_id,
        patient_id=patient_id,
        file_url=file_url,
        original_filename=original_filename,
        notes=notes,
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)
    # Reload with relationships for display names
    rx = (
        db.query(PatientPrescriptionFile)
        .filter(PatientPrescriptionFile.id == rx.id)
        .first()
    )
    return _to_out(rx)


def get_patient_prescriptions(db: Session, patient_id: uuid.UUID) -> list[PrescriptionFileOut]:
    """Return all prescription files uploaded for a specific patient."""
    rows = (
        db.query(PatientPrescriptionFile)
        .filter(PatientPrescriptionFile.patient_id == patient_id)
        .order_by(PatientPrescriptionFile.issued_date.desc())
        .all()
    )
    return [_to_out(r) for r in rows]


def get_doctor_issued(db: Session, doctor_id: uuid.UUID) -> list[PrescriptionFileOut]:
    """Return all prescription files issued by a specific doctor."""
    rows = (
        db.query(PatientPrescriptionFile)
        .filter(PatientPrescriptionFile.doctor_id == doctor_id)
        .order_by(PatientPrescriptionFile.issued_date.desc())
        .all()
    )
    return [_to_out(r) for r in rows]


def search_patients(db: Session, query: str) -> list[dict]:
    """
    Search registered patients by name or email.
    Returns minimal dicts for the doctor's patient-picker UI.
    """
    q = query.strip().lower()
    patients = (
        db.query(Patient)
        .join(User, User.id == Patient.id)
        .filter(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )
        .limit(20)
        .all()
    )
    return [
        {
            "id": str(p.id),
            "full_name": p.user.full_name if p.user else "",
            "email": p.user.email if p.user else "",
            "photo_url": p.photo_url,
        }
        for p in patients
    ]
