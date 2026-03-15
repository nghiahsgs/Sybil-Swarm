# Phase 01 — Project Scaffold & DevOps

## Context

- [plan.md](./plan.md)
- [Research: Multi-Agent Frameworks](./research/researcher-01-multi-agent-frameworks.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-03-15 |
| Description | Monorepo scaffold, CI, linting, env config, dependency setup |
| Priority | P0 |
| Status | DONE |
| Completion Date | 2026-03-15 |

## Key Insights

- Monorepo keeps deployment simple for OSS contributors
- Pre-commit hooks + CI prevent quality regression early
- BYOK requires env var management from day 1

## Requirements

- Python 3.12+ backend with FastAPI
- Node 20+ frontend with Next.js 16
- Shared Docker Compose config
- GitHub Actions CI for lint + test
- .env.example with all BYOK keys documented

## Architecture

```
sybil-swarm/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── routes/              # API route modules
│   │   ├── services/            # Business logic
│   │   ├── models/              # SQLite models (SQLModel)
│   │   └── schemas/             # Pydantic request/response
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   ├── components/          # UI components
│   │   ├── lib/                 # Utils, API client, hooks
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker/
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── README.md
├── LICENSE
└── Makefile
```

## Related Code Files

- `backend/app/main.py` — FastAPI app with CORS, lifespan
- `backend/app/config.py` — Pydantic settings (LLM keys, DB path)
- `frontend/src/app/layout.tsx` — Root layout with providers
- `docker/docker-compose.yml` — Backend + frontend + volumes
- `Makefile` — dev, build, test, lint shortcuts

## Implementation Steps

1. Init monorepo structure with all directories
2. Backend: `pyproject.toml` with deps (fastapi, uvicorn, litellm, sqlmodel, pydantic-settings)
3. Backend: `main.py` with health endpoint, CORS middleware
4. Backend: `config.py` with `Settings` class (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, DATABASE_URL)
5. Frontend: `npx create-next-app` with TypeScript, Tailwind, App Router
6. Frontend: Install shadcn/ui, framer-motion, lucide-react
7. Docker: Compose file with backend (port 8000) + frontend (port 3000)
8. CI: GitHub Actions — backend lint (ruff) + test (pytest), frontend lint (eslint) + build
9. Makefile with targets: `dev-backend`, `dev-frontend`, `dev` (both), `test`, `lint`, `docker-up`
10. `.env.example` with all keys documented
11. MIT LICENSE file
12. `.gitignore` for Python + Node

## Todo

- [ ] Create monorepo directory structure
- [ ] Set up backend pyproject.toml + deps
- [ ] FastAPI app with health check
- [ ] Pydantic settings config
- [ ] Next.js app scaffold
- [ ] Install shadcn/ui + framer-motion
- [ ] Docker Compose
- [ ] GitHub Actions CI
- [ ] Makefile
- [ ] .env.example, LICENSE, .gitignore

## Success Criteria

- `make dev` starts both backend (8000) + frontend (3000)
- `GET /health` returns 200
- Frontend renders landing page
- `docker compose up` builds and runs
- CI passes on push

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dep version conflicts | Medium | Pin all major versions |
| Docker build slow | Low | Multi-stage builds, layer caching |

## Security Considerations

- Never commit .env (only .env.example)
- API keys loaded via env vars, never hardcoded
- CORS restricted to localhost in dev

## Next Steps

→ [Phase 02: Backend Core](./phase-02-backend-core.md)
