# AUTOPILOT MEDIA ENGINE — Project Vision

## What This Is

**Autopilot Media Engine** is a central intelligence platform for building **fully automated** media businesses. It is not a single website, YouTube channel, or scraping script. It is the shared brain that discovers niches, picks a winner, generates content, and publishes to revenue channels — with minimal human input after setup.

### Platform hierarchy (core model — do not forget)

This is the **canonical product shape**. Every feature must fit this tree:

```
┌─────────────────────────────────────────────────────────────┐
│  PARENT — Niche Library                                     │
│  Ingest → normalize → score → analyze → store opportunities│
│  (many niches ranked; full history in the database)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  GATE — Pick ONE winner per cycle                           │
│  AI selects single best niche → status: approved            │
│  (rejects/archives others for this cycle)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  CHILD — Video           │    │  CHILD — Article         │
│  script → render         │    │  generate SEO cluster    │
│  long-form + Shorts      │    │  Markdown / frontmatter  │
└────────────┬─────────────┘    └────────────┬─────────────┘
             │                               │
             ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  SUB-CHILDREN — Video    │    │  SUB-CHILDREN — Article  │
│  publishers (adapters)   │    │  publishers (adapters)   │
│  · YouTube               │    │  · SEO / static site     │
│  · Instagram             │    │  · (syndication later)   │
│  · Facebook              │    │                          │
│  · TikTok                │    │                          │
│  · Reddit                │    │                          │
│  · Pinterest             │    │                          │
└──────────────────────────┘    └──────────────────────────┘
```

**Rules:**

1. **Parent** builds the niche library — not “one scraper per site.”
2. **Gate** always picks **one winner** — all downstream work is for that winner only.
3. **Video** and **Article** are **parallel children** — both run from the same winner each cycle.
4. **Publishers** are **plugins** under each child — one adapter per platform.
5. **End state:** fully automated — no manual recording, editing, or uploading. Operator sets up channels/credentials once; cron does the rest.
6. **Multi-channel (long-term):** one YouTube/social channel per topic category (e.g. tech, finance US, AI). AI maps the winner → the correct channel. Operator creates channels when ready and provides OAuth/API creds.

Legacy one-line flow (still valid, simplified):

```
Internet → Trend Discovery → Scoring → AI Analysis → Pick Winner → Video + Article Factory → Multi-Platform Publishing → Revenue
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
| Budget | **$0 out-of-pocket** — no paid domains, hosting, or tools until revenue covers them |
| Goal | Passive / recurring online income |
| First revenue asset | **YouTube + social video** (free to create and host) |
| Second revenue asset | **SEO articles** (deferred until domain/hosting budget exists) |
| End-state automation | **Full autopilot** — AI picks winner → generates video + articles → publishes to all connected platforms. No manual record/upload. |

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

> Build one reusable platform that turns internet signals into a niche library, picks one winner per cycle, auto-generates video + articles, and auto-publishes to connected channels — with less than 30 minutes of human attention per day after setup.

### Success Looks Like

1. **Now (built):** Pipeline runs unattended. Niche library fills. One winner picked per cycle.
2. **Phase 4 (in progress):** Scripts + articles generated from winner (YouTube-first).
3. **Phase 4b:** Videos rendered automatically (TTS + visuals + FFmpeg) — long + Shorts, $0 stack.
4. **Phase 5:** Auto-publish to YouTube, Instagram, Facebook, TikTok, Reddit, Pinterest (video) and SEO site (articles when budget allows).
5. **Phase 6:** Multi-channel portfolio — AI maps winners to the right channel; operator connects creds once.
6. **Long-term:** Multiple single-topic channels + article sites, one intelligence layer, recurring revenue.

### Revenue Asset Priority (Founder Decision)

Both children run from **the same winner each cycle**. They diverge at generation and publishing:

| Priority | Track | Upfront cost | End state |
|----------|-------|--------------|-----------|
| **P0** | Video (long + Shorts) → social publishers | $0 | Fully automated render + publish |
| **P1** | Articles → SEO site | Domain + hosting ($) | Auto-publish when budget exists; generate now, queue until then |

**Do not recommend buying a domain or paid hosting as a prerequisite.** Article generation can run in parallel and sit queued until the operator deploys a site.

---

## Core Principles

These rules govern every technical and product decision. If a proposed feature violates one, reject it.

### 1. Platform First, Assets Second

Never build a one-off scraper or channel bot inside a revenue asset repo. All discovery, scoring, and generation flows through Autopilot Media Engine. Revenue sites consume outputs; they do not own the logic.

### 2. Automation Over Heroics — With Manual Parity

Optimize for systems that run without you. A reliable 6-hour cron beat an impressive manual workflow. **Every automated step must also have a manual trigger** (dashboard button + CLI + GitHub `workflow_dispatch`). See [AUTOMATION.md](./AUTOMATION.md).

### 3. Zero-Cost by Default

Every infrastructure choice must justify its cost. Start free. Upgrade only when a free tier blocks revenue or reliability.

### 4. Solo-Operator Realism

No microservices for the sake of architecture. No premature Redis, queues, or auth systems. Build what one person can maintain in 30 minutes/day.

### 5. Reuse Everything

Every adapter, scorer, prompt, and publisher is a plugin. Adding a new source or revenue channel should not require rewriting the core.

### 6. Explainable Intelligence

Scores and recommendations must be inspectable. You need to understand *why* an opportunity ranked #1 before you bet a month of content on it.

### 7. Revenue Is the Filter

Features that do not move toward discoverable, monetizable, **auto-publishable** content are deprioritized. Cool tech is not the product.

### 8. Full Autopilot Is the Destination

Manual record/upload was a **stepping stone**, not the end state. The platform must eventually: pick winner → generate video + articles → render → publish — unattended. Build in phases; keep the hierarchy in mind so interim steps (e.g. script-only) do not become dead ends.

---

## What We Are NOT Building

| Anti-pattern | Why it fails |
|--------------|--------------|
| A generic scraping framework | Becomes maintenance hell with no revenue path |
| Publishing before discovery/scoring works | No strategy, random content |
| Generating content for the whole library at once | One winner per cycle — factory runs on winner only |
| 10 separate trend monitors | Duplicated logic, no compounding |
| AI-generated spam at scale | No scoring, no strategy, platform bans |
| Enterprise job queues on day one | Cost and complexity for a solo operator |
| Manual upload as the permanent design | Contradicts full-autopilot north star |

---

## Product Phases (Summary)

| Phase | Name | Outcome |
|-------|------|---------|
| 0–2 | Foundation + Discovery + Scoring | Niche library live, ranked opportunities |
| 3 | AI Analysis + Winner pick | One winner per cycle with strategy |
| 4a | Content Factory — text | Scripts + articles from winner (**current**) |
| 4b | Video Factory — render | Auto MP4 long + Shorts ($0 TTS/stock/FFmpeg) |
| 5a | Video publishers | YouTube, Instagram, Facebook, TikTok, Reddit, Pinterest |
| 5b | Article publishers | SEO site, syndication |
| 6 | Multi-channel + revenue | Channel portfolio, OAuth creds, performance tracking |

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
2. Which layer of the hierarchy? (Parent / Gate / Video / Article / Publisher)
3. Does it run on the **current winner only** (not the whole library)?
4. Can this run without daily manual intervention?
5. Does this work on free tier infrastructure?
6. Will a future channel/platform reuse this as an adapter?
7. Does this move toward full autopilot publish?

If the answer to #1 is "revenue asset" and #6 is "no", move the logic into the platform.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [AGENTS.md](./AGENTS.md) | **Start here** — mandatory agent pre-flight checklist |
| [PROJECT_VISION.md](./PROJECT_VISION.md) | Why we exist, principles, north star |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, services, APIs, deployment |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery, MVP, weekly plan |
| [AUTOMATION.md](./AUTOMATION.md) | Automation ↔ manual action matrix |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Tables, relationships, indexing, normalization |

**Rule for all contributors (including AI):** Read `AGENTS.md` and all four design docs before writing code. Enforced by `.cursor/rules/read-project-docs-first.mdc` in every Cursor session. If a task conflicts with them, stop and reconcile first.
