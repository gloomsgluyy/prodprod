"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useShipmentDetail } from "../hooks/use-shipments";

type Child = { id: string; nominationNumber: string; bargeName: string; plannedQty: number | null; loadedQty: number | null; status: string; currentStage: string | null; source: string | null; supplier: string | null; notes: string | null };

const fmt = (value: number | null | undefined) => value == null ? "—" : `${value.toLocaleString()} MT`;

export function MVWorkspace({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useShipmentDetail(id);
  const shipment = data?.data;
  const { data: childData, isLoading: childrenLoading } = useQuery({
    queryKey: ["shipments", "child-nominations", id],
    queryFn: () => api.get<{ data: Child[] }>(`/api/shipments/${id}/child-nominations`),
    enabled: !!id,
  });
  const children = childData?.data ?? [];
  const [formOpen, setFormOpen] = useState(false);
  const [nominationNumber, setNominationNumber] = useState("");
  const [bargeName, setBargeName] = useState("");
  const [plannedQty, setPlannedQty] = useState("");
  const createChild = useMutation({
    mutationFn: () => api.post(`/api/shipments/${id}/child-nominations`, { nominationNumber, bargeName, plannedQty: plannedQty || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shipments", "child-nominations", id] }); setFormOpen(false); setNominationNumber(""); setBargeName(""); setPlannedQty(""); },
  });
  const planned = children.reduce((sum, child) => sum + (child.plannedQty ?? 0), 0);
  const loaded = children.reduce((sum, child) => sum + (child.loadedQty ?? 0), 0);
  const openIssue = shipment ? "Review Issues tab" : "—";

  if (isLoading) return <div className="space-y-4 animate-pulse"><div className="h-24 rounded-lg bg-muted" /><div className="h-48 rounded-lg bg-muted" /><div className="h-64 rounded-lg bg-muted" /></div>;
  if (!shipment) return <div className="card p-8 text-center text-muted-foreground">Mother Vessel not found.</div>;

  return <div className="flex flex-col gap-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">Shipment Monitor / Mother Vessel</p><h1 className="text-2xl font-semibold mt-1">{shipment.shipmentNumber} — {shipment.vesselName ?? "Mother Vessel"}</h1><p className="text-sm text-muted-foreground mt-1">{shipment.buyer} · {shipment.type} · {shipment.status.replace(/_/g, " ")}</p></div><div className="flex gap-2"><Link href="/shipment-monitor" className="button button--sm button--ghost button--neutral">Back</Link><span className="badge badge--primary self-start">{shipment.status.replace(/_/g, " ")}</span></div></div>
    <section className="card"><div className="card__body"><div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 text-sm">{[["Buyer", shipment.buyer], ["Entity", "—"], ["Market", shipment.type], ["Qty Plan", fmt(shipment.qtyPlan)], ["Laycan", shipment.laycanStart ? new Date(shipment.laycanStart).toLocaleDateString("en-GB") : "—"], ["POL", shipment.pol], ["POD", shipment.pod], ["Shipping Term", shipment.shippingTerm]].map(([label, value]) => <div key={label as string}><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium mt-1">{value ?? "—"}</p></div>)}</div></div></section>
    <nav className="flex gap-1 overflow-x-auto border border-border rounded-lg p-1 bg-surface"><span className="button button--sm button--primary">Overview</span><Link href="#children" className="button button--sm button--ghost button--neutral">Child Nominations</Link><Link href="#progress" className="button button--sm button--ghost button--neutral">Progress</Link><Link href={`/shipment-monitor?open=${id}`} className="button button--sm button--ghost button--neutral">Full Detail</Link></nav>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Metric label="Buyer Qty (Plan)" value={fmt(shipment.qtyPlan)} /><Metric label="Supplier Allocation" value={fmt(planned)} /><Metric label="Actual Loaded" value={fmt(loaded || shipment.qtyLoaded)} /><Metric label="Current Issue" value={openIssue} danger={openIssue !== "—"} /></div>
    <section id="progress" className="grid grid-cols-1 xl:grid-cols-2 gap-6"><div className="card"><div className="card__body gap-3"><h2 className="font-semibold">Shipment Progress</h2>{["Sales Forecast", "Buyer Confirmation", "Supplier Allocation", "Barge Loading", "Mother Vessel Loading", "Documents", "Payment"].map((stage, index) => <div key={stage} className="flex items-center justify-between border-b border-border py-2 text-sm"><span><span className={`inline-block h-2 w-2 rounded-full mr-2 ${index < 3 ? "bg-emerald-500" : "bg-amber-400"}`} />{stage}</span><span className="text-muted-foreground">{index < 3 ? "Complete" : "Pending"}</span></div>)}</div></div><div className="card border-red-200"><div className="card__body gap-3"><div className="flex justify-between"><h2 className="font-semibold text-red-700">Current Issues</h2><Link href={`/shipment-monitor?open=${id}`} className="link text-xs">View All Issues →</Link></div><p className="text-sm text-muted-foreground">{openIssue}</p></div></div></section>
    <section id="children" className="card"><div className="card__body gap-3"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Child Nominations (TB/BG)</h2><p className="text-xs text-muted-foreground">Nested under {shipment.shipmentNumber}; not standalone shipments.</p></div><div className="flex items-center gap-2"><span className="badge badge--neutral">{children.length} children</span><button type="button" className="button button--sm button--primary" onClick={() => setFormOpen((value) => !value)}>+ Add TB / BG</button></div></div>{formOpen && <form className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-lg border border-border p-3" onSubmit={(event) => { event.preventDefault(); createChild.mutate(); }}><input className="input" placeholder="Nomination No." value={nominationNumber} onChange={(event) => setNominationNumber(event.target.value)} required /><input className="input" placeholder="TB / BG Name" value={bargeName} onChange={(event) => setBargeName(event.target.value)} required /><input className="input" type="number" min="0" step="0.01" placeholder="Planned Qty (MT)" value={plannedQty} onChange={(event) => setPlannedQty(event.target.value)} /><button className="button button--primary" disabled={createChild.isPending}>{createChild.isPending ? "Saving…" : "Save Nomination"}</button>{createChild.isError && <p className="text-xs text-red-600 sm:col-span-4">{createChild.error instanceof Error ? createChild.error.message : "Failed to save nomination"}</p>}</form>}{childrenLoading ? <div className="h-32 animate-pulse bg-muted rounded" /> : children.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No child nominations registered yet.</p> : <div className="overflow-x-auto"><table className="table text-sm w-full min-w-[800px]"><thead><tr><th>Nomination</th><th>TB / BG</th><th>Planned Qty</th><th>Loaded Qty</th><th>Status</th><th>Current Stage</th><th>Source / Supplier</th><th>Issue / Note</th></tr></thead><tbody>{children.map((child) => <tr key={child.id}><td className="font-medium">{child.nominationNumber}</td><td>{child.bargeName}</td><td>{fmt(child.plannedQty)}</td><td>{fmt(child.loadedQty)}</td><td><span className="badge badge--sm badge--info">{child.status}</span></td><td>{child.currentStage ?? "—"}</td><td>{[child.source, child.supplier].filter(Boolean).join(" / ") || "—"}</td><td>{child.notes ?? "—"}</td></tr>)}</tbody></table></div>}</div></section>
  </div>;
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) { return <div className={`card card--stat p-4 ${danger ? "border-red-200" : ""}`}><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold mt-2 ${danger ? "text-red-600" : ""}`}>{value}</p></div>; }
