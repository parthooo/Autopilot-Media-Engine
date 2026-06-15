/**
 * Single source of truth for pipeline steps.
 * Used by dashboard buttons — must stay in sync with AUTOMATION.md and worker CLI.
 */

/** @typedef {"ingest" | "score" | "auto-select" | "generate-content" | "export-content" | "render-videos" | "full"} PipelineStep */

export const PIPELINE_GROUPS = [
  {
    id: "discovery",
    title: "Discovery & scoring",
    hint: "Automatic: every 6h (ingest + score via GitHub Actions)",
    steps: [
      {
        step: "ingest",
        label: "Run ingest",
        desc: "Fetch trends from all active sources",
        workflow: "ingest.yml",
      },
      {
        step: "score",
        label: "Run score",
        desc: "Recalculate opportunity scores",
        workflow: "score.yml",
      },
      {
        step: "prune-library",
        label: "Prune stale",
        desc: "Delete rejected and low-score niches older than 30 days",
        workflow: "prune-library.yml",
      },
    ],
  },
  {
    id: "selection",
    title: "Niche selection",
    hint: "Automatic: part of full pipeline every 6h",
    steps: [
      {
        step: "auto-select",
        label: "AI pick",
        desc: "Gemini selects and approves one niche",
        workflow: "auto-select.yml",
      },
    ],
  },
  {
    id: "content-video",
    title: "Video factory",
    subtitle: "Pillar script, Shorts, export, and MP4 renders",
    hint: "Automatic: part of full pipeline every 6h · render is local (ffmpeg)",
    steps: [
      {
        step: "generate-content",
        label: "Generate YouTube",
        variant: "youtube-only",
        desc: "1 pillar script + 5 Shorts for the approved winner",
        workflow: "generate-content.yml",
        primary: true,
      },
      {
        step: "export-content",
        label: "Export to disk",
        desc: "Write approved scripts to content/ folder (local dev only)",
        localOnly: true,
      },
      {
        step: "render-videos",
        label: "Render videos",
        variant: "all",
        desc: "Turn approved scripts into MP4 files (requires ffmpeg, local)",
        localOnly: true,
        primary: true,
      },
      {
        step: "render-videos",
        label: "Render pillar",
        variant: "youtube-only",
        desc: "Render long-form YouTube script only",
        localOnly: true,
      },
      {
        step: "render-videos",
        label: "Render Shorts",
        variant: "shorts-only",
        desc: "Render all Shorts scripts",
        localOnly: true,
      },
    ],
  },
  {
    id: "content-article",
    title: "Article factory",
    subtitle: "SEO article cluster — publish later when domain budget exists",
    hint: "Automatic: part of full pipeline every 6h",
    steps: [
      {
        step: "generate-content",
        label: "Generate articles",
        variant: "articles-only",
        desc: "5 SEO articles for the approved winner",
        workflow: "generate-content.yml",
        primary: true,
      },
    ],
  },
  {
    id: "full",
    title: "Full run",
    hint: "Automatic: pipeline.yml every 6h",
    steps: [
      {
        step: "full",
        label: "Full pipeline",
        desc: "Ingest → score → AI pick → generate all content",
        workflow: "pipeline.yml",
      },
    ],
  },
];

/** Flat list for compact layouts */
export const ALL_PIPELINE_STEPS = PIPELINE_GROUPS.flatMap((g) => g.steps);

/**
 * @param {import('./pipeline-steps.js').PipelineStep} step
 * @param {string} [variant]
 */
export function stepKey(step, variant) {
  return variant ? `${step}:${variant}` : step;
}
