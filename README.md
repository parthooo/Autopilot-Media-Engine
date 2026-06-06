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

### 2. Setup

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Push schema and seed sources
npm run db:push
npm run db:seed
```

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
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `REDDIT_USER_AGENT` | For Reddit | Custom user agent string |
| `ADMIN_API_KEY` | For triggers | Protects manual API triggers |
| `GEMINI_API_KEY` | Phase 3+ | AI analysis |

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
