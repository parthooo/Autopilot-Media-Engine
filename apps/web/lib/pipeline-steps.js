/**
 * Single source of truth for pipeline steps.
 * Used by dashboard buttons — must stay in sync with AUTOMATION.md and worker CLI.
 */

/** @typedef {"ingest" | "score" | "auto-select" | "generate-content" | "export-content" | "full"} PipelineStep */

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
    id: "content",
    title: "Content generation",
    hint: "Automatic: part of full pipeline every 6h · YouTube-first ($0)",
    steps: [
      {
        step: "generate-content",
        label: "Generate YouTube",
        variant: "youtube-only",
        track: "video",
        desc: "1 pillar script + 5 Shorts",
        workflow: "generate-content.yml",
        primary: true,
      },
      {
        step: "generate-content",
        label: "Generate articles",
        variant: "articles-only",
        track: "article",
        desc: "5 SEO articles (publish later when domain budget exists)",
        workflow: "generate-content.yml",
        primary: true,
      },
      {
        step: "generate-content",
        label: "Generate all",
        variant: "all",
        track: "both",
        desc: "YouTube + Shorts + articles",
        workflow: "generate-content.yml",
      },
      {
        step: "export-content",
        label: "Export to disk",
        track: "video",
        desc: "Write approved scripts to content/ folder (local dev only)",
        localOnly: true,
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
