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
| `REDDIT_USER_AGENT` | `autopilot-media-engine:1.0.0 (by /u/yourusername)` |
| `ADMIN_API_KEY` | Any random string (protects manual API triggers) |

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
| `REDDIT_USER_AGENT` | Same as `.env` |
| `GEMINI_API_KEY` | Same as `.env` — enables AI winner selection |

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
2. Root directory: `apps/web`
3. Environment variables: `DATABASE_URL`, `GEMINI_API_KEY`, `ADMIN_API_KEY`
4. Optional: `GITHUB_TOKEN`, `GITHUB_REPOSITORY` for manual buttons
5. Deploy

---

## 6. What happens next (roadmap)

The AI winner includes a **content strategy** (5 article titles). Next phases will:

- **Phase 4:** Auto-generate those articles (Gemini)
- **Phase 5:** Publish to your first SEO site

You are currently at: **automated discovery + AI niche selection**.
