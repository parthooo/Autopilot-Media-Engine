"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      const from = searchParams.get("from") || "/";
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-panel panel">
      <div className="panel-header">Autopilot Media Engine</div>
      <div style={{ padding: "1.25rem" }}>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Enter your site password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "1rem", width: "100%" }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {error && (
          <p className="meta-line" style={{ marginTop: "1rem", color: "var(--color-danger)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <Suspense fallback={<div className="login-panel panel">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
