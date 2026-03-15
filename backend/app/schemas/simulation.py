"""Request/response schemas for simulation API."""

from pydantic import BaseModel, Field


class TargetAudience(BaseModel):
    """Optional target audience constraints for persona generation."""

    age_range: str = Field(default="", description="e.g. '18-35' or '25-45'")
    gender: str = Field(default="", description="e.g. 'male', 'female', or 'any'")
    interests: str = Field(default="", description="e.g. 'tech, fitness, gaming'")
    occupation: str = Field(default="", description="e.g. 'software developer, student'")
    income_level: str = Field(default="", description="e.g. 'low', 'medium', 'high'")
    location: str = Field(default="", description="e.g. 'Vietnam', 'US', 'Southeast Asia'")


class SimulationCreate(BaseModel):
    """Request body to create a new simulation."""

    product_input: str = Field(..., min_length=1, max_length=5000, description="URL or product description")
    total_agents: int = Field(default=10, ge=10, le=1000, description="Number of agents to simulate")
    target_audience: TargetAudience | None = Field(default=None, description="Optional target audience constraints")


class SimulationResponse(BaseModel):
    """Response after creating a simulation."""

    id: int
    status: str
    product_input: str
    total_agents: int


class SimulationDetail(BaseModel):
    """Full simulation details including report."""

    id: int
    status: str
    product_input: str
    product_info: str
    total_agents: int
    completed_agents: int
    created_at: str
    completed_at: str | None
    error_message: str | None


class AgentResponseItem(BaseModel):
    """Single agent response for listing."""

    id: int
    persona_name: str
    persona_age: int
    persona_occupation: str
    tier: str
    first_impression: str
    willingness_to_pay: float
    purchase_decision: bool
    sentiment_score: float
