import uuid

from pydantic import BaseModel, EmailStr


class DoctorPublicOut(BaseModel):
    """What patients see when browsing/searching doctors."""

    id: uuid.UUID
    full_name: str
    specialization: str | None = None
    qualification: str | None = None
    experience_years: int | None = None
    consultation_info: str | None = None
    photo_url: str | None = None

    model_config = {"from_attributes": True}


class DoctorProfileOut(DoctorPublicOut):
    """What a doctor sees/edits for their own profile — includes contact info."""

    email: EmailStr
    phone: str | None = None


class DoctorProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    specialization: str | None = None
    qualification: str | None = None
    experience_years: int | None = None
    consultation_info: str | None = None
    photo_url: str | None = None
