"""
Creates and reads in-app notifications.

Only in-app notifications exist in this skeleton phase (see project scope:
no SMS/email yet). Keeping every "create a notification for X" call behind
this module's functions — rather than constructing Notification rows
inline in appointment_service — is what makes it possible to later add a
second delivery channel (email, SMS) without touching the appointment
logic at all: swap what happens inside these functions.
"""

import uuid

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.notification import Notification, NotificationType
from app.models.appointment import Appointment


def _create(
    db: Session,
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    related_appointment_id: uuid.UUID | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_appointment_id=related_appointment_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notify_appointment_confirmation(db: Session, appointment: Appointment) -> None:
    _create(
        db,
        user_id=appointment.patient_id,
        notification_type=NotificationType.APPOINTMENT_CONFIRMATION,
        title="Appointment booked",
        message=f"Your appointment on {appointment.appointment_date} at {appointment.start_time} is confirmed.",
        related_appointment_id=appointment.id,
    )
    _create(
        db,
        user_id=appointment.doctor_id,
        notification_type=NotificationType.APPOINTMENT_CONFIRMATION,
        title="New appointment booked",
        message=f"A patient booked an appointment on {appointment.appointment_date} at {appointment.start_time}.",
        related_appointment_id=appointment.id,
    )


def notify_appointment_cancellation(db: Session, appointment: Appointment) -> None:
    for recipient_id in (appointment.patient_id, appointment.doctor_id):
        _create(
            db,
            user_id=recipient_id,
            notification_type=NotificationType.APPOINTMENT_CANCELLATION,
            title="Appointment cancelled",
            message=f"The appointment on {appointment.appointment_date} at {appointment.start_time} was cancelled.",
            related_appointment_id=appointment.id,
        )


def notify_appointment_rescheduled(db: Session, appointment: Appointment) -> None:
    for recipient_id in (appointment.patient_id, appointment.doctor_id):
        _create(
            db,
            user_id=recipient_id,
            notification_type=NotificationType.APPOINTMENT_RESCHEDULED,
            title="Appointment rescheduled",
            message=f"The appointment was moved to {appointment.appointment_date} at {appointment.start_time}.",
            related_appointment_id=appointment.id,
        )


def notify_follow_up_reminder(db: Session, appointment: Appointment) -> None:
    # Hook for a future scheduled job (Phase 10+) — not triggered anywhere
    # yet, but the notification type and shape already exist.
    _create(
        db,
        user_id=appointment.patient_id,
        notification_type=NotificationType.FOLLOW_UP_REMINDER,
        title="Follow-up reminder",
        message="You have a follow-up due. Please book a visit with your doctor.",
        related_appointment_id=appointment.id,
    )


def notify_appointment_reminder(db: Session, appointment: Appointment) -> None:
    # Same as above — reserved for a future scheduled job (e.g. "24 hours
    # before the appointment") rather than triggered inline by a request.
    _create(
        db,
        user_id=appointment.patient_id,
        notification_type=NotificationType.APPOINTMENT_REMINDER,
        title="Upcoming appointment",
        message=f"Reminder: you have an appointment on {appointment.appointment_date} at {appointment.start_time}.",
        related_appointment_id=appointment.id,
    )


def notify_consultation_completed(db: Session, appointment: Appointment) -> None:
    _create(
        db,
        user_id=appointment.patient_id,
        notification_type=NotificationType.CONSULTATION_COMPLETED,
        title="Consultation completed",
        message=f"Your consultation notes for the visit on {appointment.appointment_date} are now available in your medical records.",
        related_appointment_id=appointment.id,
    )


def notify_prescription_added(db: Session, patient_id: uuid.UUID, doctor_name: str, filename: str) -> None:
    _create(
        db,
        user_id=patient_id,
        notification_type=NotificationType.PRESCRIPTION_ADDED,
        title="New prescription available",
        message=f"Dr. {doctor_name} has attached a new prescription: {filename}.",
    )


def notify_appointment_status_update(db: Session, appointment: Appointment, new_status: str) -> None:
    for recipient_id in (appointment.patient_id, appointment.doctor_id):
        _create(
            db,
            user_id=recipient_id,
            notification_type=NotificationType.APPOINTMENT_STATUS_UPDATE,
            title="Appointment status updated",
            message=f"The appointment on {appointment.appointment_date} at {appointment.start_time} is now {new_status}.",
            related_appointment_id=appointment.id,
        )


def get_user_notifications(db: Session, user_id: uuid.UUID) -> list[Notification]:
    return list(
        db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        ).scalars()
    )


def mark_notification_read(db: Session, notification: Notification) -> Notification:
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: uuid.UUID) -> int:
    notifications = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read.is_(False)).all()
    for n in notifications:
        n.is_read = True
    db.commit()
    return len(notifications)
