"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentSourceChanges, useShipmentBargeChanges, useRequestSourceChange, useLogBargeChange } from "../../hooks/use-shipments";
import { useShipmentDetail } from "../../hooks/use-shipments";

const sourceSchema = z.object({
  currentSource:     z.string().min(1,"Required"),
  currentSupplier:   z.string().min(1,"Required"),
  newSource:         z.string().min(1,"Required"),
  newSupplier:       z.string().min(1,"Required"),
  reasonCategory:    z.enum(["Stock issue","Quality issue","Price issue","Legal issue","Logistics issue","Buyer request","Other"]),
  reasonDetail:      z.string().min(1,"Required"),
  impactDescription: z.string().min(1,"Required"),
  evidenceFileUrl:   z.string().url().optional().or(z.literal("")),
});

const bargeSchema = z.object({
  oldBarge:         z.string().min(1,"Required"),
  newBarge:         z.string().min(1,"Required"),
  department:       z.string().min(1,"Required"),
  reasonCategory:   z.string().min(1,"Required"),
  reasonDetail:     z.string().min(1,"Required"),
  evidenceFileUrl:  z.string().url().optional().or(z.literal("")),
  approvalRequired: z.boolean().default(false),
});

type SourceForm = z.infer<typeof sourceSchema>;
type BargeForm  = z.infer<typeof bargeSchema>;

const CEO_APPROVE_BADGE: Record<string, string> = {
  pending:  "badge--warning",
  approved: "badge--success",
  rejected: "badge--danger",
};

export function TabSourceBarge() {
  const { detailId, sourceChangeOpen, bargeChangeOpen, toggleSourceChange, toggleBargeChange } = useShipmentUIStore();
  const { data: detailData } = useShipmentDetail(detailId ?? "");
  const { data: srcData, isLoading: srcLoading }  = useShipmentSourceChanges(detailId ?? "");
  const { data: brgData, isLoading: brgLoading }  = useShipmentBargeChanges(detailId ?? "");
  const { mutate: requestSource, isPending: reqSrc } = useRequestSourceChange(detailId ?? "");
  const { mutate: logBarge,      isPending: logBrg }  = useLogBargeChange(detailId ?? "");
  const [showBargeDetail, setShowBargeDetail] = useState(false);

  const shipment    = detailData?.data;
  const srcChanges  = srcData?.data ?? [];
  const bargeChanges= brgData?.data ?? [];

  const srcForm = useForm<SourceForm>({
    resolver: zodResolver(sourceSchema),
    defaultValues: { currentSource: shipment?.source ?? "", currentSupplier: shipment?.supplier ?? "" },
  });
  const brgForm = useForm<BargeForm>({
    resolver: zodResolver(bargeSchema),
    defaultValues: { oldBarge: shipment?.bargeName ?? "", approvalRequired: false },
  });

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* ── Current Assignment ─────────────────────────────────────── */}
      <section>
        <p className="text-eyebrow mb-2">Current Assignment</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Source / Supplier</p>
            <p className="font-semibold">{shipment?.source ?? "—"}</p>
            <p className="text-muted-foreground text-xs">{shipment?.supplier}</p>
          </div>
          <div className="card p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Vessel / Barge</p>
            <p className="font-semibold">{shipment?.vesselName ?? "—"}</p>
            <p className="text-muted-foreground text-xs">{shipment?.bargeName}</p>
          </div>
        </div>
      </section>

      <section className="card p-3">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setShowBargeDetail((v) => !v)}>
          <span className="text-eyebrow">Child Barge Details ({shipment?.bargeName ? 1 : 0})</span>
          <span className="button button--xs button--ghost button--neutral">{showBargeDetail ? "Hide Detail" : "Show Detail"}</span>
        </button>
        {showBargeDetail && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Mother Vessel</p>
              <p className="font-semibold">{shipment?.vesselName ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Child Barge</p>
              <p className="font-semibold">{shipment?.bargeName ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Loaded Qty</p>
              <p className="font-semibold">{shipment?.qtyLoaded != null ? `${Number(shipment.qtyLoaded).toLocaleString()} MT` : "—"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="font-semibold">{shipment?.source ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="font-semibold">{shipment?.supplier ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Region</p>
              <p className="font-semibold">{shipment?.region ?? "—"}</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Source Changes ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-eyebrow">Source Change Log ({srcChanges.length})</p>
          <button type="button" className="button button--sm button--ghost button--primary" onClick={toggleSourceChange}>
            {sourceChangeOpen ? "Cancel" : "+ Request Change"}
          </button>
        </div>

        {sourceChangeOpen && (
          <form
            className="card p-4 flex flex-col gap-3 mb-3"
            onSubmit={srcForm.handleSubmit((d) => requestSource(d as never, { onSuccess: () => { srcForm.reset(); toggleSourceChange(); } }))}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "currentSource" as const,   label: "Current Source *" },
                { id: "currentSupplier" as const,  label: "Current Supplier *" },
                { id: "newSource" as const,        label: "New Source *" },
                { id: "newSupplier" as const,      label: "New Supplier *" },
              ].map(({ id, label }) => (
                <div key={id} className="field">
                  <label className="field__label text-xs" htmlFor={`src-${id}`}>{label}</label>
                  <input id={`src-${id}`} type="text" className={`input ${srcForm.formState.errors[id] ? "input--invalid" : ""}`}
                    aria-invalid={!!srcForm.formState.errors[id]} {...srcForm.register(id)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="src-reason">Reason Category *</label>
                <select id="src-reason" className="select" {...srcForm.register("reasonCategory")}>
                  {["Stock issue","Quality issue","Price issue","Legal issue","Logistics issue","Buyer request","Other"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="src-evidence">Evidence URL</label>
                <input id="src-evidence" type="url" className="input" placeholder="https://…" {...srcForm.register("evidenceFileUrl")} />
              </div>
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="src-detail">Reason Detail *</label>
              <textarea id="src-detail" className="input" rows={2} {...srcForm.register("reasonDetail")} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="src-impact">Impact Description *</label>
              <textarea id="src-impact" className="input" rows={2} {...srcForm.register("impactDescription")} />
            </div>
            <button type="submit" className="button button--primary self-end" disabled={reqSrc} aria-busy={reqSrc}>
              {reqSrc ? <><span className="spinner spinner--sm" aria-hidden="true" /> Submitting…</> : "Submit Request"}
            </button>
          </form>
        )}

        {srcLoading ? <div className="h-16 animate-pulse bg-muted rounded" /> : srcChanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No source changes</p>
        ) : (
          <div className="flex flex-col gap-2">
            {srcChanges.map((c) => (
              <div key={c.id} className="card p-3 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium">v{c.activeVersion}: {c.currentSource} → {c.newSource}</span>
                  <span className={`badge badge--sm ${CEO_APPROVE_BADGE[c.ceoApprovalStatus] ?? "badge--neutral"}`}>
                    CEO: {c.ceoApprovalStatus}
                  </span>
                </div>
                <p className="text-muted-foreground">{c.reasonCategory} · {c.reasonDetail}</p>
                <p className="text-muted-foreground">By: {c.requestedBy.name} · {new Date(c.requestDate).toLocaleDateString()}</p>
                {c.ceoComment && <p className="italic mt-1">&ldquo;{c.ceoComment}&rdquo;</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Barge Changes ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-eyebrow">Barge Change Log ({bargeChanges.length})</p>
          <button type="button" className="button button--sm button--ghost button--primary" onClick={toggleBargeChange}>
            {bargeChangeOpen ? "Cancel" : "+ Log Change"}
          </button>
        </div>

        {bargeChangeOpen && (
          <form
            className="card p-4 flex flex-col gap-3 mb-3"
            onSubmit={brgForm.handleSubmit((d) => logBarge(d as never, { onSuccess: () => { brgForm.reset(); toggleBargeChange(); } }))}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "oldBarge" as const,   label: "Old Barge *" },
                { id: "newBarge" as const,   label: "New Barge *" },
                { id: "department" as const, label: "Department *" },
                { id: "reasonCategory" as const, label: "Reason Category *" },
              ].map(({ id, label }) => (
                <div key={id} className="field">
                  <label className="field__label text-xs" htmlFor={`brg-${id}`}>{label}</label>
                  <input id={`brg-${id}`} type="text" className={`input ${brgForm.formState.errors[id] ? "input--invalid" : ""}`}
                    {...brgForm.register(id)} />
                </div>
              ))}
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="brg-detail">Reason Detail *</label>
              <textarea id="brg-detail" className="input" rows={2} {...brgForm.register("reasonDetail")} />
            </div>
            <div className="flex gap-4">
              <label className="field__item">
                <input type="checkbox" className="checkbox" {...brgForm.register("approvalRequired")} />
                <span className="field__label font-normal text-sm">Approval Required</span>
              </label>
            </div>
            <button type="submit" className="button button--primary self-end" disabled={logBrg} aria-busy={logBrg}>
              {logBrg ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Log Change"}
            </button>
          </form>
        )}

        {brgLoading ? <div className="h-16 animate-pulse bg-muted rounded" /> : bargeChanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No barge changes</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bargeChanges.map((c) => (
              <div key={c.id} className="card p-3 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium">{c.oldBarge} → {c.newBarge}</span>
                  <span className={`badge badge--sm ${c.status === "active" ? "badge--success" : "badge--neutral"}`}>{c.status}</span>
                </div>
                <p className="text-muted-foreground">{c.department} · {c.reasonCategory}</p>
                <p className="text-muted-foreground">By: {c.changedBy.name} · {new Date(c.changeDatetime).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
