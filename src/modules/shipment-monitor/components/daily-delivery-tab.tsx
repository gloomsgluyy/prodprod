"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api-client";
import { formatApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";

interface DDItem {
  id: string; blDate: string; buyer: string; supplier: string; shippingTerm: string;
  area: string | null; flow: string; blQty: number; invoiceAmount: number | null;
  product: string; projectName: string | null; createdAt: string;
}

const schema = z.object({
  blDate:        z.string().min(1, "Required"),
  buyer:         z.string().min(1, "Required"),
  supplier:      z.string().min(1, "Required"),
  shippingTerm:  z.string().min(1, "Required"),
  area:          z.string().optional(),
  flow:          z.enum(["domestic", "export"]),
  blQty:         z.coerce.number().positive("Required"),
  invoiceAmount: z.coerce.number().positive().optional(),
  product:       z.string().min(1, "Required"),
  projectName:   z.string().optional(),
});

type DDForm = z.infer<typeof schema>;

function useDDList(page: number) {
  return useQuery({
    queryKey: ["daily-delivery", page],
    queryFn: () => api.get<{ data: DDItem[]; meta: { total: number; page: number; totalPages: number } }>(`/api/daily-delivery?page=${page}`),
    placeholderData: (p) => p,
  });
}

function useCreateDD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: DDForm) => api.post<{ data: DDItem }>("/api/daily-delivery", d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-delivery"] }),
    onError: (error) => notify(formatApiError(error, "Daily delivery create failed"), "error"),
  });
}

function useDeleteDD(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/daily-delivery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-delivery"] }),
    onError: (error) => notify(formatApiError(error, "Daily delivery delete failed"), "error"),
  });
}

export function DailyDeliveryTab() {
  const [page, setPage]       = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useDDList(page);
  const { mutate: create, isPending: creating } = useCreateDD();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DDForm>({
    resolver: zodResolver(schema),
    defaultValues: { flow: "export", product: "Coal" },
  });

  function onSubmit(d: DDForm) {
    create(d, { onSuccess: () => { reset(); setShowForm(false); } });
  }

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-eyebrow">Daily Delivery Log</p>
        <button type="button" className="button button--sm button--primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Entry"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: "blDate" as const,     label: "BL Date *",      type: "date" },
              { id: "buyer" as const,      label: "Buyer *",         type: "text" },
              { id: "supplier" as const,   label: "Supplier *",      type: "text" },
              { id: "shippingTerm" as const,label: "Shipping Term *", type: "text" },
              { id: "area" as const,       label: "Area",            type: "text" },
            ].map(({ id, label, type }) => (
              <div key={id} className="field">
                <label className="field__label text-xs" htmlFor={`dd-${id}`}>{label}</label>
                <input id={`dd-${id}`} type={type} className={`input ${errors[id] ? "input--invalid" : ""}`}
                  aria-invalid={!!errors[id]} {...register(id)} />
                {errors[id] && <p className="text-xs text-danger mt-0.5" role="alert">{errors[id]?.message}</p>}
              </div>
            ))}
            <div className="field">
              <label className="field__label text-xs" htmlFor="dd-flow">Flow *</label>
              <select id="dd-flow" className="select" {...register("flow")}>
                <option value="export">Export</option>
                <option value="domestic">Domestic</option>
              </select>
            </div>
            {[
              { id: "blQty" as const,        label: "BL Qty (MT) *",    type: "number" },
              { id: "invoiceAmount" as const, label: "Invoice Amount",    type: "number" },
              { id: "product" as const,       label: "Product *",         type: "text" },
              { id: "projectName" as const,   label: "Project Name",      type: "text" },
            ].map(({ id, label, type }) => (
              <div key={id} className="field">
                <label className="field__label text-xs" htmlFor={`dd-${id}`}>{label}</label>
                <input id={`dd-${id}`} type={type} step={type === "number" ? "0.01" : undefined}
                  className={`input ${(errors as Record<string, unknown>)[id] ? "input--invalid" : ""}`}
                  {...register(id)} />
                {(errors as Record<string, { message?: string }>)[id] && <p className="text-xs text-danger mt-0.5" role="alert">{(errors as Record<string, { message?: string }>)[id]?.message}</p>}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="button button--primary" disabled={creating} aria-busy={creating}>
              {creating ? <><span className="spinner spinner--sm" aria-hidden="true" /> Adding…</> : "Add Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="card">
        <div className="card__body gap-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table--striped text-sm" aria-label="Daily delivery log">
                  <thead>
                    <tr>
                      <th>BL Date</th><th>Buyer</th><th>Supplier</th><th>Shipping Term</th>
                      <th>Area</th><th>Flow</th><th>BL Qty (MT)</th><th>Invoice</th>
                      <th>Product</th><th>Project</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={11} className="text-center text-muted-foreground py-8">No entries</td></tr>
                    ) : items.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.blDate).toLocaleDateString()}</td>
                        <td>{item.buyer}</td>
                        <td>{item.supplier}</td>
                        <td>{item.shippingTerm}</td>
                        <td>{item.area ?? "—"}</td>
                        <td><span className={`badge badge--sm ${item.flow === "export" ? "badge--info" : "badge--neutral"}`}>{item.flow}</span></td>
                        <td className="font-medium text-blue-500">{Number(item.blQty).toLocaleString()}</td>
                        <td className="font-mono text-xs">
                          {item.invoiceAmount != null ? `Rp ${Number(item.invoiceAmount).toLocaleString()}` : "—"}
                        </td>
                        <td>{item.product}</td>
                        <td>{item.projectName ?? "—"}</td>
                        <td>
                          <button type="button" className="button button--xs button--ghost button--danger"
                            onClick={() => setDeleteId(item.id)} aria-label="Delete entry">Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">{meta.total} entries · Page {meta.page} of {meta.totalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" className="button button--sm button--ghost button--neutral"
                      disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
                    <button type="button" className="button button--sm button--ghost button--neutral"
                      disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDeleteDD id={deleteId} onCancel={() => setDeleteId(null)} onDone={() => setDeleteId(null)} />
      )}
    </div>
  );
}

function ConfirmDeleteDD({ id, onCancel, onDone }: { id: string; onCancel: () => void; onDone: () => void }) {
  const { mutate, isPending } = useDeleteDD(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Delete Entry?</h2>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral" onClick={onCancel} disabled={isPending}>Cancel</button>
            <button type="button" className="button button--danger" disabled={isPending} aria-busy={isPending}
              onClick={() => mutate(undefined, { onSuccess: onDone })}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Deleting…</> : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
