# Phase 02 — Backend Core: Persona Engine & Simulation Pipeline

## Context

- [plan.md](./plan.md)
- [Phase 01](./phase-01-project-scaffold.md)
- [Research: Batch LLM Patterns](./research/researcher-01-multi-agent-frameworks.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-03-15 |
| Description | Core simulation pipeline: input parsing, persona generation, parallel agent evaluation, aggregation |
| Priority | P0 |
| Status | DONE |
| Completion Date | 2026-03-15 |

## Key Insights

- 1000 agents = batch LLM calls, NOT an agent framework
- litellm unifies OpenAI/Anthropic/Google under one interface
- Tiered model strategy: 990 cheap (haiku/gpt-4o-mini/flash) + 10 expert (opus/gpt-4o/pro) + 1 synthesis
- asyncio.gather with semaphore for concurrency control
- Persona diversity drives report quality — need demographic + psychographic + behavioral variety

## Requirements

- Accept product URL or text description as input
- Scrape URL to extract product info (title, description, pricing, features)
- Generate 1000 diverse personas (batched, cached)
- Run parallel agent evaluations with tiered models
- Aggregate results into structured data
- Store simulation state in SQLite
- Stream progress events via SSE

## Architecture

```
POST /api/simulations
    → InputParser (URL scrape or text)
    → PersonaGenerator (batch: 50 personas per LLM call)
    → SimulationEngine
        → 990 cheap agents (parallel, semaphore=50)
        → 10 expert agents (parallel)
        → 1 synthesis agent
    → Aggregator (stats, sentiment, conversion)
    → Store to SQLite
    → SSE stream throughout
```

### Data Models

```python
# Simulation
id, product_input, product_info, status, created_at, completed_at

# Persona
id, simulation_id, name, age, occupation, income, interests,
pain_points, tech_savvy, personality_type, tier (cheap|expert)

# AgentResponse
id, simulation_id, persona_id, tier, first_impression,
willingness_to_pay, purchase_decision, reasoning, sentiment_score,
objections, suggestions, raw_response

# SimulationReport
id, simulation_id, overall_score, conversion_rate, avg_wtp,
sentiment_distribution, top_objections, top_suggestions,
market_segments, synthesis_narrative
```

## Related Code Files

- `backend/app/services/input-parser.py` — URL scraping + text extraction
- `backend/app/services/persona-generator.py` — Batched persona creation
- `backend/app/services/simulation-engine.py` — Orchestrates agent runs
- `backend/app/services/llm-client.py` — litellm wrapper with retry/fallback
- `backend/app/services/aggregator.py` — Stats computation
- `backend/app/models/simulation.py` — SQLModel definitions
- `backend/app/routes/simulations.py` — REST + SSE endpoints

## Implementation Steps

1. **LLM Client** (`llm-client.py`)
   - Wrap litellm.acompletion with retry (tenacity), timeout, error handling
   - Model selection by tier: config maps tier → model name
   - Rate limit via asyncio.Semaphore (default 50 concurrent)

2. **Input Parser** (`input-parser.py`)
   - URL mode: httpx + BeautifulSoup → extract title, meta description, h1-h3, pricing elements
   - Text mode: pass through with basic structure extraction
   - Output: ProductInfo schema (name, description, features[], pricing, target_audience)

3. **Persona Generator** (`persona-generator.py`)
   - Single LLM call generates batch of 50 personas (JSON mode)
   - 20 batches = 1000 personas
   - Diversity enforcement: age ranges, income brackets, occupations, personality types
   - Prompt includes product context for relevance

4. **Simulation Engine** (`simulation-engine.py`)
   - Takes ProductInfo + list of Personas
   - Dispatches 990 cheap agent calls (semaphore-controlled)
   - Dispatches 10 expert agent calls
   - Each agent receives: persona + product info → returns structured evaluation
   - Collects all responses → passes to synthesis agent
   - Emits SSE events: `agent_started`, `agent_completed`, `phase_changed`

5. **Aggregator** (`aggregator.py`)
   - Computes: conversion rate, avg WTP, sentiment distribution
   - Clusters objections + suggestions (simple keyword grouping for MVP)
   - Identifies market segments by persona attributes
   - Feeds data to synthesis agent for narrative

6. **Database Models** (`models/simulation.py`)
   - SQLModel classes for Simulation, Persona, AgentResponse, SimulationReport
   - Auto-create tables on startup

7. **API Routes** (`routes/simulations.py`)
   - `POST /api/simulations` — create + start simulation (background task)
   - `GET /api/simulations/{id}` — get status + results
   - `GET /api/simulations/{id}/stream` — SSE endpoint for live progress
   - `GET /api/simulations/{id}/agents` — paginated agent responses

## Todo

- [ ] litellm client wrapper with retry + tier routing
- [ ] Input parser (URL scrape + text)
- [ ] Persona generator (batched, diverse)
- [ ] Simulation engine (async parallel, tiered)
- [ ] Aggregator (stats + clustering)
- [ ] SQLModel data models + auto-create
- [ ] REST API routes
- [ ] SSE streaming endpoint
- [ ] Agent prompt templates (cheap + expert + synthesis)
- [ ] Unit tests for each service

## Success Criteria

- POST with URL → 1000 agent responses in <3 min (with fast model)
- SSE stream emits events for each agent completion
- Aggregated stats are accurate (conversion rate, sentiment)
- Works with OpenAI, Anthropic, or Google API key
- Graceful degradation: if model unavailable, falls back

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM rate limits | High | Semaphore + exponential backoff + model fallback |
| Bad URL scraping | Medium | Fallback to text-only input; warn user |
| Persona homogeneity | Medium | Enforce diversity constraints in prompt + validation |
| Cost runaway | High | Token counting + budget cap per simulation |

## Security Considerations

- API keys stored in env, never logged or returned in responses
- Rate limit simulation creation (1 concurrent per API key)
- Sanitize scraped HTML to prevent injection
- Max input length enforcement

## Next Steps

→ [Phase 03: Frontend Dashboard](./phase-03-frontend-dashboard.md)
