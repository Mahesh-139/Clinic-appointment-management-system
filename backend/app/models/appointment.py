"""
Appointments are the central entity in this system.

Status lifecycle (see UserRole-style enum below):
  BOOKED -> CONFIRMED -> IN_CONSULTATION -> COMPLETED
  CANCELLED is a separate terminal state, reachable from BOOKED or
  CONFIRMED (enforced in app/services/appointment_service.py, not here —
  the DB layer only enforces structural constraints, not the full
  transition graph).

IMPORTANT — double-booking prevention:
A partial unique index on (doctor_id, appointment_date, start_time) that
only applies to non-cancelled rows means the database itself rejects a
second active appointment in the same slot, even if two requests race
each other. This is the actual enforcement point described in the
project's architecture requirements — the service layer also checks
availability before insert, but this index is the backstop.
"""

import enum
import uuid
from datetime import date, time, datetime

from sqlalchemy import ForeignKey, Date, Time, String, DateTime, func, Enum as SAEnum, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class AppointmentStatus(str, enum.Enum):
    BOOKED = "booked"
    CONFIRMED = "confirmed"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # The double-booking backstop: only one active (non-cancelled)
        # appointment can occupy a given doctor+date+start_time.
        Index(
            "uq_active_appointment_slot",
            "doctor_id",
            "appointment_date",
            "start_time",
            unique=True,
            # Kept in sync with AppointmentStatus.CANCELLED.value — a
            # cancelled appointment frees the slot for rebooking.
            postgresql_where=text("status != 'cancelled'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )

    appointment_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus, name="appointment_status"),
        default=AppointmentStatus.BOOKED,
        nullable=False,
        index=True,
    )
    reason_for_visit: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    doctor: Mapped["Doctor"] = relationship(back_populates="appointments")
    medical_record: Mapped["MedicalRecord"] = relationship(
        back_populates="appointment", uselist=False, cascade="all, delete-orphan"
    )
    prescription: Mapped["Prescription"] = relationship(
        back_populates="appointment", uselist=False, cascade="all, delete-orphan"
    )
