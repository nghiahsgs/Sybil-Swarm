# Sybil Swarm — Project Overview & PDR

## Vision

**Sybil Swarm**: Meet your first 1,000 customers before you build.

Open-source swarm intelligence engine that simulates customer feedback at scale. Startup founders and product managers validate product-market fit via AI-generated personas and multi-tier agent evaluations.

## Problem Statement

Early-stage founders risk months of development only to discover misaligned product-market fit. Manual customer research is slow and expensive. Need rapid, low-cost validation method that captures diverse customer perspectives.

## Solution

Generate synthetic personas from minimal product info. Route evaluations across:
- **Bulk agents** (cost-efficient, diverse perspectives)
- **Expert agents** (nuanced analysis, edge cases)
- **Synthesis agent** (aggregate insights, final report)

Stream responses live via SSE. Store results in SQLite. Export aggregated insights.

## Core Features

1. **BYOK LLM Pattern**: Use your own API keys (OpenAI, Anthropic, Google). Tier-based model selection (bulk=gpt-4o-mini, expert/synthesis=gpt-4o).
2. **Persona Generation**: Batched synthetic customer generation from product description or URL.
3. **Multi-Tier Agent Framework**: Bulk (speed), Expert (quality), Synthesis (narrative).
4. **Server-Sent Events (SSE)**: Real-time streaming of agent responses.
5. **Structured Output**: JSON extraction of metrics (willingness-to-pay, sentiment, objections, suggestions).
6. **Aggregation Engine**: Conversion rate, sentiment distribution, top objections/suggestions, market segment analysis.
7. **SSRF-Protected Input Parsing**: URL scraping with rate limiting and domain allowlist.

## Tech Stack

- **Backend**: FastAPI (Python) + SQLModel ORM + SQLite
- **Frontend**: Next.js (TypeScript) + React + Tailwind CSS
- **LLM**: litellm (unified API for OpenAI, Anthropic, Google)
- **Deployment**: Docker Compose (monorepo)
- **Architecture**: Monorepo (backend/ + frontend/ + docker/)

## Product Requirements

### Functional Requirements

| Req ID | Requirement | Status |
|--------|-------------|--------|
| FR-01  | Accept product URL or text description | In Progress |
| FR-02  | Generate N synthetic personas (default 1000) | In Progress |
| FR-03  | Stream persona generation progress via SSE | In Progress |
| FR-04  | Route personas to bulk/expert/synthesis tiers | In Progress |
| FR-05  | Collect structured agent responses (JSON) | In Progress |
| FR-06  | Aggregate metrics and generate synthesis report | In Progress |
| FR-07  | Persist all data to SQLite | In Progress |
| FR-08  | REST API for simulation CRUD + stream endpoint | In Progress |

### Non-Functional Requirements

| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-01 | Support up to 1000 concurrent personas | Configurable semaphore |
| NFR-02 | Retry LLM calls on transient failure (max 3) | Tenacity exponential backoff |
| NFR-03 | Timeout LLM calls after 60s | litellm timeout |
| NFR-04 | SSRF protection on URL parsing | Allowlist + requests timeouts |
| NFR-05 | Multi-provider key support (BYOK) | Config env vars |
| NFR-06 | Dark mode UI with glowing effects | Tailwind + custom CSS |

## Architecture

### System Diagram (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
│  Landing page → Input form → Stream results → View report   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP + SSE
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ Input Parser │  │   Persona    │  │ Simulation Engine │ │
│  │ (URL/text)   │  │  Generator   │  │ (tier routing)    │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
│         ↓                 ↓                    ↓             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LLM Client (litellm wrapper)               │   │
│  │  - BYOK routing (OpenAI/Anthropic/Google)            │   │
│  │  - Concurrency limiting (semaphore)                  │   │
│  │  - Retry logic (exponential backoff)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Aggregator + Synthesis                  │   │
│  │  - Metrics: conversion, sentiment, willingness-to-pay│   │
│  │  - Market segments, objections, suggestions          │   │
│  │  - AI narrative synthesis report                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│            Data Layer (SQLite + SQLModel)                    │
│  Tables: Simulation, Persona, AgentResponse, SimulationReport│
└──────────────────────────────────────────────────────────────┘
```

## Key Workflows

### 1. Simulation Initiation
- User submits product URL or text.
- Backend parses input, extracts product info.
- Creates Simulation record (status=PENDING).

### 2. Persona Generation (Streamed)
- Batch generate N personas from product info.
- Each persona assigned tier (BULK: 90%, EXPERT: 9%, SYNTHESIS: 1%).
- Send progress events via SSE to frontend in real-time.

### 3. Agent Simulation (Streamed)
- For each persona, route to appropriate LLM (tier-based model selection).
- LLM evaluates product from persona perspective.
- Extract: first_impression, willingness_to_pay, purchase_decision, sentiment_score, objections, suggestions.
- Store AgentResponse records. Stream updates via SSE.

### 4. Aggregation & Synthesis
- Calculate metrics: conversion_rate, avg_willingness_to_pay, sentiment_distribution.
- Identify top objections/suggestions (frequency-ranked).
- Segment market by demographics/interests.
- Call synthesis LLM to generate narrative report.
- Store SimulationReport. Return to frontend.

## Success Metrics

- Time-to-insights: < 5 minutes for 1000 personas + evaluations (parallel + efficient tier routing)
- Cost per simulation: < $5 USD (via BYOK + bulk model tier)
- Accuracy proxy: Alignment between synthesis recommendations and real market feedback (post-launch validation)
- Developer experience: < 10 min onboarding (clone, set API keys, run)

## Roadmap (v0.1 → v1.0)

| Phase | Focus | Timeframe |
|-------|-------|-----------|
| **v0.1** | MVP: Single product input, 1K personas, core tiers | Now |
| **v0.2** | API enhancements, better error handling, deployment docs | 2 weeks |
| **v0.3** | UI polish, export (CSV/PDF), history/replay | 4 weeks |
| **v1.0** | Multi-product campaigns, A/B testing, advanced filtering | 8 weeks |

---

Last updated: 2026-03-15 | Owner: Sybil Swarm Team
