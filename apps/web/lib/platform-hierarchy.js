/**
 * Platform hierarchy metadata — mirrors PROJECT_VISION.md.
 * Used by Overview and Guide for consistent labels and status.
 */

/** @typedef {'live' | 'planned' | 'partial'} LayerStatus */

export const HIERARCHY = {
  parent: {
    role: "PARENT",
    title: "Niche Library",
    description: "Ingest → score → analyze · many opportunities stored",
    status: "live",
    pipelineGroup: "discovery",
  },
  gate: {
    role: "GATE",
    title: "Pick ONE winner",
    description: "AI selects one niche per cycle — all downstream work uses this winner only",
    status: "live",
    pipelineGroup: "selection",
  },
  video: {
    role: "CHILD",
    title: "Video",
    description: "Scripts → render (MP4 long + Shorts)",
    status: "partial",
    statusNote: "Scripts live · render Phase 4b",
    pipelineGroup: "content",
    pipelineTrack: "video",
  },
  article: {
    role: "CHILD",
    title: "Article",
    description: "SEO article cluster from the same winner",
    status: "live",
    pipelineGroup: "content",
    pipelineTrack: "article",
  },
  videoPublishers: {
    role: "SUB",
    title: "Video publishers",
    status: "planned",
    platforms: [
      "YouTube",
      "Instagram",
      "Facebook",
      "TikTok",
      "Reddit",
      "Pinterest",
    ],
  },
  articlePublishers: {
    role: "SUB",
    title: "Article publishers",
    status: "planned",
    platforms: ["SEO site"],
  },
};

export const FULL_RUN = {
  role: "FULL",
  title: "Full pipeline",
  description: "Ingest → score → AI pick → generate all content",
  pipelineGroup: "full",
};
