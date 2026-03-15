# Sybil Swarm — Bootstrap Implementation Plan

**Date:** 2026-03-15 | **Status:** In Progress | **Goal:** MVP that demos well, earns GitHub stars

> "Meet your first 1,000 customers before you build"

---

## Architecture Summary

```
Next.js Frontend (shadcn/ui + Framer Motion)
    ↕ WebSocket + REST
FastAPI Backend (async)
    ↓ Batch LLM calls (asyncio + litellm)
Multi-Provider LLM (BYOK: OpenAI / Anthropic / Google)
    ↓ Tiered: 990 cheap + 10 expert + 1 synthesis
SQLite (simulations, personas, reports)
```

## Phases

| # | Phase | Priority | Status | File |
|---|-------|----------|--------|------|
| 1 | Project Scaffold & DevOps | P0 | DONE | [phase-01-project-scaffold.md](./phase-01-project-scaffold.md) |
| 2 | Backend Core — Persona Engine & Simulation Pipeline | P0 | DONE | [phase-02-backend-core.md](./phase-02-backend-core.md) |
| 3 | Frontend Dashboard & Real-Time Feed | P0 | TODO | [phase-03-frontend-dashboard.md](./phase-03-frontend-dashboard.md) |
| 4 | Agent Chat & Report Generation | P1 | TODO | [phase-04-agent-chat-reports.md](./phase-04-agent-chat-reports.md) |
| 5 | README, Visuals & Launch Prep | P1 | TODO | [phase-05-readme-launch-prep.md](./phase-05-readme-launch-prep.md) |
| 6 | Polish, Testing & Docker | P2 | TODO | [phase-06-polish-testing-docker.md](./phase-06-polish-testing-docker.md) |

## Key Decisions

- **No agent framework** — custom batch LLM calls via litellm (CrewAI/LangGraph overkill for batch persona evals)
- **SSE for dashboard feed** (simpler), WebSocket for agent chat (bidirectional)
- **litellm** for multi-provider BYOK (OpenAI/Anthropic/Google unified interface)
- **SQLite** — zero-config, sufficient for single-user MVP
- **Monorepo** — `/backend` + `/frontend` + `/docker`

## Success Metrics

- [ ] User inputs URL → gets market report in <3 min
- [ ] Live agent feed visible during simulation
- [ ] Can chat with individual agents post-sim
- [ ] `docker compose up` works end-to-end
- [ ] README has GIF, architecture diagram, badges
- [ ] First 100 GitHub stars within 2 weeks of launch

## Research

- [Multi-Agent Frameworks](./research/researcher-01-multi-agent-frameworks.md)
- [Viral README & Frontend](./research/researcher-02-viral-readme-frontend.md)
