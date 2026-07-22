"use client";

import { useState } from "react";
import { useExpensesUIStore } from "../store/expenses-ui-store";
import { useExpenseList, useDeleteExpense, useApproveExpense } from "../hooks/use-expenses";
import { ExpenseFormModal } from "./expense-form-modal";
import { useAuthStore } from "@/modules/auth/store/auth-store";

const STATUSES = ["all","draft","submitted","approved","rejected","paid"] as const;
const STATUS_BADGE: Record<string, string> = {
  draft:"badge--neutral", submitted:"badge--warning", approved:"badge--success",
  rejected:"badge--danger", paid:"badge--primary",
};
const PRIORITY_DOT: Record<string, string> = {
  low:"bg-emerald-500", medium:"bg-yellow-400", high:"bg-orange-500", urgent:"bg-red-500",
};
const APPROVER_ROLES = ["CEO","DIRUT","ASS_DIRUT","COO","TRAFFIC_HEAD","FINANCE"];

// ── Approve modal ─────────────────────────────────────────────────────────────
function ApproveModal({ id }: { id: string }) {
  const { closeApprove } = useExpensesUIStore();
  const { mutate, isPending } = useApproveExpense(id);
  const [action,  setAction]  = useState<"approved"|"rejected">("approved");
  const [notes,   setNotes]   = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-sm">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Review Expense</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeApprove} aria-label="Close">✕</button>
          </div>
          <div className="flex gap-2">
            {(["approved","rejected"] as const).map((a) => (
              <button key={a} type="button"
                className={`button button--sm ${action===a ? (a==="approved"?"button--success":"button--danger") : "button--ghost button--neutral"}`}
                onClick={() => setAction(a)} aria-pressed={action===a}>
                {a==="approved" ? "✓ Approve" : "✕ Reject"}
              </button>
            ))}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="approve-notes">Notes {action==="rejected"&&"*"}</label>
            <textarea id="approve-notes" className="input" rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={action==="rejected" ? "Reason for rejection…" : "Optional comment…"} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral"
              onClick={closeApprove} disabled={isPending}>Cancel</button>
            <button type="button"
              className={`button ${action==="approved"?"button--success":"button--danger"}`}
              disabled={isPending || (action==="rejected" && !notes.trim())}
              aria-busy={isPending}
              onClick={() => mutate({ action, notes: notes || undefined }, { onSuccess: closeApprove })}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Image preview lightbox ────────────────────────────────────────────────────
function ImagePreview() {
  const { previewImageUrl, closeImagePreview } = useExpensesUIStore();
  if (!previewImageUrl) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog" aria-modal="true" aria-label="Receipt preview"
      onClick={closeImagePreview}>
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewImageUrl} alt="Receipt" className="w-full rounded-xl max-h-[80vh] object-contain" />
        <button type="button"
          className="absolute top-2 right-2 button button--ghost button--neutral button--icon-only bg-black/50"
          onClick={closeImagePreview} aria-label="Close preview">✕</button>
      </div>
    </div>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────────
function ConfirmDeleteModal({ id }: { id: string }) {
  const { setConfirmDelete } = useExpensesUIStore();
  const { mutate, isPending } = useDeleteExpense(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Delete Expense?</h2>
          <p className="text-sm text-muted-foreground">Only draft/submitted expenses can be deleted.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral"
              onClick={() => setConfirmDelete(null)} disabled={isPending}>Cancel</button>
            <button type="button" className="button button--danger" disabled={isPending} aria-busy={isPending}
              onClick={() => mutate(undefined, { onSuccess: () => setConfirmDelete(null) })}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Deleting…</> : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCards() {
  const { data } = useExpenseList({ page: 1 });
  const meta     = data?.meta;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="card card--stat">
        <div className="card__body">
          <p className="text-eyebrow">Total Expenses</p>
          <p className="text-3xl font-light text-blue-500">{meta?.total ?? "—"}</p>
        </div>
      </div>
      <div className="card card--stat">
        <div className="card__body">
          <p className="text-eyebrow">Total Amount</p>
          <p className="text-3xl font-light text-amber-500">
            {meta?.totalAmount != null ? `${(meta.totalAmount / 1_000_000).toFixed(1)}M` : "—"}
            <span className="text-sm text-muted-foreground ml-1">IDR</span>
          </p>
        </div>
      </div>
      <div className="card card--stat">
        <div className="card__body">
          <p className="text-eyebrow">Pending Approval</p>
          {/* Separate query for submitted count */}
          <SubmittedCount />
        </div>
      </div>
    </div>
  );
}

function SubmittedCount() {
  const { data } = useExpenseList({ page: 1, status: "submitted" });
  return <p className="text-3xl font-light text-orange-500">{data?.meta?.total ?? "—"}</p>;
}

// ── Main client ───────────────────────────────────────────────────────────────
export function ExpenseClient() {
  const { role } = useAuthStore();
  const canApprove = APPROVER_ROLES.includes(role ?? "");

  const {
    filterStatus, filterSearch, shipmentOnly, page,
    modalOpen, approveId, confirmDeleteId, previewImageUrl,
    setFilterStatus, setFilterSearch, setShipmentOnly, setPage,
    openCreate, openEdit, openApprove, openImagePreview, setConfirmDelete,
  } = useExpensesUIStore();

  const { data, isLoading } = useExpenseList({
    page,
    status:      filterStatus === "all" ? undefined : filterStatus,
    search:      filterSearch || undefined,
    shipmentOnly,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto border border-border rounded-lg p-1 bg-surface">
          {STATUSES.map((s) => (
            <button key={s} type="button"
              className={`button button--sm flex-shrink-0 ${filterStatus===s?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setFilterStatus(s)} aria-pressed={filterStatus===s}>
              {s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>

        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search description, supplier…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} aria-label="Search expenses" />
        </div>

        <label className="field__item">
          <input type="checkbox" className="checkbox" checked={shipmentOnly}
            onChange={(e) => setShipmentOnly(e.target.checked)} />
          <span className="text-sm">Shipment-related only</span>
        </label>

        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>+ New Request</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card__body gap-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">{Array.from({length:6}).map((_,i)=><div key={i} className="h-10 bg-muted rounded"/>)}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table--striped text-sm" aria-label="Expenses table">
                  <thead>
                    <tr>
                      <th>Description</th><th>Category</th><th>Amount</th>
                      <th>Supplier</th><th>Priority</th><th>Image</th>
                      <th>Status</th><th>By</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={9} className="text-center text-muted-foreground py-8">No expenses found</td></tr>
                    ) : items.map((exp) => (
                      <tr key={exp.id}>
                        <td className="font-medium max-w-48 truncate">{exp.description}</td>
                        <td><span className="badge badge--neutral badge--sm">{exp.category}</span></td>
                        <td className="font-mono font-medium">
                          {exp.currency === "IDR"
                            ? `Rp ${exp.amount.toLocaleString()}`
                            : `$${exp.amount.toFixed(2)}`}
                        </td>
                        <td className="text-xs">{exp.supplierName ?? "—"}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[exp.priority] ?? ""}`} />
                            <span className="text-xs capitalize">{exp.priority}</span>
                          </div>
                        </td>
                        <td>
                          {exp.imageUrl ? (
                            <button type="button" className="button button--xs button--ghost button--primary"
                              onClick={() => openImagePreview(exp.imageUrl!)} aria-label="View receipt">
                              View 🖼
                            </button>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td>
                          <span className={`badge badge--sm ${STATUS_BADGE[exp.status] ?? ""}`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="text-xs">{exp.submittedBy.name}</td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {["draft","submitted"].includes(exp.status) && (
                              <button type="button" className="button button--xs button--ghost button--primary"
                                onClick={() => openEdit(exp.id)}>Edit</button>
                            )}
                            {canApprove && exp.status === "submitted" && (
                              <button type="button" className="button button--xs button--success"
                                onClick={() => openApprove(exp.id)}>Review</button>
                            )}
                            {["draft","submitted"].includes(exp.status) && (
                              <button type="button" className="button button--xs button--ghost button--danger"
                                onClick={() => setConfirmDelete(exp.id)}>Del</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">{meta.total} expenses · Page {meta.page} of {meta.totalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" className="button button--sm button--ghost button--neutral"
                      disabled={meta.page<=1} onClick={()=>setPage(meta.page-1)}>←</button>
                    <button type="button" className="button button--sm button--ghost button--neutral"
                      disabled={meta.page>=meta.totalPages} onClick={()=>setPage(meta.page+1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Overlays */}
      {modalOpen       && <ExpenseFormModal />}
      {approveId       && <ApproveModal id={approveId} />}
      {confirmDeleteId && <ConfirmDeleteModal id={confirmDeleteId} />}
      {previewImageUrl && <ImagePreview />}
    </div>
  );
}
