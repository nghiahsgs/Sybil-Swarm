"""API routes for simulation management — REST + SSE streaming."""

import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from sqlmodel import Session, select
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.database import engine
from app.models.simulation import AgentResponse, Persona, Simulation, SimulationReport
from app.schemas.simulation import AgentResponseItem, SimulationCreate, SimulationDetail, SimulationResponse
from app.services.simulation_engine import run_simulation, subscribe, unsubscribe

router = APIRouter(tags=["simulations"])


@router.post("/simulations", response_model=SimulationResponse, status_code=201)
async def create_simulation(body: SimulationCreate, background_tasks: BackgroundTasks):
    """Create and start a new simulation."""
    if not settings.has_any_api_key():
        raise HTTPException(status_code=400, detail="No LLM API key configured. Set at least one in .env")

    with Session(engine) as session:
        import json as _json

        sim = Simulation(
            product_input=body.product_input,
            total_agents=body.total_agents,
            target_audience=_json.dumps(body.target_audience.model_dump()) if body.target_audience else "",
        )
        session.add(sim)
        session.commit()
        session.refresh(sim)

        # Launch simulation in background
        background_tasks.add_task(run_simulation, sim.id)

        return SimulationResponse(
            id=sim.id,
            status=sim.status.value,
            product_input=sim.product_input,
            total_agents=sim.total_agents,
        )


@router.get("/simulations/{sim_id}", response_model=SimulationDetail)
async def get_simulation(sim_id: int):
    """Get simulation status and details."""
    with Session(engine) as session:
        sim = session.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(status_code=404, detail="Simulation not found")
        return SimulationDetail(
            id=sim.id,
            status=sim.status.value,
            product_input=sim.product_input,
            product_info=sim.product_info,
            total_agents=sim.total_agents,
            completed_agents=sim.completed_agents,
            created_at=sim.created_at.isoformat(),
            completed_at=sim.completed_at.isoformat() if sim.completed_at else None,
            error_message=sim.error_message,
        )


@router.get("/simulations/{sim_id}/report")
async def get_report(sim_id: int):
    """Get the aggregated simulation report."""
    with Session(engine) as session:
        report = session.exec(select(SimulationReport).where(SimulationReport.simulation_id == sim_id)).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not ready yet")
        return {
            "overall_score": report.overall_score,
            "conversion_rate": report.conversion_rate,
            "avg_willingness_to_pay": report.avg_willingness_to_pay,
            "sentiment_distribution": (
                json.loads(report.sentiment_distribution) if report.sentiment_distribution else {}
            ),
            "top_objections": json.loads(report.top_objections) if report.top_objections else [],
            "top_suggestions": json.loads(report.top_suggestions) if report.top_suggestions else [],
            "synthesis_narrative": report.synthesis_narrative,
        }


@router.get("/simulations/{sim_id}/agents")
async def list_agents(sim_id: int, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    """List agent responses with pagination."""
    with Session(engine) as session:
        sim = session.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(status_code=404, detail="Simulation not found")

        responses = session.exec(
            select(AgentResponse).where(AgentResponse.simulation_id == sim_id).offset(skip).limit(limit)
        ).all()

        items = []
        for r in responses:
            persona = session.get(Persona, r.persona_id)
            items.append(
                AgentResponseItem(
                    id=r.id,
                    persona_name=persona.name if persona else "Unknown",
                    persona_age=persona.age if persona else 0,
                    persona_occupation=persona.occupation if persona else "Unknown",
                    tier=r.tier.value,
                    first_impression=r.first_impression,
                    willingness_to_pay=r.willingness_to_pay,
                    purchase_decision=r.purchase_decision,
                    sentiment_score=r.sentiment_score,
                )
            )

        return {"agents": items, "total": sim.completed_agents}


@router.get("/simulations/{sim_id}/stream")
async def stream_simulation(sim_id: int):
    """SSE endpoint for real-time simulation progress."""
    with Session(engine) as session:
        sim = session.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(status_code=404, detail="Simulation not found")

    queue = subscribe(sim_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=120)
                    yield event
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"event": "keepalive", "data": "{}"}
        except asyncio.CancelledError:
            pass
        finally:
            unsubscribe(sim_id, queue)

    return EventSourceResponse(event_generator())
