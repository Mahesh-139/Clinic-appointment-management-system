"""
Creates and reads medical records. A record can only be created by the
doctor who owns the appointment it's attached to, and a patient can only
ever read their own records — both checks happen here so routers stay
thin and every entry point gets the same guarantee.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.appointment import Appointment, AppointmentStatus
from app.models.medical_record import MedicalRecord
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate
from app.services import notification_service


def _get_owned_appointment(db: Session, appointment_id: uuid.UUID, doctor_id: uuid.UUID) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.doctor_id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found."
        )
    return appointment


def create_medical_record(
    db: Session, doctor_id: uuid.UUID, appointment_id: uuid.UUID, payload: MedicalRecordCreate
) -> MedicalRecord:
    appointment = _get_owned_appointment(db, appointment_id, doctor_id)

    existing = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appointment_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A medical record already exists for this appointment.",
        )

    record = MedicalRecord(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        consultation_date=appointment.appointment_date,
        symptoms=payload.symptoms,
        diagnosis=payload.diagnosis,
        treatment=payload.treatment,
        notes=payload.notes,
        follow_up_date=payload.follow_up_date,
    )
    db.add(record)
    # Transition appointment to COMPLETED
    appointment.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(record)

    notification_service.notify_consultation_completed(db, appointment)
    return record


def update_medical_record(
    db: Session, doctor_id: uuid.UUID, record_id: uuid.UUID, payload: MedicalRecordUpdate
) -> MedicalRecord:
    record = db.get(MedicalRecord, record_id)
    if record is None or record.doctor_id != doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found.")

    if payload.symptoms is not None:
        record.symptoms = payload.symptoms
    if payload.diagnosis is not None:
        record.diagnosis = payload.diagnosis
    if payload.treatment is not None:
        record.treatment = payload.treatment
    if payload.notes is not None:
        record.notes = payload.notes
    if payload.follow_up_date is not None:
        record.follow_up_date = payload.follow_up_date

    db.commit()
    db.refresh(record)
    return record


def to_out_dict(db: Session, record: MedicalRecord) -> dict:
    return _to_dict(db, record)


def _with_names(db: Session, records: list[MedicalRecord]) -> list[dict]:
    """Attach the counterpart's display name — patients see the doctor's
    name, doctors see the patient's name — without changing the ORM model."""
    return [_to_dict(db, record) for record in records]


def _to_dict(db: Session, record: MedicalRecord) -> dict:
    patient_user = db.get(User, record.patient_id)
    doctor_user = db.get(User, record.doctor_id)
    return {
        "id": record.id,
        "appointment_id": record.appointment_id,
        "patient_id": record.patient_id,
        "doctor_id": record.doctor_id,
        "patient_name": patient_user.full_name if patient_user else None,
        "doctor_name": doctor_user.full_name if doctor_user else None,
        "consultation_date": record.consultation_date,
        "symptoms": record.symptoms,
        "diagnosis": record.diagnosis,
        "treatment": record.treatment,
        "notes": record.notes,
        "follow_up_date": record.follow_up_date,
        "created_at": record.created_at,
    }


def get_patient_medical_records(db: Session, patient_id: uuid.UUID) -> list[dict]:
    records = list(
        db.execute(
            select(MedicalRecord)
            .where(MedicalRecord.patient_id == patient_id)
            .order_by(MedicalRecord.consultation_date.desc())
        ).scalars()
    )
    return _with_names(db, records)


def get_doctor_issued_records(db: Session, doctor_id: uuid.UUID) -> list[dict]:
    records = list(
        db.execute(
            select(MedicalRecord)
            .where(MedicalRecord.doctor_id == doctor_id)
            .order_by(MedicalRecord.consultation_date.desc())
        ).scalars()
    )
    return _with_names(db, records)


def get_patient_medical_history_for_doctor(
    db: Session, doctor_id: uuid.UUID, patient_id: uuid.UUID
) -> list[dict]:
    """A doctor may see records for patients they have had appointments with."""
    records = list(
        db.execute(
            select(MedicalRecord)
            .where(MedicalRecord.patient_id == patient_id, MedicalRecord.doctor_id == doctor_id)
            .order_by(MedicalRecord.consultation_date.desc())
        ).scalars()
    )
    return _with_names(db, records)


def get_record_by_appointment(db: Session, appointment_id: uuid.UUID, user_id: uuid.UUID) -> dict | None:
    record = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appointment_id).first()
    if not record:
        return None
    if record.patient_id != user_id and record.doctor_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return _to_dict(db, record)
