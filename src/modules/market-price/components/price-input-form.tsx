"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddMarketPrice, type MarketPriceInput } from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";

const PRICE_KEYS = [
  "ici1", "ici2", "ici3", "ici4", "ici5", "newcastle",
  "hba", "hba1", "hba2", "hba3", "mgoUsd", "usdIdr",
] as const;

const optionalPositiveNumber = z.preprocess(
  (value) => {
    if (value === "" || value == null) return undefined;
    return Number(value);
  },
  z.number().positive().optional(),
);

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  source: z.string().trim().min(1, "Source is required"),
  notes: z.string().trim().max(500).optional(),
  ici1: optionalPositiveNumber,
  ici2: optionalPositiveNumber,
  ici3: optionalPositiveNumber,
  ici4: optionalPositiveNumber,
  ici5: optionalPositiveNumber,
  newcastle: optionalPositiveNumber,
  hba: optionalPositiveNumber,
  hba1: optionalPositiveNumber,
  hba2: optionalPositiveNumber,
  hba3: optionalPositiveNumber,
  mgoUsd: optionalPositiveNumber,
  usdIdr: optionalPositiveNumber,
}).superRefine((data, ctx) => {
  if (!PRICE_KEYS.some((key) => data[key] != null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ici1"],
      message: "Fill at least one price field.",
    });
  }
});

type FormValues = z.infer<typeof schema>;

const FIELDS = [
  { key: "ici1" as const, label: "ICI 1 (6500)", placeholder: "68.50", step: "0.01" },
  { key: "ici2" as const, label: "ICI 2 (5800)", placeholder: "59.20", step: "0.01" },
  { key: "ici3" as const, label: "ICI 3 (5000)", placeholder: "52.10", step: "0.01" },
  { key: "ici4" as const, label: "ICI 4 (4200)", placeholder: "43.80", step: "0.01" },
  { key: "ici5" as const, label: "ICI 5 (3400)", placeholder: "35.60", step: "0.01" },
  { key: "newcastle" as const, label: "Newcastle", placeholder: "112.30", step: "0.01" },
  { key: "hba" as const, label: "HBA", placeholder: "95.40", step: "0.01" },
  { key: "hba1" as const, label: "HBA I (5300)", placeholder: "82.10", step: "0.01" },
  { key: "hba2" as const, label: "HBA II (4100)", placeholder: "64.50", step: "0.01" },
  { key: "hba3" as const, label: "HBA III (3400)", placeholder: "48.20", step: "0.01" },
  { key: "mgoUsd" as const, label: "MGO USD/MT", placeholder: "742.00", step: "0.01" },
  { key: "usdIdr" as const, label: "USD/IDR", placeholder: "16250", step: "0.0001" },
];

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function PriceInputForm() {
  const { toggleInputForm } = useMarketPriceUIStore();
  const { mutate, isPending, isSuccess, isError, error, reset: resetMutation } = useAddMarketPrice();
  const defaultDate = useMemo(() => todayDateInput(), []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: defaultDate,
      source: "Manual",
      notes: "",
    },
  });

  function onSubmit(data: FormValues) {
    const payload: MarketPriceInput = {
      date: data.date,
      source: data.source,
      ...(data.notes ? { notes: data.notes } : {}),
    };

    for (const key of PRICE_KEYS) {
      if (data[key] != null) payload[key] = data[key];
    }

    mutate(payload, {
      onSuccess: () => {
        reset({ date: todayDateInput(), source: "Manual", notes: "" });
        setTimeout(() => {
          resetMutation();
          toggleInputForm();
        }, 1200);
      },
    });
  }

  return (
    <div className="card">
      <div className="card__body gap-4">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Input Price</p>
          <button
            type="button"
            className="button button--sm button--ghost button--neutral button--icon-only"
            onClick={toggleInputForm}
            aria-label="Close form"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="mp-date">Date</label>
              <input
                id="mp-date"
                type="date"
                className={`input ${errors.date ? "input--invalid" : ""}`}
                aria-invalid={!!errors.date}
                {...register("date")}
              />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="mp-source">Source</label>
              <input
                id="mp-source"
                className={`input ${errors.source ? "input--invalid" : ""}`}
                aria-invalid={!!errors.source}
                {...register("source")}
              />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="mp-notes">Notes</label>
              <input
                id="mp-notes"
                className={`input ${errors.notes ? "input--invalid" : ""}`}
                aria-invalid={!!errors.notes}
                placeholder="Optional"
                {...register("notes")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            {FIELDS.map((field) => (
              <div key={field.key} className="field">
                <label className="field__label text-xs" htmlFor={`mp-${field.key}`}>{field.label}</label>
                <input
                  id={`mp-${field.key}`}
                  type="number"
                  step={field.step}
                  className={`input ${errors[field.key] ? "input--invalid" : ""}`}
                  placeholder={field.placeholder}
                  aria-invalid={!!errors[field.key]}
                  {...register(field.key)}
                />
              </div>
            ))}
          </div>

          {errors.ici1?.message && (
            <p className="text-sm text-red-600 mt-3">{errors.ici1.message}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="submit"
              className="button button--primary"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving...</> : "Save Prices"}
            </button>
            {isSuccess && <span className="text-sm text-emerald-600 self-center">Saved</span>}
            {isError && (
              <span className="text-sm text-red-600 self-center">
                {error instanceof Error ? error.message : "Failed to save prices"}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
