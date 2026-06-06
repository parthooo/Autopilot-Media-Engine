# Setup Guide — Autopilot Media Engine

## 1. Local environment

```bash
cp .env.example .env
```

Fill in:

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | [Neon](https://neon.tech) → Connection string |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — **free** |
| `REDDIT_CLIENT_ID` | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) → create **script** app → ID under app name |
| `REDDIT_CLIENT_SECRET` | Same page → **secret** field |
| `REDDIT_USER_AGENT` | `autopilot-media-engine:1.0.0 (by /u/yourusername)` |
| `SITE_PASSWORD` | Dashboard login password (set on Vercel for production; optional locally) |

```bash
npm install
npm run db:push
npm run db:seed
npm run worker -- pipeline   # ingest → score → AI picks ONE winner
npm run dev
```

Open http://localhost:3000 — the **AI-selected winner** appears on Overview.

---

## 2. GitHub Actions (auto-run every 6 hours)

Workflows live in `.github/workflows/`:

| File | Schedule | What it does |
|------|----------|--------------|
| `pipeline.yml` | Every 6h + manual | **Full automation** — ingest, score, AI pick winner |
| `ingest.yml` | Every 6h + manual | Ingest only |
| `score.yml` | 30min after ingest | Score only |
| `auto-select.yml` | Manual only | AI pick winner only |

### Push repo to GitHub

```bash
git init
git add .
git commit -m "Initial Autopilot Media Engine"
git remote add origin https://github.com/YOUR_USERNAME/autopilot-media-engine.git
git push -u origin main
```

### Add GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Same Neon connection string from `.env` |
| `REDDIT_CLIENT_ID` | Same as `.env` |
| `REDDIT_CLIENT_SECRET` | Same as `.env` |
| `REDDIT_USER_AGENT` | Same as `.env` |
| `GEMINI_API_KEY` | Same as `.env` — enables AI winner selection |
| `YOUTUBE_API_KEY` | Same as `.env` — enables YouTube trending ingest |

### Verify it works

1. Go to **Actions** tab in GitHub
2. Click **Full Pipeline** workflow
3. Click **Run workflow** → Run
4. Wait ~2–5 minutes
5. Refresh your dashboard — new topics + AI winner should appear

### Enable scheduled runs

Scheduled workflows only run on the **default branch** (`main`). After pushing to `main`, `pipeline.yml` runs automatically every 6 hours.

---

## 3. Dashboard manual buttons

On **Overview** and **Ingestion** pages:

| Button | Action |
|--------|--------|
| Run Ingest | Fetch trends from HN, Reddit, Google Trends |
| Run Score | Calculate opportunity scores |
| AI Pick Winner | Gemini analyzes top 15, approves ONE, rejects rest |
| **Full Pipeline** | All three steps (recommended) |

**Locally:** runs inline immediately.

**On Vercel:** auto-dispatches GitHub Actions (needs optional secrets below).

### Optional: trigger GitHub from Vercel dashboard

Add to Vercel env vars:

| Variable | Value |
|----------|-------|
| `GITHUB_TOKEN` | Personal access token with `repo` + `workflow` scope |
| `GITHUB_REPOSITORY` | `your-username/autopilot-media-engine` |
| `GITHUB_REF` | `main` |

Create token: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → select repo → Actions: Read and write.

---

## 4. Fully automated flow (zero manual review)

```
Every 6 hours (GitHub Actions)
    ↓
Ingest trends (HN + Reddit + Google Trends)
    ↓
Score all opportunities (rule-based 0–100)
    ↓
Gemini analyzes top 15 candidates
    ↓
AI picks ONE winner → auto-approved
    ↓
Previous winners → archived
    Other candidates → rejected
    ↓
Dashboard shows winner + content strategy
```

**You do nothing.** Check dashboard occasionally to see what niche the AI chose.

### Without GEMINI_API_KEY

Falls back to rule-based selection (evergreen + monetization scores). Still auto-approves ONE winner, but less intelligent.

---

## 5. Deploy dashboard to Vercel

1. Import GitHub repo on [vercel.com](https://vercel.com)
2. **Root Directory:** `apps/web` (required for this monorepo)
3. Enable **"Include source files outside of the Root Directory"** if offered
3. **Environment variables** (Settings → Environment Variables):

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Yes |
| `SITE_PASSWORD` | Yes — locks dashboard behind `/login` (works on free Hobby plan) |
| `GEMINI_API_KEY` | Yes (for AI buttons on Vercel) |
| `YOUTUBE_API_KEY` | Yes (if ingest runs inline on Vercel; also required in GitHub Secrets) |
| `REDDIT_CLIENT_ID` | Yes (if running ingest from Vercel) |
| `REDDIT_CLIENT_SECRET` | Yes (if running ingest from Vercel) |
| `REDDIT_USER_AGENT` | Yes (if running ingest from Vercel) |

4. Optional: `GITHUB_TOKEN` + `GITHUB_REPOSITORY` to trigger GitHub Actions from buttons
5. Deploy

If build fails with `@prisma/client did not initialize`, ensure latest code is pushed (includes `postinstall` prisma generate).

---

## 6. Ingestion troubleshooting

| Source | Symptom | Fix |
|--------|---------|-----|
| **Google Trends** | `Unexpected token '<'` | Fixed in latest code — uses official Trends RSS feed instead of broken `google-trends-api` package |
| **Reddit** | `403` or can't create app | Reddit blocked anonymous API in May 2026 and **new app registration is often broken**. If `reddit.com/prefs/apps` won't create an app, leave Reddit disabled — **Dev.to** is enabled as a free replacement (no OAuth) |
| **Hacker News** | — | Should always work (no auth) |
| **Dev.to** | — | Free public API, no auth |
| **GitHub Trending** | HTML parse error | Scrapes `github.com/trending` — no API key needed |
| **Product Hunt** | Feed error | Uses public Atom feed at `producthunt.com/feed` |
| **YouTube** | Missing API key | Create key in [Google Cloud Console](https://console.cloud.google.com/) → enable **YouTube Data API v3** → add `YOUTUBE_API_KEY` to `.env`, then set `youtube` source active in seed |

### Active sources (default)

| Source | Auth | Cost |
|--------|------|------|
| Hacker News | None | Free |
| Google Trends | None (RSS) | Free |
| Dev.to | None | Free |
| GitHub Trending | None (scrape) | Free |
| Product Hunt | None (RSS) | Free |
| Reddit | OAuth (broken for new apps) | Disabled |
| YouTube | `YOUTUBE_API_KEY` | Free tier (10k units/day) |

After updating `.env`, run **Run Ingest** on the dashboard or `npm run worker -- ingest-all`.

---

## 7. What happens next (roadmap)

The AI winner includes a **content strategy** (5 article titles). Next phases will:

- **Phase 4:** Auto-generate those articles (Gemini)
- **Phase 5:** Publish to your first SEO site

You are currently at: **automated discovery + AI niche selection**.
