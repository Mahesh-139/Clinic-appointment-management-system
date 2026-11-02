"""
The `users` table holds authentication data common to both roles.
Patient- and doctor-specific fields live in their own tables (patients,
doctors), linked back here by a shared primary key (one-to-one).

Splitting it this way keeps auth concerns (email, password, role) separate
from profile concerns, and makes it easy to add a role later without
touching the auth table.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class UserRole(str, enum.Enum):
    # Intentionally only two roles. See project architecture notes —
    # no admin/staff/receptionist role exists in this system.
    PATIENT = "patient"
    DOCTOR = "doctor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # One-to-one links — exactly one of these will be populated depending on `role`.
    patient_profile: Mapped["Patient"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    doctor_profile: Mapped["Doctor"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
