<div align="center">

# 🔮 Sybil Swarm

### Meet your first 1,000 customers before you build.

**An open-source swarm intelligence engine that simulates AI-powered synthetic customers to validate your product idea — before you write a single line of code or spend a dollar on ads.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)

[Quick Start](#-quick-start) · [How It Works](#-how-it-works) · [Demo](#-live-demo) · [API](#-api) · [Contributing](#-contributing)

</div>

---

## 🤯 The Problem

You have a startup idea. You **think** people will pay for it. But you don't know for sure.

Traditional validation costs **weeks** and **thousands of dollars** — user interviews, landing page A/B tests, survey panels. Most founders skip it entirely and build blindly.

## 💡 The Solution

**Sybil Swarm spawns 1,000 AI agents** — each with a unique persona (age, job, income, personality, interests) — and has them evaluate your product as if they were real potential customers.

In minutes, you get:
- 🎯 **Conversion rate prediction** — what % would actually buy
- 💬 **Brutally honest feedback** — from skeptics and enthusiasts alike
- 📊 **Sentiment analysis** — real-time heatmap of opinions
- 🚫 **Top objections** — what's stopping people from buying
- 💡 **Top suggestions** — what would make them buy
- 📝 **Full market report** — downloadable, shareable with investors

---

## 🎬 Demo

<div align="center">

[![Sybil Swarm Demo](https://img.youtube.com/vi/kUqR5mokjSs/maxresdefault.jpg)](https://youtu.be/kUqR5mokjSs)

**[▶ Watch Full Demo on YouTube](https://youtu.be/kUqR5mokjSs)**

</div>

---

## 🎮 Features

<div align="center">

### The Simulation World

Watch 1,000 AI agents evaluate your product in real-time. Buyers cluster right (green), rejectors drift left (red). Expert agents glow.

```
┌─────────────────────────────────────────────────────────────┐
│  REJECT ZONE              │              BUY ZONE           │
│                           │                                 │
│        🔴  🟠             │           🟢  🟢               │
│     🔴     🟠  🟠        │        🟢                       │
│        🟠                 │     🟡    🟢  🟢               │
│  🔴       🟠   🟡        │           ✨🟢 (expert)         │
│     🔴  🟠               │        🟢     🟢               │
│                           │                                 │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Components

| Component | Description |
|-----------|-------------|
| 🌍 **Simulation World** | Canvas-based 2D world with animated agent avatars, particle effects, speech bubbles |
| 🟥🟨🟩 **Sentiment Heatmap** | Color-coded grid that fills up as agents complete — THE screenshot moment |
| 📰 **Live Agent Feed** | Twitter-like stream of agent reactions with Framer Motion animations |
| 📊 **Conversion Funnel** | Aware → Interested → Willing to Pay → Would Buy |
| 💬 **Agent Chat** | Click any agent to chat with them — they stay in character |
| 📋 **Market Report** | AI-synthesized analysis with score, objections, recommendations |

</div>

---

## 🏗 How It Works

```
Your Product URL or Description
         ↓
   🔍 Input Parser (scrapes URL or parses text)
         ↓
   🧬 Persona Generator (creates diverse synthetic customers)
         ↓
   ┌─────────────────────────────────────────┐
   │  🧠 Swarm Simulation Engine             │
   │                                         │
   │  990 Bulk Agents   → fast evaluation    │
   │   10 Expert Agents → deep analysis      │
   │    1 Synthesis Agent → final report     │
   │                                         │
   │  All running in parallel via asyncio    │
   └─────────────────────────────────────────┘
         ↓
   📊 Aggregator → stats, sentiment, clustering
         ↓
   📋 Market Prediction Report
   • Viability score (0-100)
   • Conversion rate prediction
   • Top objections & suggestions
   • Go/No-Go recommendation
```

### 🎯 Target Audience Filter (Optional)

Define who your customers are before simulation:

| Field | Example |
|-------|---------|
| Age Range | `18-35` |
| Gender | `any`, `male`, `female` |
| Interests | `tech, fitness, gaming` |
| Occupation | `software developer, student` |
| Income Level | `low`, `medium`, `high` |
| Location | `Vietnam`, `US`, `Southeast Asia` |

Personas are generated to match your target market — making the simulation dramatically more accurate.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- At least one LLM API key (OpenAI, Anthropic, Google, or Alibaba Qwen)

### 1. Clone & Install

```bash
git clone https://github.com/nghiahsgs/Sybil-Swarm.git
cd Sybil-Swarm

# Install backend
cd backend && pip install -e ".[dev]" && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env — add your LLM API key
```

**Free option:** Use [Alibaba Qwen](https://modelstudio.alibabacloud.com/) — 1M free tokens per model:

```env
OPENAI_API_KEY=sk-your-dashscope-key
OPENAI_API_BASE=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
BULK_MODEL=openai/qwen-plus
EXPERT_MODEL=openai/qwen-max
SYNTHESIS_MODEL=openai/qwen-max
```

### 3. Run

```bash
# Start backend (port 8000)
cd backend && uvicorn app.main:app --reload --port 8000

# Start frontend (port 3000) — in another terminal
cd frontend && npm run dev
```

Open **http://localhost:3000** → Enter your product URL or description → Launch Simulation 🚀

### Or with Docker:

```bash
cp .env.example .env  # edit with your API key
make docker-up
```

---

## 📡 API

```bash
# Create a simulation
curl -X POST http://localhost:8000/api/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "product_input": "https://your-landing-page.com",
    "total_agents": 100,
    "target_audience": {
      "age_range": "25-40",
      "interests": "SaaS, productivity",
      "income_level": "high"
    }
  }'

# Stream live results (SSE)
curl http://localhost:8000/api/simulations/1/stream

# Get the report
curl http://localhost:8000/api/simulations/1/report

# Download as Markdown
curl http://localhost:8000/api/simulations/1/report/download?format=md

# Chat with an agent (WebSocket)
wscat -c ws://localhost:8000/api/simulations/1/agents/1/chat
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/simulations` | Create & start simulation |
| `GET` | `/api/simulations/{id}` | Get status & details |
| `GET` | `/api/simulations/{id}/stream` | SSE live progress |
| `GET` | `/api/simulations/{id}/agents` | List agent responses |
| `GET` | `/api/simulations/{id}/report` | Get report data |
| `GET` | `/api/simulations/{id}/report/download` | Download MD report |
| `WS` | `/api/simulations/{id}/agents/{id}/chat` | Chat with agent |

---

## 🏛 Architecture

```
sybil-swarm/
├── backend/              # Python FastAPI
│   ├── app/
│   │   ├── main.py       # App entry + CORS + lifespan
│   │   ├── config.py     # BYOK settings (Pydantic)
│   │   ├── database.py   # SQLite + SQLModel
│   │   ├── models/       # Simulation, Persona, AgentResponse, Report
│   │   ├── services/
│   │   │   ├── llm_client.py          # litellm wrapper + retry + tier routing
│   │   │   ├── input_parser.py        # URL scraping (SSRF-protected)
│   │   │   ├── persona_generator.py   # Batch persona creation
│   │   │   ├── simulation_engine.py   # Async parallel orchestrator + SSE
│   │   │   ├── aggregator.py          # Stats + synthesis
│   │   │   ├── chat_service.py        # WebSocket agent chat
│   │   │   └── report_generator.py    # Markdown report
│   │   ├── routes/       # REST + SSE + WebSocket endpoints
│   │   └── schemas/      # Pydantic request/response types
│   └── tests/
├── frontend/             # Next.js 16 + TypeScript
│   └── src/
│       ├── app/          # Landing page + simulation dashboard
│       ├── components/   # SimulationWorld, Heatmap, Feed, Chat, Report
│       └── lib/          # API client, SSE hook, WebSocket hook, types
├── docker/               # Docker Compose
└── .github/workflows/    # CI (lint + test + build)
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| **No agent framework** | CrewAI/LangGraph are overkill for batch LLM calls. Custom async + semaphore is simpler and faster. |
| **litellm** | Unified interface for OpenAI/Anthropic/Google/Qwen. One code path, any provider. |
| **3-tier models** | 990 cheap (fast + affordable) + 10 expert (deep analysis) + 1 synthesis (narrative). |
| **SSE for dashboard** | One-way stream, simpler than WebSocket. WebSocket only for chat (bidirectional). |
| **SQLite** | Zero-config, sufficient for single-user. Good enough for MVP. |
| **Canvas 2D** | Lightweight, no Three.js dependency. 60fps with 1000 agents. |

---

## ⚙️ Configuration

### Model Support

Works with **any OpenAI-compatible API**:

| Provider | Models | Config |
|----------|--------|--------|
| **OpenAI** | gpt-4o-mini, gpt-4o | `OPENAI_API_KEY=sk-...` |
| **Anthropic** | claude-haiku, claude-sonnet | `ANTHROPIC_API_KEY=sk-ant-...` |
| **Google** | gemini-flash, gemini-pro | `GOOGLE_API_KEY=AI...` |
| **Alibaba Qwen** | qwen-plus, qwen-max | `OPENAI_API_BASE=https://dashscope-intl...` |
| **Any proxy** | Any model | `OPENAI_API_BASE=http://your-proxy:port/v1` |

### Environment Variables

```env
# LLM Keys (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Custom API base (for proxies)
OPENAI_API_BASE=

# Model tiers
BULK_MODEL=gpt-4o-mini        # Fast agent (990 agents)
EXPERT_MODEL=gpt-4o           # Deep analysis (10 agents)
SYNTHESIS_MODEL=gpt-4o        # Final report (1 agent)

# Tuning
MAX_CONCURRENT_AGENTS=50      # Parallel LLM calls
TOTAL_AGENTS=1000             # Default agent count
EXPERT_AGENTS=10              # Expert tier count
```

---

## 🌟 Why "Sybil Swarm"?

Named after the [**Sibyls**](https://en.wikipedia.org/wiki/Sibyl) — the prophetic oracles of ancient Greece who could see the future. Sybil Swarm channels 1,000 digital oracles to predict your product's market fate.

**Swarm** because the power isn't in any single agent — it's in the emergent intelligence of the collective.

---

## 🤝 Contributing

Contributions welcome! See [issues](https://github.com/nghiahsgs/Sybil-Swarm/issues) for ideas.

```bash
# Dev setup
make install
make dev        # Start both backend + frontend
make test       # Run tests
make lint       # Run linters
```

---

## 📄 License

MIT — Use it, fork it, ship it.

---

<div align="center">

**Built with** 🐍 FastAPI · ⚛️ Next.js · 🤖 litellm · 🎨 shadcn/ui · ✨ Framer Motion

*Stop guessing. Start simulating.*

</div>
