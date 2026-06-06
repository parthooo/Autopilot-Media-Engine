"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACTIONS = [
  { status: "approved", label: "Approve", className: "btn-primary" },
  { status: "rejected", label: "Reject", className: "btn" },
  { status: "archived", label: "Archive", className: "btn" },
];

export function OpportunityActions({ opportunityId, currentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  async function updateStatus(status) {
    setLoading(status);
    setError(null);

    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="btn-row">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            className={`btn ${action.className}`}
            disabled={loading !== null || currentStatus === action.status}
            data-state={loading === action.status ? "loading" : undefined}
            onClick={() => updateStatus(action.status)}
          >
            {loading === action.status ? "Saving…" : action.label}
          </button>
        ))}
      </div>
      {error && <p className="meta-line message-error u-mt-xs">{error}</p>}
    </div>
  );
}
