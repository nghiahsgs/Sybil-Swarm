# Phase 06 — Polish, Testing & Docker

## Context

- [plan.md](./plan.md)
- [Phase 05](./phase-05-readme-launch-prep.md)
- All prior phases must be functional before polish

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-03-15 |
| Description | E2E testing, error handling hardening, Docker production config, performance tuning |
| Priority | P2 |
| Status | TODO |

## Key Insights

- `docker compose up` must work first try — single biggest contributor OSS adoption barrier
- Error messages must be user-friendly (no raw tracebacks)
- Test coverage on critical path: simulation pipeline + aggregation
- Performance: 1000 agents in <3 min is the target

## Requirements

- Backend unit tests (pytest): services + routes
- Frontend component tests (vitest): key components
- E2E test: full simulation flow
- Docker production config with health checks
- Error handling: graceful failures, user-friendly messages
- Performance: benchmarks for 100/500/1000 agents
- Logging: structured JSON logs

## Architecture

### Test Structure

```
backend/tests/
├── test_input_parser.py
├── test_persona_generator.py
├── test_simulation_engine.py
├── test_aggregator.py
├── test_llm_client.py
├── test_routes.py
└── conftest.py           # Fixtures: mock LLM, test DB

frontend/src/__tests__/
├── agent-feed.test.tsx
├── sentiment-heatmap.test.tsx
├── use-sse.test.ts
└── api-client.test.ts
```

### Docker Production

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    healthcheck:
      test: curl -f http://localhost:8000/health
      interval: 30s
    volumes:
      - db-data:/app/data

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on:
      backend:
        condition: service_healthy
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000

volumes:
  db-data:
```

## Related Code Files

- `backend/tests/` — All backend test files
- `frontend/src/__tests__/` — Frontend test files
- `docker/docker-compose.yml` — Production compose
- `backend/Dockerfile` — Multi-stage Python build
- `frontend/Dockerfile` — Multi-stage Node build
- `backend/app/middleware/error-handler.py` — Global error handling

## Implementation Steps

1. **Backend Tests**
   - Mock litellm calls (return canned responses)
   - Test input parser: valid URL, invalid URL, text-only
   - Test persona generator: diversity validation, batch size
   - Test simulation engine: correct tier routing, aggregation math
   - Test routes: status codes, response schemas

2. **Frontend Tests**
   - Agent feed: renders cards, handles streaming data
   - Heatmap: correct color mapping, hover tooltip
   - SSE hook: connection, reconnect, event parsing
   - API client: key header injection, error handling

3. **Error Handling Hardening**
   - Global exception handler middleware (FastAPI)
   - Structured error responses: `{error: string, code: string, detail?: string}`
   - LLM failures: retry 3x → fallback model → graceful error to user
   - Invalid API key: clear message + link to setup guide
   - Network timeouts: per-request timeout + user notification

4. **Docker Production**
   - Backend: multi-stage (builder + slim runtime)
   - Frontend: build stage + nginx serve
   - Health checks on both services
   - Volume for SQLite persistence
   - `.dockerignore` for both services

5. **Performance Tuning**
   - Benchmark: time 100/500/1000 agent simulations
   - Tune semaphore concurrency based on provider rate limits
   - Optimize persona generation (fewer, larger batches)
   - Frontend: verify virtualized list handles 1000 items

6. **Logging**
   - structlog for JSON logging (backend)
   - Log levels: simulation lifecycle, LLM calls, errors
   - No PII in logs (redact API keys)

## Todo

- [ ] Backend unit tests (pytest)
- [ ] Frontend component tests (vitest)
- [ ] Global error handler middleware
- [ ] Structured error responses
- [ ] LLM fallback chain
- [ ] Docker multi-stage builds
- [ ] Docker health checks
- [ ] .dockerignore files
- [ ] Performance benchmarks
- [ ] Structured logging setup
- [ ] E2E smoke test script

## Success Criteria

- `pytest` passes with >80% coverage on services/
- `vitest` passes for key components
- `docker compose up` → full simulation works first try
- No raw tracebacks shown to user
- 1000 agents complete in <3 min (with gpt-4o-mini equivalent)
- Logs are structured JSON, no sensitive data

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docker build fails on different OS | High | Test on Linux + macOS; CI matrix |
| Test mocks drift from real API | Medium | Integration test suite (optional, uses real API) |
| SQLite locking under concurrent writes | Low | WAL mode + single-writer pattern |

## Security Considerations

- Docker runs as non-root user
- No API keys baked into images
- SQLite file permissions restricted
- Health endpoint doesn't expose internals

## Next Steps

→ Launch! Follow [Phase 05 launch checklist](./phase-05-readme-launch-prep.md)

## Unresolved Questions

1. CI/CD: auto-deploy to demo server or self-host only?
2. Rate limit strategy: per-user or global?
3. SQLite vs Postgres upgrade trigger: concurrent users threshold?
