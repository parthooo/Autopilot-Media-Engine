"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ButtonContent } from "./spinner";

export function PruneLibraryButton({ compact = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleClick() {
    const confirmed = window.confirm(
      "Delete rejected and low-score niches older than 30 days? Winners and content-linked rows are kept."
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "prune-library" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prune failed");

      const result = data.data?.result;
      const deleted = result?.topicsDeleted ?? 0;
      const orphans = result?.orphanSignalsDeleted ?? 0;
      setMessage(`Pruned ${deleted} topics and ${orphans} orphan signals.`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className="table-toolbar-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleClick}
          disabled={loading}
        >
          <ButtonContent
            loading={loading}
            loadingLabel="Pruning…"
            label="Prune stale (30d)"
          />
        </button>
        {message && <span className="table-toolbar-msg">{message}</span>}
        {error && <span className="table-toolbar-msg table-toolbar-msg--error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="filter-group">
      <span className="filter-group-label">Maintain</span>
      <div className="filter-row">
        <button
          type="button"
          className="filter-chip"
          onClick={handleClick}
          disabled={loading}
        >
          <ButtonContent
            loading={loading}
            loadingLabel="Pruning…"
            label="Prune stale (30d)"
          />
        </button>
        {message && <span className="muted filter-inline-msg">{message}</span>}
        {error && <span className="filter-inline-msg filter-inline-msg--error">{error}</span>}
      </div>
    </div>
  );
}
