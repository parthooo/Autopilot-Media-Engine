# AUTOPILOT MEDIA ENGINE — Roadmap

Phased delivery plan from zero to first revenue. Each phase has a clear gate: do not start the next phase until the current one meets its success criteria.

See [PROJECT_VISION.md](./PROJECT_VISION.md) for principles and [ARCHITECTURE.md](./ARCHITECTURE.md) for technical design.

---

## Timeline Overview

```
Phase 0–2   Foundation, discovery, scoring     ← niche library (Parent)
Phase 3     AI analysis + winner pick          ← Gate (one winner/cycle)
Phase 4a    Text content factory               ← scripts + articles (Children) [IN PROGRESS]
Phase 4b    Video render factory               ← MP4 long + Shorts ($0 stack)
Phase 5a    Video publishers                   ← YT, IG, FB, TikTok, Reddit, Pinterest
Phase 5b    Article publishers                 ← SEO site (when budget allows)
Phase 6     Multi-channel + revenue dashboard

Revenue path ($0 out-of-pocket):
  Now        → Niche library + winner pick running unattended
  Phase 4a   → Scripts + articles from winner (YouTube-first)
  Phase 4b   → Auto-rendered videos (no manual recording)
  Phase 5a   → Auto-publish to social platforms ($0 hosting)
  Phase 5b   → Article site when domain budget exists
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

## Phase 4a — Content Factory: Text (current)

**Goal:** From the **approved winner only**, generate video scripts + article cluster in parallel.

**Hierarchy layer:** Video child + Article child (text stage).

### Output Types

| Asset Type | Branch | Format |
|------------|--------|--------|
| `youtube_script` | Video | Long-form, timestamped, B-roll cues |
| `shorts_script` | Video | 30–60 sec vertical |
| `article` | Article | Markdown + frontmatter |

### Deliverables

- [x] `content_assets` table
- [x] Generation prompts in `packages/ai`
- [x] Worker: `generate-content` (YouTube-first variants)
- [x] Dashboard: content queue + manual generate buttons
- [x] Winner analysis always includes video strategy (pillar + Shorts cluster)

### Success Criteria

- One approved winner → 1 pillar script + 5 Shorts + 5 articles per cycle
- Automation + manual parity per [AUTOMATION.md](./AUTOMATION.md)

### Gate to Phase 4b

Scripts generate reliably from winner; pipeline runs unattended for 7+ days.

---

## Phase 4b — Video Factory: Render

**Goal:** Turn approved scripts into **MP4 files** automatically — no manual recording.

**Hierarchy layer:** Video child (render step).

### Stack ($0 default)

| Component | Tool |
|-----------|------|
| Voice | Edge TTS / Piper / Gemini TTS |
| Visuals | Pexels/Pixabay stock, slides |
| Assembly | FFmpeg |
| Worker | GitHub Actions or free Render/Railway if timeouts hit |

### Deliverables

- [ ] `packages/video` — render pipeline
- [ ] `video_assets` table (or extend `content_assets` with `rendered` metadata)
- [ ] Worker: `render-videos` for approved winner's scripts
- [ ] Dashboard + CLI + workflow (manual parity)
- [ ] Long-form 9:16 Shorts from same pipeline

### Success Criteria

- Winner's pillar script → watchable MP4 without human editing
- 5 Shorts rendered per cycle

### Gate to Phase 5a

At least one rendered video you'd publish without re-recording.

---

## Phase 5a — Video Publishers

**Goal:** Auto-upload rendered videos to connected social platforms on a schedule.

**Hierarchy layer:** Video sub-children (publisher adapters).

### Platform priority

| Priority | Platform | Notes |
|----------|----------|-------|
| P0 | YouTube | Data API v3, OAuth per channel |
| P1 | TikTok | Content Posting API |
| P1 | Instagram | Meta Graph API (Reels) |
| P2 | Facebook | Meta Graph API |
| P2 | Pinterest | Video pins API |
| P2 | Reddit | Post API (native video) |

### Deliverables

- [ ] `packages/publishers` adapter interface
- [ ] `channels` table — platform, niche category, OAuth tokens
- [ ] `publications` table — asset → platform → URL/status
- [ ] Worker: `publish-video`
- [ ] Operator connects channel creds once; automation handles rest
- [ ] Dashboard: publication status, manual publish button per platform

### Success Criteria

- Rendered video auto-uploads to YouTube + at least one other platform
- Full autopilot: winner → render → publish without manual steps

---

## Phase 5b — Article Publishers

**Goal:** Auto-publish article cluster from winner when site exists.

**Hierarchy layer:** Article sub-children.

### Deliverables

- [ ] Static site / Markdown publisher adapter
- [ ] Worker: `publish-articles`
- [ ] Deferred until operator has domain budget OR free `*.vercel.app` staging

### Success Criteria

- 5+ articles from winner live on a site via one cron/button

---

## Phase 6 — Multi-Channel Portfolio & Revenue

**Goal:** AI recommends channel portfolio; operator connects multiple single-topic channels; platform routes each winner to the correct channel.

### Deliverables

- [ ] AI channel portfolio analysis (how many channels, what categories)
- [ ] Winner → channel assignment in analysis
- [ ] Dashboard: channel manager, OAuth connect flow, per-channel metrics
- [ ] Revenue manual entry + funnel metrics

### Success Criteria

- 2+ channels publishing automatically from same niche library
- Daily operator time < 30 min

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
| M2 | Month 1–2 | Launch YouTube channel for #1 opportunity — scripts from Content Factory, manual upload ($0) |
| M3 | Month 2–3 | 10+ videos / Shorts published; apply for YouTube Partner Program when eligible |
| M4 | Month 3+ | Generate article cluster in parallel (review queue); **no domain purchase required yet** |
| M5 | Month 4+ | Deploy SEO site **only when revenue covers domain + hosting** |
| M6 | Month 5–6 | AdSense + affiliate on article site (second asset) |
| **Goal** | Month 6–8 | **$100/month** combined YouTube + site revenue |

### Dual-track from one winner

Each cycle: **pick one winner** → parallel generation:

| Track | Output | Publish targets | Priority |
|-------|--------|-----------------|----------|
| Video | scripts → MP4 → publish | YouTube, IG, FB, TikTok, Reddit, Pinterest | **P0** |
| Article | Markdown cluster | SEO site (when budget exists) | **P1** |

---

## What NOT to Build (Any Phase)

- Custom admin framework — use Next.js App Router directly
- Real-time WebSocket dashboard — polling / refresh is fine
- Multi-user RBAC — solo operator only
- Kubernetes — never, for this project
- Embedding-based topic clustering — defer until rule-based normalization fails
- Generating content for **all** library niches at once — **one winner per cycle only**
- Manual upload as the **permanent** architecture — full autopilot publish is the north star
- Paid video APIs (Runway, etc.) by default — compose $0 TTS + stock + FFmpeg first

---

## Phase Gate Checklist

Before advancing, confirm:

| Gate | Question |
|------|----------|
| Phase 0 → 1 | Does ingest + score run 7 days without you? |
| Phase 1 → 2 | Are 500+ topics deduplicated correctly? |
| Phase 2 → 3 | Can you explain the top 5 scores without guessing? |
| Phase 3 → 4 | Is one analysis good enough to plan content? |
| Phase 4a → 4b | Do winner's scripts render to watchable MP4 without you? |
| Phase 4b → 5a | Would you auto-publish one rendered video to YouTube? |
| Phase 5a → 5b | Is video publishing unattended on 2+ platforms? |
| Phase 5b → 6 | Are articles live on a site from the same winner pipeline? |
| Phase 6 | Are 2+ channels fed automatically with < 30 min/day from you? |

---

## Related Documents

- [PROJECT_VISION.md](./PROJECT_VISION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AUTOMATION.md](./AUTOMATION.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
