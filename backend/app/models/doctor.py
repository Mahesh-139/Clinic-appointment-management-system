"""
Doctor-specific profile data. Same one-to-one pattern as Patient — the
doctor's id IS their user id.

Kept intentionally simple: basic professional qualifications only, per the
project spec (no detailed academic history).
"""

import uuid

from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    specialization: Mapped[str | None] = mapped_column(String(150), nullable=True)
    qualification: Mapped[str | None] = mapped_column(String(150), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    consultation_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user: Mapped["User"] = relationship(back_populates="doctor_profile")
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    weekly_availability: Mapped[list["DoctorAvailability"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    unavailable_dates: Mapped[list["DoctorUnavailableDate"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
