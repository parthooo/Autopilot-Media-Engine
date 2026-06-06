"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { step: "ingest", label: "Run ingest", desc: "Fetch trends from all sources" },
  { step: "score", label: "Run score", desc: "Calculate opportunity scores" },
  { step: "auto-select", label: "AI pick", desc: "Gemini selects and approves one niche" },
  { step: "generate-content", label: "Generate", desc: "Write SEO articles for AI winner" },
  { step: "full", label: "Full pipeline", desc: "Ingest, score, AI select, articles" },
];

export function PipelineControls({ compact = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function runStep(step) {
    setLoading(step);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, mode: "auto" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline failed");

      setMessage(data.data?.message || `Completed: ${step}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className={`panel${compact ? "" : " panel-spaced"}`}>
      <div className="panel-title">Pipeline</div>
      <div className="panel-body">
        {!compact && (
          <p className="muted u-mb-sm">Run manually or let GitHub Actions run every 6 hours.</p>
        )}
        <div className="btn-row">
          {STEPS.map((s) => (
            <button
              key={s.step}
              type="button"
              className={`btn ${s.step === "full" ? "btn-primary" : ""}`}
              disabled={loading !== null}
              data-state={loading === s.step ? "loading" : undefined}
              onClick={() => runStep(s.step)}
              title={s.desc}
            >
              {loading === s.step ? "Running…" : s.label}
            </button>
          ))}
        </div>
        {message && <p className="meta-line message-success u-mt-sm">{message}</p>}
        {error && <p className="meta-line message-error u-mt-sm">{error}</p>}
      </div>
    </section>
  );
}
