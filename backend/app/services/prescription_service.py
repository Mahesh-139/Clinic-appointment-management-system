"""
Mirrors medical_record_service's shape: a prescription can only be
created by the doctor who owns the appointment, one per appointment, and
reads are scoped to "my own" (patient) or "issued by me" (doctor).
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.appointment import Appointment
from app.models.prescription import Prescription, PrescriptionItem
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate


def _get_owned_appointment(db: Session, appointment_id: uuid.UUID, doctor_id: uuid.UUID) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.doctor_id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found."
        )
    return appointment


def create_prescription(
    db: Session, doctor_id: uuid.UUID, appointment_id: uuid.UUID, payload: PrescriptionCreate
) -> Prescription:
    appointment = _get_owned_appointment(db, appointment_id, doctor_id)

    existing = db.query(Prescription).filter(Prescription.appointment_id == appointment_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A prescription already exists for this appointment.",
        )

    prescription = Prescription(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
    )
    prescription.medicines = [
        PrescriptionItem(
            medicine_name=med.name,
            dosage=med.dosage,
            frequency=med.frequency,
            duration=med.duration,
            instructions=med.instructions,
        )
        for med in payload.medicines
    ]
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def _with_names(db: Session, prescriptions: list[Prescription]) -> list[dict]:
    return [_to_dict(db, rx) for rx in prescriptions]


def _to_dict(db: Session, rx: Prescription) -> dict:
    patient_user = db.get(User, rx.patient_id)
    doctor_user = db.get(User, rx.doctor_id)
    return {
        "id": rx.id,
        "appointment_id": rx.appointment_id,
        "patient_id": rx.patient_id,
        "doctor_id": rx.doctor_id,
        "patient_name": patient_user.full_name if patient_user else None,
        "doctor_name": doctor_user.full_name if doctor_user else None,
        "issued_date": rx.issued_date,
        "medicines": [
            {
                "name": item.medicine_name,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration": item.duration,
                "instructions": item.instructions,
            }
            for item in rx.medicines
        ],
    }


def to_out_dict(db: Session, rx: Prescription) -> dict:
    return _to_dict(db, rx)


def get_patient_prescriptions(db: Session, patient_id: uuid.UUID) -> list[dict]:
    prescriptions = list(
        db.execute(
            select(Prescription)
            .where(Prescription.patient_id == patient_id)
            .order_by(Prescription.issued_date.desc())
        ).scalars()
    )
    return _with_names(db, prescriptions)


def get_doctor_issued_prescriptions(db: Session, doctor_id: uuid.UUID) -> list[dict]:
    prescriptions = list(
        db.execute(
            select(Prescription)
            .where(Prescription.doctor_id == doctor_id)
            .order_by(Prescription.issued_date.desc())
        ).scalars()
    )
    return _with_names(db, prescriptions)
