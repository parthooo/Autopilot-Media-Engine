# Automation & Manual Actions

Every automated job in Autopilot Media Engine **must** have a manual trigger. Automation runs while the operator is offline; manual triggers run the same code path on demand.

**Rule for all new features:** If you add a cron job, GitHub Action, or unattended pipeline step, you must also add:

1. A **dashboard button** (or control on the relevant page)
2. A **worker CLI command** (documented in `apps/worker` help)
3. A **`workflow_dispatch`** entry in `.github/workflows/` (when the job runs in CI)
4. A row in the matrix below

Do not ship automation-only features.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md) (worker pipeline), [SETUP.md](./SETUP.md) (secrets & GitHub).

---

## Action matrix

| Step | What it does | Automatic (background) | Manual — dashboard | Manual — CLI | GitHub Actions |
|------|----------------|------------------------|--------------------|--------------|----------------|
| **Ingest all** | Fetch trends from active sources | `ingest.yml` — every 6h | **Run ingest** on Overview / Ingestion / Content | `npm run worker -- ingest-all` | `ingest.yml` → Run workflow |
| **Score** | Calculate opportunity scores | `score.yml` — 30 min after each 6h block | **Run score** | `npm run worker -- score` | `score.yml` → Run workflow |
| **AI pick winner** | Gemini approves one niche | Inside `pipeline.yml` (every 6h) | **AI pick** | `npm run worker -- auto-select` | `auto-select.yml` → Run workflow |
| **Generate YouTube** | 1 pillar script + 5 Shorts | Inside `pipeline.yml` (every 6h) | **Generate YouTube** | `npm run worker -- generate-content --youtube-only` | `generate-content.yml` → variant `youtube-only` |
| **Generate articles** | 5 SEO articles (publish later) | Inside `pipeline.yml` (every 6h) | **Generate articles** | `npm run worker -- generate-content --articles-only` | `generate-content.yml` → variant `articles-only` |
| **Generate all content** | YouTube + articles | Inside `pipeline.yml` (every 6h) | **Generate all** | `npm run worker -- generate-content` | `generate-content.yml` → variant `all` |
| **Full pipeline** | Ingest → score → pick → generate | `pipeline.yml` — every 6h | **Full pipeline** | `npm run worker -- pipeline` | `pipeline.yml` → Run workflow |
| **Export content** | Write approved assets to `content/` | — (local only) | **Export to disk** (local dev) | `npm run worker -- generate-content --export` | — (no CI; filesystem) |
| **Approve / reject opportunity** | Human status change | AI auto-approves one winner | Buttons on opportunity detail | — | — |

---

## Where manual controls live

| Page | Controls |
|------|----------|
| **Overview** (`/`) | Full pipeline panel — all manual triggers |
| **Ingestion** (`/ingestion`) | Same pipeline panel + run history |
| **Content** (`/content`) | Content generation panel (YouTube / articles / all / export) |
| **Opportunity detail** | Approve / Reject / Archive |
| **GitHub → Actions** | Run any workflow when dashboard unavailable |

---

## Execution modes

When you click a dashboard button:

| Environment | Behavior |
|-------------|----------|
| **Local** (`npm run dev`) | Runs inline in the Next.js API route (same as CLI) |
| **Vercel** | Dispatches matching GitHub Actions workflow (needs `GITHUB_TOKEN` + `GITHUB_REPOSITORY`) |
| **Terminal** | Always inline via `npm run worker -- …` |

---

## Scheduled timeline (default)

```
:00  ingest.yml + pipeline.yml  (every 6 hours)
:30  score.yml                 (30 min after ingest block)
```

`auto-select` and `generate-content` are **not** separate crons — they run inside `pipeline.yml`. They still have **dedicated manual buttons** and **standalone GitHub workflows** for on-demand use.

---

## Adding a new automated step (checklist)

- [ ] Implement in `packages/pipeline` (or worker)
- [ ] Add CLI command in `apps/worker/src/index.js`
- [ ] Add API handler in `apps/web/app/api/pipeline/trigger/route.js`
- [ ] Add button in `apps/web/components/pipeline-controls.js` (or page-specific panel)
- [ ] Add / update `.github/workflows/*.yml` with `workflow_dispatch`
- [ ] If scheduled, add `schedule` cron to workflow
- [ ] Update this matrix in `AUTOMATION.md`
- [ ] Update [Guide](/guide) page if operator-facing

---

## Related documents

| File | Purpose |
|------|---------|
| [AGENTS.md](./AGENTS.md) | Agent pre-flight — includes automation parity rule |
| [PROJECT_VISION.md](./PROJECT_VISION.md) | Principle: automation + manual control |
| [SETUP.md](./SETUP.md) | GitHub secrets, Vercel env, verifying workflows |
