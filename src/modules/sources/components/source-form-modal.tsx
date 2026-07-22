"use client";

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSourcesUIStore } from "../store/sources-ui-store";
import { useCreateSource, useUpdateSource, useSourceDetail } from "../hooks/use-sources";

const stockLocationSchema = z.object({
  location:  z.string().min(1, "Required"),
  quantity:  z.coerce.number().min(0),
  condition: z.string().optional(),
});

const schema = z.object({
  name:                  z.string().min(1, "Required"),
  region:                z.string().optional(),
  calorieRange:          z.string().optional(),
  specGar:               z.coerce.number().positive().optional(),
  specTs:                z.coerce.number().positive().optional(),
  specAsh:               z.coerce.number().positive().optional(),
  specTm:                z.coerce.number().positive().optional(),
  specIm:                z.coerce.number().positive().optional(),
  specFc:                z.coerce.number().positive().optional(),
  specAdb:               z.coerce.number().positive().optional(),
  specNar:               z.coerce.number().positive().optional(),
  stockAvailable:        z.coerce.number().min(0).optional(),
  minStockAlert:         z.coerce.number().min(0).optional(),
  stockLocations:        z.array(stockLocationSchema).optional(),
  fobBargeOnly:          z.boolean().default(false),
  requiresTransshipment: z.boolean().default(false),
  priceLinkedIndex:      z.string().optional(),
  fobBargePriceUsd:      z.coerce.number().positive().optional(),
  fobBargePriceIdr:      z.coerce.number().positive().optional(),
  jettyPort:             z.string().optional(),
  anchorage:             z.string().optional(),
  kycStatus:             z.enum(["not_started","in_progress","completed"]).default("not_started"),
  psiStatus:             z.enum(["not_started","in_progress","completed"]).default("not_started"),
  iupNumber:             z.string().optional(),
  contractType:          z.string().optional(),
  contactPerson:         z.string().optional(),
  phone:                 z.string().optional(),
  email:                 z.string().email().optional().or(z.literal("")),
  notes:                 z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SourceFormModal() {
  const { editingId, closeModal } = useSourcesUIStore();
  const isEdit = !!editingId;

  const { data: detailData } = useSourceDetail(editingId ?? "");
  const detail = detailData?.data;

  const { mutate: create, isPending: creating } = useCreateSource();
  const { mutate: update, isPending: updating } = useUpdateSource(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fobBargeOnly: false, requiresTransshipment: false, kycStatus: "not_started", psiStatus: "not_started", stockLocations: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "stockLocations" });

  const stockLocations = watch("stockLocations") ?? [];
  const totalStock = stockLocations.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

  useEffect(() => {
    if (detail && isEdit) {
      reset({
        name: detail.name, region: detail.region ?? "", calorieRange: detail.calorieRange ?? "",
        specGar: detail.specGar ?? undefined, specTs: detail.specTs ?? undefined,
        specAsh: detail.specAsh ?? undefined, specTm: detail.specTm ?? undefined,
        specIm: detail.specIm ?? undefined, specFc: detail.specFc ?? undefined,
        specAdb: detail.specAdb ?? undefined, specNar: detail.specNar ?? undefined,
        stockAvailable: detail.stockAvailable ?? undefined, minStockAlert: detail.minStockAlert ?? undefined,
        stockLocations: (detail.stockLocations as FormValues["stockLocations"]) ?? [],
        fobBargeOnly: detail.fobBargeOnly, requiresTransshipment: detail.requiresTransshipment,
        priceLinkedIndex: detail.priceLinkedIndex ?? "", fobBargePriceUsd: detail.fobBargePriceUsd ?? undefined,
        fobBargePriceIdr: detail.fobBargePriceIdr ?? undefined,
        jettyPort: detail.jettyPort ?? "", anchorage: detail.anchorage ?? "",
        kycStatus: detail.kycStatus as FormValues["kycStatus"], psiStatus: detail.psiStatus as FormValues["psiStatus"],
        iupNumber: detail.iupNumber ?? "", contractType: detail.contractType ?? "",
        contactPerson: detail.contactPerson ?? "", phone: detail.phone ?? "", email: detail.email ?? "",
        notes: detail.notes ?? "",
      });
    }
  }, [detail, isEdit, reset]);

  const onSubmit = useCallback((data: FormValues) => {
    const action = isEdit && editingId ? update : create;
    (action as typeof create)(data, { onSuccess: closeModal });
  }, [isEdit, editingId, create, update, closeModal]);

  const F = ({ id, label, type = "text", ph }: { id: string; label: string; type?: string; ph?: string }) => {
    const err = (errors as Record<string, { message?: string }>)[id];
    return (
      <div className="field">
        <label className="field__label text-xs" htmlFor={`src-${id}`}>{label}</label>
        <input id={`src-${id}`} type={type} step={type === "number" ? "0.01" : undefined}
          className={`input ${err ? "input--invalid" : ""}`}
          placeholder={ph} aria-invalid={!!err}
          {...register(id as keyof FormValues)} />
        {err && <p className="text-xs text-danger mt-0.5" role="alert">{err.message}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Source" : "Add Source"}>
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Source" : "Add Source"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeModal} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Basic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <F id="name"         label="Supplier Name *" ph="PT. Sumber Batubara" />
              <F id="region"       label="Region"          ph="Kalimantan Timur" />
              <F id="calorieRange" label="Calorie Range"   ph="4200–5000 GAR" />
            </div>

            {/* Coal spec */}
            <fieldset className="border border-border rounded-lg p-4">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Coal Specification</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <F id="specGar" label="GAR (kcal/kg)" type="number" ph="5000" />
                <F id="specNar" label="NAR (kcal/kg)" type="number" ph="4750" />
                <F id="specTs"  label="TS (%)"         type="number" ph="0.5" />
                <F id="specAsh" label="ASH (%)"         type="number" ph="8" />
                <F id="specTm"  label="TM (%)"          type="number" ph="35" />
                <F id="specIm"  label="IM (%)"          type="number" ph="12" />
                <F id="specFc"  label="FC (%)"          type="number" ph="40" />
                <F id="specAdb" label="ADB (kcal/kg)"   type="number" ph="5200" />
              </div>
            </fieldset>

            {/* Stock */}
            <fieldset className="border border-border rounded-lg p-4">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Stock</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <F id="stockAvailable" label="Total Stock (MT)" type="number" ph="50000" />
                <F id="minStockAlert"  label="Alert Threshold (MT)" type="number" ph="5000" />
              </div>

              {/* Stock locations */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Stock Locations {fields.length > 0 && `· Total: ${totalStock.toLocaleString()} MT`}
                  </p>
                  <button type="button" className="button button--xs button--ghost button--primary"
                    onClick={() => append({ location: "", quantity: 0, condition: "" })}>
                    + Add Location
                  </button>
                </div>
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 mb-2 items-end">
                    <div className="field flex-1">
                      {idx === 0 && <label className="field__label text-xs">Location</label>}
                      <input type="text" className="input" placeholder="Jetty / gudang"
                        {...register(`stockLocations.${idx}.location`)} />
                    </div>
                    <div className="field w-28">
                      {idx === 0 && <label className="field__label text-xs">Qty (MT)</label>}
                      <input type="number" className="input" placeholder="0"
                        {...register(`stockLocations.${idx}.quantity`)} />
                    </div>
                    <div className="field flex-1">
                      {idx === 0 && <label className="field__label text-xs">Condition</label>}
                      <input type="text" className="input" placeholder="Good / Fair"
                        {...register(`stockLocations.${idx}.condition`)} />
                    </div>
                    <button type="button" className="button button--xs button--ghost button--danger mb-0.5"
                      onClick={() => remove(idx)} aria-label="Remove location">✕</button>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Pricing & Logistics */}
            <fieldset className="border border-border rounded-lg p-4">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Pricing & Logistics</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                <F id="fobBargePriceUsd" label="FOB Barge (USD)" type="number" ph="52.00" />
                <F id="fobBargePriceIdr" label="FOB Barge (IDR)" type="number" ph="800000" />
                <F id="priceLinkedIndex" label="Linked Index" ph="ICI 3" />
                <F id="jettyPort"        label="Jetty / Port"  ph="Taboneo" />
                <F id="anchorage"        label="Anchorage"     ph="BTC Anchorage" />
              </div>
              <div className="flex gap-4 mt-3">
                <label className="field__item">
                  <input type="checkbox" className="checkbox" {...register("fobBargeOnly")} />
                  <span className="field__label font-normal text-sm">FOB Barge Only</span>
                </label>
                <label className="field__item">
                  <input type="checkbox" className="checkbox" {...register("requiresTransshipment")} />
                  <span className="field__label font-normal text-sm">Requires Transshipment</span>
                </label>
              </div>
            </fieldset>

            {/* Compliance */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="src-kycStatus">KYC Status</label>
                <select id="src-kycStatus" className="select" {...register("kycStatus")}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="src-psiStatus">PSI Status</label>
                <select id="src-psiStatus" className="select" {...register("psiStatus")}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <F id="iupNumber"    label="IUP Number"   ph="IUP-KT-001" />
              <F id="contractType" label="Contract Type" ph="COA / Spot" />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <F id="contactPerson" label="Contact Person" ph="Budi Santoso" />
              <F id="phone"         label="Phone"          ph="+62-8xx" />
              <F id="email"         label="Email"          ph="contact@supplier.com" />
            </div>

            {/* Notes */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="src-notes">Notes</label>
              <textarea id="src-notes" className="input" rows={2}
                placeholder="Additional notes…" {...register("notes")} />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : isEdit ? "Update Source" : "Add Source"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
