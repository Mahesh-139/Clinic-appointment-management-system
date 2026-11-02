"""
PatientPrescriptionFile — file-based prescriptions (photo/PDF) attached directly
to a patient by a doctor. Separate from the appointment-linked Prescription model
which stores medicine line items.
"""

import uuid
from datetime import date

from sqlalchemy import ForeignKey, String, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class PatientPrescriptionFile(Base):
    __tablename__ = "patient_prescription_files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship(foreign_keys=[patient_id])
    doctor: Mapped["Doctor"] = relationship(foreign_keys=[doctor_id])
