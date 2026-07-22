"use client";

import { useSalesMonitorUIStore } from "../store/sales-monitor-ui-store";
import { DealTable }   from "./deal-table";
import { DealModal }   from "./deal-modal";
import { useDeleteDeal } from "../hooks/use-deals";
import { useDealList } from "../hooks/use-deals";

const STATUS_FILTER_OPTIONS = [
  "all","waiting_approval","waiting_buyer","offer_submitted",
  "confirmed","in_transit","completed","cancelled","rejected",
];

const TABS = [
  { key: "all",    label: "All" },
  { key: "export", label: "Export" },
  { key: "local",  label: "Local" },
] as const;

function SummaryCards() {
  const { data } = useDealList({ page: 1 });
  const all = data?.meta?.total ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: "Total Deals", value: all, color: "text-blue-500" },
        { label: "Confirmed",   value: null, color: "text-emerald-500" },
        { label: "In Transit",  value: null, color: "text-indigo-500" },
        { label: "Completed",   value: null, color: "text-teal-500" },
      ].map((c) => (
        <div key={c.label} className="card card--stat">
          <div className="card__body">
            <p className="text-eyebrow">{c.label}</p>
            <p className={`text-3xl font-light ${c.color}`}>{c.value ?? "—"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDeleteModal({ id }: { id: string }) {
  const { setConfirmDelete } = useSalesMonitorUIStore();
  const { mutate, isPending } = useDeleteDeal(id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog" aria-modal="true" aria-label="Confirm delete"
    >
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Delete Deal?</h2>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The deal record will be permanently removed.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="button button--ghost button--neutral"
              onClick={() => setConfirmDelete(null)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button--danger"
              aria-busy={isPending}
              disabled={isPending}
              onClick={() => mutate(undefined, { onSuccess: () => setConfirmDelete(null) })}
            >
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Deleting…</> : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SalesMonitorClient() {
  const {
    activeTab, filterStatus, filterSearch,
    modalOpen, confirmDeleteId,
    setActiveTab, setFilterStatus, setFilterSearch,
    openCreate,
  } = useSalesMonitorUIStore();

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <SummaryCards />

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`button button--sm ${activeTab === tab.key ? "button--primary" : "button--ghost button--neutral"}`}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          className="select select--sm w-44"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Status" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11.5" cy="11.5" r="9.5" /><path strokeLinecap="round" d="M18.5 18.5L22 22" />
              </g>
            </svg>
          </span>
          <input
            type="search"
            className="input"
            placeholder="Search project name, buyer…"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            aria-label="Search deals"
          />
        </div>

        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>
          + Add Deal
        </button>
      </div>

      {/* Table */}
      <DealTable />

      {/* Modals */}
      {modalOpen      && <DealModal />}
      {confirmDeleteId && <ConfirmDeleteModal id={confirmDeleteId} />}
    </div>
  );
}
