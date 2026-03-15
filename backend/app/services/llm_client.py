"""LLM client — uses OpenAI SDK directly for maximum provider compatibility."""

import asyncio
import json
import logging
import re

from openai import AsyncOpenAI
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


def _get_client_for_model(model: str) -> tuple[AsyncOpenAI, str]:
    """Return an OpenAI client + clean model name for the provider.

    Strips 'openai/' prefix that litellm uses, since we call the SDK directly.
    """
    clean_model = model.replace("openai/", "")
    model_lower = model.lower()

    if model_lower.startswith(("claude", "anthropic")):
        return AsyncOpenAI(api_key=settings.anthropic_api_key, base_url="https://api.anthropic.com/v1"), clean_model
    if model_lower.startswith(("gemini", "google")):
        client = AsyncOpenAI(
            api_key=settings.google_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta",
        )
        return client, clean_model

    # OpenAI or OpenAI-compatible (Qwen DashScope, proxies, etc.)
    base_url = settings.openai_api_base or "https://api.openai.com/v1"
    return AsyncOpenAI(api_key=settings.openai_api_key, base_url=base_url), clean_model


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def llm_call(
    messages: list[dict],
    tier: AgentTier = AgentTier.BULK,
    temperature: float = 0.7,
) -> str:
    """Make a single LLM call with retry and concurrency control."""
    client, model = _get_client_for_model(TIER_MODELS[tier])

    async with _semaphore:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            timeout=120,
        )
        return response.choices[0].message.content


def _extract_json(text: str) -> str:
    """Strip markdown code fences from LLM response if present."""
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
async def llm_call_json(
    messages: list[dict],
    tier: AgentTier = AgentTier.BULK,
    temperature: float = 0.7,
) -> dict | list:
    """LLM call that parses response as JSON. Handles markdown-wrapped JSON."""
    content = await llm_call(messages, tier=tier, temperature=temperature)
    return json.loads(_extract_json(content))
