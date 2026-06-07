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

1. **$0 out-of-pocket by default** — platform infra (Vercel, Neon, GitHub Actions, Gemini free tier) only; **never assume the operator will pay for domains, hosting, or SaaS** unless they explicitly say so
2. **YouTube-first revenue** — prioritize YouTube scripts + publish workflow over SEO site launch; articles are parallel prep, not the first monetization step
3. **Automation + manual parity** — every cron/GitHub Action/unattended job **must** have a dashboard button, CLI command, and `workflow_dispatch`. See [AUTOMATION.md](./AUTOMATION.md). Never ship automation-only features.
4. **Automation over manual work** — target ≤ 30 min/day operator time
5. **Explainable scores** — store sub-scores, not just composite
6. **Adapter pattern** — new sources/publishers = new adapter, not core rewrite
7. **Human approval before publish** — never auto-publish content in MVP phases
8. **No scope creep** — if it's not in the current phase gate, don't build it

## Founder constraints (do not forget)

The operator is in Bangladesh, solo, with **zero budget for revenue assets**:

- **YouTube** = free channel, free hosting → **first path to money**
- **SEO site** = needs paid domain (and often hosting beyond free tier for AdSense) → **defer until revenue or explicit budget**
- **Both tracks share one pipeline** — discovery/scoring/analysis are not either/or; only content output and publishing differ
- When suggesting "what's next", lead with YouTube script generation + export/upload, not "buy a domain and deploy a site"

## Document index

| File | Purpose |
|------|---------|
| [PROJECT_VISION.md](./PROJECT_VISION.md) | North star, principles, anti-patterns |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, APIs, deployment |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Tables, indexes, normalization |
| [ROADMAP.md](./ROADMAP.md) | Phases, MVP, Week 1 plan, gates |
| [AUTOMATION.md](./AUTOMATION.md) | Automation ↔ manual matrix — required when adding jobs |
| [AGENTS.md](./AGENTS.md) | This file — agent entry point |

## Cursor rule

An always-on rule lives at `.cursor/rules/read-project-docs-first.mdc` and enforces this workflow for every Cursor session.

## Updating the plan

If implementation reveals a needed change to architecture, schema, or phase order:

1. Update the relevant `.md` file first
2. Get user approval
3. Then implement

Never let code drift ahead of documentation.
