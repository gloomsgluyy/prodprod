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
  currentStage: string;
  issueNote: string | null;
}

export function ShipmentsTable() {
  const { data, isLoading } = useActiveShipments();
  const shipments = (data?.data ?? []) as ShipmentRow[];

  return (
    <div className="card h-full">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold">Active Shipments (Top 5)</p>
          <Link href="/shipment-monitor" className="link text-xs">View All →</Link>
        </div>

        <div className="overflow-x-auto">{isLoading ? <div className="space-y-2 animate-pulse">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-10 bg-muted rounded" />)}</div> : shipments.length === 0 ? <p className="text-sm text-center text-muted-foreground py-6">No active shipments</p> : <table className="table text-sm w-full min-w-[760px]"><thead><tr><th>Shipment No.</th><th>Buyer</th><th>Vessel / Barge</th><th className="text-right">Qty (MT)</th><th>Status</th><th>Current Stage</th><th>Issue / Note</th></tr></thead><tbody>{shipments.slice(0, 5).map((shipment) => <tr key={shipment.id}><td><Link href={`/shipment-monitor?open=${shipment.id}`} className="link font-medium">{shipment.shipmentNumber}</Link></td><td>{shipment.buyer}</td><td>{[shipment.vesselName, shipment.bargeName].filter(Boolean).join(" / ") || "—"}</td><td className="text-right whitespace-nowrap">{Number(shipment.qtyLoaded ?? shipment.qtyPlan ?? 0).toLocaleString()}</td><td><span className={`badge badge--sm ${STATUS_BADGE[shipment.status] ?? ""}`}>{shipment.status.replace("_", " ")}</span></td><td className="whitespace-nowrap">{shipment.currentStage}</td><td className="max-w-32 truncate" title={shipment.issueNote ?? undefined}>{shipment.issueNote ?? "—"}</td></tr>)}</tbody></table>}</div>
      </div>
    </div>
  );
}
