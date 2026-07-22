"use client";

import { usePaymentUIStore } from "../store/payment-ui-store";
import { useOutstandingPayments, useDeletePayment } from "../hooks/use-outstanding-payments";
import { PaymentFormModal } from "./payment-form-modal";

const TABS = [
  { key: "all",     label: "All" },
  { key: "pending", label: "Pending" },
  { key: "partial", label: "Partial" },
  { key: "paid",    label: "Paid" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  pending: "badge--danger",
  partial: "badge--warning",
  paid:    "badge--success",
};

function SummaryCards() {
  const { data } = useOutstandingPayments({ page: 1 });
  const meta = data?.meta;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card card--stat">
        <div className="card__body">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-500">💳</span>
            <p className="text-eyebrow">Total Records</p>
          </div>
          <p className="text-3xl font-light text-emerald-500">{meta?.total ?? "—"}</p>
        </div>
      </div>
      <div className="card card--stat">
        <div className="card__body">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-500">📄</span>
            <p className="text-eyebrow">Total Qty</p>
          </div>
          <p className="text-3xl font-light text-blue-500">
            {meta?.totalQty != null ? `${(meta.totalQty / 1000).toFixed(1)}K` : "—"}
            <span className="text-base text-muted-foreground ml-1">MT</span>
          </p>
        </div>
      </div>
      <div className="card card--stat">
        <div className="card__body">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-500">🧮</span>
            <p className="text-eyebrow">Total DP</p>
          </div>
          <p className="text-3xl font-light text-amber-500">
            {meta?.totalDp != null ? `${(meta.totalDp / 1_000_000_000).toFixed(2)}B` : "—"}
            <span className="text-base text-muted-foreground ml-1">IDR</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentTable() {
  const { activeTab, filterSearch, page, setPage, openEdit, setConfirmDelete } = usePaymentUIStore();
  const { data, isLoading } = useOutstandingPayments({
    page,
    status: activeTab === "all" ? undefined : activeTab,
    search: filterSearch || undefined,
  });
  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm" aria-label="Outstanding payments table">
                <thead>
                  <tr>
                    <th>Tahun</th><th>Shipment</th><th>Perusahaan</th>
                    <th>Invoice</th><th>Kode Batu</th>
                    <th>Price (Rp)</th><th>Qty (MT)</th><th>Total DP (Rp)</th>
                    <th>Calc Date</th><th>Due Date</th><th>Timeframe</th>
                    <th>Evidence</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={14} className="text-center text-muted-foreground py-8">No records found</td></tr>
                  ) : items.map((p) => (
                    <tr key={p.id}>
                      <td><span className="badge badge--neutral badge--sm">{p.tahun}</span></td>
                      <td className="text-xs">{p.shipment?.shipmentNumber ?? "—"}</td>
                      <td className="font-medium">{p.perusahaan}</td>
                      <td className="font-mono text-xs">{p.invoiceNumber ?? "—"}</td>
                      <td className="font-mono text-xs">{p.kodeBatu ?? "—"}</td>
                      <td className="font-mono text-xs">
                        {p.priceInclPph != null ? `Rp ${Number(p.priceInclPph).toLocaleString()}` : "—"}
                      </td>
                      <td className="font-medium text-blue-500">
                        {p.quantity != null ? Number(p.quantity).toLocaleString() : "—"}
                      </td>
                      <td className="font-medium text-emerald-600">
                        {p.totalDp != null ? `Rp ${Number(p.totalDp).toLocaleString()}` : "—"}
                      </td>
                      <td className="text-xs">{p.calculationDate ? new Date(p.calculationDate).toLocaleDateString() : "—"}</td>
                      <td className="text-xs">
                        {p.dueDate ? (
                          <span className={new Date(p.dueDate) < new Date() && p.status !== "paid" ? "text-red-500 font-medium" : ""}>
                            {new Date(p.dueDate).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="text-xs">{p.timeframe ?? "—"}</td>
                      <td className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          {p.invoiceDocumentId && p.shipmentId
                            ? <a href={`/api/shipments/${p.shipmentId}/documents/${p.invoiceDocumentId}`} target="_blank" rel="noopener noreferrer" className="link">Invoice ↗</a>
                            : <span className="text-muted-foreground">Invoice —</span>}
                          {p.paymentProofDocumentId && p.shipmentId
                            ? <a href={`/api/shipments/${p.shipmentId}/documents/${p.paymentProofDocumentId}`} target="_blank" rel="noopener noreferrer" className="link">Proof ↗</a>
                            : <span className="text-muted-foreground">Proof —</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge--sm ${STATUS_BADGE[p.status] ?? ""}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" className="button button--xs button--ghost button--primary"
                            onClick={() => openEdit(p.id)} aria-label={`Edit ${p.perusahaan}`}>Edit</button>
                          <button type="button" className="button button--xs button--ghost button--danger"
                            onClick={() => setConfirmDelete(p.id)} aria-label={`Delete ${p.perusahaan}`}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{meta.total} records · Page {meta.page} of {meta.totalPages}</p>
                <div className="flex gap-1">
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>←</button>
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ id }: { id: string }) {
  const { setConfirmDelete } = usePaymentUIStore();
  const { mutate, isPending } = useDeletePayment(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Delete Payment Record?</h2>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
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

export function PaymentClient() {
  const { activeTab, filterSearch, modalOpen, confirmDeleteId,
    setActiveTab, setFilterSearch, openCreate } = usePaymentUIStore();

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards />

      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {TABS.map((tab) => (
            <button key={tab.key} type="button"
              className={`button button--sm ${activeTab === tab.key ? "button--primary" : "button--ghost button--neutral"}`}
              onClick={() => setActiveTab(tab.key)} aria-pressed={activeTab === tab.key}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/>
              </g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search perusahaan, kode batu…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
            aria-label="Search payments" />
        </div>

        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>
          + New Payment Record
        </button>
      </div>

      <PaymentTable />

      {modalOpen        && <PaymentFormModal />}
      {confirmDeleteId  && <ConfirmDeleteModal id={confirmDeleteId} />}
    </div>
  );
}
