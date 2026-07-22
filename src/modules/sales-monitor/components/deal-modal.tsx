"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSalesMonitorUIStore } from "../store/sales-monitor-ui-store";
import { useCreateDeal, useUpdateDeal, useDealDetail } from "../hooks/use-deals";

const schema = z.object({
  projectName:  z.string().min(1, "Required"),
  buyer:        z.string().min(1, "Required"),
  buyerCountry: z.string().optional(),
  segment:      z.enum(["local", "export"]),
  commodity:    z.string().optional(),
  quantity:     z.coerce.number().positive("Must be > 0"),
  pricePerMt:   z.coerce.number().positive().optional(),
  dealNumber:   z.string().optional(),
  type:         z.string().optional(),
  status:       z.enum([
    "waiting_approval","waiting_buyer","offer_submitted",
    "confirmed","in_transit","completed","cancelled","rejected",
  ]),
  specGar:      z.coerce.number().positive().optional(),
  specTs:       z.coerce.number().positive().optional(),
  specAsh:      z.coerce.number().positive().optional(),
  specTm:       z.coerce.number().positive().optional(),
  shippingTerm: z.string().optional(),
  laycanPol:    z.string().optional(),
  vesselName:   z.string().optional(),
  notes:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  "waiting_approval","waiting_buyer","offer_submitted",
  "confirmed","in_transit","completed","cancelled","rejected",
] as const;

export function DealModal() {
  const { editingId, closeModal } = useSalesMonitorUIStore();
  const isEdit = !!editingId;

  const { data: detailData } = useDealDetail(editingId ?? "");
  const detail = detailData?.data;

  const { mutate: create, isPending: creating } = useCreateDeal();
  const { mutate: update, isPending: updating } = useUpdateDeal(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { segment: "export", status: "waiting_approval" },
  });

  useEffect(() => {
    if (detail) {
      reset({
        projectName:  detail.projectName,
        buyer:        detail.buyer,
        buyerCountry: detail.buyerCountry ?? "",
        segment:      detail.segment as "local" | "export",
        commodity:    detail.commodity ?? "",
        quantity:     detail.quantity,
        pricePerMt:   detail.pricePerMt ?? undefined,
        dealNumber:   detail.dealNumber ?? "",
        type:         detail.type ?? "",
        status:       detail.status as FormValues["status"],
        specGar:      detail.specGar ?? undefined,
        specTs:       detail.specTs  ?? undefined,
        specAsh:      detail.specAsh ?? undefined,
        specTm:       detail.specTm  ?? undefined,
        shippingTerm: detail.shippingTerm ?? "",
        laycanPol:    detail.laycanPol ?? "",
        vesselName:   detail.vesselName ?? "",
        notes:        detail.notes ?? "",
      });
    }
  }, [detail, reset]);

  function onSubmit(data: FormValues) {
    if (isEdit && editingId) {
      update(data, { onSuccess: closeModal });
    } else {
      create(data, { onSuccess: closeModal });
    }
  }

  function field(
    id: keyof FormValues,
    label: string,
    type: string = "text",
    placeholder?: string,
  ) {
    return (
      <div className="field">
        <label className="field__label text-xs" htmlFor={`deal-${id}`}>{label}</label>
        <input
          id={`deal-${id}`}
          type={type}
          step={type === "number" ? "0.01" : undefined}
          className={`input ${errors[id] ? "input--invalid" : ""}`}
          placeholder={placeholder}
          aria-invalid={!!errors[id]}
          aria-describedby={errors[id] ? `deal-${id}-err` : undefined}
          {...register(id)}
        />
        {errors[id] && (
          <p id={`deal-${id}-err`} className="text-xs text-danger mt-0.5" role="alert">
            {errors[id]?.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit Deal" : "Add Deal"}
    >
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Deal" : "Add Deal"}</h2>
            <button
              type="button"
              className="button button--ghost button--neutral button--icon-only"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field("projectName",  "Project Name *", "text", "e.g. CTP-2025-001")}
              {field("buyer",        "Buyer *", "text", "Company name")}
              {field("buyerCountry", "Buyer Country")}
              {field("dealNumber",   "Deal Number")}
              {field("commodity",    "Commodity", "text", "Coal")}
              {field("type",         "Type", "text", "FOB / CIF")}
            </div>

            {/* Segment + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="deal-segment">Segment</label>
                <select id="deal-segment" className="select" {...register("segment")}>
                  <option value="export">Export</option>
                  <option value="local">Local (Domestic)</option>
                </select>
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="deal-status">Status</label>
                <select id="deal-status" className="select" {...register("status")}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Qty + Price */}
            <div className="grid grid-cols-2 gap-3">
              {field("quantity",  "Quantity (MT) *", "number", "50000")}
              {field("pricePerMt","Price /MT (USD)",  "number", "65.00")}
            </div>

            {/* Spec */}
            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Coal Spec</legend>
              {field("specGar", "GAR (kcal/kg)", "number", "5000")}
              {field("specTs",  "TS (%)",         "number", "0.5")}
              {field("specAsh", "ASH (%)",         "number", "8")}
              {field("specTm",  "TM (%)",           "number", "35")}
            </fieldset>

            {/* Logistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {field("shippingTerm", "Shipping Term", "text", "FOB Barge")}
              {field("laycanPol",    "Laycan / POL")}
              {field("vesselName",   "Vessel Name")}
            </div>

            {/* Notes */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="deal-notes">Notes</label>
              <textarea
                id="deal-notes"
                className="input"
                rows={2}
                placeholder="Additional remarks…"
                {...register("notes")}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="button button--ghost button--neutral"
                onClick={closeModal}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending
                  ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</>
                  : isEdit ? "Update Deal" : "Add Deal"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
