"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userRole: string;
  details: unknown;
  createdAt: string;
  user: { id: string; name: string };
}

const ACTION_OPTIONS = [
  "all","created","updated","deleted","approved","rejected","submitted",
  "role_changed","closed","generated_fco","si_issued","si_revised",
  "source_change_requested","source_change_approved","barge_change",
  "issue_created","issue_resolved","extracted_tasks","scraped",
];

const ENTITY_OPTIONS = [
  "all","shipment","forecast_project","deal","quality_result","partner",
  "task","meeting","expense","market_price","source","outstanding_payment",
  "transshipment","daily_delivery","user",
];

const ACTION_BADGE: Record<string, string> = {
  created:    "badge--success",
  updated:    "badge--primary",
  deleted:    "badge--danger",
  approved:   "badge--success",
  rejected:   "badge--danger",
  submitted:  "badge--warning",
  closed:     "badge--info",
  role_changed:"badge--warning",
};

function getBadge(action: string) {
  return ACTION_BADGE[action] ?? "badge--neutral";
}

// ── JSON diff viewer ──────────────────────────────────────────────────────────
function DiffViewer({ details }: { details: unknown }) {
  if (!details || typeof details !== "object") return null;

  return (
    <div className="font-mono text-xs bg-neutral-950 text-neutral-100 p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
      {Object.entries(details as Record<string, unknown>).map(([key, value]) => {
        const isOld = key.startsWith("from_") || key === "from";
        const isNew = key.startsWith("to_")   || key === "to";
        const cls   = isOld ? "text-red-400" : isNew ? "text-emerald-400" : "text-neutral-300";
        return (
          <div key={key} className={cls}>
            <span className="text-neutral-500">{key}:</span>{" "}
            {typeof value === "object" ? JSON.stringify(value) : String(value ?? "null")}
          </div>
        );
      })}
    </div>
  );
}

// ── Log row with expand ───────────────────────────────────────────────────────
function LogRow({ log, idx }: { log: AuditLogItem; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!log.details && typeof log.details === "object" &&
    Object.keys(log.details as object).length > 0;

  return (
    <>
      <tr className={expanded ? "bg-surface" : ""}>
        <td className="text-xs text-muted-foreground tabular-nums">
          {new Date(log.createdAt).toLocaleString()}
        </td>
        <td>
          <div className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold flex-shrink-0">
              {log.user.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium">{log.user.name}</span>
          </div>
        </td>
        <td>
          <span className="badge badge--neutral badge--xs">{log.userRole}</span>
        </td>
        <td>
          <span className={`badge badge--sm ${getBadge(log.action)}`}>
            {log.action.replace(/_/g," ")}
          </span>
        </td>
        <td className="text-sm capitalize">{log.entity.replace(/_/g," ")}</td>
        <td className="text-xs font-mono text-muted-foreground">
          {log.entityId ? log.entityId.slice(-8) : "—"}
        </td>
        <td>
          {hasDetails ? (
            <button type="button"
              className="button button--xs button--ghost button--neutral"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="Toggle details">
              {expanded ? "▲" : "▼"}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr>
          <td colSpan={7} className="bg-surface px-4 pb-3">
            <DiffViewer details={log.details} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function AuditLogsClient() {
  const [page,     setPage]     = useState(1);
  const [action,   setAction]   = useState("all");
  const [entity,   setEntity]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const params = new URLSearchParams({
    page: String(page),
    ...(action !== "all" ? { action } : {}),
    ...(entity !== "all" ? { entity } : {}),
    ...(search   ? { search   } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo   ? { dateTo   } : {}),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, action, entity, search, dateFrom, dateTo],
    queryFn: () => api.get<{ data: AuditLogItem[]; meta: { total: number; page: number; totalPages: number } }>(
      `/api/audit-logs?${params}`
    ),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  function resetFilters() {
    setPage(1); setAction("all"); setEntity("all");
    setSearch(""); setDateFrom(""); setDateTo("");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="card">
        <div className="card__body gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="field flex-1 min-w-48">
              <label className="field__label text-xs" htmlFor="audit-search">Search</label>
              <div className="input-group">
                <span className="input-group__text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
                  </svg>
                </span>
                <input id="audit-search" type="search" className="input"
                  placeholder="Search user, action, entity…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  aria-label="Search audit logs" />
              </div>
            </div>

            {/* Action */}
            <div className="field min-w-36">
              <label className="field__label text-xs" htmlFor="audit-action">Action</label>
              <select id="audit-action" className="select" value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a === "all" ? "All Actions" : a.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity */}
            <div className="field min-w-36">
              <label className="field__label text-xs" htmlFor="audit-entity">Entity</label>
              <select id="audit-entity" className="select" value={entity}
                onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
                {ENTITY_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e === "all" ? "All Entities" : e.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="audit-from">From</label>
              <input id="audit-from" type="date" className="input"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="audit-to">To</label>
              <input id="audit-to" type="date" className="input"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>

            <button type="button"
              className="button button--ghost button--neutral button--sm self-end"
              onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card__body gap-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({length:10}).map((_,i) => <div key={i} className="h-10 bg-muted rounded" />)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {meta?.total ?? 0} log entries
                </p>
                <p className="text-xs text-muted-foreground">
                  Audit logs are immutable — BR-AUD-002
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="table text-sm w-full" aria-label="Audit logs table">
                  <thead>
                    <tr>
                      <th className="w-36">Timestamp</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>ID (last 8)</th>
                      <th className="w-8">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-10">
                          No audit log entries found
                        </td>
                      </tr>
                    ) : (
                      items.map((log, idx) => (
                        <LogRow key={log.id} log={log} idx={idx} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {meta.page} of {meta.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button type="button"
                      className="button button--sm button--ghost button--neutral"
                      disabled={meta.page <= 1}
                      onClick={() => setPage(p => p - 1)}>←</button>
                    <button type="button"
                      className="button button--sm button--ghost button--neutral"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => setPage(p => p + 1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
