"""
Appointment request/response contracts.

Note: slot validity (working hours, breaks, existing bookings) is never
trusted from the client — AppointmentCreate/AppointmentRescheduleRequest
carry only the doctor's chosen date + slot, and
app/services/appointment_service.py re-validates against the database
before writing anything.
"""

import uuid
from datetime import date, time, datetime

from pydantic import BaseModel, Field, ConfigDict

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: uuid.UUID = Field(validation_alias="doctorId", default=None)
    date: date
    slot: time  # start time of the chosen slot; end_time is derived server-side
    reason_for_visit: str | None = Field(validation_alias="reasonForVisit", default=None)

    model_config = ConfigDict(populate_by_name=True)

    def __init__(self, **data):
        if "doctor_id" in data and "doctorId" not in data:
            data["doctorId"] = data["doctor_id"]
        if "reason_for_visit" in data and "reasonForVisit" not in data:
            data["reasonForVisit"] = data["reason_for_visit"]
        super().__init__(**data)


class AppointmentRescheduleRequest(BaseModel):
    date: date
    slot: time


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    # Resolved server-side to "the other party's name" so both the patient
    # and doctor views can reuse the same shape and the same AppointmentCard.
    counterpart_name: str
    date: date
    time: time
    status: AppointmentStatus
    reason_for_visit: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
