"""LLM client wrapper around litellm with retry, timeout, and tier routing."""

import asyncio
import json
import logging

from litellm import acompletion
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.simulation import AgentTier

logger = logging.getLogger(__name__)

# Concurrency limiter — prevents rate limit hammering
_semaphore = asyncio.Semaphore(settings.max_concurrent_agents)

# Tier → model mapping
TIER_MODELS = {
    AgentTier.BULK: settings.bulk_model,
    AgentTier.EXPERT: settings.expert_model,
    AgentTier.SYNTHESIS: settings.synthesis_model,
}


def _get_provider_kwargs(model: str) -> dict:
    """Return API key + base URL for the model's provider.

    Supports OpenAI-compatible proxies via OPENAI_API_BASE.
    litellm uses model name prefixes to detect provider.
    """
    model_lower = model.lower()
    if model_lower.startswith(("claude", "anthropic")):
        return {"api_key": settings.anthropic_api_key} if settings.anthropic_api_key else {}
    if model_lower.startswith(("gemini", "google")):
        return {"api_key": settings.google_api_key} if settings.google_api_key else {}
    # OpenAI or OpenAI-compatible proxy (gpt-*, openai/*, etc.)
    kwargs = {}
    if settings.openai_api_key:
        kwargs["api_key"] = settings.openai_api_key
    if settings.openai_api_base:
        kwargs["api_base"] = settings.openai_api_base
    return kwargs


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def llm_call(
    messages: list[dict],
    tier: AgentTier = AgentTier.BULK,
    json_mode: bool = False,
    temperature: float = 0.7,
) -> str:
    """Make a single LLM call with retry and concurrency control."""
    model = TIER_MODELS[tier]
    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "timeout": 120,
        **_get_provider_kwargs(model),
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    async with _semaphore:
        response = await acompletion(**kwargs)
        return response.choices[0].message.content


def _extract_json(text: str) -> str:
    """Strip markdown code fences from LLM response if present."""
    import re

    # Try to find JSON in code fences first
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    # Otherwise return as-is (might already be pure JSON)
    return text.strip()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
async def llm_call_json(
    messages: list[dict],
    tier: AgentTier = AgentTier.BULK,
    temperature: float = 0.7,
) -> dict | list:
    """LLM call that parses response as JSON. Handles markdown-wrapped JSON."""
    # Try with json_mode first, fall back to raw if proxy doesn't support it
    try:
        content = await llm_call(messages, tier=tier, json_mode=True, temperature=temperature)
    except Exception:
        content = await llm_call(messages, tier=tier, json_mode=False, temperature=temperature)
    return json.loads(_extract_json(content))
