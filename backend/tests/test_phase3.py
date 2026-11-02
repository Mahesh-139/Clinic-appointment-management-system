"""
Phase 3 integration tests covering:
- Doctor availability & slot overlap prevention
- Doctor cancellation with counterpart notification
- Medical record creation & appointment completion lifecycle
- Consultation record updates & fetching by appointment
- Notification dispatch and mark all read
- Doctor search with sorting & day-of-week filtering
- Doctor & Patient dashboard stats endpoints
"""
import os
import pytest
from datetime import date, timedelta

# Set env before imports
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_phase3.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough-for-sha256-hmac")
os.environ.setdefault("ENVIRONMENT", "test")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app as fastapi_app
from app.database.database import get_db
from app.database.base import Base
import app.models  # noqa: F401

SQLITE_URL = "sqlite:///./test_phase3.db"
engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    fastapi_app.dependency_overrides.clear()
    engine.dispose()
    try:
        if os.path.exists("test_phase3.db"):
            os.remove("test_phase3.db")
    except Exception:
        pass


@pytest.fixture(scope="session")
def client(setup_db):
    with TestClient(fastapi_app) as c:
        yield c


# Helpers for registration/login
def register_doctor(client, email, name, specialization="Cardiology", experience_years=8):
    resp = client.post("/api/auth/register/doctor", json={
        "email": email,
        "password": "Password123!",
        "full_name": name,
        "phone": "+1234567890",
        "specialization": specialization,
        "qualification": "MD",
        "experience_years": experience_years,
        "consultation_info": "Standard consultation",
        "admin_email": "maheshmbiradar5@gmail.com",
        "admin_password": "Mahesh@13",
    })
    return resp


def register_patient(client, email, name):
    resp = client.post("/api/auth/register/patient", json={
        "email": email,
        "password": "Password123!",
        "full_name": name,
        "phone": "+1987654321",
    })
    return resp


def get_token(client, email, password="Password123!"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


class TestPhase3Functionality:
    doctor1_token = None
    doctor2_token = None
    patient_token = None
    doctor1_id = None
    doctor2_id = None
    patient_id = None

    def test_setup_users(self, client):
        r_doc1 = register_doctor(client, "dr.alice@clinic.com", "Dr. Alice Adams", "Cardiology", experience_years=10)
        assert r_doc1.status_code == 201
        TestPhase3Functionality.doctor1_id = r_doc1.json()["id"]
        TestPhase3Functionality.doctor1_token = get_token(client, "dr.alice@clinic.com")

        r_doc2 = register_doctor(client, "dr.bob@clinic.com", "Dr. Bob Baker", "Neurology", experience_years=4)
        assert r_doc2.status_code == 201
        TestPhase3Functionality.doctor2_id = r_doc2.json()["id"]
        TestPhase3Functionality.doctor2_token = get_token(client, "dr.bob@clinic.com")

        r_pat = register_patient(client, "patient.john@example.com", "John Doe")
        assert r_pat.status_code == 201
        TestPhase3Functionality.patient_id = r_pat.json()["id"]
        TestPhase3Functionality.patient_token = get_token(client, "patient.john@example.com")

    def test_doctor_search_sorting(self, client):
        # Sort by experience desc
        resp = client.get("/api/doctors?sort_by=experience_desc")
        assert resp.status_code == 200
        docs = resp.json()
        assert len(docs) >= 2
        assert docs[0]["full_name"] == "Dr. Alice Adams"  # 10 yrs vs 4 yrs

        # Sort by experience asc
        resp_asc = client.get("/api/doctors?sort_by=experience_asc")
        assert resp_asc.status_code == 200
        docs_asc = resp_asc.json()
        assert docs_asc[0]["full_name"] == "Dr. Bob Baker"

    def test_doctor_availability_and_break_clash(self, client):
        headers = {"Authorization": f"Bearer {TestPhase3Functionality.doctor1_token}"}
        # Set weekly schedule with break
        avail_resp = client.put("/api/availability/me", headers=headers, json={
            "working_days": [
                {
                    "day_of_week": 0,  # Monday
                    "start_time": "09:00:00",
                    "end_time": "12:00:00",
                    "slot_duration_minutes": 30,
                    "break_start": "10:00:00",
                    "break_end": "10:30:00",
                }
            ],
            "unavailable_dates": []
        })
        assert avail_resp.status_code in (200, 204)

        # Query slots for next Monday
        today = date.today()
        # Find next Monday (day 0)
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_monday = today + timedelta(days=days_ahead)

        slots_resp = client.get(
            f"/api/availability/{TestPhase3Functionality.doctor1_id}/slots?date={next_monday.isoformat()}"
        )
        assert slots_resp.status_code == 200
        slots_data = slots_resp.json()
        active_slots = [str(s) for s in slots_data["slots"]]
        # Break is 10:00 - 10:30, so 10:00:00 should NOT be in the slots
        assert "10:00:00" not in active_slots
        assert "09:00:00" in active_slots
        assert "09:30:00" in active_slots
        assert "10:30:00" in active_slots

    def test_book_appointment_and_overlap_prevention(self, client):
        p_headers = {"Authorization": f"Bearer {TestPhase3Functionality.patient_token}"}
        today = date.today()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_monday = today + timedelta(days=days_ahead)

        # Book 09:00 slot
        book_resp = client.post("/api/appointments", headers=p_headers, json={
            "doctor_id": str(TestPhase3Functionality.doctor1_id),
            "date": next_monday.isoformat(),
            "slot": "09:00:00",
            "reason_for_visit": "Chest pain checkup",
        })
        assert book_resp.status_code == 201, book_resp.text
        appt = book_resp.json()
        assert appt["status"].lower() == "booked"

        # Check slots again: 09:00 should now be is_available = False or removed from active slots
        slots_resp = client.get(
            f"/api/availability/{TestPhase3Functionality.doctor1_id}/slots?date={next_monday.isoformat()}"
        )
        assert slots_resp.status_code == 200
        slots_json = slots_resp.json()
        slot_9 = next((s for s in slots_json.get("all_slots", []) if "09:00" in s["time"]), None)
        if slot_9:
            assert slot_9["available"] is False
        else:
            assert "09:00:00" not in [str(s) for s in slots_json["slots"]]

        # Attempting to book the same slot again should fail (409 Conflict)
        conflict_resp = client.post("/api/appointments", headers=p_headers, json={
            "doctor_id": str(TestPhase3Functionality.doctor1_id),
            "date": next_monday.isoformat(),
            "slot": "09:00:00",
            "reason_for_visit": "Duplicate slot booking",
        })
        assert conflict_resp.status_code == 409

    def test_doctor_cancellation(self, client):
        p_headers = {"Authorization": f"Bearer {TestPhase3Functionality.patient_token}"}
        d_headers = {"Authorization": f"Bearer {TestPhase3Functionality.doctor1_token}"}
        today = date.today()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_monday = today + timedelta(days=days_ahead)

        # Book 09:30 slot
        book_resp = client.post("/api/appointments", headers=p_headers, json={
            "doctor_id": str(TestPhase3Functionality.doctor1_id),
            "date": next_monday.isoformat(),
            "slot": "09:30:00",
            "reason_for_visit": "Routine checkup",
        })
        assert book_resp.status_code == 201
        appt_id = book_resp.json()["id"]

        # Doctor cancels the appointment
        cancel_resp = client.patch(
            f"/api/appointments/{appt_id}/cancel",
            headers=d_headers,
            json={"cancellation_reason": "Emergency surgery call"}
        )
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"].lower() == "cancelled"

        # Verify patient received a cancellation notification
        notifs_resp = client.get("/api/notifications/me", headers=p_headers)
        assert notifs_resp.status_code == 200
        notifs = notifs_resp.json()
        assert any("Emergency surgery call" in n["message"] or "cancelled" in n["title"].lower() for n in notifs)

    def test_consultation_completion_and_medical_records(self, client):
        p_headers = {"Authorization": f"Bearer {TestPhase3Functionality.patient_token}"}
        d_headers = {"Authorization": f"Bearer {TestPhase3Functionality.doctor1_token}"}
        today = date.today()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_monday = today + timedelta(days=days_ahead)

        # Book 10:30 slot
        book_resp = client.post("/api/appointments", headers=p_headers, json={
            "doctor_id": str(TestPhase3Functionality.doctor1_id),
            "date": next_monday.isoformat(),
            "slot": "10:30:00",
            "reason_for_visit": "Blood pressure consultation",
        })
        assert book_resp.status_code == 201
        appt_id = book_resp.json()["id"]

        # Doctor records consultation notes -> completes appointment atomically
        med_resp = client.post(
            f"/api/medical-records/appointments/{appt_id}",
            headers=d_headers,
            json={
                "diagnosis": "Mild Hypertension",
                "symptoms": "Occasional headaches, elevated BP",
                "treatment": "Low sodium diet, Amlodipine 5mg daily",
                "notes": "Patient advised to monitor BP daily and record readings.",
                "follow_up_date": (today + timedelta(days=30)).isoformat(),
            }
        )
        assert med_resp.status_code == 201, med_resp.text
        record = med_resp.json()
        assert record["diagnosis"] == "Mild Hypertension"
        assert record["patient_name"] == "John Doe"
        assert record["doctor_name"] == "Dr. Alice Adams"
        record_id = record["id"]

        # Verify appointment status was marked COMPLETED
        appt_check = client.get(f"/api/appointments/{appt_id}", headers=d_headers)
        assert appt_check.status_code == 200
        assert appt_check.json()["status"].lower() == "completed"

        # Verify patient received consultation completed notification
        p_notifs = client.get("/api/notifications/me", headers=p_headers).json()
        assert any("consultation" in n["title"].lower() for n in p_notifs)

        # Doctor updates medical record
        update_resp = client.put(
            f"/api/medical-records/{record_id}",
            headers=d_headers,
            json={
                "diagnosis": "Stage 1 Essential Hypertension",
                "notes": "Updated diagnosis following secondary chart review.",
            }
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["diagnosis"] == "Stage 1 Essential Hypertension"

        # Fetch medical record by appointment ID
        by_appt_resp = client.get(f"/api/medical-records/appointment/{appt_id}", headers=p_headers)
        assert by_appt_resp.status_code == 200
        assert by_appt_resp.json()["diagnosis"] == "Stage 1 Essential Hypertension"

    def test_notification_mark_all_read(self, client):
        p_headers = {"Authorization": f"Bearer {TestPhase3Functionality.patient_token}"}
        mark_all_resp = client.patch("/api/notifications/mark-all-read", headers=p_headers)
        assert mark_all_resp.status_code == 200
        assert "marked_read" in mark_all_resp.json()

        # Check all are read
        notifs = client.get("/api/notifications/me", headers=p_headers).json()
        for n in notifs:
            assert n["is_read"] is True

    def test_dashboard_stats(self, client):
        p_headers = {"Authorization": f"Bearer {TestPhase3Functionality.patient_token}"}
        d_headers = {"Authorization": f"Bearer {TestPhase3Functionality.doctor1_token}"}

        doc_stats = client.get("/api/doctors/me/stats", headers=d_headers)
        assert doc_stats.status_code == 200
        ds = doc_stats.json()
        assert "completed_count" in ds
        assert "upcoming_count" in ds
        assert "total_patients" in ds
        assert ds["completed_count"] >= 1
        assert ds["total_patients"] >= 1

        pat_stats = client.get("/api/patients/me/stats", headers=p_headers)
        assert pat_stats.status_code == 200
        ps = pat_stats.json()
        assert "upcoming_count" in ps
        assert "medical_records_count" in ps
        assert ps["medical_records_count"] >= 1
