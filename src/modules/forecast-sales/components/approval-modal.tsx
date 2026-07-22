"use client";

import { useState } from "react";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useApproveForecast, useForecastDetail } from "../hooks/use-forecasts";

export function ApprovalModal() {
  const { approveModalId, closeApprove } = useForecastUIStore();
  const { data }  = useForecastDetail(approveModalId ?? "");
  const project   = data?.data;
  const { mutate, isPending } = useApproveForecast(approveModalId ?? "");

  const [action,  setAction]  = useState<"approved" | "rejected" | "revision_requested">("approved");
  const [comment, setComment] = useState("");

  if (!approveModalId) return null;

  function submit() {
    mutate({ action, comment: comment.trim() || undefined }, { onSuccess: closeApprove });
  }

  const ACTION_OPTS = [
    { value: "approved",           label: "✓ Approve",           cls: "button--success" },
    { value: "rejected",           label: "✕ Reject",            cls: "button--danger"  },
    { value: "revision_requested", label: "↺ Request Revision",  cls: "button--warning" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label="Review Forecast Project">
      <div className="card w-full max-w-lg">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Review Project</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeApprove} aria-label="Close">✕</button>
          </div>

          {project && (
            <div className="p-3 rounded-lg bg-surface border border-border text-sm space-y-1">
              <p><span className="text-muted-foreground">Project:</span> <strong>{project.projectName}</strong></p>
              <p><span className="text-muted-foreground">Buyer:</span> {project.buyer} {project.buyerCountry && `· ${project.buyerCountry}`}</p>
              <p><span className="text-muted-foreground">Qty:</span> {project.quantity ? `${Number(project.quantity).toLocaleString()} MT` : "—"}</p>
              <p><span className="text-muted-foreground">Submitted by:</span> {project.createdBy.name}</p>
            </div>
          )}

          <div className="field">
            <span className="field__label">Decision</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {ACTION_OPTS.map((o) => (
                <button key={o.value} type="button"
                  className={`button button--sm ${action === o.value ? o.cls : "button--ghost button--neutral"}`}
                  onClick={() => setAction(o.value)}
                  aria-pressed={action === o.value}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="approve-comment">Comment {action !== "approved" && "*"}</label>
            <textarea
              id="approve-comment"
              className="input"
              rows={3}
              placeholder={action === "revision_requested" ? "Describe what needs to be revised…" : "Optional remarks…"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-required={action !== "approved"}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral"
              onClick={closeApprove} disabled={isPending}>Cancel</button>
            <button type="button" className={`button ${ACTION_OPTS.find(o => o.value === action)?.cls ?? "button--primary"}`}
              disabled={isPending || (action !== "approved" && !comment.trim())}
              aria-busy={isPending}
              onClick={submit}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
