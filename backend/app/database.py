"""SQLite database setup with SQLModel."""

from sqlmodel import SQLModel, create_engine

from app.config import settings

engine = create_engine(settings.database_url, echo=False, connect_args={"check_same_thread": False})


def create_db_and_tables():
    """Create all tables on startup."""
    SQLModel.metadata.create_all(engine)
