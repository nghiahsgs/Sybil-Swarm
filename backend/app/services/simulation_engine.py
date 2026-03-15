"""Core simulation engine — orchestrates parallel agent evaluations."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from sqlmodel import Session

from app.database import engine
from app.models.simulation import AgentResponse, AgentTier, Persona, Simulation, SimulationStatus
from app.services.input_parser import ProductInfo, parse_input
from app.services.llm_client import llm_call_json
from app.services.persona_generator import generate_personas
from app.services.prompts import BULK_AGENT_PROMPT, EXPERT_AGENT_PROMPT

logger = logging.getLogger(__name__)


# SSE event queue per simulation — subscribers read from here
_event_queues: dict[int, list[asyncio.Queue]] = {}


def subscribe(simulation_id: int) -> asyncio.Queue:
    """Subscribe to SSE events for a simulation."""
    queue: asyncio.Queue = asyncio.Queue()
    _event_queues.setdefault(simulation_id, []).append(queue)
    return queue


def unsubscribe(simulation_id: int, queue: asyncio.Queue):
    """Remove a subscriber. Cleans up empty lists to prevent memory leak."""
    if simulation_id in _event_queues:
        _event_queues[simulation_id] = [q for q in _event_queues[simulation_id] if q is not queue]
        if not _event_queues[simulation_id]:
            del _event_queues[simulation_id]


async def _emit(simulation_id: int, event: str, data: dict):
    """Broadcast SSE event to all subscribers."""
    for queue in _event_queues.get(simulation_id, []):
        await queue.put({"event": event, "data": json.dumps(data)})


def _format_product_for_prompt(info: ProductInfo) -> dict:
    """Build template vars for agent prompts."""
    features_text = "\n".join(f"- {f}" for f in info.features) if info.features else "Not specified"
    return {
        "product_name": info.name,
        "product_description": info.description or info.raw_text[:500],
        "product_features": f"Features:\n{features_text}",
        "product_pricing": f"Pricing: {info.pricing}" if info.pricing else "",
    }


async def _evaluate_agent(persona: Persona, product_vars: dict, simulation_id: int) -> AgentResponse | None:
    """Run a single agent evaluation."""
    template = EXPERT_AGENT_PROMPT if persona.tier == AgentTier.EXPERT else BULK_AGENT_PROMPT
    prompt = template.format(
        name=persona.name,
        age=persona.age,
        occupation=persona.occupation,
        income_bracket=persona.income_bracket,
        tech_savvy=persona.tech_savvy,
        personality_type=persona.personality_type,
        interests=persona.interests,
        pain_points=persona.pain_points,
        **product_vars,
    )

    try:
        result = await llm_call_json(
            messages=[{"role": "user", "content": prompt}],
            tier=persona.tier,
            temperature=0.8,
        )

        response = AgentResponse(
            simulation_id=simulation_id,
            persona_id=persona.id,
            tier=persona.tier,
            first_impression=result.get("first_impression", ""),
            willingness_to_pay=float(result.get("willingness_to_pay", 0)),
            purchase_decision=bool(result.get("purchase_decision", False)),
            reasoning=result.get("reasoning", ""),
            sentiment_score=float(result.get("sentiment_score", 0)),
            objections=json.dumps(result.get("objections", [])),
            suggestions=json.dumps(result.get("suggestions", [])),
        )

        # Emit SSE event
        await _emit(
            simulation_id,
            "agent_completed",
            {
                "persona_name": persona.name,
                "persona_age": persona.age,
                "persona_occupation": persona.occupation,
                "tier": persona.tier.value,
                "purchase_decision": response.purchase_decision,
                "sentiment_score": response.sentiment_score,
                "first_impression": response.first_impression[:100],
            },
        )

        return response
    except Exception as e:
        logger.error(f"Agent eval failed for {persona.name}: {e}")
        return None


async def run_simulation(simulation_id: int):
    """Execute the full simulation pipeline."""
    with Session(engine) as session:
        sim = session.get(Simulation, simulation_id)
        if not sim:
            logger.error(f"Simulation {simulation_id} not found")
            return

        try:
            # Phase 1: Parse input
            sim.status = SimulationStatus.GENERATING_PERSONAS
            session.add(sim)
            session.commit()
            await _emit(simulation_id, "phase_changed", {"phase": "parsing_input"})

            product_info = await parse_input(sim.product_input)
            sim.product_info = product_info.model_dump_json()
            session.add(sim)
            session.commit()

            # Phase 2: Generate personas
            await _emit(simulation_id, "phase_changed", {"phase": "generating_personas"})
            # Parse target audience if provided
            target_aud = json.loads(sim.target_audience) if sim.target_audience else None

            personas = await generate_personas(
                simulation_id=simulation_id,
                product_name=product_info.name,
                product_description=product_info.description,
                total=sim.total_agents,
                target_audience=target_aud,
            )

            # Save personas to DB
            for p in personas:
                session.add(p)
            session.commit()
            # Refresh to get IDs
            for p in personas:
                session.refresh(p)

            await _emit(
                simulation_id,
                "phase_changed",
                {
                    "phase": "simulating",
                    "total_personas": len(personas),
                },
            )

            # Phase 3: Run agent evaluations
            sim.status = SimulationStatus.SIMULATING
            session.add(sim)
            session.commit()

            # Detach personas from session to prevent lazy-load issues in async
            # Copy all needed attributes while session is still active
            persona_snapshots = []
            for p in personas:
                session.refresh(p)
                persona_snapshots.append(
                    Persona(
                        id=p.id,
                        simulation_id=p.simulation_id,
                        name=p.name,
                        age=p.age,
                        occupation=p.occupation,
                        income_bracket=p.income_bracket,
                        interests=p.interests,
                        pain_points=p.pain_points,
                        tech_savvy=p.tech_savvy,
                        personality_type=p.personality_type,
                        tier=p.tier,
                    )
                )

            product_vars = _format_product_for_prompt(product_info)
            responses: list[AgentResponse] = []

            # Run all agents concurrently (semaphore in llm_client controls rate)
            tasks = [_evaluate_agent(p, product_vars, simulation_id) for p in persona_snapshots]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for i, r in enumerate(results):
                logger.warning(f"Result {i}: type={type(r).__name__}, is_agent={isinstance(r, AgentResponse)}")
                if isinstance(r, AgentResponse):
                    responses.append(r)
                    session.add(r)
                elif isinstance(r, Exception):
                    logger.error(f"Agent task exception: {type(r).__name__}: {r}")
                elif isinstance(r, BaseException):
                    logger.error(f"Agent base exception: {type(r).__name__}: {r}")
                else:
                    logger.warning(f"Unexpected result type: {type(r)} = {r}")

            logger.warning(f"Total responses collected: {len(responses)} from {len(results)} results")

            # Update counter after collecting all responses
            session.refresh(sim)
            sim.completed_agents = len(responses)
            session.add(sim)
            session.commit()

            # Phase 4: Aggregate
            sim.status = SimulationStatus.AGGREGATING
            session.add(sim)
            session.commit()
            await _emit(simulation_id, "phase_changed", {"phase": "aggregating"})

            # Import aggregator here to avoid circular imports
            from app.services.aggregator import aggregate_and_synthesize

            report = await aggregate_and_synthesize(simulation_id, product_info, responses, session)

            # Done
            sim.status = SimulationStatus.COMPLETED
            sim.completed_at = datetime.now(timezone.utc)
            session.add(sim)
            session.commit()

            await _emit(simulation_id, "phase_changed", {"phase": "completed"})
            await _emit(
                simulation_id,
                "simulation_complete",
                {
                    "conversion_rate": report.conversion_rate,
                    "overall_score": report.overall_score,
                },
            )

        except Exception as e:
            logger.exception(f"Simulation {simulation_id} failed: {e}")
            sim.status = SimulationStatus.FAILED
            sim.error_message = str(e)
            session.add(sim)
            session.commit()
            await _emit(simulation_id, "error", {"message": "Simulation failed. Check server logs."})
