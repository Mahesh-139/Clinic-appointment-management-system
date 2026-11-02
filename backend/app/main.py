"""
Application entry point. Run with:
    uvicorn app.main:app --reload

All routers are mounted under /api so paths match what the frontend
already expects (see frontend/src/utils/constants.js API_BASE_URL and
frontend/vite.config.js's dev proxy, which forwards /api unchanged to
this server).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.config import get_settings
from app.routers import (
    auth_router,
    patients_router,
    doctors_router,
    appointments_router,
    availability_router,
    medical_records_router,
    prescriptions_router,
    notifications_router,
    prescription_files_router,
)

from contextlib import asynccontextmanager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.database_url.startswith("sqlite"):
        from app.database.base import Base
        from app.database.database import engine
        import app.models  # noqa: F401
        from sqlalchemy import text
        Base.metadata.create_all(bind=engine)
        try:
            with engine.connect() as conn:
                cols = [r[1] for r in conn.execute(text("PRAGMA table_info(patients)")).fetchall()]
                if cols and "photo_url" not in cols:
                    conn.execute(text("ALTER TABLE patients ADD COLUMN photo_url VARCHAR(500)"))
                    conn.commit()
                doc_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(doctors)")).fetchall()]
                if doc_cols and "photo_url" not in doc_cols:
                    conn.execute(text("ALTER TABLE doctors ADD COLUMN photo_url VARCHAR(500)"))
                    conn.commit()
        except Exception:
            pass
    yield


app = FastAPI(
    title=settings.app_name,
    description="Phase 2 API for the Clinic Appointment Management System.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(os.path.join(uploads_dir, "profiles"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "prescriptions"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

api_prefix = "/api"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(patients_router, prefix=api_prefix)
app.include_router(doctors_router, prefix=api_prefix)
app.include_router(appointments_router, prefix=api_prefix)
app.include_router(availability_router, prefix=api_prefix)
app.include_router(medical_records_router, prefix=api_prefix)
app.include_router(prescriptions_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(prescription_files_router, prefix=api_prefix)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": settings.app_name}


@app.get("/api/health", tags=["health"])
def health_check():
    # Deliberately does not touch the database — this only confirms the
    # API process itself is up. A DB-aware check can be added once Phase 4
    # migrations are in place.
    return {"status": "ok"}
