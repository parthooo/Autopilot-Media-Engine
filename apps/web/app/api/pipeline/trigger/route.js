import {
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  generateContent,
  exportApprovedContent,
  runFullPipeline,
} from "@ame/pipeline";
import { dispatchGitHubWorkflow } from "../../../../lib/github-dispatch";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

export const maxDuration = 300;

const STEPS = {
  ingest: { fn: ingestAll, workflow: "ingest.yml" },
  score: { fn: scoreOpportunities, workflow: "score.yml" },
  "auto-select": { fn: autoSelectWinner, workflow: "auto-select.yml" },
  "generate-content": {
    fn: (options = {}) => generateContent({ autoApprove: true, ...options }),
    workflow: "generate-content.yml",
    workflowInputs: (body) => ({ variant: body.variant || "all" }),
  },
  "export-content": {
    fn: exportApprovedContent,
    localOnly: true,
  },
  full: { fn: runFullPipeline, workflow: "pipeline.yml" },
};

function getGenerateOptions(body) {
  const variant = body.variant || "all";
  if (variant === "youtube-only") {
    return { includeYouTube: true, includeArticles: false };
  }
  if (variant === "articles-only") {
    return { includeYouTube: false, includeArticles: true };
  }
  return { includeYouTube: true, includeArticles: true };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const step = body.step || "full";
    const mode = body.mode || "auto";

    const config = STEPS[step];
    if (!config) {
      return errorResponse(`Invalid step. Use: ${Object.keys(STEPS).join(", ")}`, 400);
    }

    if (config.localOnly && process.env.VERCEL === "1") {
      return errorResponse(
        "Export to disk is local-only. Run: npm run worker -- export-content",
        400
      );
    }

    const workflowInputs = config.workflowInputs?.(body);

    if (mode === "github") {
      const dispatch = await dispatchGitHubWorkflow(config.workflow, workflowInputs);
      return jsonResponse({
        mode: "github",
        step,
        ...dispatch,
        message: dispatch.dispatched
          ? `Triggered ${config.workflow} on GitHub Actions`
          : "GitHub dispatch unavailable — run locally or set GITHUB_TOKEN",
      });
    }

    if (process.env.VERCEL === "1" && !process.env.FORCE_INLINE_PIPELINE) {
      if (config.localOnly) {
        return errorResponse(
          "Export to disk is local-only. Run: npm run worker -- export-content",
          400
        );
      }
      const dispatch = await dispatchGitHubWorkflow(config.workflow, workflowInputs);
      if (dispatch.dispatched) {
        return jsonResponse({
          mode: "github",
          step,
          ...dispatch,
          message: `Vercel timeout protection: triggered ${config.workflow} on GitHub`,
        });
      }
    }

    const fnArgs =
      step === "generate-content" ? getGenerateOptions(body) : undefined;
    const result = await config.fn(fnArgs);
    return jsonResponse({ mode: "inline", step, result });
  } catch (error) {
    return errorResponse(error.message);
  }
}
