"""
Declarative base for all ORM models. Every model in app/models/ inherits
from Base so Alembic (or Base.metadata.create_all during early development)
can discover every table from a single import.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
