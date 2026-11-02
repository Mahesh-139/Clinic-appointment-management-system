import uuid
from datetime import date

from pydantic import BaseModel, EmailStr


class PatientProfileOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    photo_url: str | None = None

    model_config = {"from_attributes": True}


class PatientProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    photo_url: str | None = None
