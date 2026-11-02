"""
Doctor availability configuration + the computed slots response patients
see. WeeklyAvailabilityDay mirrors one row of doctor_availability; the
frontend's AvailabilityManagement page submits one entry per selected
working day.
"""

import uuid
from datetime import date, time

from pydantic import BaseModel, Field


class WeeklyAvailabilityDay(BaseModel):
    day_of_week: int = Field(ge=0, le=6)  # 0 = Monday ... 6 = Sunday
    start_time: time
    end_time: time
    break_start: time | None = None
    break_end: time | None = None
    slot_duration_minutes: int = Field(default=30, gt=0, le=240)


class AvailabilityUpdate(BaseModel):
    working_days: list[WeeklyAvailabilityDay]
    unavailable_dates: list[date] = []


class AvailabilityOut(BaseModel):
    doctor_id: uuid.UUID
    working_days: list[WeeklyAvailabilityDay]
    unavailable_dates: list[date]


class SlotDetail(BaseModel):
    time: str
    available: bool


class AvailableSlotsResponse(BaseModel):
    doctor_id: uuid.UUID
    date: date
    slots: list[time]
    all_slots: list[SlotDetail] = []
