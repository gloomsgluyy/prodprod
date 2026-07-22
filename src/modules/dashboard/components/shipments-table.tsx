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

        <div className="overflow-x-auto">
          <table className="table table--striped text-sm" aria-label="Active shipments">
            <thead>
              <tr>
                <th>No</th>
                <th>Shipment No</th>
                <th>Status</th>
                <th>Buyer</th>
                <th>Vessel / Barge</th>
                <th>Port Muat</th>
                <th>Qty (MT)</th>
                <th>BL Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j}><div className="h-3 bg-muted rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                : shipments.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted-foreground py-6">
                      No active shipments
                    </td>
                  </tr>
                )
                : shipments.map((s, idx) => {
                    const qty = s.qtyLoaded ?? s.qtyPlan;
                    return (
                      <tr key={s.id}>
                        <td>{idx + 1}</td>
                        <td className="font-medium">{s.shipmentNumber}</td>
                        <td>
                          <span className={`badge badge--sm ${STATUS_BADGE[s.status] ?? ""}`}>
                            {s.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>{s.buyer}</td>
                        <td>{[s.vesselName, s.bargeName].filter(Boolean).join(" / ") || "—"}</td>
                        <td>{s.pol ?? "—"}</td>
                        <td>{qty != null ? Number(qty).toLocaleString() : "—"}</td>
                        <td>{s.blDate ? new Date(s.blDate).toLocaleDateString() : "—"}</td>
                        <td>
                          <Link
                            href={`/shipment-monitor?open=${s.id}`}
                            className="link text-xs"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
