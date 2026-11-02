"""
Import every model here so that:
1. `Base.metadata` knows about all tables (needed for create_all / Alembic
   autogenerate), and
2. string-based relationship() references between models resolve correctly
   regardless of import order elsewhere in the app.
"""

from app.database.base import Base  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.availability import DoctorAvailability, DoctorUnavailableDate  # noqa: F401
from app.models.appointment import Appointment, AppointmentStatus  # noqa: F401
from app.models.medical_record import MedicalRecord  # noqa: F401
from app.models.prescription import Prescription, PrescriptionItem  # noqa: F401
from app.models.notification import Notification, NotificationType  # noqa: F401
from app.models.prescription_file import PatientPrescriptionFile  # noqa: F401

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Patient",
    "Doctor",
    "DoctorAvailability",
    "DoctorUnavailableDate",
    "Appointment",
    "AppointmentStatus",
    "MedicalRecord",
    "Prescription",
    "PrescriptionItem",
    "Notification",
    "NotificationType",
    "PatientPrescriptionFile",
]
