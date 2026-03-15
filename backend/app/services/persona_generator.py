"""Generate diverse synthetic customer personas via batched LLM calls."""

import json
import logging

from app.models.simulation import AgentTier, Persona
from app.services.llm_client import llm_call_json

logger = logging.getLogger(__name__)

# Diversity constraints — ensure varied personas
PERSONALITY_TYPES = ["analytical", "emotional", "pragmatic", "skeptical", "enthusiast"]
INCOME_BRACKETS = ["low", "medium", "high", "very_high"]
AGE_RANGES = ["18-25", "26-35", "36-45", "46-55", "56-70"]

PERSONA_BATCH_PROMPT = """Generate exactly {batch_size} diverse synthetic customer personas for evaluating this product.

PRODUCT: {product_name}
DESCRIPTION: {product_description}

{target_audience_section}

DIVERSITY REQUIREMENTS for this batch:
- Age range focus: {age_range}
- Income mix: {income_focus}
- Must include personality types: {personality_types}

Return a JSON object with key "personas" containing a list of {batch_size} personas.
Each persona must have:
- name (string, realistic full name)
- age (int)
- occupation (string)
- income_bracket (string: "low" | "medium" | "high" | "very_high")
- interests (list of 3-5 strings)
- pain_points (list of 2-3 strings related to the product domain)
- tech_savvy (int 1-10)
- personality_type (string: "analytical" | "emotional" | "pragmatic" | "skeptical" | "enthusiast")

Make personas realistic and diverse. Include skeptics and enthusiasts alike."""


def _build_target_section(target: dict | None) -> str:
    """Build target audience section for prompt from constraints."""
    if not target:
        return ""
    parts = []
    if target.get("age_range"):
        parts.append(f"- Target age range: {target['age_range']}")
    if target.get("gender") and target["gender"] != "any":
        parts.append(f"- Target gender: {target['gender']}")
    if target.get("interests"):
        parts.append(f"- Target interests: {target['interests']}")
    if target.get("occupation"):
        parts.append(f"- Target occupations: {target['occupation']}")
    if target.get("income_level"):
        parts.append(f"- Target income level: {target['income_level']}")
    if target.get("location"):
        parts.append(f"- Target location/market: {target['location']}")
    if not parts:
        return ""
    return "TARGET AUDIENCE CONSTRAINTS:\n" + "\n".join(parts)


async def generate_persona_batch(
    product_name: str,
    product_description: str,
    batch_size: int,
    batch_index: int,
    target_audience: dict | None = None,
) -> list[dict]:
    """Generate a single batch of personas."""
    # Rotate diversity constraints across batches
    age_range = AGE_RANGES[batch_index % len(AGE_RANGES)]
    income_focus = INCOME_BRACKETS[batch_index % len(INCOME_BRACKETS)]
    personality_slice = PERSONALITY_TYPES[batch_index % len(PERSONALITY_TYPES) :][:3]

    prompt = PERSONA_BATCH_PROMPT.format(
        batch_size=batch_size,
        product_name=product_name,
        product_description=product_description[:500],
        age_range=target_audience.get("age_range", age_range) if target_audience else age_range,
        income_focus=target_audience.get("income_level", income_focus) if target_audience else income_focus,
        personality_types=", ".join(personality_slice),
        target_audience_section=_build_target_section(target_audience),
    )

    result = await llm_call_json(
        messages=[{"role": "user", "content": prompt}],
        tier=AgentTier.BULK,
        temperature=0.9,  # high temp for diversity
    )

    return result.get("personas", [])


async def generate_personas(
    simulation_id: int,
    product_name: str,
    product_description: str,
    total: int = 1000,
    expert_count: int = 10,
    batch_size: int = 50,
    target_audience: dict | None = None,
) -> list[Persona]:
    """Generate all personas for a simulation in batches.

    Returns list of Persona objects (not yet saved to DB).
    """
    personas: list[Persona] = []
    # Adjust batch size if total is smaller
    effective_batch = min(batch_size, total)
    num_batches = max(1, (total + effective_batch - 1) // effective_batch)  # ceiling division

    for i in range(num_batches):
        remaining = total - len(personas)
        if remaining <= 0:
            break
        current_batch = min(effective_batch, remaining)
        try:
            batch_data = await generate_persona_batch(
                product_name, product_description, current_batch, i, target_audience
            )

            for p in batch_data:
                tier = AgentTier.EXPERT if len(personas) >= (total - expert_count) else AgentTier.BULK
                persona = Persona(
                    simulation_id=simulation_id,
                    name=p.get("name", f"Agent-{len(personas)}"),
                    age=p.get("age", 30),
                    occupation=p.get("occupation", "Unknown"),
                    income_bracket=p.get("income_bracket", "medium"),
                    interests=json.dumps(p.get("interests", [])),
                    pain_points=json.dumps(p.get("pain_points", [])),
                    tech_savvy=p.get("tech_savvy", 5),
                    personality_type=p.get("personality_type", "pragmatic"),
                    tier=tier,
                )
                personas.append(persona)
        except Exception as e:
            logger.error(f"Batch {i} failed: {e}")
            continue

    logger.info(f"Generated {len(personas)} personas for simulation {simulation_id}")
    return personas
