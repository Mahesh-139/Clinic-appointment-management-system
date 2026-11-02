"""Aggregates every router so app/main.py can import one object per feature area."""

from app.routers.auth import router as auth_router
from app.routers.patients import router as patients_router
from app.routers.doctors import router as doctors_router
from app.routers.appointments import router as appointments_router
from app.routers.availability import router as availability_router
from app.routers.medical_records import router as medical_records_router
from app.routers.prescriptions import router as prescriptions_router
from app.routers.notifications import router as notifications_router
from app.routers.prescription_files import router as prescription_files_router

__all__ = [
    "auth_router",
    "patients_router",
    "doctors_router",
    "appointments_router",
    "availability_router",
    "medical_records_router",
    "prescriptions_router",
    "notifications_router",
    "prescription_files_router",
]

