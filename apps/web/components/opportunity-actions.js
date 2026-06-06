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

  async function updateStatus(status) {
    setLoading(status);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch {
      alert("Failed to update status");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {ACTIONS.map((action) => (
        <button
          key={action.status}
          className={`btn ${action.className}`}
          disabled={loading !== null || currentStatus === action.status}
          onClick={() => updateStatus(action.status)}
        >
          {loading === action.status ? "..." : action.label}
        </button>
      ))}
    </div>
  );
}
