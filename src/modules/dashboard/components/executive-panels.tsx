"use client";

import { useState } from "react";
import { useUserActivity } from "../hooks/use-dashboard";
import { api } from "@/lib/api-client";

// ── User Activity Log (CEO/DIRUT only) ───────────────────────────────────────
function UserActivityLog() {
  const { data, isLoading, isError } = useUserActivity();
  if (isError) return null; // 403 for non-CEO
  const activity = (data?.data as { activity?: { name: string; count: number }[]; recentLogs?: { id: string; user: { name: string }; action: string; entity: string; createdAt: string }[] } | undefined);

  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">User Activity Log</p>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table text-sm" aria-label="User activity">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Activity Count</th>
                </tr>
              </thead>
              <tbody>
                {activity?.activity?.map((u) => (
                  <tr key={u.name}>
                    <td>{u.name}</td>
                    <td>{u.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Urgency Panel (CEO/DIRUT/ASS_DIRUT only) ───────────────────────────────
type UrgencyItem = { projectName: string; summary: string; severity: string; score: number };

function AIUrgencyPanel() {
  const [results, setResults] = useState<UrgencyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ data: UrgencyItem[] }>("/api/dashboard/ai-urgency", {});
      setResults(res.data);
    } catch {
      setError("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const SEVERITY_BADGE: Record<string, string> = {
    CRITICAL: "badge--danger",
    HIGH:     "badge--warning",
    MEDIUM:   "badge--primary",
    LOW:      "badge--neutral",
  };

  return (
    <div className="card">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">AI Forecast Urgency</p>
          <button
            type="button"
            className="button button--sm button--primary"
            onClick={analyze}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <><span className="spinner spinner--sm" aria-hidden="true" /> Analyzing…</>
            ) : "Analyze"}
          </button>
        </div>

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}

        {results.length > 0 && (
          <ul className="flex flex-col gap-2">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-3 p-2 rounded-lg bg-surface border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.projectName}</p>
                  <p className="text-xs text-muted-foreground">{r.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`badge badge--sm ${SEVERITY_BADGE[r.severity] ?? ""}`}>{r.severity}</span>
                  <span className="text-xs text-muted-foreground">Score: {r.score}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && results.length === 0 && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click Analyze to run AI urgency assessment on forecast projects.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ExecutivePanels() {
  return (
    <div className="flex flex-col gap-6">
      <AIUrgencyPanel />
      <UserActivityLog />
    </div>
  );
}
