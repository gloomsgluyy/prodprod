"use client";

import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentCommercialRef } from "../../hooks/use-shipments";

export function TabCommercialRef() {
  const { detailId } = useShipmentUIStore();
  const { data, isLoading } = useShipmentCommercialRef(detailId ?? "");
  const ref = data?.data;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {[1,2,3,4].map((i) => <div key={i} className="h-8 bg-muted rounded" />)}
      </div>
    );
  }

  if (!ref) return null;

  if (!ref.linked) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <p className="mb-2">{ref.message}</p>
        {ref.shipmentRef && (
          <div className="card p-3 text-left text-xs mt-3 inline-block">
            <p><span className="text-muted-foreground">Shipping Term: </span>{ref.shipmentRef.shippingTerm ?? "—"}</p>
            <p><span className="text-muted-foreground">Payment Term: </span>{ref.shipmentRef.paymentTerm ?? "—"}</p>
            <p><span className="text-muted-foreground">Sales Price: </span>{ref.shipmentRef.salesPrice ? `$${ref.shipmentRef.salesPrice}/MT` : "—"}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Project header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-eyebrow">Linked Forecast Sales Project</p>
          <p className="font-semibold">{ref.projectName}</p>
          <p className="text-sm text-muted-foreground">{ref.buyer}{ref.buyerCountry ? ` — ${ref.buyerCountry}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge badge--sm ${
            ref.projectStatus === "deal" ? "badge--success" :
            ref.projectStatus === "approved" ? "badge--info" :
            "badge--neutral"
          }`}>{ref.projectStatus ?? "—"}</span>
          <a
            href={`/forecast-sales?open=${ref.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--ghost button--neutral button--sm"
          >
            Open Project ↗
          </a>
        </div>
      </div>

      {/* Commercial Terms */}
      <section>
        <p className="text-eyebrow mb-2">Commercial Terms</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Sales Term",      value: ref.salesTerm },
            { label: "Price Basis",     value: ref.priceBasis },
            { label: "Payment Terms",   value: ref.paymentTerms },
            { label: "Target Price",    value: ref.targetSellingPrice ? `$${ref.targetSellingPrice}/MT` : null },
            { label: "Actual Price",    value: ref.actualSalesPrice   ? `$${ref.actualSalesPrice}/MT`   : null },
            { label: "Margin/MT",       value: ref.marginMt           ? `$${ref.marginMt}`              : null },
            { label: "Quantity",        value: ref.quantity           ? `${Number(ref.quantity).toLocaleString()} MT` : null },
            { label: "Laycan Start",    value: ref.laycanStart ? new Date(ref.laycanStart).toLocaleDateString("en-GB") : null },
            { label: "Laycan End",      value: ref.laycanEnd   ? new Date(ref.laycanEnd).toLocaleDateString("en-GB")   : null },
          ].map(({ label, value }) => (
            <div key={label} className="card p-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coal Spec */}
      {(ref.specGar || ref.specTs || ref.specAsh || ref.specTm) && (
        <section>
          <p className="text-eyebrow mb-2">Contract Coal Spec</p>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {[
              { label: "GAR",  value: ref.specGar  },
              { label: "TS %", value: ref.specTs   },
              { label: "ASH %",value: ref.specAsh  },
              { label: "TM %", value: ref.specTm   },
            ].map(({ label, value }) => (
              <div key={label} className="card p-2 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FCO Documents */}
      <section>
        <p className="text-eyebrow mb-2">FCO Documents</p>
        {!ref.fcoNumber ? (
          <p className="text-sm text-muted-foreground">No FCO generated yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(ref.fcoHistory ?? []).map((fco) => (
              <div key={fco.id} className="card p-3 flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{fco.fcoNumber} <span className="text-xs text-muted-foreground">v{fco.version}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {fco.action} · {new Date(fco.generatedAt).toLocaleDateString("en-GB")} · by {fco.generatedBy}
                  </p>
                </div>
                {fco.pdfUrl ? (
                  <a
                    href={fco.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--ghost button--neutral button--sm"
                    aria-label={`Download FCO ${fco.fcoNumber}`}
                  >
                    PDF ↓
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No PDF</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
