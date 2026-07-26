"use client";

import { useSalesMonitorUIStore } from "../store/sales-monitor-ui-store";
import { useDealDetail } from "../hooks/use-deals";

const STATUS_BADGE: Record<string, string> = {
  waiting_approval: "badge--neutral",
  waiting_buyer:    "badge--warning",
  offer_submitted:  "badge--info",
  confirmed:        "badge--primary",
  in_transit:       "badge--primary",
  completed:        "badge--success",
  cancelled:        "badge--danger",
  rejected:         "badge--danger",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0 w-32">{label}</span>
      <span className="text-xs font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export function DealDetailModal() {
  const { detailId, closeDetail } = useSalesMonitorUIStore();
  const { data, isLoading } = useDealDetail(detailId ?? "");
  const deal = data?.data;

  if (!detailId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Deal detail">
      <button type="button" className="absolute inset-0 w-full"
        onClick={closeDetail} aria-label="Close" tabIndex={-1} />

      <div className="relative card w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="card__body space-y-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-6 bg-muted rounded" />)}
          </div>
        ) : deal ? (
          <div className="card__body gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">{deal.projectName}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {deal.buyer} {deal.buyerCountry && `· ${deal.buyerCountry}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge ${STATUS_BADGE[deal.status] ?? "badge--neutral"}`}>
                  {statusLabel(deal.status)}
                </span>
                <button type="button" className="button button--ghost button--neutral button--icon-only"
                  onClick={closeDetail} aria-label="Close">✕</button>
              </div>
            </div>

            {/* General Info */}
            <section>
              <p className="text-eyebrow mb-2">Deal Info</p>
              <div className="bg-muted/30 rounded p-3">
                <Row label="Deal Number" value={deal.dealNumber} />
                <Row label="Segment" value={deal.segment} />
                <Row label="Commodity" value={deal.commodity} />
                <Row label="Type" value={deal.type} />
                <Row label="Quantity" value={deal.quantity ? `${Number(deal.quantity).toLocaleString()} MT` : null} />
                <Row label="Price /MT" value={deal.pricePerMt ? `$${Number(deal.pricePerMt).toFixed(2)}` : null} />
                <Row label="Total Value" value={deal.quantity && deal.pricePerMt ? `$${(Number(deal.quantity) * Number(deal.pricePerMt)).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : null} />
              </div>
            </section>

            {/* Shipping */}
            <section>
              <p className="text-eyebrow mb-2">Shipping</p>
              <div className="bg-muted/30 rounded p-3">
                <Row label="Shipping Term" value={deal.shippingTerm} />
                <Row label="Laycan / POL" value={deal.laycanPol} />
                <Row label="Vessel Name" value={deal.vesselName} />
              </div>
            </section>

            {/* Coal Spec */}
            <section>
              <p className="text-eyebrow mb-2">Coal Specification</p>
              <div className="bg-muted/30 rounded p-3">
                <Row label="GAR" value={deal.specGar ? `${Number(deal.specGar).toLocaleString()} kcal/kg` : null} />
                <Row label="Total Sulfur" value={deal.specTs ? `${Number(deal.specTs).toFixed(2)}%` : null} />
                <Row label="Ash" value={deal.specAsh ? `${Number(deal.specAsh).toFixed(2)}%` : null} />
                <Row label="Total Moisture" value={deal.specTm ? `${Number(deal.specTm).toFixed(2)}%` : null} />
              </div>
            </section>

            {/* Notes */}
            {deal.notes && (
              <section>
                <p className="text-eyebrow mb-2">Notes</p>
                <div className="bg-muted/30 rounded p-3 text-sm whitespace-pre-wrap">{deal.notes}</div>
              </section>
            )}

            {/* Metadata */}
            <section>
              <p className="text-eyebrow mb-2">Metadata</p>
              <div className="bg-muted/30 rounded p-3">
                <Row label="Created" value={new Date(deal.createdAt).toLocaleString()} />
                <Row label="Updated" value={new Date(deal.updatedAt).toLocaleString()} />
                <Row label="Linked Shipment" value={deal.linkedShipmentId ?? "—"} />
                <Row label="Linked Project" value={deal.linkedProjectId ?? "—"} />
              </div>
            </section>
          </div>
        ) : (
          <div className="card__body py-12 text-center text-muted-foreground">
            Deal not found
          </div>
        )}
      </div>
    </div>
  );
}
