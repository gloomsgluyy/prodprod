"use client";

import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentDetail, useUpdateShipment } from "../../hooks/use-shipments";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useShipmentTimelines, useUpdateTimelines } from "../../hooks/use-shipments";

const finSchema = z.object({
  salesPrice:    z.coerce.number().positive().optional(),
  buyingPrice:   z.coerce.number().positive().optional(),
  freightRate:   z.coerce.number().positive().optional(),
  royaltyCost:   z.coerce.number().min(0).optional(),
  taxExportCost: z.coerce.number().min(0).optional(),
  surveyCost:    z.coerce.number().min(0).optional(),
  financeCost:   z.coerce.number().min(0).optional(),
  qtyFinal:      z.coerce.number().positive().optional(),
});

type FinForm = z.infer<typeof finSchema>;

function TimelinePanel({ shipmentId }: { shipmentId: string }) {
  const { data, isLoading } = useShipmentTimelines(shipmentId);
  const { mutate: update, isPending } = useUpdateTimelines(shipmentId);
  const [activeType, setActiveType] = useState<"pol"|"pod">("pol");

  const polT = data?.data?.pol;
  const podT = data?.data?.pod;

  const POL_FIELDS = [
    { key: "arrivePol",       label: "Arrive POL" },
    { key: "norPol",          label: "NOR POL" },
    { key: "berthing",        label: "Berthing" },
    { key: "commenceLoading", label: "Commence Loading" },
    { key: "completeLoading", label: "Complete Loading" },
    { key: "blDate",          label: "BL Date" },
    { key: "peb",             label: "PEB" },
    { key: "lhv",             label: "LHV" },
  ];

  const POD_FIELDS = [
    { key: "etaPod",            label: "ETA POD" },
    { key: "arrivePod",         label: "Arrive POD" },
    { key: "norPod",            label: "NOR POD" },
    { key: "inPosition",        label: "In Position" },
    { key: "dischargeStart",    label: "Discharge Start" },
    { key: "dischargeComplete", label: "Discharge Complete" },
    { key: "factoryDate",       label: "Factory Date" },
  ];

  const current = activeType === "pol" ? polT : podT;
  const fields  = activeType === "pol" ? POL_FIELDS : POD_FIELDS;

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-eyebrow">Timeline</p>
        <div className="flex gap-1">
          {(["pol","pod"] as const).map((t) => (
            <button key={t} type="button"
              className={`button button--xs ${activeType === t ? "button--primary" : "button--ghost button--neutral"}`}
              onClick={() => setActiveType(t)} aria-pressed={activeType === t}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? <div className="h-24 animate-pulse bg-muted rounded" /> : (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fields.map(({ key, label }) => (
            <div key={key} className="field">
              <label className="field__label text-xs" htmlFor={`tl-${key}`}>{label}</label>
              <input id={`tl-${key}`} type="datetime-local" className="input input--sm"
                defaultValue={current ? (current as unknown as Record<string, string | null>)[key]?.slice(0,16) ?? "" : ""}
                onBlur={(e) => update({ type: activeType, [key]: e.target.value || null })}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function TabFinancial() {
  const { detailId } = useShipmentUIStore();
  const { isExecutive } = useAuthStore();
  const { data, isLoading } = useShipmentDetail(detailId ?? "");
  const { mutate: update, isPending } = useUpdateShipment(detailId ?? "");
  const shipment = data?.data;

  const { register, handleSubmit, formState: { errors } } = useForm<FinForm>({
    resolver: zodResolver(finSchema),
    values: {
      salesPrice:    shipment?.salesPrice    ?? undefined,
      buyingPrice:   shipment?.buyingPrice   ?? undefined,
      freightRate:   shipment?.freightRate   ?? undefined,
      royaltyCost:   shipment?.royaltyCost   ?? undefined,
      taxExportCost: shipment?.taxExportCost ?? undefined,
      surveyCost:    shipment?.surveyCost    ?? undefined,
      financeCost:   shipment?.financeCost   ?? undefined,
      qtyFinal:      shipment?.qtyFinal      ?? undefined,
    },
  });

  const qty = shipment?.qtyFinal ?? shipment?.qtyLoaded ?? shipment?.qtyPlan ?? 0;

  function calcMargin(d: FinForm) {
    const sell  = d.salesPrice    ?? 0;
    const buy   = d.buyingPrice   ?? 0;
    const frt   = d.freightRate   ?? 0;
    const roy   = d.royaltyCost   ?? 0;
    const tax   = d.taxExportCost ?? 0;
    const srv   = d.surveyCost    ?? 0;
    const fin   = d.financeCost   ?? 0;
    const totalCost = buy + frt + roy + tax + srv + fin;
    return Math.round((sell - totalCost) * 100) / 100;
  }

  function onSave(d: FinForm) {
    const marginMt = calcMargin(d);
    update({ ...d, marginMt });
  }

  if (!isExecutive) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground text-sm">Financial data is restricted to executive roles.</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-4 space-y-2 animate-pulse">{Array.from({length:6}).map((_,i)=><div key={i} className="h-10 bg-muted rounded"/>)}</div>;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Financial fields */}
      <section>
        <p className="text-eyebrow mb-2">Financial Data <span className="text-amber-500">(Confidential)</span></p>
        <form onSubmit={handleSubmit(onSave)} noValidate className="card p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { id: "salesPrice" as const,    label: "Sales Price (USD/MT)" },
              { id: "buyingPrice" as const,   label: "Buying Price (USD/MT)" },
              { id: "freightRate" as const,   label: "Freight Rate (USD/MT)" },
              { id: "royaltyCost" as const,   label: "Royalty (USD/MT)" },
              { id: "taxExportCost" as const, label: "Tax / Export (USD/MT)" },
              { id: "surveyCost" as const,    label: "Survey Cost (USD/MT)" },
              { id: "financeCost" as const,   label: "Finance Cost (USD/MT)" },
              { id: "qtyFinal" as const,      label: "Qty Final (MT)" },
            ].map(({ id, label }) => (
              <div key={id} className="field">
                <label className="field__label text-xs" htmlFor={`fin-${id}`}>{label}</label>
                <input id={`fin-${id}`} type="number" step="0.01" className={`input ${errors[id] ? "input--invalid" : ""}`}
                  aria-invalid={!!errors[id]} {...register(id)} />
              </div>
            ))}
          </div>
          <button type="submit" className="button button--primary" disabled={isPending} aria-busy={isPending}>
            {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Save Financial Data"}
          </button>
        </form>
      </section>

      {/* Margin breakdown */}
      {shipment?.salesPrice && (
        <section>
          <p className="text-eyebrow mb-2">Margin Breakdown</p>
          <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { l: "Sell Price",    v: shipment.salesPrice,    cls: "text-blue-500" },
              { l: "Buy Price",     v: shipment.buyingPrice,   cls: "" },
              { l: "Freight",       v: shipment.freightRate,   cls: "" },
              { l: "Royalty",       v: shipment.royaltyCost,   cls: "" },
              { l: "Tax/Export",    v: shipment.taxExportCost, cls: "" },
              { l: "Survey",        v: shipment.surveyCost,    cls: "" },
              { l: "Finance",       v: shipment.financeCost,   cls: "" },
              { l: "Margin /MT",    v: shipment.marginMt,      cls: Number(shipment.marginMt??0) >= 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold" },
            ].map(({ l, v, cls }) => (
              <div key={l}>
                <p className="text-eyebrow">{l}</p>
                <p className={cls}>{v != null ? `$${Number(v).toFixed(2)}` : "—"}</p>
              </div>
            ))}
          </div>
          {qty > 0 && shipment.marginMt != null && (
            <div className="mt-3 p-3 rounded-lg border bg-surface border-border text-sm">
              <p className="text-eyebrow mb-1">Total Margin (Qty × Margin/MT)</p>
              <p className={`text-2xl font-light ${Number(shipment.marginMt) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                ${(Number(qty) * Number(shipment.marginMt)).toLocaleString("en-US",{maximumFractionDigits:0})}
              </p>
              <p className="text-xs text-muted-foreground">{Number(qty).toLocaleString()} MT × ${Number(shipment.marginMt).toFixed(2)}/MT</p>
            </div>
          )}
        </section>
      )}

      {/* Timelines */}
      <TimelinePanel shipmentId={detailId!} />
    </div>
  );
}
