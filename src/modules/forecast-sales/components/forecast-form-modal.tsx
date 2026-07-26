"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { isExecutive } from "@/lib/roles";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useCreateForecast, useUpdateForecast, useForecastDetail, useSubmitForecast } from "../hooks/use-forecasts";
import { FORECAST_TEMPLATES, TEMPLATE_OPTIONS, type TemplateItem } from "@/lib/forecast-templates";

const schema = z.object({
  projectName:    z.string().min(1, "Required"),
  buyer:          z.string().min(1, "Required"),
  buyerCountry:   z.string().optional(),
  segment:        z.string().default("export"),
  templateType:   z.string().optional(),
  forecastMonth:  z.string().min(1, "Forecast Month wajib diisi"),
  commodity:      z.string().min(1, "Commodity wajib diisi"),
  priceBasis:     z.string().min(1, "Price Basis wajib diisi"),
  paymentTerm:    z.string().min(1, "Payment Term wajib diisi"),
  surveyor:       z.string().min(1, "Surveyor wajib diisi"),
  // Quantity & logistics
  quantity:       z.coerce.number().positive("Quantity wajib > 0"),
  quantityUnit:   z.string().default("MT"),
  laycanStart:    z.string().min(1, "Laycan Start wajib diisi"),
  laycanEnd:      z.string().min(1, "Laycan End wajib diisi"),
  shippingTerm:   z.string().min(1, "Shipping Term wajib diisi"),
  pol:            z.string().min(1, "POL wajib diisi"),
  pod:            z.string().optional(),
  // Pricing
  salesPriceEst:  z.coerce.number().positive("Sales Price wajib > 0"),
  buyingPriceEst: z.coerce.number().positive().optional(),
  freightEst:     z.coerce.number().positive().optional(),
  // Full coal spec per SRS 5.1
  specGar:        z.coerce.number().positive("GAR wajib > 0"),
  specNar:        z.coerce.number().positive().optional(),
  specTs:         z.coerce.number().positive().optional(),
  specAsh:        z.coerce.number().positive().optional(),
  specTm:         z.coerce.number().positive().optional(),
  specIm:         z.coerce.number().positive().optional(),
  specVm:         z.coerce.number().positive().optional(),
  specHgi:        z.coerce.number().positive().optional(),
  specSize:       z.string().optional(),
  remarks:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ForecastFormModal() {
  const { editingId, createModalOpen, closeCreateEdit } = useForecastUIStore();
  const isEdit = !!editingId;
  const { data: session } = useSession();
  const canSeePnL = session?.user?.role && isExecutive(session.user.role);

  const { data: detailData } = useForecastDetail(editingId ?? "");
  const detail = detailData?.data;

  const { mutate: create, isPending: creating } = useCreateForecast();
  const { mutate: update, isPending: updating } = useUpdateForecast(editingId ?? "");
  const { mutate: submit, isPending: submitting } = useSubmitForecast(editingId ?? "");
  const isPending = creating || updating || submitting;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { segment: "export", quantityUnit: "MT", templateType: "export_shipment" },
  });

  const templateType = watch("templateType");
  const [checklist, setChecklist] = useState<TemplateItem[]>([]);

  useEffect(() => {
    if (detail && isEdit) {
      reset({
        projectName:    detail.projectName,
        buyer:          detail.buyer,
        buyerCountry:   detail.buyerCountry ?? "",
        segment:        detail.segment ?? "export",
        templateType:   (detail as any).templateType ?? "export_shipment",
        forecastMonth:  (detail as any).forecastMonth ?? "",
        commodity:      (detail as any).commodity ?? "",
        priceBasis:     (detail as any).priceBasis ?? "",
        paymentTerm:    (detail as any).paymentTerm ?? "",
        surveyor:       (detail as any).surveyor ?? "",
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
        specNar:        (detail as any).specNar ?? undefined,
        specTs:         detail.specTs  ?? undefined,
        specAsh:        detail.specAsh ?? undefined,
        specTm:         detail.specTm  ?? undefined,
        specIm:         (detail as any).specIm  ?? undefined,
        specVm:         (detail as any).specVm  ?? undefined,
        specHgi:        (detail as any).specHgi ?? undefined,
        specSize:       (detail as any).specSize ?? "",
        remarks:        detail.remarks ?? "",
      });
      const existingChecklist = (detail as any).templateChecklist;
      if (existingChecklist) {
        try {
          setChecklist(typeof existingChecklist === "string" ? JSON.parse(existingChecklist) : existingChecklist);
        } catch {
          setChecklist(FORECAST_TEMPLATES[(detail as any).templateType ?? "export_shipment"] || []);
        }
      } else {
        setChecklist(FORECAST_TEMPLATES[(detail as any).templateType ?? "export_shipment"] || []);
      }
    }
  }, [detail, isEdit, reset]);

  useEffect(() => {
    if (!isEdit && templateType) {
      setChecklist(FORECAST_TEMPLATES[templateType] || []);
    }
  }, [templateType, isEdit]);

  function onSubmit(data: FormValues) {
    const payload = { ...data, templateChecklist: checklist };
    if (isEdit && editingId) {
      update(payload, { onSuccess: closeCreateEdit });
    } else {
      create(payload, { onSuccess: closeCreateEdit });
    }
  }

  function onSaveAndSubmit(data: FormValues) {
    const payload = { ...data, templateChecklist: checklist };
    create(payload, {
      onSuccess: (res) => {
        const id = (res as { data: { id: string } }).data.id;
        fetch(`/api/forecasts/${id}/submit`, { method: "POST" }).finally(closeCreateEdit);
      },
    });
  }

  const open = createModalOpen || isEdit;
  if (!open) return null;

  async function submitExisting(data: FormValues) {
    if (!editingId) return;
    update({ ...data, templateChecklist: checklist }, {
      onSuccess: () => submit(undefined, { onSuccess: closeCreateEdit }),
    });
  }

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
              <div className="field">
                <label className="field__label text-xs" htmlFor="fc-templateType">Document Template</label>
                <select id="fc-templateType" className="select" {...register("templateType")}>
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <F id="forecastMonth" label="Forecast Month *" type="month" placeholder="2026-08" />
              <F id="commodity"     label="Commodity *" placeholder="Coal" />
              <F id="priceBasis"    label="Price Basis *" placeholder="ICI 1 / HBA / Fixed" />
              <F id="paymentTerm"   label="Payment Term *" placeholder="LC at sight / 30 days" />
              <F id="surveyor"      label="Surveyor *" placeholder="SGS / Intertek" />
              <F id="quantity"      label="Quantity (MT) *"  type="number" placeholder="50000" />
              <F id="shippingTerm"  label="Shipping Term *"  placeholder="FOB Barge" />
              <F id="pol"           label="POL *"            placeholder="Taboneo" />
              <F id="pod"           label="POD"            placeholder="Shanghai" />
              <F id="laycanStart"   label="Laycan Start"   type="date" />
              <F id="laycanEnd"     label="Laycan End"     type="date" />
            </div>

            {checklist.length > 0 && (
              <fieldset className="border border-border rounded-lg p-4">
                <legend className="px-1 text-xs font-medium text-muted-foreground">Document Checklist</legend>
                <div className="space-y-2 mt-2">
                  {checklist.map((item, idx) => (
                    <label key={item.code} className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="checkbox mt-0.5"
                        checked={item.done}
                        onChange={(e) => {
                          const updated = [...checklist];
                          updated[idx] = { ...item, done: e.target.checked };
                          setChecklist(updated);
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground ml-2">({item.owner})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Coal Spec (Full per SRS)</legend>
              <F id="specGar"  label="GAR (kcal/kg) *" type="number" placeholder="5000" />
              <F id="specNar"  label="NAR (kcal/kg)" type="number" placeholder="4800" />
              <F id="specTs"   label="TS (%)"        type="number" placeholder="0.5" />
              <F id="specAsh"  label="ASH (%)"       type="number" placeholder="8" />
              <F id="specTm"   label="TM (%)"        type="number" placeholder="35" />
              <F id="specIm"   label="IM (%)"        type="number" placeholder="30" />
              <F id="specVm"   label="VM (%)"        type="number" placeholder="40" />
              <F id="specHgi"  label="HGI"           type="number" placeholder="50" />
              <F id="specSize" label="Size"          placeholder="0-50mm" />
            </fieldset>

            {canSeePnL && (
              <fieldset className="border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <legend className="px-1 text-xs font-medium text-muted-foreground">Estimated P&amp;L (Executive Only)</legend>
                <F id="salesPriceEst"  label="Sales Price Est. (USD/MT) *" type="number" placeholder="68.00" />
                <F id="buyingPriceEst" label="Buying Price Est."         type="number" placeholder="48.00" />
                <F id="freightEst"     label="Freight Est."              type="number" placeholder="8.00" />
              </fieldset>
            )}

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
                  onClick={handleSubmit(submitExisting)}>
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
