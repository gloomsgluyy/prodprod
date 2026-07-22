"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useMarkForecastFailed } from "../hooks/use-forecasts";

const FAIL_CATEGORIES = [
  "Price too high", "Buyer dropped", "Quality mismatch",
  "Laycan expired", "Competitor won", "Internal cancellation", "Other",
];

const schema = z.object({
  failedReason:   z.string().min(1, "Required"),
  failedCategory: z.string().optional(),
  buyerFeedback:  z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function MarkFailedModal() {
  const { failedModalId, closeFailed } = useForecastUIStore();
  const { mutate, isPending } = useMarkForecastFailed(failedModalId ?? "");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!failedModalId) return null;

  function onSubmit(data: FormValues) {
    mutate(data, { onSuccess: closeFailed });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label="Mark as Failed">
      <div className="card w-full max-w-md">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Mark as Failed</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeFailed} aria-label="Close">✕</button>
          </div>

          <p className="text-sm text-muted-foreground">
            This will move the project to <strong>Failed</strong> status. Required for tracking lost deals.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <div className="field">
              <label className="field__label" htmlFor="fail-cat">Failure Category</label>
              <select id="fail-cat" className="select" {...register("failedCategory")}>
                <option value="">— Select —</option>
                {FAIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="fail-reason">Reason *</label>
              <textarea id="fail-reason" className={`input ${errors.failedReason ? "input--invalid" : ""}`}
                rows={3} placeholder="Describe why the deal failed…"
                aria-invalid={!!errors.failedReason}
                {...register("failedReason")} />
              {errors.failedReason && <p className="text-xs text-danger mt-0.5" role="alert">{errors.failedReason.message}</p>}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="fail-feedback">Buyer Feedback</label>
              <textarea id="fail-feedback" className="input" rows={2}
                placeholder="Optional — what did the buyer say?"
                {...register("buyerFeedback")} />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeFailed} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--danger" disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Mark as Failed"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
