"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadJobs, updateJob, removeJob } from "../lib/pipeline-jobs";

/**
 * Headless provider: persists job state + polls render status.
 * No global banner — spinners live on buttons only.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function PipelineJobProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    const jobs = loadJobs();
    const running = jobs.filter((j) => j.status === "running" && j.assetId);
    if (!running.length) return;

    async function poll() {
      for (const job of running) {
        if (!job.assetId) continue;
        try {
          const res = await fetch(`/api/content/${job.assetId}/render-status`);
          if (!res.ok) continue;
          const data = await res.json();
          const vs = data.videoStatus;

          if (vs === "completed") {
            updateJob(job.id, {
              status: "completed",
              message: "Video render finished",
            });
            router.refresh();
            window.setTimeout(() => removeJob(job.id), 8000);
          } else if (vs === "failed") {
            updateJob(job.id, {
              status: "failed",
              message: data.errorMessage || "Render failed",
            });
            window.setTimeout(() => removeJob(job.id), 12000);
          }
        } catch {
          // keep polling
        }
      }
    }

    poll();
    const interval = window.setInterval(poll, 4000);
    return () => window.clearInterval(interval);
  }, [router]);

  return children;
}
