import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, AliasChoices, computed_field, field_validator


class MedicalRecordCreate(BaseModel):
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    notes: str | None = None
    follow_up_date: date | None = Field(default=None, validation_alias=AliasChoices("follow_up_date", "followUpDate"))

    @field_validator("follow_up_date", mode="before")
    @classmethod
    def parse_empty_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    model_config = ConfigDict(populate_by_name=True)


class MedicalRecordUpdate(BaseModel):
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    notes: str | None = None
    follow_up_date: date | None = Field(default=None, validation_alias=AliasChoices("follow_up_date", "followUpDate"))

    @field_validator("follow_up_date", mode="before")
    @classmethod
    def parse_empty_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    model_config = ConfigDict(populate_by_name=True)


class MedicalRecordOut(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    patient_name: str | None = None
    doctor_name: str | None = None
    consultation_date: date
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    notes: str | None = None
    follow_up_date: date | None = None
    created_at: datetime

    @computed_field
    @property
    def patientName(self) -> str | None:
        return self.patient_name

    @computed_field
    @property
    def doctorName(self) -> str | None:
        return self.doctor_name

    @computed_field
    @property
    def consultationDate(self) -> str:
        return self.consultation_date.isoformat()

    @computed_field
    @property
    def followUpDate(self) -> str | None:
        return self.follow_up_date.isoformat() if self.follow_up_date else None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
