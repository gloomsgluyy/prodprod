"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useCreateForecast, useUpdateForecast, useForecastDetail, useSubmitForecast } from "../hooks/use-forecasts";

const schema = z.object({
  projectName:    z.string().min(1, "Required"),
  buyer:          z.string().min(1, "Required"),
  buyerCountry:   z.string().optional(),
  segment:        z.string().default("export"),
  quantity:       z.coerce.number().positive("Must be > 0").optional(),
  quantityUnit:   z.string().default("MT"),
  laycanStart:    z.string().optional(),
  laycanEnd:      z.string().optional(),
  shippingTerm:   z.string().optional(),
  pol:            z.string().optional(),
  pod:            z.string().optional(),
  salesPriceEst:  z.coerce.number().positive().optional(),
  buyingPriceEst: z.coerce.number().positive().optional(),
  freightEst:     z.coerce.number().positive().optional(),
  specGar:        z.coerce.number().positive().optional(),
  specTs:         z.coerce.number().positive().optional(),
  specAsh:        z.coerce.number().positive().optional(),
  specTm:         z.coerce.number().positive().optional(),
  remarks:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ForecastFormModal() {
  const { editingId, createModalOpen, closeCreateEdit } = useForecastUIStore();
  const isEdit = !!editingId;

  const { data: detailData } = useForecastDetail(editingId ?? "");
  const detail = detailData?.data;

  const { mutate: create, isPending: creating } = useCreateForecast();
  const { mutate: update, isPending: updating } = useUpdateForecast(editingId ?? "");
  const { mutate: submit, isPending: submitting } = useSubmitForecast(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { segment: "export", quantityUnit: "MT" },
  });

  useEffect(() => {
    if (detail && isEdit) {
      reset({
        projectName:    detail.projectName,
        buyer:          detail.buyer,
        buyerCountry:   detail.buyerCountry ?? "",
        segment:        detail.segment ?? "export",
        quantity:       detail.quantity ?? undefined,
        laycanStart:    detail.laycanStart?.split("T")[0] ?? "",
        laycanEnd:      detail.laycanEnd?.split("T")[0]   ?? "",
        shippingTerm:   detail.shippingTerm  ?? "",
        pol:            detail.pol  ?? "",
        pod:            detail.pod  ?? "",
        salesPriceEst:  detail.salesPriceEst  ?? undefined,
        buyingPriceEst: detail.buyingPriceEst ?? undefined,
        freightEst:     detail.freightEst     ?? undefined,
        specGar:        detail.specGar ?? undefined,
        specTs:         detail.specTs  ?? undefined,
        specAsh:        detail.specAsh ?? undefined,
        specTm:         detail.specTm  ?? undefined,
        remarks:        detail.remarks ?? "",
      });
    }
  }, [detail, isEdit, reset]);

  function onSubmit(data: FormValues) {
    if (isEdit && editingId) {
      update(data, { onSuccess: closeCreateEdit });
    } else {
      create(data, { onSuccess: closeCreateEdit });
    }
  }

  function onSaveAndSubmit(data: FormValues) {
    create(data, {
      onSuccess: (res) => {
        const id = (res as { data: { id: string } }).data.id;
        // Re-use the submit mutation scoped to new ID inline
        fetch(`/api/forecasts/${id}/submit`, { method: "POST" }).finally(closeCreateEdit);
      },
    });
  }

  const open = createModalOpen || isEdit;
  if (!open) return null;

  const F = ({ id, label, type = "text", placeholder }: {
    id: keyof FormValues; label: string; type?: string; placeholder?: string;
  }) => (
    <div className="field">
      <label className="field__label text-xs" htmlFor={`fc-${id}`}>{label}</label>
      <input id={`fc-${id}`} type={type} step={type === "number" ? "0.01" : undefined}
        className={`input ${errors[id] ? "input--invalid" : ""}`}
        placeholder={placeholder}
        aria-invalid={!!errors[id]}
        {...register(id)} />
      {errors[id] && <p className="text-xs text-danger mt-0.5" role="alert">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Project" : "New Forecast Project"}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Project" : "New Forecast Project"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeCreateEdit} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F id="projectName"  label="Project Name *" placeholder="CTP-2025-001" />
              <F id="buyer"        label="Buyer *"         placeholder="Company name" />
              <F id="buyerCountry" label="Buyer Country" />
              <div className="field">
                <label className="field__label text-xs" htmlFor="fc-segment">Segment</label>
                <select id="fc-segment" className="select" {...register("segment")}>
                  <option value="export">Export</option>
                  <option value="local">Local (Domestic)</option>
                </select>
              </div>
              <F id="quantity"     label="Quantity (MT)"  type="number" placeholder="50000" />
              <F id="shippingTerm" label="Shipping Term"  placeholder="FOB Barge" />
              <F id="pol"          label="POL"            placeholder="Taboneo" />
              <F id="pod"          label="POD"            placeholder="Shanghai" />
              <F id="laycanStart"  label="Laycan Start"   type="date" />
              <F id="laycanEnd"    label="Laycan End"     type="date" />
            </div>

            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Coal Spec</legend>
              <F id="specGar" label="GAR (kcal/kg)" type="number" placeholder="5000" />
              <F id="specTs"  label="TS (%)"         type="number" placeholder="0.5" />
              <F id="specAsh" label="ASH (%)"         type="number" placeholder="8" />
              <F id="specTm"  label="TM (%)"          type="number" placeholder="35" />
            </fieldset>

            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Estimated P&amp;L (Confidential)</legend>
              <F id="salesPriceEst"  label="Sales Price Est. (USD/MT)" type="number" placeholder="68.00" />
              <F id="buyingPriceEst" label="Buying Price Est."         type="number" placeholder="48.00" />
              <F id="freightEst"     label="Freight Est."              type="number" placeholder="8.00" />
            </fieldset>

            <div className="field">
              <label className="field__label text-xs" htmlFor="fc-remarks">Remarks</label>
              <textarea id="fc-remarks" className="input" rows={2}
                placeholder="Additional notes…" {...register("remarks")} />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeCreateEdit} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--ghost button--primary" disabled={isPending || submitting} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Save Draft"}
              </button>
              {!isEdit && (
                <button type="button" className="button button--primary" disabled={isPending}
                  onClick={handleSubmit(onSaveAndSubmit)}>
                  Save & Submit
                </button>
              )}
              {isEdit && detail && ["draft","revision"].includes(detail.status) && (
                <button type="button" className="button button--primary" disabled={submitting}
                  aria-busy={submitting}
                  onClick={() => submit(undefined, { onSuccess: closeCreateEdit })}>
                  {submitting ? <><span className="spinner spinner--sm" aria-hidden="true" /> Submitting…</> : "Submit for Approval"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
