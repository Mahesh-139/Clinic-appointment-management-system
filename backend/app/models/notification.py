"""
In-app notifications only for the skeleton phase (no SMS/email yet — see
app/services/notification_service.py for where that would plug in later).
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Boolean, DateTime, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class NotificationType(str, enum.Enum):
    APPOINTMENT_CONFIRMATION = "appointment_confirmation"
    APPOINTMENT_CANCELLATION = "appointment_cancellation"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_REMINDER = "appointment_reminder"
    FOLLOW_UP_REMINDER = "follow_up_reminder"
    CONSULTATION_COMPLETED = "consultation_completed"
    PRESCRIPTION_ADDED = "prescription_added"
    APPOINTMENT_STATUS_UPDATE = "appointment_status_update"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Nullable: not every notification type is necessarily tied to one
    # appointment (kept flexible for future notification types).
    related_appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True
    )

    type: Mapped[NotificationType] = mapped_column(
        SAEnum(NotificationType, name="notification_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="notifications")
