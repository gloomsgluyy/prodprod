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

const optionalPositiveNumber = z.preprocess(
  (value) => value === "" || value == null ? undefined : Number(value),
  z.number().positive().optional(),
);

const schema = z.object({
  entity:         z.string().optional(),
  offerDate:      z.string().optional(),
  projectName:    z.string().optional(),
  buyer:          z.string().optional(),
  buyerCountry:   z.string().optional(),
  attention:      z.string().optional(),
  buyerCode:      z.string().optional(),
  segment:        z.string().default("export"),
  templateType:   z.string().optional(),
  forecastMonth:  z.string().optional(),
  commodity:      z.string().optional(),
  priceBasis:     z.string().optional(),
  paymentTerm:    z.string().optional(),
  surveyor:       z.string().optional(),
  // Quantity & logistics
  quantity:       optionalPositiveNumber,
  quantityUnit:   z.string().default("MT"),
  tolerance:      z.string().optional(),
  laycanStart:    z.string().optional(),
  laycanEnd:      z.string().optional(),
  shippingTerm:   z.string().optional(),
  pol:            z.string().optional(),
  pod:            z.string().optional(),
  // Pricing
  salesPriceEst:  optionalPositiveNumber,
  buyingPriceEst: optionalPositiveNumber,
  freightEst:     optionalPositiveNumber,
  basePriceMethod: z.string().optional(),
  formula:         z.string().optional(),
  averagePeriod:  z.string().optional(),
  applyPriceAdjustment: z.boolean().optional(),
  adjustmentFormula: z.string().optional(),
  rejectionGar:   optionalPositiveNumber,
  specStandard:   z.string().optional(),
  specificationSource: z.string().optional(),
  validityDate:   z.string().optional(),
  validityTime:   z.string().optional(),
  timezone:       z.string().optional(),
  subjectCargoUnsold: z.boolean().optional(),
  // Full coal spec per SRS 5.1
  specGar:        optionalPositiveNumber,
  specNar:        optionalPositiveNumber,
  specTs:         optionalPositiveNumber,
  specAsh:        optionalPositiveNumber,
  specTm:         optionalPositiveNumber,
  specIm:         optionalPositiveNumber,
  specVm:         optionalPositiveNumber,
  specHgi:        optionalPositiveNumber,
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
  const [customFields, setCustomFields] = useState({
    entity: "MSE", offerDate: "", attention: "", buyerCode: "", tolerance: "±10%",
    basePriceMethod: "formula", formula: "", averagePeriod: "latest", applyPriceAdjustment: false,
    adjustmentFormula: "", rejectionGar: 0, specStandard: "ASTM", specificationSource: "Source / Existing",
    validityDate: "", validityTime: "", timezone: "WIB (UTC+7)", subjectCargoUnsold: false,
  });

  const setCustomField = (field: keyof typeof customFields, value: string | boolean | number) =>
    setCustomFields((current) => ({ ...current, [field]: value }));

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
    const payload = { ...data, ...customFields, quantityTolerance: customFields.tolerance, validityDate: customFields.validityDate || undefined, subjectToCargoUnsold: customFields.subjectCargoUnsold, templateChecklist: checklist };
    if (isEdit && editingId) {
      update(payload, { onSuccess: closeCreateEdit });
    } else {
      create(payload, { onSuccess: closeCreateEdit });
    }
  }

  function onSaveAndSubmit(data: FormValues) {
    const payload = { ...data, ...customFields, quantityTolerance: customFields.tolerance, validityDate: customFields.validityDate || undefined, subjectToCargoUnsold: customFields.subjectCargoUnsold, templateChecklist: checklist };
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
    update({ ...data, ...customFields, quantityTolerance: customFields.tolerance, validityDate: customFields.validityDate || undefined, subjectToCargoUnsold: customFields.subjectCargoUnsold, templateChecklist: checklist }, {
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
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Sales Forecast" : "New Sales Forecast"}>
      <div className="card w-full max-w-6xl max-h-[92vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Sales Forecast" : "New Sales Forecast"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeCreateEdit} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div className="space-y-5">
              <FormSection number="1" title="Entity & Market">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="field"><label className="field__label text-xs">Entity</label><select className="select" value={customFields.entity} onChange={(e) => setCustomField("entity", e.target.value)}><option>MSE</option><option>CMD</option></select></div>
                  <div className="field"><label className="field__label text-xs">Market Section</label><select className="select" {...register("segment")}><option value="export">Export</option><option value="local">Domestic</option></select></div>
                  <div className="field"><label className="field__label text-xs">Offer Date</label><input className="input" type="date" value={customFields.offerDate} onChange={(e) => setCustomField("offerDate", e.target.value)} /></div>
                  <div className="field"><label className="field__label text-xs">Offer No</label><input className="input bg-muted" value="Auto-generated" readOnly /></div>
                  <F id="projectName" label="Offer Name" placeholder="Sales forecast name" />
                </div>
              </FormSection>
              <FormSection number="2" title="Buyer Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <F id="buyer" label="Buyer" placeholder="Company name" />
                  <button type="button" className="button button--ghost button--primary self-end">+ Add New Buyer</button>
                  <F id="attention" label="Attention / Contact" placeholder="Contact person" />
                  <F id="buyerCountry" label="Buyer Country" />
                  <div className="field"><label className="field__label text-xs">Buyer Code / Abbr.</label><input className="input" value={customFields.buyerCode} onChange={(e) => setCustomField("buyerCode", e.target.value)} placeholder="GT" /></div>
                </div>
              </FormSection>
              <FormSection number="3" title="Commodity & Quantity">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="field"><label className="field__label text-xs">Commodity</label><div className="flex gap-2"><select className="select min-w-0 flex-1" {...register("commodity")}><option value="Coal">Coal</option><option value="Custom">Custom</option></select><button type="button" className="button button--sm button--ghost button--primary">+ Custom</button></div></div>
                  <F id="quantity" label="Quantity (MT)" type="number" placeholder="50000" />
                  <div className="field"><label className="field__label text-xs">Tolerance</label><input className="input" value={customFields.tolerance} onChange={(e) => setCustomField("tolerance", e.target.value)} /></div>
                </div>
              </FormSection>
              <FormSection number="4" title="Laycan & Port">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><F id="laycanStart" label="Delivery Period From" type="date" /><F id="laycanEnd" label="Delivery Period To" type="date" /><F id="pol" label="Loading Port" placeholder="Bunati Anchorage" /><F id="pod" label="Discharge Port" placeholder="Destination" /></div>
              </FormSection>
              <FormSection number="5" title="Base Price">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><div className="field"><label className="field__label text-xs">Base Price Method</label><select className="select" value={customFields.basePriceMethod} onChange={(e) => setCustomField("basePriceMethod", e.target.value)}><option value="formula">Formula / Wording</option><option value="calculator">From Calculator History</option><option value="fixed">Fixed Final Price</option></select></div><div className="field"><label className="field__label text-xs">Formula / Reference</label><input className="input" value={customFields.formula} onChange={(e) => setCustomField("formula", e.target.value)} placeholder="ICI 3 + adjustment" /></div><div className="field"><label className="field__label text-xs">Average Period</label><select className="select" value={customFields.averagePeriod} onChange={(e) => setCustomField("averagePeriod", e.target.value)}><option value="latest">Latest</option><option value="1w">1 Week</option><option value="2w">2 Weeks</option></select></div><F id="salesPriceEst" label="Premium / Discount (USD/MT)" type="number" /></div>
              </FormSection>
              <FormSection number="6" title="Price Adjustment">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><label className="flex items-center gap-2 text-sm self-end pb-2"><input type="checkbox" className="checkbox" checked={customFields.applyPriceAdjustment} onChange={(e) => setCustomField("applyPriceAdjustment", e.target.checked)} /> Apply Price Adjustment</label><div className="field"><label className="field__label text-xs">Adjustment Formula</label><input className="input" value={customFields.adjustmentFormula} onChange={(e) => setCustomField("adjustmentFormula", e.target.value)} placeholder="Select formula" /></div><F id="specGar" label="Basis GAR" type="number" /><div className="field"><label className="field__label text-xs">Rejection GAR</label><input className="input" type="number" value={customFields.rejectionGar} onChange={(e) => setCustomField("rejectionGar", e.target.value)} /></div></div>
              </FormSection>
              <FormSection number="7" title="Shipping Terms"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><F id="shippingTerm" label="Shipping Terms" placeholder="FOB Barge" /><button type="button" className="button button--ghost button--primary self-end justify-self-start">Preview Clause</button></div></FormSection>
              <FormSection number="8" title="Independent Surveyors"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><F id="surveyor" label="Surveyor Selection" placeholder="SGS / Intertek" /><p className="text-xs text-muted-foreground self-end pb-2">Multi-select surveyors supported by the workflow.</p></div></FormSection>
              <FormSection number="9" title="Document Template"><div className="field max-w-md"><label className="field__label text-xs" htmlFor="fc-templateType">Document Template</label><select id="fc-templateType" className="select" {...register("templateType")}>{TEMPLATE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div></FormSection>
              <FormSection number="10" title="Coal Spec Standard"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><div className="field"><label className="field__label text-xs">Spec Standard</label><select className="select" value={customFields.specStandard} onChange={(e) => setCustomField("specStandard", e.target.value)}><option>ASTM</option><option>ISO</option></select></div><div className="field"><label className="field__label text-xs">Specification Source</label><select className="select" value={customFields.specificationSource} onChange={(e) => setCustomField("specificationSource", e.target.value)}><option>Source / Existing</option><option>Custom</option></select></div><button type="button" className="button button--ghost button--primary self-end">View Spec</button><button type="button" className="button button--ghost button--neutral self-end">Use Custom Spec</button></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3"><F id="specNar" label="NAR" type="number" /><F id="specTs" label="TS" type="number" /><F id="specAsh" label="ASH" type="number" /><F id="specTm" label="TM" type="number" /></div></FormSection>
              <FormSection number="11" title="Other Terms"><textarea id="fc-remarks" className="input min-h-24" placeholder="As per mutually agreed&#10;Must declare end user&#10;Not to be sold to ZIMI/TOP Mineral" {...register("remarks")} /></FormSection>
              <FormSection number="12" title="Validity"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><div className="field"><label className="field__label text-xs">Validity Date</label><input className="input" type="date" value={customFields.validityDate} onChange={(e) => setCustomField("validityDate", e.target.value)} /></div><div className="field"><label className="field__label text-xs">Specific Time</label><input className="input" type="time" value={customFields.validityTime} onChange={(e) => setCustomField("validityTime", e.target.value)} /></div><div className="field"><label className="field__label text-xs">Timezone</label><select className="select" value={customFields.timezone} onChange={(e) => setCustomField("timezone", e.target.value)}><option>WIB (UTC+7)</option><option>UTC</option></select></div><label className="flex items-center gap-2 text-sm self-end pb-2"><input type="checkbox" className="checkbox" checked={customFields.subjectCargoUnsold} onChange={(e) => setCustomField("subjectCargoUnsold", e.target.checked)} /> Subject to cargo unsold</label></div></FormSection>
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

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border p-4 space-y-4"><div className="flex items-center gap-2 border-b border-border pb-2"><span className="text-xs font-semibold text-primary">{number}.</span><h3 className="text-sm font-semibold">{title}</h3></div>{children}</section>;
}
