"""Application configuration via environment variables (BYOK pattern)."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All settings loaded from env vars or .env file."""

    # LLM API keys — provide at least one
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""

    # Custom API base URL (for OpenAI-compatible proxies)
    openai_api_base: str = ""

    # Model configuration — tiered strategy
    bulk_model: str = "gpt-4o-mini"
    expert_model: str = "gpt-4o"
    synthesis_model: str = "gpt-4o"

    # Server
    backend_port: int = 8000
    database_url: str = "sqlite:///./sybil-swarm.db"

    # Simulation defaults
    max_concurrent_agents: int = 50
    total_agents: int = 1000
    expert_agents: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def has_any_api_key(self) -> bool:
        """Check if at least one LLM API key is configured."""
        return bool(self.openai_api_key or self.anthropic_api_key or self.google_api_key)


settings = Settings()
