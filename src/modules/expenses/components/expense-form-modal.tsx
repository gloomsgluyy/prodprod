"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useExpensesUIStore } from "../store/expenses-ui-store";
import { useCreateExpense, useUpdateExpense, useExpenseList } from "../hooks/use-expenses";

const CATEGORIES = ["Sewa","Supplies","Fuel","Transport","Maintenance","Office","Survey","Legal","Port Charges","Other"] as const;

const schema = z.object({
  description:       z.string().min(1,"Required"),
  amount:            z.coerce.number().positive("Must be > 0"),
  currency:          z.string().default("IDR"),
  category:          z.enum(CATEGORIES).default("Other"),
  supplierName:      z.string().optional(),
  priority:          z.enum(["low","medium","high","urgent"]).default("medium"),
  imageUrl:          z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes:             z.string().optional(),
  relatedShipmentId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ExpenseFormModal() {
  const { editingId, closeModal } = useExpensesUIStore();
  const isEdit = !!editingId;

  // Load current record for edit — reuse the list cache
  const { data: listData } = useExpenseList({ page: 1 });
  const editing = isEdit ? listData?.data?.find((e) => e.id === editingId) : undefined;

  const { mutate: create, isPending: creating } = useCreateExpense();
  const { mutate: update, isPending: updating } = useUpdateExpense(editingId ?? "");
  const isPending = creating || updating;

  const [submitNow, setSubmitNow] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "IDR", category: "Other", priority: "medium" },
  });

  const imageUrl = watch("imageUrl");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrFlags, setOcrFlags] = useState<string[]>([]);

  useEffect(() => {
    if (editing && isEdit) {
      reset({
        description:       editing.description,
        amount:            editing.amount,
        currency:          editing.currency,
        category:          editing.category as FormValues["category"],
        supplierName:      editing.supplierName ?? "",
        priority:          editing.priority as FormValues["priority"],
        imageUrl:          editing.imageUrl ?? "",
        notes:             editing.notes ?? "",
        relatedShipmentId: editing.relatedShipmentId ?? "",
      });
    }
  }, [editing, isEdit, reset]);

  function onSubmit(data: FormValues) {
    const isAnomaly = ocrFlags.length > 0;
    const anomalyReason = isAnomaly ? ocrFlags.join("; ") : undefined;
    const payload = { 
      ...data, 
      imageUrl: data.imageUrl || undefined, 
      relatedShipmentId: data.relatedShipmentId || undefined,
      isAnomaly,
      anomalyReason,
    };
    if (isEdit) {
      update(payload, { onSuccess: closeModal });
    } else {
      create({ ...payload, submitNow }, { onSuccess: closeModal });
    }
  }

  async function runOcr() {
    if (!imageUrl) return;
    setOcrBusy(true);
    setOcrFlags([]);
    try {
      const res = await fetch("/api/expenses/ocr", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageUrl }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "OCR failed");
      const d = json.data ?? {};
      if (d.description) setValue("description", d.description);
      if (d.amount) setValue("amount", d.amount);
      if (d.currency) setValue("currency", d.currency);
      if (d.category) setValue("category", d.category);
      if (d.supplierName) setValue("supplierName", d.supplierName);
      if (d.notes) setValue("notes", [watch("notes"), d.notes].filter(Boolean).join("\n"));
      const flags = d.anomalyFlags ?? [];
      setOcrFlags(flags);
      if (flags.length > 0 && !isEdit) {
        setValue("notes", [watch("notes"), `[Anomaly Detected] ${flags.join("; ")}`].filter(Boolean).join("\n"));
      }
    } finally {
      setOcrBusy(false);
    }
  }

  const F = ({ id, label, type="text", ph }: { id: keyof FormValues; label: string; type?: string; ph?: string }) => {
    const err = errors[id];
    return (
      <div className="field">
        <label className="field__label text-xs" htmlFor={`exp-${id}`}>{label}</label>
        <input id={`exp-${id}`} type={type} step={type==="number"?"0.01":undefined}
          className={`input ${err?"input--invalid":""}`} placeholder={ph}
          aria-invalid={!!err} {...register(id)} />
        {err && <p className="text-xs text-danger mt-0.5" role="alert">{(err as {message?:string})?.message}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Expense" : "New Expense"}>
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Expense" : "New Purchase Request"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeModal} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <F id="description" label="Description *" ph="Office supplies for Q3" />

            <div className="grid grid-cols-2 gap-3">
              <F id="amount"   label="Amount *"  type="number" ph="1500000" />
              <div className="field">
                <label className="field__label text-xs" htmlFor="exp-currency">Currency</label>
                <select id="exp-currency" className="select" {...register("currency")}>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="exp-category">Category</label>
                <select id="exp-category" className="select" {...register("category")}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="exp-priority">Priority</label>
                <select id="exp-priority" className="select" {...register("priority")}>
                  {["low","medium","high","urgent"].map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <F id="supplierName"      label="Supplier / Vendor" ph="PT. Vendor Name" />
            <F id="relatedShipmentId" label="Related Shipment ID (optional)" ph="UUID" />

            {/* Image URL field + preview */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="exp-imageUrl">Receipt / Invoice Image URL</label>
              <input id="exp-imageUrl" type="url" className={`input ${errors.imageUrl?"input--invalid":""}`}
                placeholder="https://your-storage.com/receipt.jpg"
                aria-invalid={!!errors.imageUrl} {...register("imageUrl")} />
              {errors.imageUrl && <p className="text-xs text-danger mt-0.5" role="alert">{errors.imageUrl.message}</p>}
              {imageUrl && !errors.imageUrl && (
                <div className="mt-2 relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Receipt preview" className="h-24 rounded-lg object-cover border border-border" />
                  <span className="absolute top-1 right-1 badge badge--success badge--xs">Preview</span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button type="button" className="button button--sm button--ghost button--primary"
                  disabled={!imageUrl || ocrBusy} aria-busy={ocrBusy} onClick={runOcr}>
                  {ocrBusy ? <><span className="spinner spinner--sm" aria-hidden="true" /> Reading…</> : "OCR Receipt"}
                </button>
                <span className="text-xs text-muted-foreground">AI if configured; fallback otherwise</span>
              </div>
              {ocrFlags.length > 0 && (
                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700">
                  {ocrFlags.map((flag) => <p key={flag}>Warning: {flag}</p>)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Paste a direct image URL, then OCR Receipt to pre-fill fields.
              </p>
            </div>

            <div className="field">
              <label className="field__label text-xs" htmlFor="exp-notes">Notes</label>
              <textarea id="exp-notes" className="input" rows={2}
                placeholder="Additional context…" {...register("notes")} />
            </div>

            {/* Submit toggle — only for new */}
            {!isEdit && (
              <label className="field__item">
                <input type="checkbox" className="checkbox" checked={submitNow}
                  onChange={(e) => setSubmitNow(e.target.checked)} />
                <span className="field__label font-normal text-sm">Submit for approval immediately</span>
              </label>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending
                  ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</>
                  : isEdit ? "Update" : submitNow ? "Save & Submit" : "Save Draft"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
