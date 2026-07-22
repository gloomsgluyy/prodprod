"use client";

import Link from "next/link";
import { useDocumentAging } from "../hooks/use-dashboard";
import type { DocumentAgingAlert } from "@/types";

export function DocumentAging() {
  const { data, isLoading } = useDocumentAging();
  const alerts: DocumentAgingAlert[] = data?.data ?? [];

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning  = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="card">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-eyebrow">Document Aging Alerts</p>
            {critical > 0 && <span className="badge badge--danger badge--sm">{critical} critical</span>}
            {warning  > 0 && <span className="badge badge--warning badge--sm">{warning} warning</span>}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No document aging alerts</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 6).map((a, i) => (
              <Link
                key={i}
                href={`/shipment-monitor?open=${a.shipmentId}&tab=documents`}
                className={`block p-3 rounded-lg border text-left hover:opacity-80 transition-opacity ${
                  a.severity === "critical"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                }`}
                aria-label={`${a.shipmentNumber} — ${a.label}, ${a.agingDays} days`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-semibold truncate">{a.shipmentNumber}</p>
                  <span className={`badge badge--xs flex-shrink-0 ${a.severity === "critical" ? "badge--danger" : "badge--warning"}`}>
                    {a.agingDays}d
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.label}</p>
                {a.pic && <p className="text-xs mt-0.5">PIC: {a.pic}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
