"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddMarketPrice } from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";

const schema = z.object({
  ici1:      z.coerce.number().positive().optional(),
  ici2:      z.coerce.number().positive().optional(),
  ici3:      z.coerce.number().positive().optional(),
  ici4:      z.coerce.number().positive().optional(),
  ici5:      z.coerce.number().positive().optional(),
  newcastle: z.coerce.number().positive().optional(),
  hba:       z.coerce.number().positive().optional(),
  hba1:      z.coerce.number().positive().optional(),
  hba2:      z.coerce.number().positive().optional(),
  hba3:      z.coerce.number().positive().optional(),
});

type FormValues = z.infer<typeof schema>;

const FIELDS = [
  { key: "ici1" as const,      label: "ICI 1 (6500)",   placeholder: "68.50" },
  { key: "ici2" as const,      label: "ICI 2 (5800)",   placeholder: "59.20" },
  { key: "ici3" as const,      label: "ICI 3 (5000)",   placeholder: "52.10" },
  { key: "ici4" as const,      label: "ICI 4 (4200)",   placeholder: "43.80" },
  { key: "ici5" as const,      label: "ICI 5 (3400)",   placeholder: "35.60" },
  { key: "newcastle" as const, label: "Newcastle",       placeholder: "112.30" },
  { key: "hba" as const,       label: "HBA",             placeholder: "95.40" },
  { key: "hba1" as const,      label: "HBA I (5300)",    placeholder: "82.10" },
  { key: "hba2" as const,      label: "HBA II (4100)",   placeholder: "64.50" },
  { key: "hba3" as const,      label: "HBA III (3400)",  placeholder: "48.20" },
];

export function PriceInputForm() {
  const { toggleInputForm } = useMarketPriceUIStore();
  const { mutate, isPending, isSuccess, reset: resetMutation } = useAddMarketPrice();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormValues) {
    // Strip undefined — only send filled values
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v != null && v !== 0)
    ) as Record<string, number>;

    mutate(payload, {
      onSuccess: () => {
        reset();
        setTimeout(() => { resetMutation(); toggleInputForm(); }, 1200);
      },
    });
  }

  return (
    <div className="card">
      <div className="card__body gap-4">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Manual Price Input</p>
          <button type="button" className="button button--sm button--ghost button--neutral"
            onClick={toggleInputForm} aria-label="Close form">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="field">
                <label className="field__label text-xs" htmlFor={`mp-${f.key}`}>{f.label}</label>
                <input
                  id={`mp-${f.key}`}
                  type="number"
                  step="0.01"
                  className={`input ${errors[f.key] ? "input--invalid" : ""}`}
                  placeholder={f.placeholder}
                  aria-invalid={!!errors[f.key]}
                  {...register(f.key)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="button button--primary"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Save Prices"}
            </button>
            {isSuccess && <span className="text-sm text-emerald-600 self-center">✓ Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
