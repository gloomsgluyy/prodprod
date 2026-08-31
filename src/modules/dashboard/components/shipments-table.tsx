"use client";

import Link from "next/link";
import { useActiveShipments } from "../hooks/use-dashboard";

const STATUS_BADGE: Record<string, string> = {
  upcoming:  "badge--neutral",
  loading:   "badge--primary",
  in_transit:"badge--info",
  completed: "badge--success",
  cancelled: "badge--danger",
};

interface ShipmentRow {
  id: string;
  shipmentNumber: string;
  buyer: string;
  vesselName: string | null;
  bargeName: string | null;
  pol: string | null;
  qtyPlan: number | null;
  qtyLoaded: number | null;
  blDate: string | null;
  status: string;
  completionScore: number | null;
  openIssueCount: number;
}

export function ShipmentsTable() {
  const { data, isLoading } = useActiveShipments();
  const shipments = (data?.data ?? []) as ShipmentRow[];

  return (
    <div className="card">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Active Shipments</p>
          <Link href="/shipment-monitor" className="link text-xs">View All →</Link>
        </div>

        <div className="space-y-2">{isLoading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 bg-muted animate-pulse rounded" />) : shipments.length === 0 ? <p className="text-sm text-center text-muted-foreground py-6">No active shipments</p> : shipments.slice(0, 6).map((shipment) => <Link key={shipment.id} href={`/shipment-monitor?open=${shipment.id}`} className="block rounded border border-border p-3 hover:bg-muted/50"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium truncate">{shipment.shipmentNumber}</p><span className={`badge badge--xs ${STATUS_BADGE[shipment.status] ?? ""}`}>{shipment.status.replace("_", " ")}</span></div><p className="text-xs text-muted-foreground truncate mt-1">{shipment.buyer} · {shipment.status === "upcoming" ? "Pre-loading" : shipment.status === "loading" ? "Loading" : "In transit"} · {shipment.openIssueCount ? `${shipment.openIssueCount} open issue` : "No open issue"}</p></Link>)}</div>
      </div>
    </div>
  );
}
