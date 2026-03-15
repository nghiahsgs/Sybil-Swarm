# CLAUDE.md — Sybil Swarm

## Project Overview
Open-source swarm intelligence engine for product/startup validation.
Spawns 1,000 AI agents with diverse personas to evaluate a product idea.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, litellm, SQLModel, SQLite
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Infra:** Docker Compose, GitHub Actions CI

## Architecture
Monorepo: `backend/` + `frontend/` + `docker/`

### Backend Core Pipeline
1. Input Parser → scrape URL or parse text
2. Persona Generator → batch LLM calls (50 personas/call)
3. Simulation Engine → async parallel agent evals (semaphore-controlled)
4. Aggregator → stats + synthesis report via LLM

### Key Patterns
- BYOK: Users provide own API keys via `.env`
- Multi-tier: 990 bulk (cheap) + 10 expert + 1 synthesis agent
- SSE for real-time streaming, REST for CRUD
- litellm for unified multi-provider LLM interface

## Commands
```bash
make dev          # Start backend + frontend
make test         # Run pytest
make lint         # Run ruff
make docker-up    # Docker compose
```

## Conventions
- Python: ruff for lint/format, pytest for tests
- Frontend: ESLint, TypeScript strict
- Kebab-case file names in services
- Conventional commits
