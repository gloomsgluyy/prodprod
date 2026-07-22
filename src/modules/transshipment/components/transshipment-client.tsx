"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransshipmentUIStore } from "../store/transshipment-ui-store";
import {
  useTransshipmentList, useCreateTransshipment, useUpdateTransshipment,
  useDeleteTransshipment, useUpdateMilestones, useRiskInsight,
  type TransshipmentItem,
} from "../hooks/use-transshipment";

const STATUS_BADGE: Record<string, string> = { active: "badge--primary", completed: "badge--success" };

// ── Allocate form ─────────────────────────────────────────────────────────────
const allocSchema = z.object({
  mvName:       z.string().min(1,"Required"),
  shipmentNumber:z.string().optional(),
  vesselName:   z.string().optional(),
  bargeName:    z.string().optional(),
  loadingPort:  z.string().optional(),
  dischargePort:z.string().optional(),
  freightRate:  z.coerce.number().positive().optional(),
  qtyLoaded:    z.coerce.number().positive().optional(),
  eta:          z.string().optional(),
  weather:      z.string().optional(),
  status:       z.enum(["active","completed"]).default("active"),
});
type AllocForm = z.infer<typeof allocSchema>;

function AllocateModal() {
  const { editingId, closeModal } = useTransshipmentUIStore();
  const isEdit = !!editingId;
  const { mutate: create, isPending: creating } = useCreateTransshipment();
  const { mutate: update, isPending: updating } = useUpdateTransshipment(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, formState: { errors } } = useForm<AllocForm>({
    resolver: zodResolver(allocSchema),
    defaultValues: { status: "active" },
  });

  const F = ({ id, label, type="text", ph }: { id: keyof AllocForm; label: string; type?: string; ph?: string }) => (
    <div className="field">
      <label className="field__label text-xs" htmlFor={`ts-${id}`}>{label}</label>
      <input id={`ts-${id}`} type={type} step={type==="number"?"0.01":undefined}
        className={`input ${errors[id] ? "input--invalid":""}`} placeholder={ph}
        {...register(id)} />
      {errors[id] && <p className="text-xs text-danger mt-0.5">{(errors[id] as {message?:string})?.message}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Voyage" : "Allocate Vessel"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only" onClick={closeModal} aria-label="Close">✕</button>
          </div>
          <form onSubmit={handleSubmit((d) => {
            if (isEdit) update(d, { onSuccess: closeModal });
            else create(d, { onSuccess: closeModal });
          })} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <F id="mvName"        label="MV Project Name *" ph="Project Alpha" />
              <F id="shipmentNumber"label="Shipment Number" />
              <F id="vesselName"    label="Vessel Name" ph="MV Harmony" />
              <F id="bargeName"     label="Barge Name"   ph="TB Jaya" />
              <F id="loadingPort"   label="Loading Port" ph="Taboneo" />
              <F id="dischargePort" label="Discharge Port"ph="Shanghai" />
              <F id="freightRate"   label="Freight Rate (USD/MT)" type="number" ph="8.50" />
              <F id="qtyLoaded"     label="Qty Loaded (MT)"       type="number" ph="50000" />
              <F id="eta"           label="ETA"  type="datetime-local" />
              <F id="weather"       label="Weather Note" ph="Fair" />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="ts-status">Status</label>
              <select id="ts-status" className="select" {...register("status")}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral" onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary" disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : isEdit ? "Update" : "Allocate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Milestone dialog ──────────────────────────────────────────────────────────
type MilestoneStatus = "pending" | "current" | "completed" | "done";
interface MilestoneItem { title: string; subtitle: string; status: MilestoneStatus; }

const DEFAULT_MILESTONES: MilestoneItem[] = [
  { title: "Vessel Chartered",             subtitle: "",  status: "pending" },
  { title: "NOR Tendered",                 subtitle: "",  status: "pending" },
  { title: "Arrived at Discharging Port",  subtitle: "",  status: "pending" },
];

function MilestoneModal({ voyageId }: { id: string; voyageId: string }) {
  const { closeMilestones } = useTransshipmentUIStore();
  const { mutate, isPending } = useUpdateMilestones(voyageId);
  const [stones, setStones] = useState<MilestoneItem[]>(DEFAULT_MILESTONES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-lg">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Milestones</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only" onClick={closeMilestones} aria-label="Close">✕</button>
          </div>
          <div className="flex flex-col gap-3">
            {stones.map((m, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${m.status === "completed" ? "bg-emerald-500" : m.status === "current" ? "bg-blue-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                <div className="flex-1 flex gap-2 flex-wrap">
                  <input type="text" className="input input--sm flex-1" value={m.title}
                    onChange={(e) => setStones((prev) => prev.map((s,j)=>j===i?{...s,title:e.target.value}:s))} aria-label={`Milestone ${i+1} title`} />
                  <select className="select select--sm w-32" value={m.status}
                    onChange={(e) => setStones((prev) => prev.map((s,j)=>j===i?{...s,status:e.target.value as typeof m.status}:s))}>
                    <option value="pending">Pending</option>
                    <option value="current">Current</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral" onClick={closeMilestones}>Cancel</button>
            <button type="button" className="button button--primary" disabled={isPending} aria-busy={isPending}
              onClick={() => mutate(stones, { onSuccess: closeMilestones })}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Save Milestones"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Risk Insight modal ────────────────────────────────────────────────────────
function RiskModal({ voyageId }: { voyageId: string }) {
  const { closeRisk } = useTransshipmentUIStore();
  const { mutate, isPending, data: result } = useRiskInsight(voyageId);
  const insights = result?.data?.insights ?? [];

  const RISK_BADGE: Record<string, string> = { Low:"badge--success", Medium:"badge--warning", High:"badge--danger", Unknown:"badge--neutral" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">AI Risk Insight</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only" onClick={closeRisk} aria-label="Close">✕</button>
          </div>

          {insights.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                AI will analyze route, weather, and freight risks.{result?.data?.isStub ? " (Stub mode — Groq integration pending)" : ""}
              </p>
              <button type="button" className="button button--primary" onClick={() => mutate()} disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Analyzing…</> : "Generate AI Risk Insight"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {insights.map((ins) => (
                <div key={ins.category} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{ins.category}</p>
                    <span className={`badge badge--sm ${RISK_BADGE[ins.risk] ?? "badge--neutral"}`}>{ins.risk}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ins.detail}</p>
                  <p className="text-xs mt-1"><span className="font-medium">Mitigation:</span> {ins.mitigation}</p>
                </div>
              ))}
              <button type="button" className="button button--ghost button--neutral button--sm self-end"
                onClick={() => mutate()} disabled={isPending}>Re-generate</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Voyage card ───────────────────────────────────────────────────────────────
function VoyageCard({ voyage }: { voyage: TransshipmentItem }) {
  const { openEdit, openMilestones, openRisk } = useTransshipmentUIStore();
  const { mutate: deleteV } = useDeleteTransshipment(voyage.id);

  const milestones = voyage.milestones ?? [];
  const completed  = milestones.filter((m) => m.status === "completed").length;
  const pct        = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;
  const current    = milestones.find((m) => m.status === "current");

  return (
    <div className="card">
      <div className="card__body gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{voyage.mvName}</p>
            {voyage.shipmentNumber && <p className="text-xs text-muted-foreground">{voyage.shipmentNumber}</p>}
          </div>
          <span className={`badge badge--sm ${STATUS_BADGE[voyage.status] ?? ""}`}>{voyage.status}</span>
        </div>

        {/* Route progress */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{voyage.loadingPort ?? "—"}</span>
            <span>{current?.title ?? `${pct}% complete`}</span>
            <span>{voyage.dischargePort ?? "—"}</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
          <span>Qty: <strong className="text-foreground">{voyage.qtyLoaded != null ? Number(voyage.qtyLoaded).toLocaleString() : "—"} MT</strong></span>
          <span>Rate: <strong className="text-foreground">{voyage.freightRate != null ? `$${Number(voyage.freightRate).toFixed(2)}/MT` : "—"}</strong></span>
          <span>Total: <strong className="text-foreground">{voyage.totalFreight != null ? `$${Number(voyage.totalFreight).toLocaleString()}` : "—"}</strong></span>
          <span>ETA: <strong className="text-foreground">{voyage.eta ? new Date(voyage.eta).toLocaleDateString() : "—"}</strong></span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-wrap pt-1 border-t border-border">
          <button type="button" className="button button--xs button--ghost button--primary" onClick={() => openEdit(voyage.id)}>Edit</button>
          <button type="button" className="button button--xs button--ghost button--neutral" onClick={() => openMilestones(voyage.id)}>Milestones</button>
          <button type="button" className="button button--xs button--ghost button--neutral" onClick={() => openRisk(voyage.id)}>AI Risk</button>
          <button type="button" className="button button--xs button--ghost button--danger ms-auto"
            onClick={() => { if (confirm("Delete this voyage?")) deleteV(); }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function TransshipmentClient() {
  const { activeTab, viewMode, filterSearch, page, modalOpen, milestoneId, riskId,
    setActiveTab, setViewMode, setFilterSearch, setPage, openCreate } = useTransshipmentUIStore();

  const status = activeTab === "all" ? undefined : activeTab;
  const { data, isLoading } = useTransshipmentList({ page, status, search: filterSearch || undefined });
  const items   = data?.data ?? [];
  const meta    = data?.meta;
  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Voyages",   val: summary.totalShipments,                   color: "text-blue-500"    },
            { label: "Total Volume",    val: `${(summary.totalVolumeMt/1000).toFixed(1)}K MT`, color: "text-violet-500" },
            { label: "Avg Freight Rate",val: `$${Number(summary.avgFreightRate).toFixed(2)}/MT`, color: "text-amber-500" },
          ].map((c) => (
            <div key={c.label} className="card card--stat">
              <div className="card__body"><p className="text-eyebrow">{c.label}</p><p className={`text-2xl font-light ${c.color}`}>{c.val}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {(["active","completed","all"] as const).map((t) => (
            <button key={t} type="button"
              className={`button button--sm ${activeTab===t?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setActiveTab(t)} aria-pressed={activeTab===t}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {(["card","list"] as const).map((v) => (
            <button key={v} type="button"
              className={`button button--sm ${viewMode===v?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setViewMode(v)} aria-pressed={viewMode===v}>
              {v==="card"?"Cards":"List"}
            </button>
          ))}
        </div>

        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search MV name, port, shipment…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} aria-label="Search voyages" />
        </div>

        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>+ Allocate Vessel</button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={`grid ${viewMode==="card"?"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3":"grid-cols-1"} gap-4 animate-pulse`}>
          {Array.from({length:3}).map((_,i)=><div key={i} className="h-40 bg-muted rounded-lg"/>)}
        </div>
      ) : items.length === 0 ? (
        <div className="card"><div className="card__body py-12 text-center text-muted-foreground">
          {/* TODO: ganti dengan custom illustration Dermaga */}
          No voyages found
        </div></div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((v) => <VoyageCard key={v.id} voyage={v} />)}
        </div>
      ) : (
        <div className="card">
          <div className="card__body">
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm">
                <thead>
                  <tr><th>MV Name</th><th>Shipment</th><th>Route</th><th>Qty (MT)</th><th>Freight</th><th>Total</th><th>ETA</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((v) => (
                    <tr key={v.id}>
                      <td className="font-medium">{v.mvName}</td>
                      <td className="text-xs">{v.shipmentNumber ?? "—"}</td>
                      <td className="text-xs">{[v.loadingPort, v.dischargePort].filter(Boolean).join(" → ") || "—"}</td>
                      <td>{v.qtyLoaded != null ? Number(v.qtyLoaded).toLocaleString() : "—"}</td>
                      <td>{v.freightRate != null ? `$${Number(v.freightRate).toFixed(2)}/MT` : "—"}</td>
                      <td className="font-medium">{v.totalFreight != null ? `$${Number(v.totalFreight).toLocaleString()}` : "—"}</td>
                      <td className="text-xs">{v.eta ? new Date(v.eta).toLocaleDateString() : "—"}</td>
                      <td><span className={`badge badge--sm ${STATUS_BADGE[v.status]??""}`}>{v.status}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" className="button button--xs button--ghost button--primary" onClick={() => useTransshipmentUIStore.getState().openEdit(v.id)}>Edit</button>
                          <button type="button" className="button button--xs button--ghost button--neutral" onClick={() => useTransshipmentUIStore.getState().openRisk(v.id)}>Risk</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{meta.total} voyages · Page {meta.page} of {meta.totalPages}</p>
                <div className="flex gap-1">
                  <button type="button" className="button button--sm button--ghost button--neutral" disabled={meta.page<=1} onClick={()=>setPage(meta.page-1)}>←</button>
                  <button type="button" className="button button--sm button--ghost button--neutral" disabled={meta.page>=meta.totalPages} onClick={()=>setPage(meta.page+1)}>→</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen     && <AllocateModal />}
      {milestoneId   && <MilestoneModal id={milestoneId} voyageId={milestoneId} />}
      {riskId        && <RiskModal voyageId={riskId} />}
    </div>
  );
}
