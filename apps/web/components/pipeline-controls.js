"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE_GROUPS, stepKey } from "../lib/pipeline-steps";

/**
 * @param {object} props
 * @param {boolean} [props.compact]
 * @param {string} [props.filterGroup] - Show only one group: discovery | selection | content | full
 */
export function PipelineControls({ compact = false, filterGroup = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const groups = filterGroup
    ? PIPELINE_GROUPS.filter((g) => g.id === filterGroup)
    : PIPELINE_GROUPS;

  async function runStep(step, variant, localOnly) {
    const loadingKey = stepKey(step, variant);
    setLoading(loadingKey);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, mode: "auto", variant }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline failed");

      const result = data.data?.result;
      if (step === "generate-content" && result?.youtube) {
        const yt = result.youtube.generated || 0;
        const art = result.articles?.generated || 0;
        setMessage(
          data.data?.message ||
            `Generated ${yt} YouTube asset${yt === 1 ? "" : "s"}${art ? ` + ${art} articles` : ""}`
        );
      } else if (step === "export-content" && result?.exportPath) {
        setMessage(`Exported to ${result.exportPath}`);
      } else if (localOnly && data.data?.mode === "github") {
        setMessage(
          "Export runs locally only — use: npm run worker -- export-content"
        );
      } else {
        setMessage(data.data?.message || `Completed: ${step}`);
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pipeline-controls">
      {groups.map((group) => (
        <section
          key={group.id}
          className={`panel${compact && groups.length === 1 ? "" : " panel-spaced"}`}
        >
          <div className="panel-title">{group.title}</div>
          <div className="panel-body">
            {!compact && (
              <p className="muted u-mb-sm">
                <span className="automation-badge">Auto</span> {group.hint}
              </p>
            )}
            <div className="btn-row">
              {group.steps.map((s) => {
                const key = stepKey(s.step, s.variant);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`btn ${s.primary ? "btn-primary" : ""}`}
                    disabled={loading !== null}
                    data-state={loading === key ? "loading" : undefined}
                    onClick={() => runStep(s.step, s.variant, s.localOnly)}
                    title={s.desc}
                  >
                    {loading === key ? "Running…" : s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {(message || error) && (
        <div className="panel panel-spaced">
          {message && <p className="meta-line message-success">{message}</p>}
          {error && <p className="meta-line message-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
