"use client";

import Link from "next/link";
import { usePendingAlerts } from "../hooks/use-dashboard";

type Alert = { id: string; type: string; message: string; shipmentNumber: string; link: string; severity: "critical" | "warning" };

export function PendingAlerts() {
  const { data, isLoading, isError } = usePendingAlerts();
  const alerts: Alert[] = data?.data ?? [];
  return <section className="card"><div className="card__body gap-3"><div className="flex items-center justify-between"><div><p className="text-eyebrow">Pending Alerts</p><p className="text-xs text-muted-foreground">SI, draft BL, invoice, surveyor report. COO pending awaits final field mapping.</p></div><span className="badge badge--sm badge--warning">{alerts.length}</span></div>{isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 animate-pulse">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 bg-muted rounded" />)}</div> : isError ? <p className="text-sm text-red-600">Pending alerts unavailable.</p> : alerts.length === 0 ? <p className="text-sm text-center py-4 text-muted-foreground">No pending operational alerts</p> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{alerts.slice(0, 12).map((alert) => <Link key={alert.id} href={alert.link} className={`rounded border p-3 hover:opacity-80 ${alert.severity === "critical" ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20"}`}><p className="text-xs font-semibold">{alert.type}</p><p className="text-xs mt-1">{alert.shipmentNumber}</p><p className="text-xs text-muted-foreground mt-1">{alert.message}</p></Link>)}</div>}</div></section>;
}
