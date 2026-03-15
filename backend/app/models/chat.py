"""Chat message model for agent conversations."""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class ChatMessage(SQLModel, table=True):
    """Persistent chat message between user and agent persona."""

    id: Optional[int] = Field(default=None, primary_key=True)
    simulation_id: int = Field(foreign_key="simulation.id")
    persona_id: int = Field(foreign_key="persona.id")
    role: str  # "user" or "agent"
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
