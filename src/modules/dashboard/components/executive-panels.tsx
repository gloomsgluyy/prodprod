"use client";

import { useState } from "react";
import { useUserActivity } from "../hooks/use-dashboard";
import { api } from "@/lib/api-client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ── User Activity Log (CEO/DIRUT only) ───────────────────────────────────────
export function UserActivityLog() {
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

export function AIUrgencyPanel() {
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

  const distribution = ["HIGH", "MEDIUM", "LOW"].map((severity) => ({
    name: severity === "HIGH" ? "High Risk" : severity === "MEDIUM" ? "Medium Risk" : "Low Risk",
    value: results.filter((result) => result.severity === severity).length,
    color: severity === "HIGH" ? "#c85a7b" : severity === "MEDIUM" ? "#d7a46b" : "#78a86f",
  }));
  const total = results.length;

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

        {results.length > 0 && <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-4"><div className="relative h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2}>{distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-semibold">{total}</span><span className="text-xs text-muted-foreground">Total Forecasts</span></div></div><div className="space-y-3">{distribution.map((entry) => <div key={entry.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span><strong>{entry.value} <span className="font-normal text-muted-foreground">({total ? Math.round(entry.value / total * 100) : 0}%)</span></strong></div>)}</div></div>}

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
      <UserActivityLog />
    </div>
  );
}
