"use client";

import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentDetail, useUpdateShipment, useCloseShipment } from "../../hooks/use-shipments";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { useState } from "react";

const STATUS_BADGE: Record<string, string> = {
  upcoming:   "badge--neutral",
  loading:    "badge--primary",
  in_transit: "badge--info",
  completed:  "badge--success",
  cancelled:  "badge--danger",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export function TabInfo() {
  const { detailId, openCloseModal, openEdit } = useShipmentUIStore();
  const { isExecutive } = useAuthStore();
  const { data, isLoading } = useShipmentDetail(detailId ?? "");
  const shipment = data?.data;
  const { mutate: updateStatus, isPending } = useUpdateShipment(detailId ?? "");
  const [editingStatus, setEditingStatus] = useState(false);

  if (isLoading) return <div className="space-y-2 animate-pulse p-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-6 bg-muted rounded" />)}</div>;
  if (!shipment) return null;

  const qty = shipment.qtyFinal ?? shipment.qtyLoaded ?? shipment.qtyPlan;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" className="button button--sm button--ghost button--primary" onClick={() => openEdit(shipment.id)}>Edit</button>
        {!["completed","cancelled"].includes(shipment.status) && (
          <button type="button" className="button button--sm button--success" onClick={() => openCloseModal(shipment.id)}>Close Shipment</button>
        )}
        {/* Quick status update */}
        {editingStatus ? (
          <div className="flex gap-2 items-center">
            <select className="select select--sm w-36" defaultValue={shipment.status}
              onChange={(e) => {
                updateStatus({ status: e.target.value as never }, { onSuccess: () => setEditingStatus(false) });
              }}>
              {["upcoming","loading","in_transit","completed","cancelled"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g," ")}</option>
              ))}
            </select>
            <button type="button" className="button button--xs button--ghost button--neutral" onClick={() => setEditingStatus(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="button button--sm button--ghost button--neutral" onClick={() => setEditingStatus(true)}>Change Status</button>
        )}
        <div className="ms-auto">
          <span className={`badge ${STATUS_BADGE[shipment.status] ?? "badge--neutral"}`}>
            {shipment.status.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
          </span>
        </div>
      </div>

      {/* Completion score */}
      <div className="p-3 rounded-lg bg-surface border border-border">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-eyebrow">Data Completeness</span>
          <span className="font-semibold">{shipment.completionScore ?? 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${(shipment.completionScore ?? 0) >= 80 ? "bg-emerald-500" : (shipment.completionScore ?? 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${shipment.completionScore ?? 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Buyer & Route */}
        <section>
          <p className="text-eyebrow mb-2">Buyer & Route</p>
          <div className="card p-3">
            <Row label="Buyer"         value={shipment.buyer} />
            <Row label="Country"       value={shipment.buyerCountry} />
            <Row label="Type"          value={shipment.type} />
            <Row label="POL"           value={shipment.pol} />
            <Row label="POD"           value={shipment.pod} />
            <Row label="Shipping Term" value={shipment.shippingTerm} />
            <Row label="Payment Term"  value={shipment.paymentTerm} />
            <Row label="PIC"           value={shipment.pic} />
          </div>
        </section>

        {/* Vessel & Schedule */}
        <section>
          <p className="text-eyebrow mb-2">Vessel & Schedule</p>
          <div className="card p-3">
            <Row label="Vessel (MV)"    value={shipment.vesselName} />
            <Row label="Barge (TB/BG)"  value={shipment.bargeName} />
            <Row label="Laycan Start"   value={shipment.laycanStart ? new Date(shipment.laycanStart).toLocaleDateString() : null} />
            <Row label="Laycan End"     value={shipment.laycanEnd   ? new Date(shipment.laycanEnd).toLocaleDateString()   : null} />
            <Row label="ETD"            value={shipment.etd   ? new Date(shipment.etd).toLocaleDateString()   : null} />
            <Row label="ETA"            value={shipment.eta   ? new Date(shipment.eta).toLocaleDateString()   : null} />
            <Row label="BL Date"        value={shipment.blDate? new Date(shipment.blDate).toLocaleDateString(): null} />
          </div>
        </section>

        {/* Qty & Source */}
        <section>
          <p className="text-eyebrow mb-2">Quantity & Source</p>
          <div className="card p-3">
            <Row label="Qty Plan"    value={shipment.qtyPlan   != null ? `${Number(shipment.qtyPlan).toLocaleString()} MT`  : null} />
            <Row label="Qty Loaded"  value={shipment.qtyLoaded != null ? `${Number(shipment.qtyLoaded).toLocaleString()} MT`: null} />
            <Row label="Qty Final"   value={shipment.qtyFinal  != null ? `${Number(shipment.qtyFinal).toLocaleString()} MT` : null} />
            <Row label="Source"      value={shipment.source} />
            <Row label="Supplier"    value={shipment.supplier} />
            <Row label="IUP OP"      value={shipment.iupOp} />
            <Row label="Region"      value={shipment.region} />
          </div>
        </section>

        {/* Coal Spec */}
        <section>
          <p className="text-eyebrow mb-2">Coal Specification</p>
          <div className="card p-3">
            <Row label="GAR (kcal/kg)" value={shipment.specGar ? Number(shipment.specGar).toLocaleString() : null} />
            <Row label="TS (%)"        value={shipment.specTs} />
            <Row label="ASH (%)"       value={shipment.specAsh} />
            <Row label="TM (%)"        value={shipment.specTm} />
          </div>
        </section>

        {/* Financial — executive only */}
        {isExecutive && (
          <section className="lg:col-span-2">
            <p className="text-eyebrow mb-2">Financial Summary <span className="text-xs text-amber-500">(Confidential)</span></p>
            <div className="card p-3 grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-border">
              {[
                { l: "Sales Price",   v: shipment.salesPrice,   u: "USD/MT" },
                { l: "Buying Price",  v: shipment.buyingPrice,  u: "USD/MT" },
                { l: "Freight",       v: shipment.freightRate,  u: "USD/MT" },
                { l: "Margin",        v: shipment.marginMt,     u: "USD/MT" },
              ].map((f) => (
                <div key={f.l} className="px-4 first:pl-0 last:pr-0">
                  <p className="text-eyebrow">{f.l}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${f.l === "Margin" ? (Number(f.v ?? 0) >= 0 ? "text-emerald-500" : "text-red-500") : ""}`}>
                    {f.v != null ? `$${Number(f.v).toFixed(2)}` : "—"}
                    <span className="text-xs text-muted-foreground ml-1">{f.u}</span>
                  </p>
                </div>
              ))}
            </div>
            {qty != null && shipment.marginMt != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Total Margin: <strong className="text-foreground">${(Number(qty) * Number(shipment.marginMt)).toLocaleString("en-US",{maximumFractionDigits:0})}</strong>
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
