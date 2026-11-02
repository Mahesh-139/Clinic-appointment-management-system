"""
Auth request/response contracts. Registration is patient-only — doctor
accounts are provisioned another way (see project scope notes), so there
is no DoctorRegisterRequest here.
"""

import uuid

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = None


# Alias for explicit clarity
PatientRegisterRequest = RegisterRequest


class DoctorRegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = None
    specialization: str | None = Field(default=None, max_length=150)
    qualification: str | None = Field(default=None, max_length=150)
    experience_years: int | None = Field(default=None, ge=0)
    consultation_info: str | None = Field(default=None, max_length=255)
    photo_url: str | None = Field(default=None, max_length=500)
    admin_email: EmailStr
    admin_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str



class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    phone: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
