"""Pydantic schemas for file-based prescriptions (PatientPrescriptionFile)."""

import uuid
from datetime import date

from pydantic import BaseModel


class PrescriptionFileOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    file_url: str
    original_filename: str
    issued_date: date
    notes: str | None = None
    # Convenience display fields resolved from relationships
    patient_name: str | None = None
    doctor_name: str | None = None

    model_config = {"from_attributes": True}


class PrescriptionFileCreate(BaseModel):
    notes: str | None = None
