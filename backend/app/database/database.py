"""
Engine + session factory for PostgreSQL, and the get_db dependency that
routers use to obtain a request-scoped session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.utils.config import get_settings

settings = get_settings()

engine_kwargs = {"future": True}
if settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(settings.database_url, **engine_kwargs)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def get_db() -> Session:
    """FastAPI dependency: yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
