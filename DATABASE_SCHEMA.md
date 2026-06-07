# AUTOPILOT MEDIA ENGINE — Database Schema

PostgreSQL on Neon. ORM: Prisma. This document is the data model source of truth.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how data flows through the system.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    Source ||--o{ RawSignal : produces
    Source ||--o{ IngestionRun : logs
    Source ||--o{ TopicMetric : captures
    RawSignal }o--o| Topic : normalizes_to
    Topic ||--o{ TopicMetric : has
    Topic ||--o| Opportunity : becomes
    Opportunity ||--o{ OpportunityScoreHistory : tracks
    Opportunity ||--o| OpportunityAnalysis : has
    Opportunity ||--o{ ContentAsset : generates
    ContentAsset ||--o{ Publication : publishes_via
    Channel ||--o{ Publication : receives
    Channel ||--o{ RevenueEvent : earns

    Source {
        uuid id PK
        string name
        string slug UK
        boolean is_active
        int scrape_interval_hours
        jsonb config
        timestamp created_at
    }

    IngestionRun {
        uuid id PK
        uuid source_id FK
        string status
        int records_fetched
        int records_new
        text error_message
        timestamp started_at
        timestamp completed_at
    }

    RawSignal {
        uuid id PK
        uuid source_id FK
        string external_id
        string title
        string url
        text description
        jsonb raw_payload
        timestamp discovered_at
        uuid topic_id FK
    }

    Topic {
        uuid id PK
        string slug UK
        string title
        string normalized_key UK
        string category
        text_array keywords
        timestamp first_seen_at
        timestamp last_seen_at
        int signal_count
    }

    TopicMetric {
        uuid id PK
        uuid topic_id FK
        uuid source_id FK
        int rank_position
        int volume_estimate
        float velocity_score
        float engagement_score
        timestamp captured_at
    }

    Opportunity {
        uuid id PK
        uuid topic_id FK UK
        float growth_score
        float competition_score
        float monetization_score
        float usa_audience_score
        float evergreen_score
        float opportunity_score
        string status
        timestamp scored_at
        timestamp updated_at
    }

    OpportunityScoreHistory {
        uuid id PK
        uuid opportunity_id FK
        float opportunity_score
        jsonb scores_json
        timestamp recorded_at
    }
```

---

## Table Definitions

### Phase 1–2 (Build in Week 1)

#### `sources`

Registry of monitored platforms. Worker reads active sources at job start.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `name` | VARCHAR(100) | NOT NULL | Display name, e.g. "Hacker News" |
| `slug` | VARCHAR(50) | NOT NULL, UNIQUE | Machine key, e.g. `hacker-news` |
| `is_active` | BOOLEAN | NOT NULL, default `false` | Only active sources are ingested |
| `scrape_interval_hours` | INT | NOT NULL, default `6` | Expected cadence |
| `config` | JSONB | default `{}` | Source-specific settings (subreddit list, etc.) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

**Seed data (Week 1):**

| slug | name | is_active (MVP) |
|------|------|-----------------|
| `hacker-news` | Hacker News | true |
| `reddit` | Reddit | true |
| `google-trends` | Google Trends | true |
| `github-trending` | GitHub Trending | false |
| `product-hunt` | Product Hunt | false |
| `youtube` | YouTube | false |

---

#### `ingestion_runs`

Audit log for every worker ingest execution. Critical for debugging unattended pipelines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `source_id` | UUID | FK → `sources.id`, NOT NULL | |
| `status` | VARCHAR(20) | NOT NULL | `running`, `success`, `failed` |
| `records_fetched` | INT | NOT NULL, default `0` | Items returned by adapter |
| `records_new` | INT | NOT NULL, default `0` | New `raw_signals` inserted |
| `error_message` | TEXT | nullable | Populated on failure |
| `started_at` | TIMESTAMPTZ | NOT NULL | |
| `completed_at` | TIMESTAMPTZ | nullable | Null while running |

**Indexes:**

- `(source_id, started_at DESC)` — run history per source
- `(status, started_at DESC)` — find failures quickly

---

#### `raw_signals`

Immutable ingested items before or after topic assignment. Never update — only insert.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `source_id` | UUID | FK → `sources.id`, NOT NULL | |
| `external_id` | VARCHAR(255) | NOT NULL | Source-native ID (HN story id, Reddit post id) |
| `title` | VARCHAR(500) | NOT NULL | |
| `url` | TEXT | nullable | Canonical link |
| `description` | TEXT | nullable | Subtitle, selftext, or summary |
| `raw_payload` | JSONB | NOT NULL | Full adapter response for audit |
| `discovered_at` | TIMESTAMPTZ | NOT NULL | When the source published or we found it |
| `topic_id` | UUID | FK → `topics.id`, nullable | Set after normalization |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | When we ingested it |

**Constraints:**

- `UNIQUE (source_id, external_id)` — dedup within source

**Indexes:**

- `(source_id, discovered_at DESC)`
- `(topic_id)` — join to topics

---

#### `topics`

Deduplicated, normalized trend subjects. The central entity for scoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-safe display slug |
| `title` | VARCHAR(500) | NOT NULL | Best available human title |
| `normalized_key` | VARCHAR(255) | NOT NULL, UNIQUE | Fingerprint for deduplication |
| `category` | VARCHAR(100) | nullable | Auto or manual: `tech`, `finance`, `saas`, etc. |
| `keywords` | TEXT[] | default `{}` | Extracted terms for search/scoring |
| `first_seen_at` | TIMESTAMPTZ | NOT NULL | |
| `last_seen_at` | TIMESTAMPTZ | NOT NULL | Updated on each new signal |
| `signal_count` | INT | NOT NULL, default `1` | Total linked raw_signals |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

**Indexes:**

- `(normalized_key)` — dedup lookup
- `(last_seen_at DESC)` — recent trends
- `(category)` — filter by category
- GIN on `keywords` — keyword search (optional)

---

#### `topic_metrics`

Time-series snapshots. One row per topic per source per ingest cycle. Powers growth scoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `topic_id` | UUID | FK → `topics.id`, NOT NULL | |
| `source_id` | UUID | FK → `sources.id`, NOT NULL | |
| `rank_position` | INT | nullable | Position in source feed (1 = top) |
| `volume_estimate` | INT | nullable | Upvotes, search volume proxy, stars, etc. |
| `velocity_score` | FLOAT | nullable | Computed growth rate for this snapshot |
| `engagement_score` | FLOAT | nullable | Comments, shares, etc. normalized 0–100 |
| `captured_at` | TIMESTAMPTZ | NOT NULL | Ingest timestamp |

**Indexes:**

- `(topic_id, captured_at DESC)` — charts and growth calculation
- `(source_id, captured_at DESC)` — source activity over time

---

#### `opportunities`

Scored opportunities. One per topic (1:1). Created/updated by scoring job.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `topic_id` | UUID | FK → `topics.id`, NOT NULL, UNIQUE | One opportunity per topic |
| `growth_score` | FLOAT | NOT NULL, default `0` | 0–100 |
| `competition_score` | FLOAT | NOT NULL, default `0` | 0–100 (higher = more competition) |
| `monetization_score` | FLOAT | NOT NULL, default `0` | 0–100 |
| `usa_audience_score` | FLOAT | NOT NULL, default `0` | 0–100 |
| `evergreen_score` | FLOAT | NOT NULL, default `0` | 0–100 |
| `opportunity_score` | FLOAT | NOT NULL, default `0` | Weighted composite 0–100 |
| `status` | VARCHAR(20) | NOT NULL, default `new` | See status enum below |
| `scored_at` | TIMESTAMPTZ | NOT NULL | Last score calculation |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

**Status enum:** `new` → `reviewing` → `approved` | `rejected` | `archived`

**Indexes:**

- `(opportunity_score DESC)` WHERE `status != 'archived'` — dashboard ranking
- `(status, opportunity_score DESC)` — filtered lists
- `(topic_id)` — detail lookups

---

#### `opportunity_score_history`

Track how scores change over time. Enables "rising opportunity" detection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `opportunity_id` | UUID | FK → `opportunities.id`, NOT NULL | |
| `opportunity_score` | FLOAT | NOT NULL | Composite at time of recording |
| `scores_json` | JSONB | NOT NULL | All sub-scores snapshot |
| `recorded_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

**Indexes:**

- `(opportunity_id, recorded_at DESC)`

**`scores_json` example:**

```json
{
  "growth": 78.5,
  "competition": 32.0,
  "monetization": 65.0,
  "usa_audience": 71.0,
  "evergreen": 55.0,
  "opportunity": 72.3
}
```

---

### Phase 3 (AI Analysis)

#### `opportunity_analyses`

One active analysis per opportunity. Re-analysis creates new row or upserts with `analyzed_at` update.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `opportunity_id` | UUID | FK → `opportunities.id`, NOT NULL, UNIQUE | |
| `trend_explanation` | TEXT | NOT NULL | Why this is trending |
| `audience_analysis` | JSONB | NOT NULL | Demographics, intent, geography |
| `seo_keywords` | JSONB | NOT NULL | Primary + long-tail keywords |
| `youtube_ideas` | JSONB | NOT NULL | Video concepts with angles |
| `affiliate_potential` | JSONB | NOT NULL | Products, programs, commission estimates |
| `revenue_estimate` | JSONB | NOT NULL | Traffic/revenue ranges |
| `content_strategy` | JSONB | NOT NULL | Cluster plan, publishing order |
| `model_version` | VARCHAR(50) | NOT NULL | e.g. `gemini-2.0-flash` |
| `analyzed_at` | TIMESTAMPTZ | NOT NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

---

### Phase 4 (Content Factory)

#### `content_assets`

Generated content awaiting human review.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `opportunity_id` | UUID | FK → `opportunities.id`, NOT NULL | |
| `asset_type` | VARCHAR(30) | NOT NULL | See asset types below |
| `title` | VARCHAR(500) | NOT NULL | |
| `body` | TEXT | NOT NULL | Main content (Markdown) |
| `metadata` | JSONB | default `{}` | SEO title, description, tags, word count |
| `status` | VARCHAR(20) | NOT NULL, default `draft` | `draft`, `approved`, `rejected`, `published` |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

**Asset types:** `article`, `youtube_script`, `shorts_script`, `social_post`, `newsletter`

**Indexes:**

- `(opportunity_id, asset_type)`
- `(status, created_at DESC)`

---

### Phase 5 (Publishing)

#### `channels`

Publishing destinations (sites, accounts).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `name` | VARCHAR(100) | NOT NULL | e.g. "Finance Calc Site" |
| `platform` | VARCHAR(30) | NOT NULL | `markdown`, `wordpress`, `nextjs`, `youtube` |
| `config` | JSONB | NOT NULL, default `{}` | API URLs, credentials ref, repo path |
| `is_active` | BOOLEAN | NOT NULL, default `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

---

#### `publications`

Record of what was published where.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `content_asset_id` | UUID | FK → `content_assets.id`, NOT NULL | |
| `channel_id` | UUID | FK → `channels.id`, NOT NULL | |
| `external_url` | TEXT | nullable | Live URL after publish |
| `external_id` | VARCHAR(255) | nullable | Platform post/video ID |
| `status` | VARCHAR(20) | NOT NULL | `pending`, `published`, `failed` |
| `error_message` | TEXT | nullable | |
| `published_at` | TIMESTAMPTZ | nullable | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

**Indexes:**

- `(channel_id, published_at DESC)`
- `(content_asset_id)`

---

### Phase 6 (Revenue)

#### `revenue_events`

Manual entry first. API integration later.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `channel_id` | UUID | FK → `channels.id`, NOT NULL | |
| `event_type` | VARCHAR(30) | NOT NULL | `adsense`, `affiliate`, `sponsorship` |
| `amount_usd` | DECIMAL(10,2) | NOT NULL | |
| `period_start` | DATE | NOT NULL | |
| `period_end` | DATE | NOT NULL | |
| `notes` | TEXT | nullable | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |

---

## Prisma Schema Conventions

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Use UUID for all PKs
// Use @map("snake_case") for column names
// Use @@map("table_name") for table names
// Timestamps: always TIMESTAMPTZ
// JSON fields: Json type in Prisma
```

### Naming Rules

| Layer | Convention | Example |
|-------|------------|---------|
| Table | snake_case plural | `raw_signals` |
| Column | snake_case | `normalized_key` |
| Prisma model | PascalCase singular | `RawSignal` |
| Enum | PascalCase | `OpportunityStatus` |

---

## Topic Normalization Algorithm

Implemented in `packages/core` — documented here because it defines how `topics.normalized_key` is generated.

```
Input:  raw signal title
Step 1: lowercase
Step 2: remove URLs
Step 3: remove punctuation except spaces
Step 4: collapse whitespace
Step 5: remove stop words
Step 6: sort remaining tokens alphabetically (optional, improves cross-source match)
Step 7: join with hyphens → normalized_key
Step 8: slug from title → slug column
```

**Stop words (initial set):** `a`, `an`, `the`, `is`, `are`, `was`, `were`, `in`, `on`, `at`, `to`, `for`, `of`, `and`, `or`, `but`, `how`, `what`, `why`, `when`, `who`

**Merge rule:** If `normalized_key` exists → attach `raw_signal` to existing `topic`, increment `signal_count`, update `last_seen_at`. Else → create new `topic`.

---

## Query Patterns (Hot Paths)

### Dashboard: top opportunities

```sql
SELECT o.*, t.title, t.slug, t.category
FROM opportunities o
JOIN topics t ON t.id = o.topic_id
WHERE o.status NOT IN ('archived', 'rejected')
ORDER BY o.opportunity_score DESC
LIMIT 20;
```

### Growth calculation: topic velocity

```sql
SELECT topic_id, source_id,
       rank_position,
       captured_at,
       LAG(rank_position) OVER (PARTITION BY topic_id, source_id ORDER BY captured_at) AS prev_rank
FROM topic_metrics
WHERE captured_at > NOW() - INTERVAL '48 hours';
```

### Ingestion health

```sql
SELECT s.slug, r.status, r.records_new, r.completed_at, r.error_message
FROM ingestion_runs r
JOIN sources s ON s.id = r.source_id
WHERE r.started_at > NOW() - INTERVAL '24 hours'
ORDER BY r.started_at DESC;
```

### Rising opportunities (score delta)

```sql
SELECT opportunity_id,
       opportunity_score - LAG(opportunity_score) OVER (
         PARTITION BY opportunity_id ORDER BY recorded_at
       ) AS score_delta
FROM opportunity_score_history
WHERE recorded_at > NOW() - INTERVAL '7 days';
```

---

## Migration Strategy

| Phase | Migration | Tables |
|-------|-----------|--------|
| Week 1 | `001_initial` | sources, ingestion_runs, raw_signals, topics, topic_metrics |
| Week 1 | `002_scoring` | opportunities, opportunity_score_history |
| Phase 3 | `003_analysis` | opportunity_analyses |
| Phase 4 | `004_content` | content_assets |
| Phase 4b | `004b_video` | video render metadata on content_assets (or video_assets) |
| Phase 5 | `005_publishing` | channels, publications |
| Phase 6 | `006_channels` | channel portfolio mapping, OAuth fields |
| Phase 6 | `006_revenue` | revenue_events |

Never add Phase 3+ tables before Phase 1–2 are stable. Prisma migrations are sequential and additive — no destructive changes without explicit backup.

### `channels` (Phase 5+)

Stores connected publish targets. One row per platform + channel identity.

| Column | Purpose |
|--------|---------|
| `platform` | `youtube`, `instagram`, `facebook`, `tiktok`, `reddit`, `pinterest`, `static_site` |
| `niche_category` | AI-assigned category (e.g. `tech`, `finance_us`, `ai`) for routing winners |
| `oauth_tokens` | Encrypted refresh token JSON (operator connects once) |
| `is_active` | Whether cron publishes here |

**Multi-channel rule:** one channel per topic category; winner pick assigns content to matching `channels` row.

See [PROJECT_VISION.md](./PROJECT_VISION.md) platform hierarchy and [ARCHITECTURE.md](./ARCHITECTURE.md) multi-channel section.

---

## Data Retention (Future)

Not implemented in MVP. Plan for when DB grows:

| Table | Retention |
|-------|-----------|
| `raw_signals` | Keep 90 days, archive older |
| `topic_metrics` | Keep 1 year |
| `ingestion_runs` | Keep 90 days |
| `opportunity_score_history` | Keep indefinitely (small) |

---

## Related Documents

- [PROJECT_VISION.md](./PROJECT_VISION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
