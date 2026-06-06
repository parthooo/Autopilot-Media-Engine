# AUTOPILOT MEDIA ENGINE — Project Vision

## What This Is

**Autopilot Media Engine** is a central intelligence platform for building automated media businesses. It is not a single website, YouTube channel, or scraping script. It is the shared brain that discovers opportunities and feeds every revenue asset you create.

```
Internet
    ↓
Trend Discovery Engine
    ↓
Opportunity Scoring Engine
    ↓
AI Analysis Layer
    ↓
Content Factory
    ↓
Publishing Engine
    ↓
Revenue Assets
```

Revenue assets are outputs of the platform — not the platform itself. Examples:

- YouTube channels
- SEO micro-sites
- Affiliate comparison sites
- AI tools directories
- Finance calculator sites
- News sites
- Future projects

One pipeline. Many assets. Minimal daily human input.

---

## Founder Context

| Constraint | Value |
|------------|-------|
| Operator | Solo software engineer |
| Location | Bangladesh |
| Daily time (post-setup) | ≤ 30 minutes |
| Budget | Near zero |
| Goal | Passive / recurring online income |

### Available Resources

- Cursor Pro
- Gemini API (free tier)
- GitHub
- Vercel
- Neon PostgreSQL (free tier)
- Free / low-cost hosting (Railway, Render, GitHub Actions)

### Explicitly Out of Scope

- Client work
- Agency services
- Freelancing
- Customer acquisition
- Manual content grinding as a lifestyle

### Explicitly In Scope

- Automated traffic discovery
- Automated content creation
- Automated publishing (where APIs allow)
- Systems that compound over time
- Path to first **$100/month** recurring revenue

---

## North Star

> Build one reusable platform that turns internet signals into scored opportunities, then into published content, then into revenue — with less than 30 minutes of human attention per day.

### Success Looks Like

1. **Week 4:** Pipeline runs unattended. Dashboard shows ranked opportunities.
2. **Month 2:** First SEO micro-site launched from a top-scored opportunity.
3. **Month 3–4:** 10–20 articles published from the Content Factory.
4. **Month 4–6:** AdSense + affiliate links live on first asset.
5. **Month 6+:** YouTube channel fed by the same opportunity pipeline.
6. **Long-term:** Multiple revenue assets, one intelligence layer.

---

## Core Principles

These rules govern every technical and product decision. If a proposed feature violates one, reject it.

### 1. Platform First, Assets Second

Never build a one-off scraper or channel bot inside a revenue asset repo. All discovery, scoring, and generation flows through Autopilot Media Engine. Revenue sites consume outputs; they do not own the logic.

### 2. Automation Over Heroics

Optimize for systems that run without you. A reliable 6-hour cron beat an impressive manual workflow. If it cannot run while you sleep, it is not done.

### 3. Zero-Cost by Default

Every infrastructure choice must justify its cost. Start free. Upgrade only when a free tier blocks revenue or reliability.

### 4. Solo-Operator Realism

No microservices for the sake of architecture. No premature Redis, queues, or auth systems. Build what one person can maintain in 30 minutes/day.

### 5. Reuse Everything

Every adapter, scorer, prompt, and publisher is a plugin. Adding a new source or revenue channel should not require rewriting the core.

### 6. Explainable Intelligence

Scores and recommendations must be inspectable. You need to understand *why* an opportunity ranked #1 before you bet a month of content on it.

### 7. Revenue Is the Filter

Features that do not move toward discoverable, monetizable, publishable content are deprioritized. Cool tech is not the product.

---

## What We Are NOT Building

| Anti-pattern | Why it fails |
|--------------|--------------|
| A generic scraping framework | Becomes maintenance hell with no revenue path |
| A YouTube upload bot on day one | Publishing before discovery is backwards |
| 10 separate trend monitors | Duplicated logic, no compounding |
| AI-generated spam sites | No scoring, no strategy, no longevity |
| Enterprise job queues on day one | Cost and complexity for a solo operator |

---

## Product Phases (Summary)

| Phase | Name | Outcome |
|-------|------|---------|
| 1 | Trend Discovery Engine | Continuous signal ingestion from 6+ sources |
| 2 | Opportunity Scoring Engine | Ranked 0–100 opportunities with explainable sub-scores |
| 3 | AI Analysis Layer | Gemini-powered strategy per opportunity |
| 4 | Content Factory | Articles, scripts, posts from approved opportunities |
| 5 | Publishing Engine | Modular output to WordPress, static sites, YouTube, social |
| 6 | Dashboard & Revenue | Review queue, channel management, revenue tracking |

See [ROADMAP.md](./ROADMAP.md) for timeline and deliverables.

---

## Tech Stack (Finalized)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js on Vercel |
| Backend | Node.js (JavaScript) |
| Database | PostgreSQL via Neon |
| ORM | Prisma |
| Background jobs | GitHub Actions cron (MVP) → Railway/Render cron or BullMQ (later) |
| Caching | Redis — only when proven necessary |
| AI | Gemini API (free tier) |
| Worker hosting | GitHub Actions (free) initially |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for data model.

---

## Decision Log

When in doubt during implementation, ask:

1. Does this belong in the platform or in a revenue asset?
2. Can this run without daily manual intervention?
3. Does this work on free tier infrastructure?
4. Will a future site/channel reuse this component?
5. Does this help reach $100/month faster?

If the answer to #1 is "revenue asset" and #4 is "no", move the logic into the platform.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [AGENTS.md](./AGENTS.md) | **Start here** — mandatory agent pre-flight checklist |
| [PROJECT_VISION.md](./PROJECT_VISION.md) | Why we exist, principles, north star |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, services, APIs, deployment |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery, MVP, weekly plan |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Tables, relationships, indexing, normalization |

**Rule for all contributors (including AI):** Read `AGENTS.md` and all four design docs before writing code. Enforced by `.cursor/rules/read-project-docs-first.mdc` in every Cursor session. If a task conflicts with them, stop and reconcile first.
