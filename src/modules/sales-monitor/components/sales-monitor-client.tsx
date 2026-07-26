"use client";

import * as React from "react";
import { useSalesMonitorUIStore } from "../store/sales-monitor-ui-store";
import { DealTable }   from "./deal-table";
import { DealModal }   from "./deal-modal";
import { DealDetailModal } from "./deal-detail-modal";
import { useDeleteDeal } from "../hooks/use-deals";
import { useDealList } from "../hooks/use-deals";
import { useSalesRollup } from "../hooks/use-sales-rollup";

const STATUS_FILTER_OPTIONS = [
  "all","waiting_approval","waiting_buyer","offer_submitted",
  "confirmed","in_transit","completed","cancelled","rejected",
];

const TABS = [
  { key: "deals",  label: "Deals" },
  { key: "rollup", label: "Project Rollup" },
] as const;

const SEGMENT_TABS = [
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

function RollupSummaryCards() {
  const { data } = useSalesRollup();
  const summary = data?.summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: "Total Revenue", value: summary?.totalRevenue ? `$${(summary.totalRevenue / 1_000_000).toFixed(2)}M` : "—", color: "text-emerald-500" },
        { label: "Total Volume", value: summary?.totalVolume ? `${(summary.totalVolume / 1_000).toFixed(1)}K MT` : "—", color: "text-blue-500" },
        { label: "Active Deals", value: summary?.totalDeals ?? "—", color: "text-indigo-500" },
        { label: "Shipments", value: summary?.totalShipments ?? "—", color: "text-teal-500" },
      ].map((c) => (
        <div key={c.label} className="card card--stat">
          <div className="card__body">
            <p className="text-eyebrow">{c.label}</p>
            <p className={`text-3xl font-light ${c.color}`}>{c.value}</p>
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
    modalOpen, confirmDeleteId, detailId,
    setActiveTab, setFilterStatus, setFilterSearch,
    openCreate,
  } = useSalesMonitorUIStore();

  const [segmentTab, setSegmentTab] = React.useState<"all" | "export" | "local">("all");
  const [rollupSearch, setRollupSearch] = React.useState("");

  const { data: rollupData, isLoading: rollupLoading } = useSalesRollup();

  const filteredRollup = React.useMemo(() => {
    if (!rollupData?.data) return [];
    const q = rollupSearch.trim().toLowerCase();
    return rollupData.data.filter((r) => {
      if (segmentTab !== "all" && r.segment !== segmentTab) return false;
      if (!q) return true;
      return [r.projectName, r.buyer].some((x) => (x || "").toLowerCase().includes(q));
    });
  }, [rollupData, segmentTab, rollupSearch]);

  const isRollupView = activeTab === "rollup";

  return (
    <div className="flex flex-col gap-6">
      {/* Tab switcher */}
      <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface w-fit">
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

      {/* Summary */}
      {isRollupView ? <RollupSummaryCards /> : <SummaryCards />}

      {/* Action bar */}
      {isRollupView ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* Segment tabs */}
          <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
            {SEGMENT_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`button button--sm ${segmentTab === tab.key ? "button--primary" : "button--ghost button--neutral"}`}
                onClick={() => setSegmentTab(tab.key)}
                aria-pressed={segmentTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
              placeholder="Search project, buyer…"
              value={rollupSearch}
              onChange={(e) => setRollupSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
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
      )}

      {/* Content */}
      {isRollupView ? (
        rollupLoading ? (
          <div className="card">
            <div className="card__body flex items-center justify-center py-12">
              <span className="spinner spinner--lg" aria-hidden="true" />
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Buyer</th>
                    <th>Segment</th>
                    <th>Sales Status</th>
                    <th className="text-right">Deals</th>
                    <th className="text-right">Shipments</th>
                    <th className="text-right">Volume (MT)</th>
                    <th className="text-right">Revenue (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRollup.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted-foreground py-8">
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    filteredRollup.map((row) => (
                      <tr key={row.projectId ?? `row-${row.projectName}`}>
                        <td className="font-medium">{row.projectName}</td>
                        <td>{row.buyer}</td>
                        <td>
                          <span className={`badge ${row.segment === "export" ? "badge--primary" : "badge--secondary"}`}>
                            {row.segment ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(row.salesStatus)}`}>
                            {row.salesStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="text-right">{row.dealCount}</td>
                        <td className="text-right">{row.shipmentCount}</td>
                        <td className="text-right">{row.qtyTotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                        <td className="text-right">{row.revenueEstimate.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <DealTable />
      )}

      {/* Modals */}
      {modalOpen      && <DealModal />}
      {confirmDeleteId && <ConfirmDeleteModal id={confirmDeleteId} />}
      {detailId && <DealDetailModal />}
    </div>
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "completed": return "badge--success";
    case "confirmed": return "badge--primary";
    case "in_transit": return "badge--info";
    case "offer_submitted": return "badge--warning";
    case "waiting_approval": return "badge--secondary";
    case "rejected": case "cancelled": return "badge--danger";
    default: return "badge--secondary";
  }
}
