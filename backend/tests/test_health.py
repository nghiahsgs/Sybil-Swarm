"""Basic health check and input parser tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.input_parser import parse_text


@pytest.fixture
async def client():
    # Ensure DB tables exist before tests (lifespan not auto-triggered by test client)
    from app.database import create_db_and_tables

    create_db_and_tables()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "sybil-swarm"


def test_parse_text_basic():
    result = parse_text("My Cool Product\nA tool that helps developers ship faster")
    assert result.name == "My Cool Product"
    assert "ship faster" in result.description


def test_parse_text_single_line():
    result = parse_text("Just a simple description")
    assert result.name == "Just a simple description"


def test_create_simulation_validation():
    """Should validate simulation input."""
    from app.schemas.simulation import SimulationCreate

    # Valid
    s = SimulationCreate(product_input="test", total_agents=10)
    assert s.total_agents == 10

    # With target audience
    s2 = SimulationCreate(
        product_input="test",
        total_agents=20,
        target_audience={
            "age_range": "18-35",
            "gender": "any",
            "interests": "tech",
            "occupation": "",
            "income_level": "",
            "location": "",
        },
    )
    assert s2.target_audience is not None
    assert s2.target_audience.age_range == "18-35"
