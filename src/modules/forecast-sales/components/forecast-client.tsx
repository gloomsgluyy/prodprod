"use client";

import { useForecastUIStore } from "../store/forecast-ui-store";
import { useForecastList, useDeleteForecast } from "../hooks/use-forecasts";
import { ForecastTable }         from "./forecast-table";
import { ForecastFormModal }     from "./forecast-form-modal";
import { ForecastDetailDrawer }  from "./forecast-detail-drawer";
import { ApprovalModal }         from "./approval-modal";
import { ConvertShipmentModal }  from "./convert-shipment-modal";
import { MarkFailedModal }       from "./mark-failed-modal";

const TABS = [
  { key: "all",    label: "All" },
  { key: "export", label: "Export" },
  { key: "local",  label: "Local" },
] as const;

const STATUS_FILTERS = [
  "all","draft","submitted","waiting_approval","approved",
  "rejected","revision","deal","failed","cancelled",
];

function SummaryCards() {
  const { data } = useForecastList({ page: 1 });
  const total = data?.meta?.total ?? 0;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: "Total Projects", value: total,      color: "text-blue-500"    },
        { label: "Waiting Approval", value: null,     color: "text-amber-500"   },
        { label: "Approved / Deal",  value: null,     color: "text-emerald-500" },
        { label: "Failed",           value: null,     color: "text-red-500"     },
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
  const { setConfirmDelete } = useForecastUIStore();
  const { mutate, isPending } = useDeleteForecast(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Delete Draft?</h2>
          <p className="text-sm text-muted-foreground">
            This cannot be undone. Only draft projects can be deleted.
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral"
              onClick={() => setConfirmDelete(null)} disabled={isPending}>Cancel</button>
            <button type="button" className="button button--danger"
              disabled={isPending} aria-busy={isPending}
              onClick={() => mutate(undefined, { onSuccess: () => setConfirmDelete(null) })}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Deleting…</> : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForecastClient() {
  const {
    activeTab, filterStatus, filterSearch, filterEntity,
    createModalOpen, editingId, detailId, approveModalId,
    convertModalId, failedModalId, confirmDeleteId,
    setActiveTab, setFilterStatus, setFilterSearch, setFilterEntity, openCreate,
  } = useForecastUIStore();

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards />

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {TABS.map((tab) => (
            <button key={tab.key} type="button"
              className={`button button--sm ${activeTab === tab.key ? "button--primary" : "button--ghost button--neutral"}`}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}>
              {tab.label}
            </button>
          ))}
        </div>

        <select className="select select--sm w-44" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Status" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        <select className="select select--sm w-36" aria-label="Filter entity" value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}>
          <option value="all">All Entity</option>
          <option value="mse">MSE</option>
          <option value="cmd">CMD</option>
        </select>

        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11.5" cy="11.5" r="9.5" /><path strokeLinecap="round" d="M18.5 18.5L22 22" />
              </g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search offer, buyer…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
            aria-label="Search forecasts" />
        </div>

        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>
           + New Sales Forecast
        </button>
      </div>

      <ForecastTable />

      {/* Overlays */}
      {(createModalOpen || editingId)  && <ForecastFormModal />}
      {detailId                        && <ForecastDetailDrawer />}
      {approveModalId                  && <ApprovalModal />}
      {convertModalId                  && <ConvertShipmentModal />}
      {failedModalId                   && <MarkFailedModal />}
      {confirmDeleteId                 && <ConfirmDeleteModal id={confirmDeleteId} />}
    </div>
  );
}
