import uuid
from datetime import datetime

from pydantic import BaseModel, computed_field

from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    related_appointment_id: uuid.UUID | None = None
    created_at: datetime

    @computed_field
    @property
    def isRead(self) -> bool:
        return self.is_read

    @computed_field
    @property
    def createdAt(self) -> str:
        return self.created_at.strftime("%Y-%m-%d %H:%M")

    model_config = {"from_attributes": True}
