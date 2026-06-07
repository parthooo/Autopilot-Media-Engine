"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE_GROUPS, stepKey } from "../lib/pipeline-steps";

/**
 * @param {object} props
 * @param {boolean} [props.compact]
 * @param {string} [props.filterGroup] - Show only one group: discovery | selection | content | full
 * @param {'video' | 'article' | 'both'} [props.filterTrack] - Filter content steps by track
 * @param {boolean} [props.inline] - Buttons only, no panel wrapper (for hierarchy layout)
 * @param {string} [props.className]
 */
export function PipelineControls({
  compact = false,
  filterGroup = null,
  filterTrack = null,
  inline = false,
  className = "",
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  let groups = filterGroup
    ? PIPELINE_GROUPS.filter((g) => g.id === filterGroup)
    : PIPELINE_GROUPS;

  if (filterTrack) {
    groups = groups.map((group) => ({
      ...group,
      steps: group.steps.filter((s) => {
        if (!s.track) return true;
        if (filterTrack === "video") return s.track === "video";
        if (filterTrack === "article") return s.track === "article";
        return s.track === filterTrack;
      }),
    }));
  }

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

  const controlsBody = groups.map((group) => (
    <div key={group.id} className="pipeline-group">
      {!compact && !inline && (
        <p className="muted u-mb-sm">
          <span className="automation-badge">Auto</span> {group.hint}
        </p>
      )}
      {inline && !compact && group.hint && (
        <p className="meta-line pipeline-hint">
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
  ));

  if (inline) {
    return (
      <div className={`pipeline-controls pipeline-controls--inline ${className}`.trim()}>
        {controlsBody}
        {(message || error) && (
          <div className="pipeline-feedback">
            {message && <p className="meta-line message-success">{message}</p>}
            {error && <p className="meta-line message-error">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`pipeline-controls ${className}`.trim()}>
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
