# AUTOPILOT MEDIA ENGINE — Roadmap

Phased delivery plan from zero to first revenue. Each phase has a clear gate: do not start the next phase until the current one meets its success criteria.

See [PROJECT_VISION.md](./PROJECT_VISION.md) for principles and [ARCHITECTURE.md](./ARCHITECTURE.md) for technical design.

---

## Timeline Overview

```
Phase 0  Week 1        Foundation + first pipeline
Phase 1  Weeks 2–3    Trend Discovery (3→6 sources)
Phase 2  Week 4        Opportunity Scoring
Phase 3  Weeks 5–6    AI Analysis (Gemini)
Phase 4  Weeks 7–8    Content Factory
Phase 5  Weeks 9–12   Publishing Engine
Phase 6  Ongoing       Dashboard polish + Revenue tracking

Revenue path:
  Month 2–3  → First SEO micro-site from top opportunity
  Month 4–6  → AdSense + affiliate on live site
  Month 6+   → YouTube channel from same pipeline
```

---

## Phase 0 — Foundation (Week 1)

**Goal:** Runnable monorepo with one source ingesting on a schedule and data visible in a bare dashboard.

### Deliverables

- [ ] npm workspaces monorepo scaffolded
- [ ] Neon PostgreSQL connected
- [ ] Prisma schema: Phase 1–2 tables (see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md))
- [ ] `sources` table seeded (6 platforms, 3 active for MVP)
- [ ] Hacker News ingest adapter
- [ ] Reddit ingest adapter
- [ ] Topic normalization in `packages/core`
- [ ] Worker CLI: `ingest`, `ingest-all`, `score`
- [ ] GitHub Actions: `ingest.yml`, `score.yml`
- [ ] Next.js dashboard deployed to Vercel
- [ ] API: health, topics, opportunities (read-only initially)

### Success Criteria

- Pipeline runs 48+ hours unattended without manual intervention
- Dashboard loads on Vercel and shows real ingested topics
- Total infrastructure cost: **$0/month**

### Week 1 Daily Plan

| Day | Focus |
|-----|-------|
| **1** | Monorepo init, Neon + Prisma schema, seed sources, `.env.example` |
| **2** | HN adapter, topic normalization, worker `ingest` command |
| **3** | Reddit adapter, `ingest-all` orchestrator, `ingestion_runs` logging, GitHub Actions |
| **4** | Scoring package, `opportunities` table, worker `score` command |
| **5** | Next.js dashboard (overview, trends, opportunities), Vercel deploy |
| **6** | Google Trends adapter (or defer), opportunity detail + approve/reject, run history UI |
| **7** | 48h soak test, dedup fixes, README, manual review of first real opportunities |

---

## Phase 1 — Trend Discovery Engine (Weeks 2–3)

**Goal:** Continuously monitor all six sources. Stable, deduplicated topic store.

### Sources (priority order)

| Priority | Source | Auth | Notes |
|----------|--------|------|-------|
| P0 (Week 1) | Hacker News | None | Firebase API |
| P0 (Week 1) | Reddit | None (public JSON) | Custom User-Agent required |
| P1 (Week 2) | Google Trends | None / unofficial lib | Fragile — isolate in adapter |
| P2 (Week 2) | GitHub Trending | Scrape / unofficial | Rate-limit carefully |
| P2 (Week 3) | Product Hunt | API or scrape | Evaluate free access |
| P3 (Week 3) | YouTube | Data API (quota) | Start with trending searches only |

### Deliverables

- [ ] All 6 adapters implemented and registered
- [ ] `ingestion_runs` fully populated with error details
- [ ] Dashboard: source filter, search, topic detail with metrics chart
- [ ] Deduplication stable across sources (same story, different URLs → one topic)

### Success Criteria

- 500+ unique topics after 2 weeks of unattended operation
- < 5% ingestion run failure rate
- No manual restarts required in a 7-day window

### Gate to Phase 2

Phase 1 is complete when ingestion is boring — it runs, logs, recovers, and fills the database without you thinking about it.

---

## Phase 2 — Opportunity Scoring Engine (Week 4)

**Goal:** Every active topic gets a ranked 0–100 opportunity score with explainable sub-scores.

### Deliverables

- [ ] `packages/scoring` with 5 sub-score calculators
- [ ] `opportunity_score` computed and stored
- [ ] `opportunity_score_history` for trend tracking
- [ ] Dashboard: ranked opportunities, score breakdown per row
- [ ] Approve / reject / archive workflow
- [ ] Optional: weekly email digest of top 5 opportunities

### Scoring Weights

```
opportunity_score =
  growth_score          × 0.30 +
  (100 - competition)   × 0.25 +
  monetization_score    × 0.20 +
  usa_audience_score    × 0.15 +
  evergreen_score       × 0.10
```

### Success Criteria

- Top 10 opportunities are plausibly monetizable (human review)
- Score breakdown visible and understandable in dashboard
- Re-score runs automatically after each ingest cycle

### Gate to Phase 3

You can look at the dashboard, understand why #1 is #1, and decide to bet content on it. That is the gate.

---

## Phase 3 — AI Analysis Layer (Weeks 5–6)

**Goal:** Gemini enriches high-scoring opportunities with actionable strategy.

### Deliverables

- [ ] `packages/ai` with Gemini client and rate limiting
- [ ] `opportunity_analyses` table populated
- [ ] Structured output: trend explanation, audience, SEO keywords, YouTube ideas, affiliate potential, revenue estimate, content strategy
- [ ] Worker job: `analyze-opportunities` (daily, score ≥ 70 only)
- [ ] Dashboard: analysis tab on opportunity detail page
- [ ] Manual re-analyze button

### Cost Guards

- Analyze only `opportunity_score ≥ 70`
- Max 10 analyses per day on free tier
- Cache analysis; re-analyze only on significant score change or manual trigger

### Success Criteria

- Analysis output is actionable enough to plan a 5-article content cluster
- Gemini costs remain $0 (free tier)

### Gate to Phase 4

At least one opportunity has analysis good enough that you would publish content based on it.

---

## Phase 4 — Content Factory (Weeks 7–8)

**Goal:** Turn approved opportunities into publishable content assets.

### Output Types

| Asset Type | Format |
|------------|--------|
| Website article | Markdown with frontmatter |
| YouTube script | Structured sections (hook, body, CTA) |
| Shorts script | 30–60 second format |
| Social post | X / LinkedIn text |
| Newsletter draft | Subject + body |

### Deliverables

- [ ] `content_assets` table
- [ ] Generation prompts in `packages/ai`
- [ ] Worker job: `generate-content` for approved opportunities
- [ ] Dashboard: content review queue (approve / reject / edit)
- [ ] Export approved content as Markdown files

### Success Criteria

- Generate a 5-article cluster from one approved opportunity
- Human edit time < 15 min per article before publish-ready

### Gate to Phase 5

You have 5+ approved articles ready to publish for one topic.

---

## Phase 5 — Publishing Engine (Weeks 9–12)

**Goal:** Modular publishing to revenue asset channels.

### Publisher Priority

| Priority | Adapter | MVP approach |
|----------|---------|--------------|
| P0 | Markdown file export | Commit to static site repo |
| P1 | Static Next.js site | First revenue asset template |
| P2 | WordPress REST API | If first site is WordPress |
| P3 | YouTube | Script export + manual upload |
| P4 | X / Pinterest | API posting when stable |

### Deliverables

- [ ] `channels` and `publications` tables
- [ ] `packages/publishers` adapter interface
- [ ] Markdown + static site publisher
- [ ] Worker job: `publish-content`
- [ ] Dashboard: publication status per content asset

### Success Criteria

- One SEO micro-site live with 10+ articles published via the engine
- Publishing is one-click (or one cron) after content approval

---

## Phase 6 — Dashboard & Revenue (Ongoing)

**Goal:** Operate the business in < 30 min/day.

### Deliverables

- [ ] Revenue manual entry (AdSense, affiliate)
- [ ] Channel performance view
- [ ] Opportunity → content → publication funnel metrics
- [ ] NextAuth admin login
- [ ] Mobile-friendly dashboard review flow

### Success Criteria

- Daily workflow: open dashboard → review new opportunities → approve content → check revenue. Under 30 minutes.

---

## MVP Definition

The MVP is **Phase 0 + Phase 1 (3 sources) + Phase 2**. Nothing else.

### MVP Includes

- Hacker News, Reddit, Google Trends ingestion
- GitHub Actions cron every 6 hours
- Topic normalization and deduplication
- Rule-based opportunity scoring
- Dashboard: overview, trends, ranked opportunities, approve/reject

### MVP Excludes

- Gemini / AI analysis
- Content generation
- Publishing to external platforms
- YouTube API
- User authentication (beyond API key)
- Redis / BullMQ
- Revenue tracking
- Product Hunt, GitHub Trending, YouTube (stretch in Weeks 2–3)

### MVP Success Statement

> The system discovers trends daily, scores them, and shows the top 10 opportunities — with zero daily manual work from the operator.

---

## Path to $100/Month

| Milestone | Target | Action |
|-----------|--------|--------|
| M1 | Week 4 | MVP live, reviewing opportunities weekly |
| M2 | Month 2 | Pick #1 opportunity, register domain, deploy site template |
| M3 | Month 3 | 10–20 articles published from Content Factory |
| M4 | Month 4 | Apply for AdSense, add affiliate links |
| M5 | Month 5 | SEO indexing, internal linking, 1 article/week auto-published |
| M6 | Month 6 | Evaluate YouTube launch from same opportunity |
| **Goal** | Month 6–8 | **$100/month** combined AdSense + affiliate |

---

## What NOT to Build (Any Phase)

- Custom admin framework — use Next.js App Router directly
- Real-time WebSocket dashboard — polling / refresh is fine
- Multi-user RBAC — solo operator only
- Kubernetes — never, for this project
- Embedding-based topic clustering — defer until rule-based normalization fails
- Auto-publish without human approval — always review before publish (MVP through Phase 5)

---

## Phase Gate Checklist

Before advancing, confirm:

| Gate | Question |
|------|----------|
| Phase 0 → 1 | Does ingest + score run 7 days without you? |
| Phase 1 → 2 | Are 500+ topics deduplicated correctly? |
| Phase 2 → 3 | Can you explain the top 5 scores without guessing? |
| Phase 3 → 4 | Is one analysis good enough to plan content? |
| Phase 4 → 5 | Do you have 5+ publish-ready articles? |
| Phase 5 → 6 | Is one site live with 10+ published articles? |

---

## Related Documents

- [PROJECT_VISION.md](./PROJECT_VISION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
