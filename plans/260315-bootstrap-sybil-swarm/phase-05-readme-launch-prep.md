# Phase 05 — README, Visuals & Launch Prep

## Context

- [plan.md](./plan.md)
- [Research: Viral README Patterns](./research/researcher-02-viral-readme-frontend.md)
- Key stat: READMEs with visuals get 42% more stars

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-03-15 |
| Description | Professional README, demo GIF, architecture diagram, launch channel prep |
| Priority | P1 |
| Status | TODO |

## Key Insights

- README is the #1 conversion tool for stars — treat as landing page
- GIF of heatmap filling + agent feed scrolling = viral visual
- Architecture diagram reduces cognitive load, increases contributor trust
- 4-7 badges (not more — looks desperate)
- Creator story drives engagement on HN/Reddit
- Launch on Tue-Thu, 9am-12pm PT

## Requirements

- README.md with all viral elements
- Demo GIF (30-60 seconds, 800px wide)
- Architecture diagram (Mermaid or image)
- Badges: build, license, Python version, stars, PRs welcome
- CONTRIBUTING.md for OSS contributors
- Social media assets (OG image, Twitter card)

## Architecture

### README Structure

```markdown
<!-- Badges row -->
<!-- Logo/Banner -->

# Sybil Swarm 🐝
> Meet your first 1,000 customers before you build

<!-- Demo GIF -->

## What is this?
2-3 sentences: problem → solution → outcome

## See it in action
Screenshot of heatmap + agent feed

## Quick Start
docker compose up (3 lines max)

## How it works
Architecture diagram + 5-step pipeline explanation

## Features
Bullet list with icons

## Configuration
BYOK setup, model options

## Contributing
Link to CONTRIBUTING.md

## License
MIT
```

## Related Code Files

- `README.md` — Project root
- `CONTRIBUTING.md` — Contributor guidelines
- `docs/architecture.md` — Detailed architecture (linked from README)
- `assets/demo.gif` — Screen recording of simulation
- `assets/architecture.png` — System diagram
- `assets/og-image.png` — Social share card

## Implementation Steps

1. **Demo Recording**
   - Run full simulation with sample product
   - Screen record: input URL → heatmap filling → agent feed → report
   - Edit to 30s, optimize GIF (<5MB for GitHub)
   - Tool: OBS + gifski or ScreenToGif

2. **Architecture Diagram**
   - Mermaid diagram in README (renders natively on GitHub)
   - Shows: User Input → FastAPI → Persona Gen → Agent Swarm → Aggregation → Report
   - Include model tier labels

3. **README.md**
   - Follow structure above exactly
   - One-liner tagline, problem statement, GIF, quick start
   - Copy tone: confident but not hype-y (engineers detect BS)
   - Include "Why not just survey real people?" FAQ

4. **Badges**
   - Build status (GitHub Actions)
   - License (MIT)
   - Python 3.12+
   - GitHub stars
   - PRs Welcome

5. **CONTRIBUTING.md**
   - Setup instructions (fork, clone, install)
   - Architecture overview for newcomers
   - Good first issues labeling strategy
   - Code style guide (ruff, eslint)

6. **Social Assets**
   - OG image: 1200x630, dark bg, logo, tagline, heatmap screenshot
   - Twitter card meta tags in Next.js
   - HN post draft: technical angle, problem-first

7. **Launch Prep**
   - HN post: "Show HN: Sybil Swarm — test your product with 1000 AI customers"
   - Reddit: r/MachineLearning, r/SideProject, r/startups
   - Product Hunt: prep hunting post, screenshots, tagline
   - Twitter thread: build-in-public narrative

## Todo

- [ ] Record demo GIF
- [ ] Create architecture diagram (Mermaid)
- [ ] Write README.md
- [ ] Add badges
- [ ] Write CONTRIBUTING.md
- [ ] Create OG image
- [ ] Draft HN post
- [ ] Draft Reddit post
- [ ] Prep Product Hunt listing
- [ ] Twitter launch thread

## Success Criteria

- README renders perfectly on GitHub (no broken images)
- GIF loads fast, shows full flow in <30s
- Architecture diagram is clear at first glance
- Quick Start works in 3 commands
- External feedback: "I'd star this"

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| GIF too large for GitHub | Low | gifski compression, link to video if >10MB |
| README too long | Medium | Keep under 200 lines, link to docs/ |
| Launch timing wrong | Medium | A/B test with small audience first |

## Security Considerations

- No API keys in screenshots/GIFs
- OG image doesn't expose internal URLs

## Next Steps

→ [Phase 06: Polish, Testing & Docker](./phase-06-polish-testing-docker.md)
