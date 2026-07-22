"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { HealthCheckResult } from "@/app/api/production-readiness/route";

interface CheckData {
  checks:    HealthCheckResult[];
  overall:   "pass" | "warn" | "fail";
  checkedAt: string;
}

const STATUS_ICON: Record<string, string> = { pass: "✅", warn: "⚠️", fail: "❌" };
const STATUS_COLOR: Record<string, string> = {
  pass: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  fail: "text-red-600 dark:text-red-400",
};
const BANNER_BG: Record<string, string> = {
  pass: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700",
  warn: "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700",
  fail: "bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-700",
};
const BANNER_MSG: Record<string, string> = {
  pass: "All systems operational — ready for production",
  warn: "System operational with warnings — review items below",
  fail: "Critical issues detected — resolve before deploying to production",
};

export default function ProductionReadinessPage() {
  const qc = useQueryClient();
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["production-readiness"],
    queryFn: () => api.get<{ data: CheckData }>("/api/production-readiness"),
    staleTime: 60 * 1000,
  });

  const { mutate: runCheck, isPending: running } = useMutation({
    mutationFn: () => api.post<{ data: CheckData }>("/api/production-readiness/check", {}),
    onSuccess: (res) => {
      qc.setQueryData(["production-readiness"], { data: res.data });
      setLastChecked(new Date().toLocaleTimeString());
    },
  });

  const result    = data?.data;
  const overall   = result?.overall ?? "warn";
  const checks    = result?.checks  ?? [];
  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header flex items-center justify-between gap-3">
        <h1 className="page__title text-2xl font-semibold">
          Production Readiness
          <span className="text-muted-foreground font-normal text-base ml-2">— System Health Check</span>
        </h1>
        <button
          type="button"
          className="button button--primary"
          onClick={() => runCheck()}
          disabled={running || isLoading}
          aria-busy={running}
        >
          {running
            ? <><span className="spinner spinner--sm" aria-hidden="true" /> Running checks…</>
            : "Run All Checks"
          }
        </button>
      </div>

      {/* Overall status banner */}
      {isLoading ? (
        <div className="h-20 animate-pulse bg-muted rounded-lg" />
      ) : result && (
        <div className={`rounded-xl border-2 p-5 ${BANNER_BG[overall]}`} role="status">
          <div className="flex items-center gap-4">
            <span className="text-4xl" aria-hidden="true">{STATUS_ICON[overall]}</span>
            <div>
              <p className={`text-xl font-bold ${STATUS_COLOR[overall]}`}>
                {overall.toUpperCase()} — {BANNER_MSG[overall]}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {passCount} passed · {warnCount} warning{warnCount !== 1 ? "s" : ""} · {failCount} failed
                {(lastChecked || result.checkedAt) && (
                  <> · Last checked: {lastChecked ?? new Date(result.checkedAt).toLocaleTimeString()}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checklist grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((check) => (
            <div key={check.id} className={`card border-l-4 ${
              check.status === "pass" ? "border-l-emerald-500" :
              check.status === "warn" ? "border-l-amber-500" :
              "border-l-red-500"
            }`}>
              <div className="card__body gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                  </div>
                  <span className="text-lg flex-shrink-0" aria-label={check.status}>
                    {STATUS_ICON[check.status]}
                  </span>
                </div>
                <p className={`text-xs font-medium ${STATUS_COLOR[check.status]}`}>
                  {check.detail}
                </p>
                <p className="text-xs text-muted-foreground">
                  Checked: {new Date(check.checkedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action items */}
      {!isLoading && checks.filter((c) => c.status !== "pass").length > 0 && (
        <div className="card">
          <div className="card__body gap-3">
            <p className="text-eyebrow">Action Items</p>
            <ul className="flex flex-col gap-2">
              {checks.filter((c) => c.status !== "pass").map((check) => (
                <li key={check.id} className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true">{STATUS_ICON[check.status]}</span>
                  <div>
                    <span className="font-medium">{check.label}:</span>{" "}
                    <span className="text-muted-foreground">{check.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ENV reference */}
      <div className="card">
        <div className="card__body gap-2">
          <p className="text-eyebrow">Required Environment Variables</p>
          <div className="font-mono text-xs bg-neutral-950 text-neutral-200 p-4 rounded-lg overflow-x-auto space-y-1">
            {[
              ["DATABASE_URL",              "required",  "Pooler URL for runtime"],
              ["DIRECT_URL",               "optional",  "Direct URL for migrations"],
              ["NEXTAUTH_URL",             "required",  "e.g. http://localhost:3000"],
              ["NEXTAUTH_SECRET",          "required",  "openssl rand -base64 32"],
              ["UPSTASH_REDIS_REST_URL",   "optional",  "For three-tier caching"],
              ["UPSTASH_REDIS_REST_TOKEN", "optional",  "For three-tier caching"],
              ["GROQ_API_KEY",             "optional",  "For AI features (transcription, scraping, DD)"],
              ["CRON_SECRET",              "optional",  "For cron job security"],
            ].map(([key, req, desc]) => (
              <div key={key} className="flex gap-3">
                <span className={req === "required" ? "text-red-400" : "text-neutral-500"}>
                  {req === "required" ? "●" : "○"}
                </span>
                <span className="text-emerald-400 w-40 flex-shrink-0">{key}</span>
                <span className="text-neutral-400"># {desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Copy <code className="text-xs">.env.example</code> to <code className="text-xs">.env</code> and fill in values</p>
        </div>
      </div>
    </div>
  );
}
