# Sybil Swarm — Codebase Summary

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point + CORS + router setup
│   ├── config.py                    # Pydantic Settings (BYOK env vars)
│   ├── database.py                  # SQLite setup + session management
│   ├── models/
│   │   ├── __init__.py
│   │   └── simulation.py            # SQLModel: Simulation, Persona, AgentResponse, SimulationReport
│   ├── routes/
│   │   ├── __init__.py
│   │   └── simulations.py           # REST endpoints + SSE streaming
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── simulation.py            # Pydantic request/response schemas
│   └── services/
│       ├── __init__.py
│       ├── llm_client.py            # litellm wrapper (retry + tier routing + BYOK)
│       ├── input_parser.py          # URL scraping + text parsing (SSRF protected)
│       ├── persona_generator.py     # Batch persona synthesis
│       ├── simulation_engine.py     # Main orchestrator (personas → agents → aggregation)
│       ├── aggregator.py            # Stats + synthesis report generation
│       └── prompts.py               # Prompt templates (system + user)
├── requirements.txt
├── Dockerfile
└── entrypoint.sh

frontend/
├── src/
│   └── app/
│       ├── page.tsx                 # Landing page + simulation UI
│       ├── layout.tsx               # RootLayout, metadata
│       └── globals.css              # Dark mode + Tailwind + glowing effects
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js

docker/
├── docker-compose.yml               # Backend (8000) + Frontend (3000) + SQLite volume
└── .env.example                     # Env template

.github/
└── workflows/                       # CI/CD (if any)
```

## Key Files Overview

### Backend Core

**app/main.py**
- FastAPI entry point (title, description, version)
- Lifespan context: DB initialization on startup
- CORS middleware: Allow localhost:3000 in dev
- Router registration: `/api/simulations`
- Health check: `GET /health`

**app/config.py**
- Pydantic Settings with .env support
- LLM API keys: openai_api_key, anthropic_api_key, google_api_key (BYOK)
- Model tiers: bulk_model=gpt-4o-mini, expert_model=gpt-4o, synthesis_model=gpt-4o
- Server: backend_port=8000, database_url=sqlite
- Simulation defaults: max_concurrent_agents=50, total_agents=1000, expert_agents=10

**app/database.py**
- SQLModel engine setup with SQLite
- Dependency: get_session() for route handlers

### Data Models (app/models/simulation.py)

**SimulationStatus Enum**
- PENDING, GENERATING_PERSONAS, SIMULATING, AGGREGATING, COMPLETED, FAILED

**AgentTier Enum**
- BULK (cost-efficient, 900 agents)
- EXPERT (higher quality, ~90 agents)
- SYNTHESIS (narrative, 1 agent)

**Simulation Table**
- id (PK), product_input (URL or text), product_info (JSON parsed), status, total_agents, completed_agents, created_at, completed_at, error_message

**Persona Table**
- id (PK), simulation_id (FK), name, age, occupation, income_bracket, interests (JSON), pain_points (JSON), tech_savvy (1-10), personality_type (analytical/emotional/pragmatic/skeptical/enthusiast), tier (AgentTier)

**AgentResponse Table**
- id (PK), simulation_id (FK), persona_id (FK), tier, first_impression, willingness_to_pay (0-100), purchase_decision (bool), reasoning, sentiment_score (-1.0 to 1.0), objections (JSON), suggestions (JSON), created_at

**SimulationReport Table**
- id (PK), simulation_id (FK, unique), overall_score, conversion_rate, avg_willingness_to_pay, sentiment_distribution (JSON), top_objections (JSON), top_suggestions (JSON), market_segments (JSON), synthesis_narrative (text), created_at

### LLM Integration (app/services/llm_client.py)

**Tier Model Routing**
- BULK → gpt-4o-mini (low cost, bulk personas)
- EXPERT → gpt-4o (higher quality)
- SYNTHESIS → gpt-4o (narrative)

**llm_call()**
- Async wrapper around litellm.acompletion
- Accepts messages, tier, json_mode, temperature
- Manages API key routing based on model provider (OpenAI/Anthropic/Google)
- Retries up to 3x with exponential backoff (1-10s)
- Timeout: 60s per call
- Concurrency semaphore: limits to max_concurrent_agents

**llm_call_json()**
- Calls llm_call with json_mode=True
- Parses response as JSON
- Retries on parse failure (2x)

**_get_api_key_for_model()**
- Routes API key based on model name prefix
- claude/anthropic → anthropic_api_key
- gemini/google → google_api_key
- gpt-*,o1-* → openai_api_key

### Input Parsing (app/services/input_parser.py)

**parse_product_input()**
- Detects URL vs plain text
- URL: fetch via requests (timeout=10s, SSRF safe)
- Extract: title, description, content from HTML (BeautifulSoup)
- Text: return as-is
- Return normalized JSON: {url, title, description, content, source}

**SSRF Protection**
- Timeout on fetch
- Allowlist of safe domains (if configured)
- Domain/IP validation

### Persona Generation (app/services/persona_generator.py)

**generate_personas_batch()**
- Input: product_info (JSON), count (int, default 1000)
- Distribute across tiers: ~900 BULK, ~90 EXPERT, ~10 SYNTHESIS
- For each batch, call LLM with prompt template
- Extract JSON: [{name, age, occupation, income_bracket, interests, pain_points, tech_savvy, personality_type, tier}, ...]
- Stream progress events via callback (for SSE)

### Simulation Engine (app/services/simulation_engine.py)

**run_simulation()**
- Main orchestrator
- Input: simulation_id, product_info, persona_generator, llm_client
- Workflow:
  1. Update status → GENERATING_PERSONAS
  2. Generate personas (stream progress)
  3. Update status → SIMULATING
  4. For each persona, call route_agent_evaluation() (concurrent via semaphore)
  5. Store AgentResponse records
  6. Update status → AGGREGATING
  7. Call aggregator to compute metrics + synthesis
  8. Update status → COMPLETED
- Error handling: catch exceptions, set status → FAILED, store error_message

**route_agent_evaluation()**
- Input: persona, product_info, simulation_id
- Select LLM tier based on persona.tier
- Construct evaluation prompt
- Parse JSON response
- Return: {first_impression, willingness_to_pay, purchase_decision, reasoning, sentiment_score, objections, suggestions}

### Aggregation & Synthesis (app/services/aggregator.py)

**aggregate_responses()**
- Compute metrics from all AgentResponse records
- conversion_rate = (count of purchase_decision==True) / total * 100
- avg_willingness_to_pay = mean of willingness_to_pay
- sentiment_distribution = {positive, neutral, negative} counts
- top_objections = frequency-ranked list of JSON objections
- top_suggestions = frequency-ranked list of JSON suggestions
- market_segments = group by income_bracket / personality_type (analyze each segment)

**generate_synthesis_report()**
- Input: simulation, aggregated_metrics
- Call synthesis LLM with narrative prompt
- LLM generates final human-readable report
- Return: synthesis_narrative (string)

### Prompt Templates (app/services/prompts.py)

**PERSONA_SYSTEM_PROMPT**
- Role: You are a demographic analyst generating synthetic customer personas.

**PERSONA_USER_PROMPT**
- Input: product_info
- Output format: JSON array of N personas
- Constraints: Diverse income, interests, tech_savvy, personality_type

**EVALUATION_SYSTEM_PROMPT**
- Role: You are a customer evaluating a product from a specific persona perspective.

**EVALUATION_USER_PROMPT**
- Input: product_info, persona (name, age, occupation, interests, pain_points, etc.)
- Output: JSON with {first_impression, willingness_to_pay, purchase_decision, reasoning, sentiment_score, objections, suggestions}

**SYNTHESIS_SYSTEM_PROMPT**
- Role: You are a strategic business analyst synthesizing market research data.

**SYNTHESIS_USER_PROMPT**
- Input: product_info, aggregated metrics (conversion_rate, avg_wtp, sentiment, objections, suggestions)
- Output: narrative report with key insights, risks, opportunities

### REST API (app/routes/simulations.py)

**POST /api/simulations**
- Request: {product_input: str}
- Response: {id, status, created_at}
- Creates Simulation record, starts async task

**GET /api/simulations/{simulation_id}**
- Response: {id, product_input, product_info, status, total_agents, completed_agents, created_at, completed_at, error_message}

**GET /api/simulations/{simulation_id}/stream**
- SSE streaming endpoint
- Streams events: {"type": "progress", "data": {"stage": "...", "progress": X%}}
- Client reconnects on disconnect (automatic retry)

**GET /api/simulations/{simulation_id}/report**
- Response: SimulationReport (after COMPLETED)
- Includes metrics, objections, suggestions, synthesis_narrative

### Frontend (frontend/src/app/page.tsx)

**Landing Page**
- Hero section: Tagline + CTA
- Input form: URL or text input
- Simulation live view: Progress bars (personas, agents), metrics updates
- Report view: Conversion rate, sentiment, top objections, synthesis narrative
- Dark mode: Tailwind dark mode + custom glowing CSS effects
- Responsive: Mobile-first design

---

## Database Schema

SQLite (created via SQLModel on startup):
- simulation (id, product_input, product_info, status, total_agents, completed_agents, created_at, completed_at, error_message)
- persona (id, simulation_id, name, age, occupation, income_bracket, interests, pain_points, tech_savvy, personality_type, tier)
- agent_response (id, simulation_id, persona_id, tier, first_impression, willingness_to_pay, purchase_decision, reasoning, sentiment_score, objections, suggestions, created_at)
- simulation_report (id, simulation_id, overall_score, conversion_rate, avg_willingness_to_pay, sentiment_distribution, top_objections, top_suggestions, market_segments, synthesis_narrative, created_at)

## Dependencies

**Backend** (app/requirements.txt)
- fastapi, uvicorn (web framework)
- sqlmodel, sqlalchemy (ORM)
- litellm (LLM unified API)
- tenacity (retry library)
- requests, beautifulsoup4 (web scraping)
- pydantic-settings (config)
- python-multipart (form parsing)

**Frontend** (package.json)
- next, react, typescript
- tailwindcss, postcss
- axios (HTTP client)
- shadcn/ui (optional, for components)

---

Last updated: 2026-03-15
