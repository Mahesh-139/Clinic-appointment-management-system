"""
Phase 2 integration tests — uses SQLite in-memory so PostgreSQL is NOT required.

Run from the repo root:
    cd backend
    python -m pytest tests/test_phase2.py -v
"""
import os
import pytest

# Override DATABASE_URL before importing anything from app
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_phase2.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-long-enough-for-sha256-hmac")
os.environ.setdefault("ENVIRONMENT", "test")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app as fastapi_app
from app.database.database import get_db
from app.database.base import Base
import app.models  # noqa: F401 — registers all models with Base.metadata

# ─── SQLite in-memory test database ───────────────────────────────────────────
SQLITE_URL = "sqlite:///./test_phase2.db"
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
    """Create all tables once for the test session."""
    Base.metadata.create_all(bind=engine)
    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    fastapi_app.dependency_overrides.clear()
    engine.dispose()
    # Clean up test db file
    try:
        if os.path.exists("test_phase2.db"):
            os.remove("test_phase2.db")
    except Exception:
        pass


@pytest.fixture(scope="session")
def client(setup_db):
    with TestClient(fastapi_app) as c:
        yield c


# ─── Helper data ──────────────────────────────────────────────────────────────
PATIENT_DATA = {
    "full_name": "Alice Patient",
    "email": "alice@test.com",
    "password": "securepass123",
    "phone": "1234567890",
}

DOCTOR_DATA = {
    "full_name": "Dr. Bob Smith",
    "email": "bob@test.com",
    "password": "doctorpass123",
    "phone": "9876543210",
    "specialization": "Cardiology",
    "qualification": "MBBS, MD",
    "experience_years": 10,
    "consultation_info": "In-clinic and online",
    "photo_url": "",
    "admin_email": "maheshmbiradar5@gmail.com",
    "admin_password": "Mahesh@13",
}


# ─── Tests ────────────────────────────────────────────────────────────────────

class TestPatientRegistration:
    def test_register_patient_success(self, client):
        resp = client.post("/api/auth/register/patient", json=PATIENT_DATA)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["email"] == PATIENT_DATA["email"]
        assert data["role"] == "patient"

    def test_register_patient_duplicate_email(self, client):
        resp = client.post("/api/auth/register/patient", json=PATIENT_DATA)
        assert resp.status_code == 409, resp.text

    def test_register_patient_missing_email(self, client):
        bad = PATIENT_DATA.copy()
        del bad["email"]
        resp = client.post("/api/auth/register/patient", json=bad)
        assert resp.status_code == 422


class TestDoctorRegistration:
    def test_register_doctor_success(self, client):
        resp = client.post("/api/auth/register/doctor", json=DOCTOR_DATA)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["email"] == DOCTOR_DATA["email"]
        assert data["role"] == "doctor"

    def test_register_doctor_duplicate_email(self, client):
        resp = client.post("/api/auth/register/doctor", json=DOCTOR_DATA)
        assert resp.status_code == 409, resp.text

    def test_register_doctor_bad_admin_credentials(self, client):
        bad_admin = DOCTOR_DATA.copy()
        bad_admin["email"] = "doctor_bad_admin@test.com"
        bad_admin["admin_password"] = "WrongAdminPassword!"
        resp = client.post("/api/auth/register/doctor", json=bad_admin)
        assert resp.status_code == 400
        assert "Account can't be created. Admin details are incorrect." in resp.text


class TestPatientLogin:
    def test_login_patient_success(self, client):
        resp = client.post("/api/auth/login", json={
            "email": PATIENT_DATA["email"],
            "password": PATIENT_DATA["password"],
        })
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        resp = client.post("/api/auth/login", json={
            "email": PATIENT_DATA["email"],
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@test.com",
            "password": "whatever",
        })
        assert resp.status_code == 401


class TestDoctorLogin:
    def test_login_doctor_success(self, client):
        resp = client.post("/api/auth/login", json={
            "email": DOCTOR_DATA["email"],
            "password": DOCTOR_DATA["password"],
        })
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data


# ─── Shared auth token fixtures ───────────────────────────────────────────────

def get_patient_token(client):
    resp = client.post("/api/auth/login", json={
        "email": PATIENT_DATA["email"],
        "password": PATIENT_DATA["password"],
    })
    return resp.json()["access_token"]


def get_doctor_token(client):
    resp = client.post("/api/auth/login", json={
        "email": DOCTOR_DATA["email"],
        "password": DOCTOR_DATA["password"],
    })
    return resp.json()["access_token"]


class TestAuthMe:
    def test_patient_auth_me(self, client):
        token = get_patient_token(client)
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["email"] == PATIENT_DATA["email"]
        assert data["role"] == "patient"

    def test_doctor_auth_me(self, client):
        token = get_doctor_token(client)
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["email"] == DOCTOR_DATA["email"]
        assert data["role"] == "doctor"

    def test_auth_me_no_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_auth_me_bad_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer badtoken"})
        assert resp.status_code == 401


class TestPatientProfile:
    def test_get_patient_profile(self, client):
        token = get_patient_token(client)
        resp = client.get("/api/patients/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["email"] == PATIENT_DATA["email"]
        assert data["full_name"] == PATIENT_DATA["full_name"]

    def test_update_patient_profile(self, client):
        token = get_patient_token(client)
        resp = client.put("/api/patients/me", json={
            "phone": "5555555555",
            "gender": "female",
            "address": "123 Main St",
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["phone"] == "5555555555"
        assert data["gender"] == "female"

    def test_patient_cannot_access_doctor_endpoint(self, client):
        token = get_patient_token(client)
        resp = client.get("/api/doctors/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403


class TestDoctorProfile:
    def test_get_doctor_profile(self, client):
        token = get_doctor_token(client)
        resp = client.get("/api/doctors/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["email"] == DOCTOR_DATA["email"]
        assert data["full_name"] == DOCTOR_DATA["full_name"]
        assert data["specialization"] == DOCTOR_DATA["specialization"]

    def test_update_doctor_profile(self, client):
        token = get_doctor_token(client)
        resp = client.put("/api/doctors/me", json={
            "consultation_info": "Online only",
            "experience_years": 12,
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["consultation_info"] == "Online only"
        assert data["experience_years"] == 12

    def test_doctor_cannot_access_patient_endpoint(self, client):
        token = get_doctor_token(client)
        resp = client.get("/api/patients/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403


class TestDoctorDiscovery:
    def test_list_all_doctors(self, client):
        resp = client.get("/api/doctors")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        names = [d["full_name"] for d in data]
        assert DOCTOR_DATA["full_name"] in names

    def test_search_by_name(self, client):
        resp = client.get("/api/doctors?q=Bob")
        assert resp.status_code == 200
        data = resp.json()
        assert any("Bob" in d["full_name"] for d in data)

    def test_filter_by_specialization(self, client):
        resp = client.get("/api/doctors?specialization=Cardiology")
        assert resp.status_code == 200
        data = resp.json()
        assert all(d["specialization"] == "Cardiology" for d in data)

    def test_filter_no_match(self, client):
        resp = client.get("/api/doctors?specialization=Dermatology")
        assert resp.status_code == 200
        data = resp.json()
        assert data == []

    def test_get_doctor_by_id(self, client):
        # First get the doctor's ID
        resp = client.get("/api/doctors?q=Bob")
        assert resp.status_code == 200
        doctors = resp.json()
        assert len(doctors) >= 1
        doctor_id = doctors[0]["id"]
        # Now get by ID
        resp2 = client.get(f"/api/doctors/{doctor_id}")
        assert resp2.status_code == 200
        data = resp2.json()
        assert data["id"] == doctor_id
        assert data["specialization"] == "Cardiology"


class TestDoctorAvailability:
    def test_get_my_availability(self, client):
        token = get_doctor_token(client)
        resp = client.get("/api/availability/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "working_days" in data
        assert len(data["working_days"]) == 5  # Mon-Fri seeded default

    def test_update_my_availability(self, client):
        token = get_doctor_token(client)
        payload = {
            "working_days": [
                {
                    "day_of_week": 0,
                    "start_time": "10:00:00",
                    "end_time": "16:00:00",
                    "break_start": "12:00:00",
                    "break_end": "13:00:00",
                    "slot_duration_minutes": 30,
                }
            ],
            "unavailable_dates": ["2026-12-25"],
        }
        resp = client.put("/api/availability/me", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 204

        # Check that it updated
        resp2 = client.get("/api/availability/me", headers={"Authorization": f"Bearer {token}"})
        assert resp2.status_code == 200
        data = resp2.json()
        assert len(data["working_days"]) == 1
        assert "2026-12-25" in data["unavailable_dates"]

    def test_slots_detail_structure(self, client):
        # Find doctor ID
        resp = client.get("/api/doctors?q=Bob")
        doctor_id = resp.json()[0]["id"]
        # Fetch slots for next Monday (day_of_week = 0)
        from datetime import date, timedelta
        today = date.today()
        # Find next Monday
        days_ahead = (0 - today.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        next_monday = today + timedelta(days=days_ahead)
        resp2 = client.get(f"/api/availability/{doctor_id}/slots?date={next_monday.isoformat()}")
        assert resp2.status_code == 200, resp2.text
        data = resp2.json()
        assert "all_slots" in data
        assert len(data["all_slots"]) > 0
        assert "time" in data["all_slots"][0]
        assert "available" in data["all_slots"][0]


class TestPrescriptionFiles:
    def test_search_patients_for_prescription(self, client):
        token = get_doctor_token(client)
        resp = client.get("/api/prescription-files/patients?q=Alice", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["full_name"] == "Alice Patient"

    def test_doctor_upload_and_patient_view_prescription(self, client):
        doc_token = get_doctor_token(client)
        pat_token = get_patient_token(client)

        # Get patient ID
        p_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {pat_token}"})
        patient_id = p_resp.json()["id"]

        # Doctor uploads prescription file
        fake_pdf = b"%PDF-1.4 Fake PDF prescription for testing"
        files = {"file": ("rx_test.pdf", fake_pdf, "application/pdf")}
        data = {"notes": "Take 1 tablet after meals"}
        resp = client.post(
            f"/api/prescription-files/patient/{patient_id}",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert resp.status_code == 201, resp.text
        rx_data = resp.json()
        assert rx_data["patient_id"] == patient_id
        assert rx_data["original_filename"] == "rx_test.pdf"
        assert rx_data["notes"] == "Take 1 tablet after meals"
        assert "rx_" in rx_data["file_url"]

        # Patient reads their own prescription files
        resp_pat = client.get("/api/prescription-files/my-files", headers={"Authorization": f"Bearer {pat_token}"})
        assert resp_pat.status_code == 200
        pat_files = resp_pat.json()
        assert len(pat_files) >= 1
        assert any(f["original_filename"] == "rx_test.pdf" for f in pat_files)

        # Doctor reads their issued prescription files
        resp_doc = client.get("/api/prescription-files/issued-by-me", headers={"Authorization": f"Bearer {doc_token}"})
        assert resp_doc.status_code == 200
        doc_files = resp_doc.json()
        assert len(doc_files) >= 1
        assert any(f["original_filename"] == "rx_test.pdf" for f in doc_files)

    def test_patient_cannot_upload_prescription(self, client):
        pat_token = get_patient_token(client)
        p_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {pat_token}"})
        patient_id = p_resp.json()["id"]

        fake_pdf = b"%PDF-1.4 Fake PDF prescription"
        files = {"file": ("rx_test.pdf", fake_pdf, "application/pdf")}
        resp = client.post(
            f"/api/prescription-files/patient/{patient_id}",
            files=files,
            headers={"Authorization": f"Bearer {pat_token}"},
        )
        assert resp.status_code == 403


class TestAccountDeletion:
    def test_delete_patient_account(self, client):
        # Register a disposable patient
        temp_patient = {
            "full_name": "Delete Me",
            "email": "delete_patient@test.com",
            "password": "password123",
            "phone": "5551234567",
        }
        resp = client.post("/api/auth/register/patient", json=temp_patient)
        assert resp.status_code == 201

        # Login
        login_resp = client.post("/api/auth/login", json={
            "email": temp_patient["email"],
            "password": temp_patient["password"],
        })
        token = login_resp.json()["access_token"]

        # Delete account
        del_resp = client.delete("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert del_resp.status_code == 204

        # Login should now fail
        login_fail = client.post("/api/auth/login", json={
            "email": temp_patient["email"],
            "password": temp_patient["password"],
        })
        assert login_fail.status_code == 401
