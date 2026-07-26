"use client";

import { useState } from "react";
import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentTimelines, useUpdateTimelines } from "../../hooks/use-shipments";

const POL_FIELDS = [
  { key: "arrivePol",       label: "Arrive POL" },
  { key: "norPol",          label: "NOR POL" },
  { key: "berthing",        label: "Berthing" },
  { key: "commenceLoading", label: "Commence Loading" },
  { key: "completeLoading", label: "Complete Loading" },
  { key: "blDate",          label: "BL Date" },
  { key: "peb",             label: "PEB" },
  { key: "lhv",             label: "LHV" },
] as const;

const POD_FIELDS = [
  { key: "etaPod",            label: "ETA POD" },
  { key: "arrivePod",         label: "Arrive POD" },
  { key: "norPod",            label: "NOR POD" },
  { key: "inPosition",        label: "In Position" },
  { key: "dischargeStart",    label: "Discharge Start" },
  { key: "dischargeComplete", label: "Discharge Complete" },
  { key: "factoryDate",       label: "Factory Date" },
] as const;

export function TabTimeline() {
  const { detailId } = useShipmentUIStore();
  const { data, isLoading } = useShipmentTimelines(detailId ?? "");
  const { mutate: update, isPending } = useUpdateTimelines(detailId ?? "");
  const [activeType, setActiveType] = useState<"pol"|"pod">("pol");

  const current = activeType === "pol" ? data?.data?.pol : data?.data?.pod;
  const fields = activeType === "pol" ? POL_FIELDS : POD_FIELDS;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-eyebrow">Shipment Timeline</p>
        <div className="flex gap-1">
          {(["pol", "pod"] as const).map((t) => (
            <button key={t} type="button"
              className={`button button--sm ${activeType === t ? "button--primary" : "button--ghost button--neutral"}`}
              onClick={() => setActiveType(t)} aria-pressed={activeType === t}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="h-40 animate-pulse bg-muted rounded" /> : (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(({ key, label }) => (
            <div key={key} className="field">
              <label className="field__label text-xs" htmlFor={`tl-${key}`}>{label}</label>
              <input id={`tl-${key}`} type="datetime-local" className="input"
                defaultValue={current ? (current as unknown as Record<string, string | null>)[key]?.slice(0,16) ?? "" : ""}
                disabled={isPending}
                onBlur={(e) => update({ type: activeType, [key]: e.target.value || null })}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
