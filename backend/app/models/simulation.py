"""Data models for simulations, personas, agent responses, and reports."""

import json
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class SimulationStatus(str, Enum):
    PENDING = "pending"
    GENERATING_PERSONAS = "generating_personas"
    SIMULATING = "simulating"
    AGGREGATING = "aggregating"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentTier(str, Enum):
    BULK = "bulk"
    EXPERT = "expert"
    SYNTHESIS = "synthesis"


class Simulation(SQLModel, table=True):
    """A single simulation run — evaluating one product with N agents."""

    id: Optional[int] = Field(default=None, primary_key=True)
    product_input: str  # raw URL or text from user
    product_info: str = ""  # parsed product data as JSON
    target_audience: str = ""  # JSON string of audience constraints
    status: SimulationStatus = SimulationStatus.PENDING
    total_agents: int = 1000
    completed_agents: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class Persona(SQLModel, table=True):
    """A synthetic customer persona used in simulation."""

    id: Optional[int] = Field(default=None, primary_key=True)
    simulation_id: int = Field(foreign_key="simulation.id")
    name: str
    age: int
    occupation: str
    income_bracket: str  # low / medium / high / very_high
    interests: str  # JSON list
    pain_points: str  # JSON list
    tech_savvy: int  # 1-10
    personality_type: str  # analytical / emotional / pragmatic / skeptical / enthusiast
    tier: AgentTier = AgentTier.BULK

    def interests_list(self) -> list[str]:
        return json.loads(self.interests) if self.interests else []

    def pain_points_list(self) -> list[str]:
        return json.loads(self.pain_points) if self.pain_points else []


class AgentResponse(SQLModel, table=True):
    """An individual agent's evaluation of the product."""

    id: Optional[int] = Field(default=None, primary_key=True)
    simulation_id: int = Field(foreign_key="simulation.id")
    persona_id: int = Field(foreign_key="persona.id")
    tier: AgentTier
    first_impression: str = ""
    willingness_to_pay: float = 0.0  # 0-100 scale
    purchase_decision: bool = False
    reasoning: str = ""
    sentiment_score: float = 0.0  # -1.0 to 1.0
    objections: str = ""  # JSON list
    suggestions: str = ""  # JSON list
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SimulationReport(SQLModel, table=True):
    """Aggregated report from all agent responses."""

    id: Optional[int] = Field(default=None, primary_key=True)
    simulation_id: int = Field(foreign_key="simulation.id", unique=True)
    overall_score: float = 0.0  # 0-100
    conversion_rate: float = 0.0  # percentage
    avg_willingness_to_pay: float = 0.0
    sentiment_distribution: str = ""  # JSON: {positive, neutral, negative}
    top_objections: str = ""  # JSON list of {objection, count}
    top_suggestions: str = ""  # JSON list of {suggestion, count}
    market_segments: str = ""  # JSON list of segment analyses
    synthesis_narrative: str = ""  # final AI-written report
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
