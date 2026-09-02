"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useConvertToShipment, useForecastDetail } from "../hooks/use-forecasts";

const schema = z.object({
  shipmentNumber: z.string().min(1, "Required — must be unique"),
  vesselName:     z.string().optional(),
  bargeName:      z.string().optional(),
  source:         z.string().optional(),
  supplier:       z.string().optional(),
  pic:            z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ConvertShipmentModal() {
  const { convertModalId, closeConvert } = useForecastUIStore();
  const router = useRouter();
  const { data } = useForecastDetail(convertModalId ?? "");
  const project  = data?.data;
  const { mutate, isPending, isError, error } = useConvertToShipment(convertModalId ?? "");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!convertModalId) return null;

  function onSubmit(values: FormValues) {
    mutate(values, { onSuccess: (result) => { closeConvert(); const shipmentId = (result as { data?: { shipment?: { id?: string } } })?.data?.shipment?.id; if (shipmentId) router.push(`/shipment-monitor/${shipmentId}`); } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label="Convert to Shipment">
      <div className="card w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
          <h2 className="font-semibold">Initialize Shipment from Approved Forecast</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeConvert} aria-label="Close">✕</button>
          </div>

          {project && <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-4"><Summary label="Forecast" value={project.projectName} /><Summary label="Offer / FCO" value={`${project.fcoNumber ?? "Not generated"}${project.fcoVersion ? ` v${project.fcoVersion}` : ""}`} /><Summary label="Buyer" value={project.buyer} /><Summary label="Quantity" value={project.quantity ? `${Number(project.quantity).toLocaleString()} ${project.quantityUnit}` : "Not available"} /><Summary label="Laycan" value={`${project.laycanStart?.slice(0, 10) ?? "—"} – ${project.laycanEnd?.slice(0, 10) ?? "—"}`} /><Summary label="POL / POD" value={`${project.pol ?? "—"} / ${project.pod ?? "—"}`} /><Summary label="Shipping" value={project.shippingTerm ?? "Not available"} /><Summary label="Buyer feedback" value={project.buyerFeedbackStatus ?? "Not available"} /></div>}

          {isError && (
            <p className="text-sm text-danger" role="alert">
              {(error as Error)?.message ?? "Failed to convert"}
            </p>
          )}

          <div className="rounded border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">All approved Forecast/FCO data is inherited automatically and cannot be changed here. Add source, supplier, and barge allocation later in the Shipment Workspace.</div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <fieldset className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
              <legend className="px-1 text-xs font-semibold">Operation Setup</legend>
              <div className="field sm:col-span-2">
                <label className="field__label text-xs" htmlFor="conv-num">Shipment Number *</label>
                <input id="conv-num" type="text" className={`input ${errors.shipmentNumber ? "input--invalid" : ""}`}
                  placeholder="SHP-2025-001" aria-invalid={!!errors.shipmentNumber} {...register("shipmentNumber")} />
                {errors.shipmentNumber && <p className="text-xs text-danger mt-0.5" role="alert">{errors.shipmentNumber.message}</p>}
              </div>
              {[
                { id: "vesselName" as const, label: "Mother Vessel", ph: "MV Harmony" },
                { id: "pic" as const, label: "Operational PIC", ph: "Assigned person" },
              ].map(({ id, label, ph }) => (
                <div key={id} className="field">
                  <label className="field__label text-xs" htmlFor={`conv-${id}`}>{label}</label>
                  <input id={`conv-${id}`} type="text" className="input"
                    placeholder={ph} {...register(id)} />
                </div>
              ))}
            </fieldset>

            <p className="text-xs text-muted-foreground">After initialization, manage Supplier Side allocations through the MV Workspace.</p>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeConvert} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary" disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Initializing…</> : "Initialize Shipment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 truncate font-medium" title={value}>{value}</p></div>;
}
