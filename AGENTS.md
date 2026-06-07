# Agent Instructions — Autopilot Media Engine

This file is the entry point for **all AI agents** (Cursor, future threads, automation bots) working in this repository.

## Mandatory pre-flight (every session)

Before generating code, running scaffolding commands, editing schema, or making architectural changes:

1. **Read** `PROJECT_VISION.md` — especially [Platform hierarchy](./PROJECT_VISION.md#platform-hierarchy-core-model--do-not-forget)
2. **Read** `ARCHITECTURE.md`
3. **Read** `DATABASE_SCHEMA.md`
4. **Read** `ROADMAP.md`
5. **Skim** `AUTOMATION.md` if adding jobs, crons, or buttons

Do not skip this step. New threads and new agents have no memory of prior conversations — these files are the source of truth.

---

## Core platform hierarchy (never forget)

```
PARENT   Niche library     ingest → score → analyze (many opportunities stored)
GATE     Pick ONE winner   per cycle — all downstream work uses this winner only
CHILD    Video             scripts → render (MP4 long + Shorts)
CHILD    Article           SEO article cluster
SUB      Video publishers  YouTube, Instagram, Facebook, TikTok, Reddit, Pinterest
SUB      Article publishers SEO site (when budget allows)
```

**End state:** Full autopilot — winner → generate → render → publish. No manual record/upload.

**Not:** generate for the whole library at once. **Not:** skip the winner pick. **Not:** permanent manual upload design.

Full diagram: [PROJECT_VISION.md](./PROJECT_VISION.md#platform-hierarchy-core-model--do-not-forget)

---

## What this project is

**Autopilot Media Engine** is a central intelligence platform that:

```
Internet → Niche Library → Pick Winner → Video + Article Factory → Multi-Platform Publish
```

It is **not**:

- A random scraping script
- A standalone upload bot disconnected from discovery
- A single SEO site or YouTube channel repo

Channels and sites are **outputs**. All logic stays in this platform.

---

## Agent workflow checklist

- [ ] Read docs above (vision hierarchy first)
- [ ] Identify current phase in `ROADMAP.md`
- [ ] Confirm task fits hierarchy layer (Parent / Gate / Video / Article / Publisher)
- [ ] Confirm task operates on **winner only** if downstream of gate
- [ ] Respect service boundaries in `ARCHITECTURE.md`
- [ ] Match table/column names to `DATABASE_SCHEMA.md`
- [ ] If adding automation → add manual twin per `AUTOMATION.md`
- [ ] If task conflicts with docs → stop, report conflict, wait for approval

---

## Implementation status (high level)

| Layer | Status |
|-------|--------|
| Parent — niche library | **Live** (ingest, score, ~500 topics) |
| Gate — winner pick | **Live** (Gemini auto-select) |
| Video child — scripts | **Live** (pillar + Shorts) |
| Video child — render | **Not built** (Phase 4b) |
| Article child — generate | **Live** |
| Video publishers | **Not built** (Phase 5a) |
| Article publishers | **Not built** (Phase 5b) |
| Multi-channel portfolio | **Not built** (Phase 6) |

See `ROADMAP.md` for gates and deliverables.

---

## Hard rules

1. **$0 out-of-pocket by default** — platform infra only; never assume paid domains/hosting/SaaS unless operator explicitly agrees
2. **YouTube/social video first** — video render + publish before SEO site launch; articles generate in parallel, publish later
3. **One winner per cycle** — factory and publishers use approved winner only, not entire library
4. **Full autopilot is the destination** — do not design permanent manual upload steps
5. **Automation + manual parity** — every cron/job needs dashboard button + CLI + `workflow_dispatch`. See [AUTOMATION.md](./AUTOMATION.md)
6. **Automation over manual work** — target ≤ 30 min/day operator time after setup
7. **Explainable scores** — store sub-scores, not just composite
8. **Adapter pattern** — new sources/publishers = new adapter, not core rewrite
9. **No scope creep** — match current phase gate in `ROADMAP.md`

---

## Founder constraints (do not forget)

- Solo operator, Bangladesh, **$0 budget** for revenue assets initially
- **Video/social** = free hosting → first revenue path
- **SEO site** = needs domain → defer until revenue or explicit budget
- Operator will connect channel OAuth/creds once; platform automates thereafter
- When suggesting "what's next", follow `ROADMAP.md` phase order toward **render + auto-publish**

---

## Document index

| File | Purpose |
|------|---------|
| [PROJECT_VISION.md](./PROJECT_VISION.md) | **Hierarchy, principles, north star** |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, packages, pipeline |
| [ROADMAP.md](./ROADMAP.md) | Phases, gates, current vs planned |
| [AUTOMATION.md](./AUTOMATION.md) | Automation ↔ manual matrix |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Tables, indexes, migrations |
| [AGENTS.md](./AGENTS.md) | This file — agent entry point |

---

## Cursor rule

An always-on rule lives at `.cursor/rules/read-project-docs-first.mdc` and enforces this workflow for every Cursor session.

---

## Updating the plan

If implementation reveals a needed change to architecture, schema, or phase order:

1. Update the relevant `.md` file first
2. Get user approval
3. Then implement

Never let code drift ahead of documentation.
