import {
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  runFullPipeline,
} from "@ame/pipeline";
import { dispatchGitHubWorkflow } from "../../../../lib/github-dispatch";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

export const maxDuration = 300;

const STEPS = {
  ingest: { fn: ingestAll, workflow: "ingest.yml" },
  score: { fn: scoreOpportunities, workflow: "score.yml" },
  "auto-select": { fn: autoSelectWinner, workflow: "auto-select.yml" },
  full: { fn: runFullPipeline, workflow: "pipeline.yml" },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const step = body.step || "full";
    const mode = body.mode || "auto";

    const config = STEPS[step];
    if (!config) {
      return errorResponse(`Invalid step. Use: ${Object.keys(STEPS).join(", ")}`, 400);
    }

    if (mode === "github") {
      const dispatch = await dispatchGitHubWorkflow(config.workflow);
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
      const dispatch = await dispatchGitHubWorkflow(config.workflow);
      if (dispatch.dispatched) {
        return jsonResponse({
          mode: "github",
          step,
          ...dispatch,
          message: `Vercel timeout protection: triggered ${config.workflow} on GitHub`,
        });
      }
    }

    const result = await config.fn();
    return jsonResponse({ mode: "inline", step, result });
  } catch (error) {
    return errorResponse(error.message);
  }
}
