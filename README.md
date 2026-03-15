# 🔮 Sybil Swarm

> **Meet your first 1,000 customers before you build.**

Sybil Swarm is an open-source **swarm intelligence engine** that simulates 1,000 AI-powered synthetic customers to validate your product idea — before you write a single line of code or spend a dollar on ads.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

---

## How It Works

```
Your Landing Page / Product Idea
         ↓
   Input Parser (URL scrape or text)
         ↓
   Persona Generator (1,000 diverse synthetic customers)
         ↓
   ┌─────────────────────────────────────┐
   │  🧠 Swarm Simulation Engine        │
   │                                     │
   │  990 Bulk Agents (fast, cheap LLM)  │
   │   10 Expert Agents (deep analysis)  │
   │    1 Synthesis Agent (final report) │
   └─────────────────────────────────────┘
         ↓
   Market Prediction Report
   • Conversion rate prediction
   • Top objections & suggestions
   • Sentiment analysis
   • Go/No-Go recommendation
```

## Features

- **🎯 BYOK (Bring Your Own Key)** — Use your own OpenAI, Anthropic, or Google API key. No vendor lock-in.
- **⚡ Multi-Tier Intelligence** — 990 cheap agents for breadth + 10 expert agents for depth + 1 synthesis agent for the final verdict.
- **📡 Real-Time Streaming** — Watch agents evaluate your product live via SSE.
- **🧬 Diverse Personas** — Age, income, personality type, tech savviness — each agent is unique.
- **📊 Brutally Honest Reports** — No sugar-coating. Get the truth about your product.
- **🐳 Docker Ready** — `docker compose up` and you're running.

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/sybil-swarm.git
cd sybil-swarm

# Set up your API key
cp .env.example .env
# Edit .env — add at least one LLM API key

# Install & run
make install
make dev

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

### Or with Docker:

```bash
cp .env.example .env
# Edit .env with your API key
make docker-up
```

## API

```bash
# Start a simulation
curl -X POST http://localhost:8000/api/simulations \
  -H "Content-Type: application/json" \
  -d '{"product_input": "https://your-landing-page.com", "total_agents": 100}'

# Stream live results
curl http://localhost:8000/api/simulations/1/stream

# Get the report
curl http://localhost:8000/api/simulations/1/report
```

## Architecture

```
sybil-swarm/
├── backend/          # Python FastAPI
│   ├── app/
│   │   ├── services/ # Core engine (persona gen, simulation, aggregation)
│   │   ├── models/   # SQLModel data models
│   │   ├── routes/   # REST + SSE endpoints
│   │   └── schemas/  # Request/response types
│   └── tests/
├── frontend/         # Next.js + shadcn/ui
│   └── src/app/      # App Router pages
└── docker/           # Docker Compose config
```

## Model Configuration

| Tier | Default Model | Purpose | Count |
|------|--------------|---------|-------|
| Bulk | `gpt-4o-mini` | Fast persona reactions | 990 |
| Expert | `gpt-4o` | Deep domain analysis | 10 |
| Synthesis | `gpt-4o` | Final market report | 1 |

Override in `.env`:
```env
BULK_MODEL=claude-haiku-4-5-20251001
EXPERT_MODEL=claude-sonnet-4-6
SYNTHESIS_MODEL=claude-opus-4-6
```

## Inspired By

Named after the [Sibyls](https://en.wikipedia.org/wiki/Sibyl) — the prophetic oracles of ancient Greece who could see the future. Sybil Swarm channels 1,000 digital oracles to predict your product's market fate.

## License

MIT — Use it, fork it, ship it.
