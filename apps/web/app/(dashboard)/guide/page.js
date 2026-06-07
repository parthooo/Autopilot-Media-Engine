import { PageHeader } from "../../../components/page-header";
import Link from "next/link";

export const metadata = {
  title: "Guide — Autopilot Media Engine",
};

export default function GuidePage() {
  return (
    <div>
      <PageHeader
        title="Guide"
        subtitle="What this dashboard does, how to navigate it, and what you should do"
      />

      <div className="guide-layout">
        <section className="panel guide-section">
          <div className="panel-title">What is this?</div>
          <div className="guide-body">
            <p>
              <strong>Autopilot Media Engine</strong> is your automated trend-to-content
              pipeline. It watches the internet for rising topics, scores them as business
              opportunities, lets AI pick <em>one winning niche</em>, and generates{" "}
              <strong>YouTube scripts + Shorts</strong> (primary, $0 to publish) plus SEO
              articles (for later, when you have budget for a domain).
            </p>
            <p className="muted">
              This dashboard is your control room — not your YouTube channel or SEO site.
              Upload scripts to YouTube Studio when ready; deploy articles later when you
              can afford a domain.
            </p>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">How the pipeline works</div>
          <div className="guide-body">
            <ol className="guide-steps">
              <li>
                <strong>Ingest</strong> — fetch trends from Hacker News, Google Trends,
                Dev.to, GitHub Trending, Product Hunt, and YouTube
              </li>
              <li>
                <strong>Score</strong> — rate each topic 0–100 on growth, competition,
                monetization, USA audience, and evergreen potential
              </li>
              <li>
                <strong>AI pick winner</strong> — Gemini analyzes the top 15 and approves{" "}
                <em>one</em> niche; others are rejected or archived
              </li>
              <li>
                <strong>Generate content</strong> — 1 pillar video script + 5 Shorts + 5
                SEO articles for the approved winner (YouTube first)
              </li>
              <li>
                <strong>Upload to YouTube</strong> — record or TTS, then publish manually ($0)
              </li>
              <li>
                <strong>Publish articles</strong> (later) — deploy to an SEO site when domain
                budget exists
              </li>
            </ol>
            <p className="meta-line">
              Every 6 hours, GitHub Actions runs the full pipeline automatically. You can
              also trigger it manually from Overview or Ingestion.
            </p>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">Navigate the dashboard</div>
          <div className="guide-body">
            <dl className="guide-dl">
              <div className="guide-dl-row">
                <dt>
                  <Link href="/">Overview</Link>
                </dt>
                <dd>
                  Start here. See stats, the current AI-approved niche, top opportunities,
                  and pipeline buttons.
                </dd>
              </div>
              <div className="guide-dl-row">
                <dt>
                  <Link href="/trends">Trends</Link>
                </dt>
                <dd>
                  All discovered topics from every source. Browse what the internet is
                  talking about right now.
                </dd>
              </div>
              <div className="guide-dl-row">
                <dt>
                  <Link href="/opportunities">Opportunities</Link>
                </dt>
                <dd>
                  Scored business opportunities. Higher score = better niche for an SEO site
                  or content business. One will be <strong>approved</strong> by AI.
                </dd>
              </div>
              <div className="guide-dl-row">
                <dt>
                  <Link href="/content">Content</Link>
                </dt>
                <dd>
                  AI-generated scripts and articles for the approved winner. Filter by
                  YouTube, Shorts, or Articles. Each script includes an upload checklist.
                </dd>
              </div>
              <div className="guide-dl-row">
                <dt>
                  <Link href="/ingestion">Ingestion</Link>
                </dt>
                <dd>
                  Pipeline run history per source. Green = success, red = failed. Use this to
                  debug if a source breaks.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">Automatic vs manual</div>
          <div className="guide-body">
            <p>
              <strong>Every automated step has a manual button.</strong> GitHub Actions runs
              the pipeline every 6 hours while you&apos;re offline. When you&apos;re online,
              use the same buttons on Overview, Ingestion, or Content — they run identical
              code.
            </p>
            <ul className="guide-list">
              <li>
                <strong>Auto</strong> — scheduled crons (ingest, score, full pipeline)
              </li>
              <li>
                <strong>Manual</strong> — dashboard buttons, CLI (<code>npm run worker -- …</code>
                ), or GitHub Actions → Run workflow
              </li>
            </ul>
            <p className="meta-line muted">
              Full matrix: <code>AUTOMATION.md</code> in the repo root.
            </p>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">Manual pipeline buttons</div>
          <div className="guide-body">
            <dl className="guide-dl">
              <div className="guide-dl-row">
                <dt>Run ingest</dt>
                <dd>Fetch new trends from all active sources.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Run score</dt>
                <dd>Recalculate opportunity scores.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>AI pick</dt>
                <dd>Gemini picks one winner and auto-approves it.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Generate YouTube</dt>
                <dd>1 pillar script + 5 Shorts ($0 path).</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Generate articles</dt>
                <dd>5 SEO articles only (for later, when domain budget exists).</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Generate all</dt>
                <dd>YouTube + Shorts + articles in one run.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Export to disk</dt>
                <dd>
                  Write scripts to <code>content/</code> folder — local dev only.
                </dd>
              </div>
              <div className="guide-dl-row">
                <dt>Full pipeline</dt>
                <dd>Ingest → score → AI pick → generate all content.</dd>
              </div>
            </dl>
            <p className="meta-line muted">
              Content page shows only generation buttons. Overview shows everything grouped
              by stage. On Vercel, buttons dispatch GitHub Actions.
            </p>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">What you should do</div>
          <div className="guide-body">
            <h3 className="guide-h3">Daily (~2 minutes)</h3>
            <ul className="guide-list">
              <li>Open <Link href="/">Overview</Link> — check the active AI niche</li>
              <li>Glance at <Link href="/ingestion">Ingestion</Link> — all sources green?</li>
              <li>Optional: skim new scripts on <Link href="/content">Content</Link></li>
            </ul>

            <h3 className="guide-h3">Weekly (optional)</h3>
            <ul className="guide-list">
              <li>Click <strong>Full pipeline</strong> if you want a manual refresh</li>
              <li>Review whether the AI-picked niche still makes sense</li>
            </ul>

            <h3 className="guide-h3">You do NOT need to</h3>
            <ul className="guide-list">
              <li>Manually approve opportunities — AI does it</li>
              <li>Pick topics yourself — the engine decides</li>
              <li>Run ingest every day — GitHub runs every 6 hours</li>
              <li>Use localhost and the live site at the same time (causes duplicate runs)</li>
            </ul>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">Active data sources</div>
          <div className="guide-body">
            <table className="guide-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>What it finds</th>
                  <th>Auth</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Hacker News</td>
                  <td>Tech stories and startup discussions</td>
                  <td className="muted">None</td>
                </tr>
                <tr>
                  <td>Google Trends</td>
                  <td>What people are searching for in the US</td>
                  <td className="muted">None</td>
                </tr>
                <tr>
                  <td>Dev.to</td>
                  <td>Developer and startup articles</td>
                  <td className="muted">None</td>
                </tr>
                <tr>
                  <td>GitHub Trending</td>
                  <td>Hot open-source repos</td>
                  <td className="muted">None</td>
                </tr>
                <tr>
                  <td>Product Hunt</td>
                  <td>New product launches</td>
                  <td className="muted">None</td>
                </tr>
                <tr>
                  <td>YouTube</td>
                  <td>Trending videos in the US</td>
                  <td className="muted">API key</td>
                </tr>
                <tr>
                  <td>Reddit</td>
                  <td className="muted">Disabled — OAuth registration blocked</td>
                  <td className="muted">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">Status badges</div>
          <div className="guide-body">
            <dl className="guide-dl">
              <div className="guide-dl-row">
                <dt>Opportunity: approved</dt>
                <dd>The AI-selected active niche. Articles are generated for this one.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Opportunity: rejected</dt>
                <dd>Scored but not chosen. AI passed on it.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Opportunity: archived</dt>
                <dd>Was previously approved; replaced by a newer winner.</dd>
              </div>
              <div className="guide-dl-row">
                <dt>Ingestion: success / failed</dt>
                <dd>Whether that source fetch worked. Check the Error column if failed.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="panel guide-section">
          <div className="panel-title">What&apos;s next — Phase 5</div>
          <div className="guide-body">
            <p>
              Discovery, scoring, AI selection, and article generation are done. The next
              step is <strong>publishing</strong>:
            </p>
            <ol className="guide-steps">
              <li>Buy a domain for your AI-picked niche</li>
              <li>Deploy articles as an SEO micro-site (static site on Vercel)</li>
              <li>Apply for Google AdSense and add affiliate links</li>
              <li>Submit sitemap to Google Search Console</li>
            </ol>
            <p className="muted">
              That public site earns money. This dashboard runs the engine behind it.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
