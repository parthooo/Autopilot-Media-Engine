"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { step: "ingest", label: "Run Ingest", desc: "Fetch trends from all sources" },
  { step: "score", label: "Run Score", desc: "Calculate opportunity scores" },
  { step: "auto-select", label: "AI Pick Winner", desc: "Gemini selects & approves ONE niche" },
  { step: "generate-content", label: "Generate Articles", desc: "Write 5 SEO articles for AI winner" },
  { step: "full", label: "Full Pipeline", desc: "Ingest → Score → AI select → articles" },
];

export function PipelineControls() {
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

      setMessage(data.data?.message || `Completed: ${step} (${data.data?.mode})`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div className="panel-header">Pipeline controls</div>
      <div style={{ padding: "1.25rem" }}>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Click to run manually, or let GitHub Actions run every 6 hours automatically.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {STEPS.map((s) => (
            <button
              key={s.step}
              className={`btn ${s.step === "full" ? "btn-primary" : ""}`}
              disabled={loading !== null}
              onClick={() => runStep(s.step)}
              title={s.desc}
            >
              {loading === s.step ? "Running…" : s.label}
            </button>
          ))}
        </div>
        {message && (
          <p className="meta-line" style={{ marginTop: "1rem", color: "var(--color-success)" }}>
            {message}
          </p>
        )}
        {error && (
          <p className="meta-line" style={{ marginTop: "1rem", color: "var(--color-danger)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
