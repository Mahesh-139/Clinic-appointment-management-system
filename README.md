# Clinic Appointment Management System

A full-stack clinic appointment management application — **Phase 1: complete
project skeleton**. This establishes the entire folder architecture, page
structure, routing, component structure, backend architecture, database
architecture, authentication architecture, and API architecture described in
the project brief. It is intentionally not yet wired to a running database or
fully styled — that's Phases 2–12.

## Tech stack

| Layer          | Technology                                              |
|----------------|----------------------------------------------------------|
| Frontend       | React (JavaScript), React Router, Tailwind CSS, Framer Motion, Vite |
| Backend        | Python, FastAPI, Pydantic, SQLAlchemy                    |
| Database       | PostgreSQL                                                |
| Auth           | JWT, bcrypt password hashing, role-based authorization    |

Only two user roles exist: **Patient** and **Doctor**. There is no admin,
staff, or receptionist role anywhere in this system.

## Project structure

```
clinic-appointment-management-system/
├── frontend/                  # React + Vite app
│   └── src/
│       ├── components/        # Reusable UI (Button, Card, Modal, DoctorCard, ...)
│       ├── layouts/           # PublicLayout, PatientLayout, DoctorLayout
│       ├── pages/
│       │   ├── public/        # Home, About, Services, Doctors, Contact, Login, Register
│       │   ├── patient/       # Dashboard, Find Doctors, Booking, Appointments, Records, ...
│       │   └── doctor/        # Dashboard, Availability, Appointments, Consultation, ...
│       ├── services/          # API client + one file per resource
│       ├── context/           # AuthContext (role + token)
│       ├── hooks/             # useAuth
│       └── utils/             # constants, validators
│
├── backend/                   # FastAPI app
│   ├── app/
│   │   ├── main.py            # App entry point, CORS, router registration
│   │   ├── database/          # Engine, session, declarative base
│   │   ├── models/            # SQLAlchemy models (one file per entity)
│   │   ├── schemas/           # Pydantic request/response contracts
│   │   ├── routers/           # One router per resource, mounted under /api
│   │   ├── services/          # Business logic (booking, availability, auth, ...)
│   │   ├── auth/               # JWT, password hashing, role dependencies
│   │   └── utils/config.py    # Environment-driven settings
│   ├── migrations/            # Alembic migration environment
│   ├── alembic.ini
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

## Database design

Core tables: `users`, `patients`, `doctors`, `doctor_availability`,
`doctor_unavailable_dates`, `appointments`, `medical_records`,
`prescriptions` + `prescription_items`, `notifications`.

- `patients` and `doctors` are one-to-one extensions of `users` (shared
  primary key), keeping auth concerns separate from profile data.
- **Double-booking prevention happens in the database**, not just the UI: a
  partial unique index on `appointments (doctor_id, appointment_date,
  start_time)` — restricted to non-cancelled rows — means two requests
  racing for the same slot cannot both succeed, even if the application
  layer's own availability check is bypassed somehow. The service layer
  (`app/services/appointment_service.py`) checks first and turns the rare
  race-condition case into a clean `409` instead of a raw database error.
- Appointment lifecycle: `booked → confirmed → in_consultation → completed`,
  with `cancelled` as a separate terminal state reachable from `booked` or
  `confirmed`. Enforced in `appointment_service.ALLOWED_TRANSITIONS`.

## Getting started

### Prerequisites

- Node.js and npm
- Python 3.11+
- A running PostgreSQL instance

### 1. Environment variables

Copy the relevant sections of the root `.env.example`:

```bash
cp .env.example backend/.env
cp .env.example frontend/.env   # only needed if not using the Vite dev proxy
```

Then edit `backend/.env` and set `DATABASE_URL` to point at your PostgreSQL
instance, and set a real `JWT_SECRET_KEY`.

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create the initial migration from the models, then apply it:
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive docs
at `http://localhost:8000/docs`.

### 3. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`. The Vite dev server
proxies any request to `/api/*` through to `http://localhost:8000`, so no
frontend environment variable is required for local development.

## What was built in this phase

- Complete folder architecture for both frontend and backend.
- Every page listed in the project brief (public, patient, doctor) exists as
  a working React component with real routing, loading/empty/error states,
  and calls into the service layer — not placeholder text.
- Full React Router configuration with role-based route protection
  (`ProtectedRoute`), so a logged-in patient cannot reach doctor pages and
  vice versa.
- Complete FastAPI backend: models, schemas, services, and routers for
  every feature area (auth, patients, doctors, appointments, availability,
  medical records, prescriptions, notifications), mounted under `/api`.
- JWT authentication with bcrypt password hashing and role-based
  authorization dependencies (`require_patient`, `require_doctor`).
- Working appointment booking logic with real double-booking prevention,
  both at the service layer and via a database constraint.
- Framer Motion used for page transitions, card hover states, modal
  open/close, and mobile menu — kept subtle, not applied to everything.

## What could not be tested in this environment

This project was built and validated in a sandboxed environment **without
network access and without a running PostgreSQL instance**, so the
following could not be executed directly:

- `npm install` / `npm run build` — dependencies were never fetched, so no
  bundling or dev-server run was performed here.
- `pip install -r requirements.txt` — backend dependencies (FastAPI,
  SQLAlchemy, etc.) were not installed here, so the app was never actually
  started with `uvicorn`.
- `alembic revision --autogenerate` / `alembic upgrade head` — no database
  connection was available to generate or apply a real migration.
- Any actual HTTP request between the frontend and backend.

### What *was* validated

- **Every frontend `.js`/`.jsx` file** was syntax-checked with esbuild
  (transpiled with zero errors), and every relative import path in the
  frontend was confirmed to resolve to a real file.
- **Every backend `.py` file** was checked with `python -m py_compile`
  (pure syntax validation — see the note in each file if you re-run this).
- Route naming between frontend service calls (`frontend/src/services/*.js`)
  and backend router paths (`backend/app/routers/*.py`) was manually
  cross-checked to make sure every endpoint the frontend calls actually
  exists on the backend, with matching HTTP methods and path parameters.

You will need to run `npm install`, `pip install -r requirements.txt`, set
up a real PostgreSQL database, and run the Alembic migration yourself before
either app will actually start.

## Commands to run after extracting

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # then edit DATABASE_URL and JWT_SECRET_KEY
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Roadmap (Phases 2–12)

Phase 1 is a skeleton: pages and endpoints exist and are wired together,
but haven't been run against a live database. Next phases (see original
project plan) connect everything end-to-end, add real validation, and
polish the UI and animations.
