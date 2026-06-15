"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonContent } from "./spinner";
import { runPipelineJob, getRunningJobForAsset, subscribeJobs } from "../lib/pipeline-jobs";

/**
 * @param {object} props
 * @param {string} props.assetId
 * @param {boolean} [props.hasVideo]
 * @param {string} [props.label]
 * @param {string} [props.dbStatus] - videoAsset.status from server
 */
export function RenderVideoButton({ assetId, hasVideo = false, label, dbStatus }) {
  const router = useRouter();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [jobRunning, setJobRunning] = useState(false);
  const [dbVideoStatus, setDbVideoStatus] = useState(dbStatus);

  const buttonLabel = label || (hasVideo ? "Re-render video" : "Generate video");

  useEffect(() => {
    setDbVideoStatus(dbStatus);
  }, [dbStatus]);

  useEffect(() => {
    const sync = () => setJobRunning(Boolean(getRunningJobForAsset(assetId)));
    sync();
    return subscribeJobs(sync);
  }, [assetId]);

  useEffect(() => {
    if (!jobRunning && dbVideoStatus !== "rendering") return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/content/${assetId}/render-status`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        setDbVideoStatus(data.videoStatus);

        if (data.videoStatus === "completed" || data.videoStatus === "failed") {
          router.refresh();
        }
      } catch {
        // retry on next interval
      }
    }

    poll();
    const interval = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [assetId, jobRunning, dbVideoStatus, router]);

  async function handleClick() {
    setMessage(null);
    setError(null);

    try {
      await runPipelineJob(
        {
          step: "render-videos",
          label: hasVideo ? "Re-rendering video" : "Generating video",
          assetId,
          href: `/content/${assetId}`,
        },
        async () => {
          const res = await fetch("/api/pipeline/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: "render-videos",
              assetId,
              force: true,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Render failed");

          const result = data.data?.result;
          const item = result?.items?.[0];

          if (item) {
            const msg = `Video updated (${Math.round(item.durationSeconds || 0)}s)`;
            setMessage(msg);
            router.refresh();
            return { message: msg };
          }

          if (result?.errors?.length) {
            throw new Error(result.errors[0].error || "Render failed");
          }

          if (result?.skippedItems?.length) {
            throw new Error("Render was skipped. Try again in a few seconds.");
          }

          setMessage("Render completed");
          router.refresh();
          return { message: "Render completed" };
        }
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const loading = jobRunning || dbVideoStatus === "rendering";

  return (
    <div className="render-video-actions">
      <button
        type="button"
        className={`btn btn-with-spinner ${hasVideo ? "" : "btn-primary"}`}
        disabled={loading}
        data-state={loading ? "loading" : undefined}
        onClick={handleClick}
      >
        <ButtonContent
          loading={loading}
          loadingLabel={hasVideo ? "Re-rendering…" : "Generating…"}
          label={buttonLabel}
        />
      </button>
      {!loading && (
        <p className="meta-line muted u-mt-sm">May take several minutes for long-form videos.</p>
      )}
      {message && <p className="meta-line message-success u-mt-sm">{message}</p>}
      {error && <p className="meta-line message-error u-mt-sm">{error}</p>}
    </div>
  );
}
