"""Chat service — persona-contextualized conversation with individual agents."""

import logging
from collections.abc import AsyncGenerator

from litellm import acompletion
from sqlmodel import Session, select

from app.config import settings
from app.database import engine
from app.models.chat import ChatMessage
from app.models.simulation import AgentResponse, Persona

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are {name}, a {age}-year-old {occupation}.
Income: {income_bracket} | Tech savvy: {tech_savvy}/10 | Personality: {personality_type}
Interests: {interests}
Pain points: {pain_points}

You previously evaluated a product and gave this feedback:
- First impression: {first_impression}
- Purchase decision: {"Would buy" if purchase_decision else "Would NOT buy"}
- Reasoning: {reasoning}
- Sentiment: {sentiment_score}

RULES:
- Stay completely in character as {name}. Never break character.
- Answer questions about why you made your evaluation.
- Share thoughts about improvements, pricing, competitors.
- Be honest and consistent with your persona's perspective.
- Keep responses conversational and concise (2-4 sentences)."""


def _build_system_prompt(persona: Persona, agent_response: AgentResponse) -> str:
    """Build system prompt with persona context and original evaluation."""
    return CHAT_SYSTEM_PROMPT.format(
        name=persona.name,
        age=persona.age,
        occupation=persona.occupation,
        income_bracket=persona.income_bracket,
        tech_savvy=persona.tech_savvy,
        personality_type=persona.personality_type,
        interests=persona.interests,
        pain_points=persona.pain_points,
        first_impression=agent_response.first_impression,
        purchase_decision=agent_response.purchase_decision,
        reasoning=agent_response.reasoning,
        sentiment_score=agent_response.sentiment_score,
    )


def get_chat_context(simulation_id: int, persona_id: int) -> tuple[str, list[dict]]:
    """Load persona, build system prompt, and fetch chat history."""
    with Session(engine) as session:
        persona = session.get(Persona, persona_id)
        if not persona:
            raise ValueError(f"Persona {persona_id} not found")

        response = session.exec(
            select(AgentResponse).where(
                AgentResponse.simulation_id == simulation_id,
                AgentResponse.persona_id == persona_id,
            )
        ).first()
        if not response:
            raise ValueError(f"No agent response for persona {persona_id}")

        system_prompt = _build_system_prompt(persona, response)

        # Fetch last 20 messages for context
        messages = session.exec(
            select(ChatMessage)
            .where(ChatMessage.simulation_id == simulation_id, ChatMessage.persona_id == persona_id)
            .order_by(ChatMessage.created_at.desc())  # type: ignore
            .limit(20)
        ).all()

        history = [
            {"role": m.role if m.role == "user" else "assistant", "content": m.content} for m in reversed(messages)
        ]

        return system_prompt, history


def save_message(simulation_id: int, persona_id: int, role: str, content: str):
    """Persist a chat message."""
    with Session(engine) as session:
        msg = ChatMessage(
            simulation_id=simulation_id,
            persona_id=persona_id,
            role=role,
            content=content,
        )
        session.add(msg)
        session.commit()


def _get_provider_kwargs(model: str) -> dict:
    """Return API key + base URL for the model's provider."""
    model_lower = model.lower()
    if model_lower.startswith(("claude", "anthropic")):
        return {"api_key": settings.anthropic_api_key} if settings.anthropic_api_key else {}
    if model_lower.startswith(("gemini", "google")):
        return {"api_key": settings.google_api_key} if settings.google_api_key else {}
    kwargs = {}
    if settings.openai_api_key:
        kwargs["api_key"] = settings.openai_api_key
    if settings.openai_api_base:
        kwargs["api_base"] = settings.openai_api_base
    return kwargs


async def stream_chat_response(
    simulation_id: int,
    persona_id: int,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream chat response token-by-token. Uses expert model for quality."""
    system_prompt, history = get_chat_context(simulation_id, persona_id)

    # Save user message
    save_message(simulation_id, persona_id, "user", user_message)

    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": user_message},
    ]

    model = settings.expert_model
    full_response = ""

    try:
        response = await acompletion(
            model=model,
            messages=messages,
            temperature=0.8,
            stream=True,
            timeout=30,
            **_get_provider_kwargs(model),
        )

        async for chunk in response:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                full_response += delta.content
                yield delta.content

        # Save full agent response
        save_message(simulation_id, persona_id, "agent", full_response)

    except Exception as e:
        logger.error(f"Chat stream failed: {e}")
        yield "\n[Error: Chat temporarily unavailable]"
