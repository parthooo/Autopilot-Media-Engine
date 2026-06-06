# Agent Instructions — Autopilot Media Engine

This file is the entry point for **all AI agents** (Cursor, future threads, automation bots) working in this repository.

## Mandatory pre-flight (every session)

Before generating code, running scaffolding commands, editing schema, or making architectural changes:

1. **Read** `PROJECT_VISION.md`
2. **Read** `ARCHITECTURE.md`
3. **Read** `DATABASE_SCHEMA.md`
4. **Read** `ROADMAP.md`

Do not skip this step. New threads and new agents have no memory of prior conversations — these files are the source of truth.

## What this project is

**Autopilot Media Engine** is a central intelligence platform that:

```
Internet → Trend Discovery → Opportunity Scoring → AI Analysis → Content Factory → Publishing → Revenue Assets
```

It is **not**:

- A random scraping script
- A standalone YouTube upload bot
- A single SEO site repo

Revenue sites and channels are **outputs** of this platform. Discovery, scoring, and generation logic stays here.

## Agent workflow checklist

- [ ] Read all four docs above
- [ ] Identify current phase in `ROADMAP.md`
- [ ] Confirm the requested task is in scope for that phase
- [ ] Respect service boundaries in `ARCHITECTURE.md`
- [ ] Match table/column names to `DATABASE_SCHEMA.md`
- [ ] If task conflicts with docs → stop, report conflict, wait for approval

## Current focus (MVP)

See `ROADMAP.md` for the live checklist. At a high level:

| In MVP | Not in MVP yet |
|--------|----------------|
| HN + Reddit + Google Trends ingestion | Gemini / AI analysis |
| Topic normalization + scoring | Content Factory |
| GitHub Actions cron (every 6h) | Publishing engine |
| Next.js dashboard on Vercel | YouTube API |
| Neon PostgreSQL + Prisma | Redis / BullMQ |

## Hard rules

1. **Zero-cost infra by default** — Vercel, Neon, GitHub Actions
2. **Automation over manual work** — target ≤ 30 min/day operator time
3. **Explainable scores** — store sub-scores, not just composite
4. **Adapter pattern** — new sources/publishers = new adapter, not core rewrite
5. **Human approval before publish** — never auto-publish content in MVP phases
6. **No scope creep** — if it's not in the current phase gate, don't build it

## Document index

| File | Purpose |
|------|---------|
| [PROJECT_VISION.md](./PROJECT_VISION.md) | North star, principles, anti-patterns |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, APIs, deployment |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Tables, indexes, normalization |
| [ROADMAP.md](./ROADMAP.md) | Phases, MVP, Week 1 plan, gates |
| [AGENTS.md](./AGENTS.md) | This file — agent entry point |

## Cursor rule

An always-on rule lives at `.cursor/rules/read-project-docs-first.mdc` and enforces this workflow for every Cursor session.

## Updating the plan

If implementation reveals a needed change to architecture, schema, or phase order:

1. Update the relevant `.md` file first
2. Get user approval
3. Then implement

Never let code drift ahead of documentation.
