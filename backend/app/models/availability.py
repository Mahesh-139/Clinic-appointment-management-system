"""
Two tables model availability:

- doctor_availability: the recurring weekly template (which days, working
  hours, break window, and slot length). One row per working day.
- doctor_unavailable_dates: one-off exceptions (leave, holidays) that
  override the weekly template for a specific date.

Actual bookable slots are computed at request time by
app/services/availability_service.py from these two tables plus existing
appointments — they are never stored as their own rows.
"""

import uuid
from datetime import time, date

from sqlalchemy import ForeignKey, Integer, Time, Date, CheckConstraint, UniqueConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"
    __table_args__ = (
        # One working-hours configuration per doctor per weekday.
        UniqueConstraint("doctor_id", "day_of_week", name="uq_doctor_availability_day"),
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="ck_valid_day_of_week"),
        CheckConstraint("start_time < end_time", name="ck_working_hours_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )

    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0 = Monday ... 6 = Sunday
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    break_start: Mapped[time | None] = mapped_column(Time, nullable=True)
    break_end: Mapped[time | None] = mapped_column(Time, nullable=True)
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    doctor: Mapped["Doctor"] = relationship(back_populates="weekly_availability")


class DoctorUnavailableDate(Base):
    __tablename__ = "doctor_unavailable_dates"
    __table_args__ = (
        UniqueConstraint("doctor_id", "date", name="uq_doctor_unavailable_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    doctor: Mapped["Doctor"] = relationship(back_populates="unavailable_dates")
