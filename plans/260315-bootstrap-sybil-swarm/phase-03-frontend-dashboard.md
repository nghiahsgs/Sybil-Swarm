# Phase 03 — Frontend Dashboard & Real-Time Feed

## Context

- [plan.md](./plan.md)
- [Phase 02](./phase-02-backend-core.md)
- [Research: Viral Frontend](./research/researcher-02-viral-readme-frontend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-03-15 |
| Description | Next.js dashboard with real-time agent feed, sentiment heatmap, conversion funnel |
| Priority | P0 |
| Status | TODO |

## Key Insights

- Visual demos drive 42% more stars — dashboard must be screenshot-worthy
- Live agent feed (Twitter-like UX) creates "wow" moment
- Sentiment heatmap is the signature visual — color-coded grid of agent states
- Framer Motion animations make transitions feel alive
- Mobile-responsive not critical for MVP (desktop-first dev tool)

## Requirements

- Landing page with product URL input
- Real-time simulation dashboard with 3 panels
- Agent feed: streaming list of agent evaluations as they complete
- Sentiment heatmap: grid visualization of agent sentiment
- Conversion funnel: visual showing awareness → interest → purchase
- Summary stats: overall score, conversion rate, top objections
- Dark mode default (dev tool aesthetic)

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing: URL input → start sim
│   ├── simulation/[id]/
│   │   └── page.tsx          # Dashboard (SSE consumer)
│   └── layout.tsx            # Root layout, dark mode, fonts
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── input-form.tsx        # Product URL/text input
│   ├── agent-feed.tsx        # Live streaming agent cards
│   ├── agent-card.tsx        # Single agent evaluation display
│   ├── sentiment-heatmap.tsx # Grid of colored cells
│   ├── conversion-funnel.tsx # Funnel chart
│   ├── stats-panel.tsx       # Key metrics cards
│   ├── progress-bar.tsx      # Simulation progress
│   └── api-key-modal.tsx     # BYOK key entry
├── lib/
│   ├── api-client.ts         # Fetch wrapper for backend
│   ├── use-sse.ts            # Custom hook for SSE consumption
│   ├── use-simulation.ts     # Simulation state management
│   └── types.ts              # Shared TypeScript types
└── styles/
    └── globals.css            # Tailwind + custom CSS vars
```

## Related Code Files

- `frontend/src/components/agent-feed.tsx` — Core viral component
- `frontend/src/components/sentiment-heatmap.tsx` — Signature visual
- `frontend/src/lib/use-sse.ts` — SSE hook (EventSource + state)
- `frontend/src/app/simulation/[id]/page.tsx` — Dashboard layout

## Implementation Steps

1. **Landing Page** (`app/page.tsx`)
   - Dark gradient background, centered input
   - URL input + "or describe your product" text toggle
   - API key modal (first-time setup, stored in localStorage)
   - "Launch Swarm" button → POST /api/simulations → redirect to dashboard

2. **SSE Hook** (`lib/use-sse.ts`)
   - EventSource connection to `/api/simulations/{id}/stream`
   - Parses events: `agent_completed`, `phase_changed`, `simulation_complete`
   - Accumulates agent responses in state array
   - Auto-reconnect on disconnect

3. **Dashboard Layout** (`simulation/[id]/page.tsx`)
   - 3-column grid: Feed (left) | Heatmap (center) | Stats (right)
   - Top bar: progress bar + phase indicator
   - Responsive: stacks vertically on smaller screens

4. **Agent Feed** (`components/agent-feed.tsx`)
   - Virtualized scrolling list (react-window for 1000 items)
   - New agents animate in from top (Framer Motion)
   - Each card: avatar placeholder, name, sentiment emoji, purchase decision, one-line reasoning
   - Color-coded border: green (buy), yellow (maybe), red (pass)

5. **Sentiment Heatmap** (`components/sentiment-heatmap.tsx`)
   - 32x32 grid (1024 cells, close to 1000 agents)
   - Each cell colors based on sentiment: red → yellow → green gradient
   - Cells animate fill as agents complete
   - Hover shows agent name + score
   - This is THE screenshot for README/social

6. **Conversion Funnel** (`components/conversion-funnel.tsx`)
   - Simple SVG funnel: Aware (1000) → Interested → Willing to Pay → Would Purchase
   - Numbers update live as agents respond
   - shadcn/ui Card wrapper

7. **Stats Panel** (`components/stats-panel.tsx`)
   - Cards: Overall Score, Conversion Rate, Avg WTP, Top Objection
   - Animated number counting (Framer Motion)
   - Updates incrementally as data streams in

8. **API Key Modal** (`components/api-key-modal.tsx`)
   - Select provider (OpenAI / Anthropic / Google)
   - Input key, validate format, store localStorage
   - Key sent as header on all API calls

## Todo

- [ ] Landing page with input form
- [ ] API key modal (BYOK)
- [ ] SSE custom hook
- [ ] Dashboard 3-column layout
- [ ] Agent feed with virtualized scrolling
- [ ] Sentiment heatmap grid
- [ ] Conversion funnel SVG
- [ ] Stats panel with animated numbers
- [ ] Progress bar + phase indicator
- [ ] Dark mode theme setup
- [ ] API client with key header

## Success Criteria

- Dashboard renders within 1s of navigation
- Agent feed displays 1000 agents without jank (virtualized)
- Heatmap animates fill in real-time
- Stats update incrementally during simulation
- Screenshot of heatmap + feed looks compelling

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSE drops during long sim | Medium | Auto-reconnect + catch-up via GET endpoint |
| 1000 DOM nodes = jank | High | react-window virtualization mandatory |
| Heatmap unreadable at scale | Low | Tooltip on hover, zoom controls later |

## Security Considerations

- API keys in localStorage (acceptable for BYOK CLI tool)
- Never send keys to any third party — only to user's own backend
- CSP headers to prevent XSS

## Next Steps

→ [Phase 04: Agent Chat & Reports](./phase-04-agent-chat-reports.md)
