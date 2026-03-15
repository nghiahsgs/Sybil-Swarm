# Phase 04 — Agent Chat & Report Generation

## Context

- [plan.md](./plan.md)
- [Phase 03](./phase-03-frontend-dashboard.md)
- MiroFish reference: post-simulation interaction is key differentiator

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-03-15 |
| Description | Post-simulation agent chat (WebSocket) + PDF/markdown report generation |
| Priority | P1 |
| Status | TODO |

## Key Insights

- Chatting with individual agents post-sim = unique value prop vs competitors
- Agent maintains persona consistency using original persona + response as context
- WebSocket needed here (bidirectional chat), unlike SSE for dashboard
- Report should be downloadable (PDF + Markdown) for stakeholder sharing
- Report is the "deliverable" — needs to look professional

## Requirements

- Click any agent in feed/heatmap → open chat panel
- Chat maintains persona: agent "remembers" who they are + their evaluation
- WebSocket for real-time chat messages
- Generate comprehensive market report post-simulation
- Report formats: in-app view, Markdown download, PDF export
- Report sections: executive summary, conversion analysis, objections, segments, recommendations

## Architecture

### Agent Chat Flow

```
Frontend (WebSocket)
    ↕ JSON messages
FastAPI WebSocket /api/simulations/{id}/agents/{agent_id}/chat
    → Load persona + agent response as system context
    → Stream LLM response back
    → Store chat history in SQLite
```

### Report Generation

```
GET /api/simulations/{id}/report
    → Load aggregated data
    → Synthesis agent generates narrative sections
    → Template renders Markdown
    → Optional: convert to PDF (weasyprint)
```

### Data Models

```python
# ChatMessage
id, simulation_id, persona_id, role (user|agent), content, created_at

# Report (extends SimulationReport)
executive_summary, methodology, detailed_findings,
segment_analysis, recommendations, raw_markdown
```

## Related Code Files

- `backend/app/routes/chat.py` — WebSocket chat endpoint
- `backend/app/services/chat-service.py` — Persona-contextualized chat
- `backend/app/services/report-generator.py` — Markdown + PDF report
- `backend/app/routes/reports.py` — Report download endpoints
- `frontend/src/components/chat-panel.tsx` — Slide-out chat UI
- `frontend/src/components/report-view.tsx` — In-app report display
- `frontend/src/lib/use-websocket.ts` — WebSocket hook

## Implementation Steps

1. **Chat Service** (`services/chat-service.py`)
   - Build system prompt: persona details + original evaluation + product info
   - Maintain conversation history (last 20 messages for context window)
   - Use expert-tier model for chat (quality matters in conversation)
   - Stream responses token-by-token via WebSocket

2. **WebSocket Route** (`routes/chat.py`)
   - `WS /api/simulations/{id}/agents/{agent_id}/chat`
   - Accept: `{message: string}`
   - Send: `{type: "token"|"complete", content: string}`
   - Persist messages to SQLite

3. **Chat Panel UI** (`components/chat-panel.tsx`)
   - Slide-out panel from right side (Framer Motion)
   - Shows agent persona card at top (name, age, occupation, sentiment)
   - Chat interface: message bubbles, streaming text, input field
   - "Ask the swarm" option — same question to 10 random agents

4. **Report Generator** (`services/report-generator.py`)
   - Template with sections: Executive Summary, Methodology, Market Fit Score,
     Conversion Analysis, Key Objections, Market Segments, Recommendations
   - Synthesis agent fills narrative sections from aggregated data
   - Output: structured Markdown string
   - PDF: weasyprint renders Markdown → styled PDF

5. **Report Routes** (`routes/reports.py`)
   - `GET /api/simulations/{id}/report` — JSON report data
   - `GET /api/simulations/{id}/report/download?format=md|pdf`

6. **Report View UI** (`components/report-view.tsx`)
   - Tabbed view: Summary | Details | Segments | Recommendations
   - Download buttons (MD, PDF)
   - Share link generation (stores report, returns public URL — stretch goal)

## Todo

- [ ] Chat service with persona context
- [ ] WebSocket chat endpoint
- [ ] Chat message persistence
- [ ] Chat panel UI component
- [ ] Report generator (Markdown)
- [ ] PDF export (weasyprint)
- [ ] Report API routes
- [ ] Report view UI
- [ ] "Ask the swarm" batch query feature

## Success Criteria

- Chat with any agent; agent stays in character
- Chat streams tokens in real-time
- Report generates in <30s post-simulation
- PDF looks professional, no broken formatting
- Report contains actionable insights, not just raw stats

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent breaks character in chat | Medium | Strong system prompt + few-shot examples |
| WebSocket drops mid-chat | Low | Auto-reconnect + message queue |
| PDF rendering issues | Low | Markdown-first; PDF is bonus |
| Report quality low | High | Invest in synthesis prompt engineering |

## Security Considerations

- WebSocket auth via API key header on upgrade
- Chat history scoped to simulation owner
- Rate limit chat messages (prevent abuse)

## Next Steps

→ [Phase 05: README & Launch Prep](./phase-05-readme-launch-prep.md)
