"""
In-app notifications shared by both roles — a patient and a doctor each
only ever see their own (scoped by the authenticated user's id, not a
role check), matching frontend/src/services/notificationService.js which
uses the same two calls for both dashboards.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.auth.dependencies import get_current_user
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationOut])
def my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_service.get_user_notifications(db, current_user.id)


@router.patch("/mark-all-read", response_model=dict)
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = notification_service.mark_all_read(db, current_user.id)
    return {"marked_read": count}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return notification_service.mark_notification_read(db, notification)
