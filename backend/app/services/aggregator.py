"""Aggregate agent responses into stats and synthesis report."""

import json
import logging
from collections import Counter

from sqlmodel import Session

from app.models.simulation import AgentResponse, AgentTier, SimulationReport
from app.services.input_parser import ProductInfo
from app.services.llm_client import llm_call
from app.services.prompts import SYNTHESIS_PROMPT

logger = logging.getLogger(__name__)


def _compute_stats(responses: list[AgentResponse]) -> dict:
    """Compute aggregate statistics from agent responses."""
    if not responses:
        return {"conversion_rate": 0, "avg_wtp": 0, "sentiment": {}, "objections": [], "suggestions": []}

    total = len(responses)
    buyers = sum(1 for r in responses if r.purchase_decision)
    conversion_rate = (buyers / total) * 100

    avg_wtp = sum(r.willingness_to_pay for r in responses) / total

    # Sentiment distribution
    positive = sum(1 for r in responses if r.sentiment_score > 0.2)
    negative = sum(1 for r in responses if r.sentiment_score < -0.2)
    neutral = total - positive - negative

    # Aggregate objections and suggestions
    all_objections: list[str] = []
    all_suggestions: list[str] = []
    for r in responses:
        try:
            all_objections.extend(json.loads(r.objections) if r.objections else [])
        except json.JSONDecodeError:
            pass
        try:
            all_suggestions.extend(json.loads(r.suggestions) if r.suggestions else [])
        except json.JSONDecodeError:
            pass

    # Count top objections/suggestions
    objection_counts = Counter(all_objections).most_common(10)
    suggestion_counts = Counter(all_suggestions).most_common(10)

    return {
        "conversion_rate": conversion_rate,
        "avg_wtp": avg_wtp,
        "sentiment": {
            "positive": round(positive / total * 100, 1),
            "neutral": round(neutral / total * 100, 1),
            "negative": round(negative / total * 100, 1),
        },
        "objections": [{"objection": o, "count": c} for o, c in objection_counts],
        "suggestions": [{"suggestion": s, "count": c} for s, c in suggestion_counts],
    }


async def aggregate_and_synthesize(
    simulation_id: int,
    product_info: ProductInfo,
    responses: list[AgentResponse],
    session: Session,
) -> SimulationReport:
    """Compute stats and generate synthesis narrative via LLM."""
    stats = _compute_stats(responses)

    # Collect expert insights for synthesis
    expert_responses = [r for r in responses if r.tier == AgentTier.EXPERT]
    expert_insights = (
        "\n".join(f"- {r.reasoning[:200]}" for r in expert_responses[:10]) or "No expert insights available"
    )

    # Format objections/suggestions for prompt
    objections_text = (
        "\n".join(f"- {o['objection']} (mentioned {o['count']}x)" for o in stats["objections"][:8]) or "None reported"
    )

    suggestions_text = (
        "\n".join(f"- {s['suggestion']} (mentioned {s['count']}x)" for s in stats["suggestions"][:8]) or "None reported"
    )

    # Generate synthesis narrative
    synthesis_prompt = SYNTHESIS_PROMPT.format(
        total_agents=len(responses),
        product_name=product_info.name,
        product_description=product_info.description[:500],
        conversion_rate=stats["conversion_rate"],
        avg_wtp=stats["avg_wtp"],
        sentiment_positive=stats["sentiment"].get("positive", 0),
        sentiment_neutral=stats["sentiment"].get("neutral", 0),
        sentiment_negative=stats["sentiment"].get("negative", 0),
        top_objections=objections_text,
        top_suggestions=suggestions_text,
        expert_insights=expert_insights,
    )

    try:
        narrative = await llm_call(
            messages=[{"role": "user", "content": synthesis_prompt}],
            tier=AgentTier.SYNTHESIS,
            temperature=0.5,
        )
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        narrative = "Synthesis generation failed. See raw data for analysis."

    # Create report
    report = SimulationReport(
        simulation_id=simulation_id,
        overall_score=min(100, max(0, stats["avg_wtp"] * 0.6 + stats["conversion_rate"] * 0.4)),
        conversion_rate=stats["conversion_rate"],
        avg_willingness_to_pay=stats["avg_wtp"],
        sentiment_distribution=json.dumps(stats["sentiment"]),
        top_objections=json.dumps(stats["objections"]),
        top_suggestions=json.dumps(stats["suggestions"]),
        synthesis_narrative=narrative,
    )

    session.add(report)
    session.commit()
    session.refresh(report)

    return report
