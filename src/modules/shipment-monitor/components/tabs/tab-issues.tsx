"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentIssues, useCreateIssue, useUpdateIssue } from "../../hooks/use-shipments";

const CATEGORIES = ["Loading delay","Quality issue","Barge issue","Document issue","Payment issue","Weather","Port issue","Other"] as const;
const STATUS_BADGE: Record<string, string> = {
  open: "badge--danger", in_progress: "badge--warning", resolved: "badge--success", closed: "badge--neutral",
};

const schema = z.object({
  category:    z.enum(CATEGORIES),
  description: z.string().min(1,"Required"),
  impact:      z.string().min(1,"Required"),
  actionPlan:  z.string().min(1,"Required"),
  picId:       z.string().uuid("Select a valid user"),
  targetDate:  z.string().min(1,"Required"),
  evidenceFileUrl: z.string().url().optional().or(z.literal("")),
});
type IssueForm = z.infer<typeof schema>;

export function TabIssues() {
  const { detailId, issueFormOpen, toggleIssueForm } = useShipmentUIStore();
  const { data, isLoading } = useShipmentIssues(detailId ?? "");
  const { mutate: createIssue, isPending: creating } = useCreateIssue(detailId ?? "");
  const issues = data?.data ?? [];
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IssueForm>({
    resolver: zodResolver(schema),
  });

  function onSubmit(d: IssueForm) {
    createIssue(d as never, { onSuccess: () => { reset(); toggleIssueForm(); } });
  }

  const open       = issues.filter((i) => i.status === "open").length;
  const inProgress = issues.filter((i) => i.status === "in_progress").length;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary */}
      <div className="flex gap-2 flex-wrap">
        <span className="badge badge--danger">{open} open</span>
        <span className="badge badge--warning">{inProgress} in progress</span>
        <span className="badge badge--success">{issues.filter((i) => i.status === "resolved").length} resolved</span>
        <button type="button" className="button button--sm button--primary ms-auto" onClick={toggleIssueForm}>
          {issueFormOpen ? "Cancel" : "+ Add Issue"}
        </button>
      </div>

      {/* Add issue form */}
      {issueFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="issue-cat">Category *</label>
              <select id="issue-cat" className={`select ${errors.category ? "input--invalid" : ""}`} {...register("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="issue-target">Target Date *</label>
              <input id="issue-target" type="date" className={`input ${errors.targetDate ? "input--invalid" : ""}`}
                aria-invalid={!!errors.targetDate} {...register("targetDate")} />
            </div>
          </div>
          {[
            { id: "description" as const, label: "Description *" },
            { id: "impact" as const,      label: "Impact *" },
            { id: "actionPlan" as const,  label: "Action Plan *" },
          ].map(({ id, label }) => (
            <div key={id} className="field">
              <label className="field__label text-xs" htmlFor={`issue-${id}`}>{label}</label>
              <textarea id={`issue-${id}`} className={`input ${errors[id] ? "input--invalid" : ""}`}
                rows={2} aria-invalid={!!errors[id]} {...register(id)} />
              {errors[id] && <p className="text-xs text-danger mt-0.5" role="alert">{errors[id]?.message}</p>}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="issue-pic">PIC User ID *</label>
              <input id="issue-pic" type="text" className={`input ${errors.picId ? "input--invalid" : ""}`}
                placeholder="User UUID" aria-invalid={!!errors.picId} {...register("picId")} />
              {errors.picId && <p className="text-xs text-danger mt-0.5" role="alert">{errors.picId.message}</p>}
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="issue-evidence">Evidence URL</label>
              <input id="issue-evidence" type="url" className="input" placeholder="https://…" {...register("evidenceFileUrl")} />
            </div>
          </div>
          <button type="submit" className="button button--primary self-end" disabled={creating} aria-busy={creating}>
            {creating ? <><span className="spinner spinner--sm" aria-hidden="true" /> Adding…</> : "Add Issue"}
          </button>
        </form>
      )}

      {/* Issues list */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded" />)}</div>
      ) : issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No issues — all clear</p>
      ) : (
        <div className="flex flex-col gap-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} shipmentId={detailId!} onUpdateId={setUpdatingId} updatingId={updatingId} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, shipmentId, onUpdateId, updatingId }: {
  issue: ReturnType<typeof useShipmentIssues>["data"] extends { data: (infer I)[] } | undefined ? I : never;
  shipmentId: string;
  onUpdateId: (id: string | null) => void;
  updatingId: string | null;
}) {
  const { mutate: update, isPending } = useUpdateIssue(shipmentId, issue.id);
  const isOverdue = new Date(issue.targetDate) < new Date() && !["resolved","closed"].includes(issue.status);

  return (
    <div className={`card p-4 text-sm border-l-4 ${issue.status === "open" ? "border-l-red-500" : issue.status === "in_progress" ? "border-l-amber-500" : "border-l-emerald-500"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-medium">{issue.category}</span>
          {isOverdue && <span className="badge badge--danger badge--sm ml-2">Overdue</span>}
        </div>
        <div className="flex gap-2 items-center">
          <span className={`badge badge--sm ${STATUS_BADGE[issue.status] ?? ""}`}>{issue.status.replace(/_/g," ")}</span>
        </div>
      </div>
      <p className="text-muted-foreground">{issue.description}</p>
      <p className="mt-1"><span className="text-eyebrow">Impact:</span> {issue.impact}</p>
      <p className="mt-0.5"><span className="text-eyebrow">Action:</span> {issue.actionPlan}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          PIC: {issue.pic.name} · Target: {new Date(issue.targetDate).toLocaleDateString()}
        </p>
        {!["resolved","closed"].includes(issue.status) && (
          <div className="flex gap-1">
            {issue.status === "open" && (
              <button type="button" className="button button--xs button--warning"
                disabled={isPending}
                onClick={() => { onUpdateId(issue.id); update({ status: "in_progress" }, { onSuccess: () => onUpdateId(null) }); }}>
                Start
              </button>
            )}
            <button type="button" className="button button--xs button--success"
              disabled={isPending}
              onClick={() => { onUpdateId(issue.id); update({ status: "resolved" }, { onSuccess: () => onUpdateId(null) }); }}>
              Resolve
            </button>
          </div>
        )}
      </div>
      {issue.resolvedAt && (
        <p className="text-xs text-emerald-600 mt-1">✓ Resolved {new Date(issue.resolvedAt).toLocaleDateString()} by {issue.resolvedBy?.name}</p>
      )}
    </div>
  );
}
