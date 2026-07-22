"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/modules/auth/store/auth-store";

const APPROVER_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];

const TYPE_LABELS: Record<string, string> = {
  fco:           "FCO / Offer",
  si_early:      "SI Early",
  si_revision:   "SI Revision",
  source_change: "Source Change",
  issue_ack:     "High Risk Issue",
};

const DECISION_BADGE: Record<string, string> = {
  approved:            "badge--success",
  rejected:            "badge--danger",
  revision_requested:  "badge--warning",
  acknowledged:        "badge--info",
};

const TYPE_COLORS: Record<string, string> = {
  fco:           "badge--primary",
  si_early:      "badge--warning",
  si_revision:   "badge--info",
  source_change: "badge--danger",
  issue_ack:     "badge--neutral",
};

const ALL_TYPES = ["all", "fco", "si_early", "si_revision", "source_change", "issue_ack"] as const;

interface QueueItem {
  id: string;
  type: string;
  title: string;
  requesterName: string;
  requesterRole: string;
  requestedAt: string;
  deadline: string | null;
  urgencyLevel: "urgent" | "normal";
  summary: string;
  reason: string | null;
  evidenceUrl: string | null;
  sourceModule: string;
  sourceEntityId: string;
  contextData: Record<string, unknown>;
}

export default function ApprovalCenterPage() {
  const role = useAuthStore((s) => s.role);
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [showHistory, setShowHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ item: QueueItem; action: "approve" | "reject" | "acknowledge" } | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["approval-center"],
    queryFn: () => api.get<{ data: QueueItem[]; counts: Record<string, number> }>("/api/approval-center"),
    staleTime: 60_000,
    enabled: role != null && APPROVER_ROLES.includes(role as string),
  });

  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ["approval-center-history"],
    queryFn: () => api.get<{ data: { id: string; type: string; title: string; decidedBy: string; decision: string; decidedAt: string; comment: string | null }[] }>("/api/approval-center/history"),
    staleTime: 60_000,
    enabled: role != null && APPROVER_ROLES.includes(role as string) && showHistory,
  });

  const actMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.post(`/api/approval-center/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-center"] });
      qc.invalidateQueries({ queryKey: ["approval-center-count"] });
      setActionModal(null);
      setReason("");
      setComment("");
    },
  });

  if (role == null || !APPROVER_ROLES.includes(role as string)) {
    return (
      <div className="page__body">
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold text-danger mb-2">Access Restricted</p>
          <p className="text-muted-foreground text-sm">Approval Center is only accessible by CEO / DIRUT / ASS_DIRUT.</p>
        </div>
      </div>
    );
  }

  const queue: QueueItem[] = data?.data ?? [];
  const counts = data?.counts ?? {};

  const filtered = activeTab === "all" ? queue : queue.filter((i) => i.type === activeTab);

  function submit() {
    if (!actionModal) return;
    const { item, action } = actionModal;
    actMutation.mutate({
      id: item.id,
      body: { action, type: item.type, reason, comment },
    });
  }

  return (
    <div className="page__body">
      {/* Header */}
      <div className="page__header">
        <div>
          <h1 className="page__title">
            Approval Center
            {(counts.total ?? 0) > 0 && (
              <span className="badge badge--danger badge--sm ms-2">{counts.total} pending</span>
            )}
          </h1>
          <p className="page__subtitle text-muted-foreground text-sm">
            All pending approvals in one place — FCO, SI, Source Change, Critical Issues
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[
          { label: "Total Pending", value: counts.total ?? 0, color: "text-foreground" },
          { label: "FCO / Offer",   value: counts.fco ?? 0,   color: "text-primary" },
          { label: "SI",            value: counts.si ?? 0,    color: "text-amber-500" },
          { label: "Source Change", value: counts.sourceChange ?? 0, color: "text-danger" },
          { label: "Issue Ack",     value: counts.issue ?? 0, color: "text-muted-foreground" },
          { label: "Urgent ≤3 days",value: queue.filter((i) => i.urgencyLevel === "urgent").length, color: "text-danger" },
        ].map((c) => (
          <div key={c.label} className="card p-3 text-center">
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex gap-1 flex-wrap" role="tablist">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={activeTab === t && !showHistory}
              onClick={() => { setActiveTab(t); setShowHistory(false); }}
              className={`button button--sm ${activeTab === t && !showHistory ? "button--primary" : "button--ghost button--neutral"}`}
            >
              {t === "all" ? "All Pending" : TYPE_LABELS[t]}
              {t !== "all" && (counts[t] ?? 0) > 0 && (
                <span className="badge badge--sm badge--danger ms-1">{counts[t]}</span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className={`button button--sm ${showHistory ? "button--info" : "button--ghost button--neutral"}`}
        >
          {showHistory ? "← Pending Queue" : "History →"}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="flex flex-col gap-3 mb-4">
          {histLoading ? (
            <div className="space-y-2 animate-pulse">{[1,2,3].map((i)=><div key={i} className="h-16 bg-muted rounded"/>)}</div>
          ) : !histData?.data?.length ? (
            <div className="card p-8 text-center text-muted-foreground text-sm">No processed approvals yet.</div>
          ) : (
            histData.data.map((h) => (
              <div key={h.id} className="card p-4 text-sm flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge badge--sm ${TYPE_COLORS[h.type] ?? "badge--neutral"}`}>{TYPE_LABELS[h.type] ?? h.type}</span>
                    <span className={`badge badge--sm ${DECISION_BADGE[h.decision] ?? "badge--neutral"}`}>{h.decision}</span>
                    <p className="font-medium">{h.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By: <strong>{h.decidedBy}</strong> · {new Date(h.decidedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                    {h.comment && <span className="italic ms-2">&ldquo;{h.comment}&rdquo;</span>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queue */}
      {!showHistory && isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted rounded-lg" />)}
        </div>
      ) : !showHistory && filtered.length === 0 ? (
        <div className="card p-10 text-center text-muted-foreground text-sm">
          No pending approvals in this category.
        </div>
      ) : !showHistory && (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isUrgent = item.urgencyLevel === "urgent";

            return (
              <div
                key={item.id}
                className={`card border-l-4 ${isUrgent ? "border-l-danger" : "border-l-primary"}`}
              >
                <div className="card__body gap-3">
                  {/* Row 1: badges + title */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUrgent && <span className="badge badge--danger badge--sm">🔴 Urgent</span>}
                      <span className={`badge badge--sm ${TYPE_COLORS[item.type] ?? "badge--neutral"}`}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      <p className="font-semibold text-sm">{item.title}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        className="button button--ghost button--neutral button--sm"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Collapse" : "Details"}
                      </button>
                      <a
                        href={`/${item.sourceModule === "forecast_sales" ? "forecast-sales" : "shipment-monitor"}?open=${item.sourceEntityId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button--ghost button--neutral button--sm"
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>

                  {/* Row 2: meta */}
                  <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>By: <strong>{item.requesterName}</strong></span>
                    <span>Requested: {new Date(item.requestedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    {item.deadline && (
                      <span className={isUrgent ? "text-danger font-medium" : ""}>
                        Deadline: {new Date(item.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm">{item.summary}</p>

                  {/* Reason */}
                  {item.reason && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                      {item.reason}
                    </p>
                  )}

                  {/* Expanded context */}
                  {isExpanded && (
                    <div className="bg-surface rounded-lg p-3 text-xs mt-1">
                      <p className="text-eyebrow mb-2">Context Details</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(item.contextData)
                          .filter(([, v]) => v !== null && v !== undefined)
                          .map(([k, v]) => (
                            <div key={k}>
                              <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}: </span>
                              <span>{typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v)}</span>
                            </div>
                          ))}
                      </div>
                      {item.evidenceUrl && (
                        <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-primary mt-2 inline-block">
                          Evidence ↓
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end flex-wrap mt-1">
                    {item.type !== "issue_ack" && (
                      <button
                        type="button"
                        className="button button--sm button--danger"
                        onClick={() => { setActionModal({ item, action: "reject" }); setReason(""); setComment(""); }}
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      className="button button--sm button--success"
                      onClick={() => {
                        setActionModal({ item, action: item.type === "issue_ack" ? "acknowledge" : "approve" });
                        setReason(""); setComment("");
                      }}
                    >
                      {item.type === "issue_ack" ? "Acknowledge" : "✓ Approve"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${actionModal.action} confirmation`}
        >
          <div className="card w-full max-w-md">
            <div className="card__body gap-4">
              <h2 className="font-semibold capitalize">
                {actionModal.action} — {TYPE_LABELS[actionModal.item.type]}
              </h2>
              <p className="text-sm text-muted-foreground">{actionModal.item.title}</p>

              {actionModal.action === "reject" && (
                <div className="field">
                  <label className="field__label text-sm" htmlFor="reject-reason">
                    Reason for Rejection <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    className="input"
                    rows={3}
                    placeholder="Why are you rejecting this?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <div className="field">
                <label className="field__label text-sm" htmlFor="action-comment">
                  Comment (optional)
                </label>
                <textarea
                  id="action-comment"
                  className="input"
                  rows={2}
                  placeholder="Add a note for the requester…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {actMutation.error && (
                <p className="text-sm text-danger" role="alert">
                  {(actMutation.error as Error).message}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="button button--ghost button--neutral"
                  onClick={() => setActionModal(null)}
                  disabled={actMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`button ${actionModal.action === "reject" ? "button--danger" : "button--success"}`}
                  disabled={actMutation.isPending || (actionModal.action === "reject" && !reason.trim())}
                  aria-busy={actMutation.isPending}
                  onClick={submit}
                >
                  {actMutation.isPending
                    ? <><span className="spinner spinner--sm" aria-hidden="true" /> Processing…</>
                    : <span className="capitalize">{actionModal.action}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
