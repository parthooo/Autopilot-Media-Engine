# Autopilot Media Engine

Central intelligence platform for automated media businesses. Discovers trends, scores opportunities, and feeds future content assets.

**Read before coding:** [AGENTS.md](./AGENTS.md) → [PROJECT_VISION.md](./PROJECT_VISION.md) → [ARCHITECTURE.md](./ARCHITECTURE.md) → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) → [ROADMAP.md](./ROADMAP.md)

## Stack

- **Frontend:** Next.js on Vercel
- **Worker:** Node.js CLI (GitHub Actions cron)
- **Database:** PostgreSQL via Neon + Prisma
- **Monorepo:** npm workspaces

## Project Structure

```
apps/
  web/       → Dashboard + API routes
  worker/    → Background jobs (ingest, score)
packages/
  database/  → Prisma schema + client
  core/      → Topic normalization, shared utils
  ingest/    → Source adapters (HN, Reddit, Google Trends)
  scoring/   → Opportunity scoring engine
```

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Neon PostgreSQL database ([neon.tech](https://neon.tech))

### 2. Fresh clone checklist

After `git clone` on a new device or folder:

```bash
cp .env.example .env   # secrets + DB URLs (edit before continuing)
npm install            # deps + Prisma client (postinstall)
npm run db:push        # create tables in Neon
npm run db:seed        # default ingest sources
npm run dev            # dashboard → http://localhost:3000
```

| Step | Why |
|------|-----|
| `cp .env.example .env` | `.env` is not in git. Single file at **repo root** only. Do this **before** `npm install`. |
| `npm install` | `node_modules` is not in git; `postinstall` runs `prisma generate`. |
| `npm run db:push` | Empty Neon DB has no tables until schema is pushed. |
| `npm run db:seed` | Pipeline needs seeded `Source` rows (HN, Reddit, Dev.to, …). |

Using a **shared Neon database**? Skip `db:push` / `db:seed` if already done — you still need your own `.env`.

See [SETUP.md](./SETUP.md) for GitHub Actions, Vercel, and troubleshooting.

### 3. Run ingestion + scoring

```bash
# Ingest all active sources
npm run worker -- ingest-all

# Score opportunities
npm run worker -- score

# Or ingest a single source
npm run worker -- ingest --source=hacker-news
```

### 4. Start dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon pooled connection string (`-pooler` host) |
| `DIRECT_URL` | Yes | Neon direct URL (migrations + local `next dev`) |
| `GEMINI_API_KEY` | Yes (AI winner) | Google AI Studio — free tier |
| `REDDIT_CLIENT_ID` | For Reddit ingest | Reddit script app |
| `REDDIT_CLIENT_SECRET` | For Reddit ingest | Reddit script app secret |
| `REDDIT_USER_AGENT` | For Reddit ingest | `autopilot-media-engine:1.0.0 (by /u/you)` |
| `SITE_PASSWORD` | Production dashboard | Optional locally (skip login if unset) |
| `YOUTUBE_API_KEY` | Optional | YouTube trending ingest |
| `GITHUB_TOKEN` | Optional | Dashboard buttons → trigger GitHub Actions |
| `ADMIN_API_KEY` | Optional | Protects manual API triggers |

## Deployment

### Vercel (Dashboard)

1. Import repo to Vercel
2. Set root directory to `apps/web`
3. Add `DATABASE_URL` environment variable
4. Deploy

### GitHub Actions (Worker)

Add repository secrets:

- `DATABASE_URL`
- `REDDIT_USER_AGENT`

Workflows run every 6 hours automatically.

## Worker Commands

| Command | Description |
|---------|-------------|
| `npm run worker -- ingest-all` | Ingest all active sources |
| `npm run worker -- ingest --source=reddit` | Ingest one source |
| `npm run worker -- score` | Calculate opportunity scores |

## Adding a New Source

1. Create adapter in `packages/ingest/src/adapters/`
2. Register in `packages/ingest/src/registry.js`
3. Add seed row in `packages/database/prisma/seed.js`
4. Run `npm run db:seed`

## Current Phase

**Phase 0 — Foundation (Week 1)**

See [ROADMAP.md](./ROADMAP.md) for full timeline.

## License

Private — solo operator project.
