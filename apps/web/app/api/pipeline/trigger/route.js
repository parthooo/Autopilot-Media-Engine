import {
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  generateContent,
  pruneLibrary,
  runFullPipeline,
} from "@ame/pipeline";
import { dispatchGitHubWorkflow } from "../../../../lib/github-dispatch";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";
import { runWorkerCommand, renderWorkerArgs, formatWorkerError } from "../../../../lib/run-worker-cli";

// Hobby plan allows max 60s; heavy work runs on GitHub Actions or local worker.
export const maxDuration = 60;

const STEPS = {
  ingest: { fn: ingestAll, workflow: "ingest.yml" },
  score: { fn: scoreOpportunities, workflow: "score.yml" },
  "prune-library": { fn: pruneLibrary, workflow: "prune-library.yml" },
  "auto-select": { fn: autoSelectWinner, workflow: "auto-select.yml" },
  "generate-content": {
    fn: (options = {}) => generateContent({ autoApprove: true, ...options }),
    workflow: "generate-content.yml",
    workflowInputs: (body) => ({ variant: body.variant || "all" }),
  },
  "export-content": {
    workerCommand: "export-content",
    localOnly: true,
    spawnWorker: true,
  },
  "render-videos": {
    workerCommand: "render-videos",
    workflow: "render-videos.yml",
    workflowInputs: (body) => ({
      variant: body.variant || "all",
      force: body.force ? "true" : "false",
    }),
    localOnly: true,
    spawnWorker: true,
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
      const hint =
        step === "render-videos"
          ? "Video render requires ffmpeg locally. Run: npm run worker -- render-videos"
          : "Export to disk is local-only. Run: npm run worker -- export-content";
      return errorResponse(hint, 400);
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
        const hint =
          step === "render-videos"
            ? "Video render requires ffmpeg locally. Run: npm run worker -- render-videos"
            : "Export to disk is local-only. Run: npm run worker -- export-content";
        return errorResponse(hint, 400);
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

    // Fresh worker process: up-to-date Prisma client, auto db:push if schema drifted
    if (config.spawnWorker) {
      const args =
        step === "render-videos" ? renderWorkerArgs(body) : [];
      const result = await runWorkerCommand(config.workerCommand, args);
      if (body.force && result.skipped > 0 && result.rendered === 0) {
        return errorResponse(
          "Re-render was skipped unexpectedly. Restart dev server and retry, or run: npm run worker -- render-videos --force --asset=<id>",
          400
        );
      }
      if (!result.success) {
        return errorResponse(formatWorkerError(result), 400);
      }
      return jsonResponse({ mode: "worker", step, result });
    }

    const fnArgs = step === "generate-content" ? getGenerateOptions(body) : undefined;
    const result = await config.fn(fnArgs);
    return jsonResponse({ mode: "inline", step, result });
  } catch (error) {
    return errorResponse(error.message);
  }
}
