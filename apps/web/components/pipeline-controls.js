"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE_GROUPS, stepKey } from "../lib/pipeline-steps";
import { ButtonContent } from "./spinner";
import { runPipelineJob, hasRunningJobs, subscribeJobs } from "../lib/pipeline-jobs";

/**
 * @param {object} props
 * @param {boolean} [props.compact]
 * @param {string} [props.filterGroup]
 * @param {'video' | 'article' | 'both'} [props.filterTrack]
 * @param {boolean} [props.inline]
 * @param {"stack" | "grid"} [props.layout]
 * @param {"2-3"} [props.gridLayout] — row 1: two half cards; row 2: three thirds
 * @param {string} [props.className]
 */
export function PipelineControls({
  compact = false,
  filterGroup = null,
  filterTrack = null,
  inline = false,
  layout = null,
  gridLayout = null,
  className = "",
}) {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState(null);
  const [anyRunning, setAnyRunning] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sync = () => setAnyRunning(hasRunningJobs());
    sync();
    return subscribeJobs(sync);
  }, []);

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

  async function runStep(step, variant, localOnly, stepLabel) {
    const loadingKey = stepKey(step, variant);
    setActiveKey(loadingKey);
    setMessage(null);
    setError(null);

    const body = { step, mode: "auto", variant };
    if (step === "render-videos") body.force = true;

    try {
      await runPipelineJob(
        {
          step,
          label: stepLabel || step,
          href: step === "render-videos" ? "/content" : undefined,
        },
        async () => {
          const res = await fetch("/api/pipeline/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Pipeline failed");

          const result = data.data?.result;
          let msg = data.data?.message || `Completed: ${step}`;

          if (step === "generate-content" && result?.youtube) {
            const yt = result.youtube.generated || 0;
            const art = result.articles?.generated || 0;
            msg = `Generated ${yt} YouTube asset${yt === 1 ? "" : "s"}${art ? ` + ${art} articles` : ""}`;
          } else if (step === "export-content" && result?.exportPath) {
            msg = `Exported to ${result.exportPath}`;
          } else if (step === "render-videos" && result?.items) {
            msg = `Rendered ${result.rendered || 0} video${result.rendered === 1 ? "" : "s"}`;
          } else if (localOnly && data.data?.mode === "github") {
            msg =
              step === "render-videos"
                ? "Render runs locally only — use: npm run worker -- render-videos"
                : "Export runs locally only — use: npm run worker -- export-content";
          }

          setMessage(msg);
          router.refresh();
          return { message: msg };
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActiveKey(null);
    }
  }

  const busy = anyRunning || activeKey !== null;

  const useGrid =
    layout === "grid" ||
    (layout !== "stack" && !filterGroup && !compact && !inline && groups.length > 1);

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
          const isLoading = activeKey === key || (anyRunning && activeKey === null);
          return (
            <button
              key={key}
              type="button"
              className={`btn btn-with-spinner ${s.primary ? "btn-primary" : ""}`}
              disabled={busy}
              data-state={activeKey === key ? "loading" : undefined}
              onClick={() => runStep(s.step, s.variant, s.localOnly, s.label)}
              title={s.desc}
            >
              <ButtonContent
                loading={activeKey === key}
                loadingLabel="Running…"
                label={s.label}
              />
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
    <div
      className={[
        "pipeline-controls",
        useGrid && "pipeline-controls--grid",
        gridLayout === "2-3" && "pipeline-controls--grid-2-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {groups.map((group) => (
        <section
          key={group.id}
          className={`panel pipeline-panel pipeline-panel--${group.id}${
            compact && groups.length === 1 ? "" : useGrid ? "" : " panel-spaced"
          }`}
        >
          <div className="panel-title">{group.title}</div>
          <div className="panel-body">
            {group.subtitle && (
              <p className="pipeline-panel-subtitle muted">{group.subtitle}</p>
            )}
            {!compact && group.hint && (
              <p className="pipeline-panel-hint muted">
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
                    className={`btn btn-with-spinner ${s.primary ? "btn-primary" : ""}`}
                    disabled={busy}
                    data-state={activeKey === key ? "loading" : undefined}
                    onClick={() => runStep(s.step, s.variant, s.localOnly, s.label)}
                    title={s.desc}
                  >
                    <ButtonContent
                      loading={activeKey === key}
                      loadingLabel="Running…"
                      label={s.label}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {(message || error) && (
        <div className="panel pipeline-feedback-panel">
          {message && <p className="meta-line message-success">{message}</p>}
          {error && <p className="meta-line message-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
