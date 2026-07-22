"use client";

import { useShipmentUIStore } from "../store/shipment-ui-store";
import { useCloseShipment } from "../hooks/use-shipments";

export function CloseModal() {
  const { closeModalId, closeCloseModal } = useShipmentUIStore();
  const { mutate, isPending, error, data } = useCloseShipment(closeModalId ?? "");

  if (!closeModalId) return null;

  // Server returns blockers on 409
  const blockers: { check: string; message: string }[] = (error as any)?.body?.blockers ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="alertdialog" aria-modal="true" aria-label="Close shipment confirmation">
      <div className="card w-full max-w-lg">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Close Shipment?</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeCloseModal} aria-label="Cancel">✕</button>
          </div>

          {blockers.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800">
              <p className="text-sm font-semibold text-red-600 mb-2">Closing blocked — resolve the following:</p>
              <ul className="flex flex-col gap-1">
                {blockers.map((b) => (
                  <li key={b.check} className="text-xs text-red-600 flex items-start gap-1">
                    <span>✕</span> {b.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!error && (
            <p className="text-sm text-muted-foreground">
              This will mark the shipment as <strong>Completed</strong>. The system will validate all mandatory checks first.
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral"
              onClick={closeCloseModal} disabled={isPending}>Cancel</button>
            {blockers.length === 0 && (
              <button type="button" className="button button--success"
                disabled={isPending} aria-busy={isPending}
                onClick={() => mutate(undefined, { onSuccess: closeCloseModal })}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Closing…</> : "Confirm Close"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
