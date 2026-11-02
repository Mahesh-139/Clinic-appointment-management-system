import uuid
from datetime import date

from pydantic import BaseModel, Field


class MedicineItem(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None
    instructions: str | None = None


class PrescriptionCreate(BaseModel):
    medicines: list[MedicineItem] = Field(min_length=1)


class PrescriptionOut(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    patient_name: str | None = None
    doctor_name: str | None = None
    issued_date: date
    medicines: list[MedicineItem]

    model_config = {"from_attributes": True}
