"use client";

import Link from "next/link";
import { useBlockers } from "../hooks/use-dashboard";
import type { BlockerAlert } from "@/types";

const CATEGORY_LABELS: Record<BlockerAlert["category"], string> = {
  payment:  "Payment",
  quality:  "Quality",
  source:   "Source",
  barge:    "Barge",
  closing:  "Closing",
  domestic: "Domestic",
};

const CATEGORY_COLORS: Record<BlockerAlert["category"], string> = {
  payment:  "text-amber-500",
  quality:  "text-blue-500",
  source:   "text-emerald-500",
  barge:    "text-violet-500",
  closing:  "text-red-500",
  domestic: "text-orange-500",
};

export function BlockerTower() {
  const { data, isLoading } = useBlockers();
  const alerts: BlockerAlert[] = data?.data ?? [];

  const critical = alerts.filter((a) => a.severity === "critical").length;

  // Group by category for summary
  const byCategory = alerts.reduce<Record<string, BlockerAlert[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="card__body gap-4">
        <div className="flex items-center gap-2">
          <p className="text-eyebrow">Blocker Control Tower</p>
          {critical > 0 && (
            <span className="badge badge--danger badge--sm">{critical} critical</span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
            <span className="text-emerald-500">✓</span>
            <p className="text-sm text-muted-foreground">No active blockers — all systems clear</p>
          </div>
        ) : (
          <>
            {/* Category summary row */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {(Object.keys(CATEGORY_LABELS) as BlockerAlert["category"][]).map((cat) => {
                const items = byCategory[cat] ?? [];
                return (
                  <div
                    key={cat}
                    className={`text-center p-2 rounded-lg bg-surface ${items.length > 0 ? "border border-border" : "opacity-40"}`}
                  >
                    <p className={`text-lg font-semibold ${items.length > 0 ? CATEGORY_COLORS[cat] : "text-muted-foreground"}`}>
                      {items.length}
                    </p>
                    <p className="text-eyebrow">{CATEGORY_LABELS[cat]}</p>
                  </div>
                );
              })}
            </div>

            {/* Alert cards */}
            <div className="flex flex-col gap-2">
              {alerts.slice(0, 8).map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.link}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-opacity hover:opacity-80 ${
                    alert.severity === "critical"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                  }`}
                  aria-label={alert.title}
                >
                  <span className={`font-medium text-xs flex-shrink-0 mt-0.5 ${CATEGORY_COLORS[alert.category]}`}>
                    [{CATEGORY_LABELS[alert.category]}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                  </div>
                  <span className={`badge badge--xs flex-shrink-0 ${alert.severity === "critical" ? "badge--danger" : "badge--warning"}`}>
                    {alert.severity}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
