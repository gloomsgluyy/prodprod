"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  const { data } = useForecastDetail(convertModalId ?? "");
  const project  = data?.data;
  const { mutate, isPending, isError, error } = useConvertToShipment(convertModalId ?? "");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!convertModalId) return null;

  function onSubmit(values: FormValues) {
    mutate(values, { onSuccess: closeConvert });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label="Convert to Shipment">
      <div className="card w-full max-w-lg">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Convert to Shipment</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeConvert} aria-label="Close">✕</button>
          </div>

          {project && (
            <div className="p-3 rounded-lg bg-surface border border-border text-sm">
              <p className="font-medium">{project.projectName}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {project.buyer} · {project.quantity ? `${Number(project.quantity).toLocaleString()} MT` : "TBD"}
              </p>
            </div>
          )}

          {isError && (
            <p className="text-sm text-danger" role="alert">
              {(error as Error)?.message ?? "Failed to convert"}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="conv-num">Shipment Number *</label>
              <input id="conv-num" type="text" className={`input ${errors.shipmentNumber ? "input--invalid" : ""}`}
                placeholder="SHP-2025-001" aria-invalid={!!errors.shipmentNumber} {...register("shipmentNumber")} />
              {errors.shipmentNumber && <p className="text-xs text-danger mt-0.5" role="alert">{errors.shipmentNumber.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "vesselName" as const, label: "Vessel Name",  ph: "MV Harmony" },
                { id: "bargeName"  as const, label: "Barge Name",   ph: "TB Jaya" },
                { id: "source"     as const, label: "Source / IUP", ph: "Source name" },
                { id: "supplier"   as const, label: "Supplier",     ph: "Supplier name" },
              ].map(({ id, label, ph }) => (
                <div key={id} className="field">
                  <label className="field__label text-xs" htmlFor={`conv-${id}`}>{label}</label>
                  <input id={`conv-${id}`} type="text" className="input"
                    placeholder={ph} {...register(id)} />
                </div>
              ))}
            </div>

            <div className="field">
              <label className="field__label text-xs" htmlFor="conv-pic">PIC</label>
              <input id="conv-pic" type="text" className="input" placeholder="Assigned person" {...register("pic")} />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeConvert} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary" disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Converting…</> : "Create Shipment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
