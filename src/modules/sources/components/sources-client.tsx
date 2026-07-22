"use client";

import { useSourcesUIStore } from "../store/sources-ui-store";
import { useSourceList, useSourceAlerts, useDeleteSource } from "../hooks/use-sources";
import { SourceFormModal } from "./source-form-modal";
import type { SourceItem, StockAlert } from "../hooks/use-sources";

const KYC_PSI_BADGE: Record<string, string> = {
  not_started:  "badge--neutral",
  in_progress:  "badge--warning",
  completed:    "badge--success",
};

function SourceTable() {
  const { filterSearch, filterRegion, page, setPage, openEdit, setConfirmDelete } = useSourcesUIStore();
  const { data, isLoading } = useSourceList({ page, search: filterSearch || undefined, region: filterRegion || undefined });
  const items = (data?.data ?? []) as SourceItem[];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm" aria-label="Sources table">
                <thead>
                  <tr>
                    <th>Supplier Name</th><th>Region</th><th>Calorie Range</th>
                    <th>Stock (MT)</th><th>FOB USD</th><th>FOB IDR</th>
                    <th>Jetty/Port</th><th>KYC</th><th>PSI</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={10} className="text-center text-muted-foreground py-8">No sources found</td></tr>
                  ) : items.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.name}</td>
                      <td>{s.region ?? "—"}</td>
                      <td>{s.calorieRange ?? (s.specGar ? `${Number(s.specGar).toLocaleString()} GAR` : "—")}</td>
                      <td className="font-medium text-blue-500">
                        {s.stockAvailable != null ? Number(s.stockAvailable).toLocaleString() : "—"}
                      </td>
                      <td>{s.fobBargePriceUsd != null ? `$${Number(s.fobBargePriceUsd).toFixed(2)}` : "—"}</td>
                      <td className="font-mono text-xs">{s.fobBargePriceIdr != null ? `Rp ${Number(s.fobBargePriceIdr).toLocaleString()}` : "—"}</td>
                      <td>{s.jettyPort ?? "—"}</td>
                      <td><span className={`badge badge--sm ${KYC_PSI_BADGE[s.kycStatus] ?? ""}`}>{s.kycStatus.replace("_"," ")}</span></td>
                      <td><span className={`badge badge--sm ${KYC_PSI_BADGE[s.psiStatus] ?? ""}`}>{s.psiStatus.replace("_"," ")}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" className="button button--xs button--ghost button--primary" onClick={() => openEdit(s.id)}>Edit</button>
                          <button type="button" className="button button--xs button--ghost button--danger" onClick={() => setConfirmDelete(s.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{meta.total} sources · Page {meta.page} of {meta.totalPages}</p>
                <div className="flex gap-1">
                  <button type="button" className="button button--sm button--ghost button--neutral" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>←</button>
                  <button type="button" className="button button--sm button--ghost button--neutral" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SourceCards() {
  const { filterSearch, filterRegion, page } = useSourcesUIStore();
  const { data, isLoading } = useSourceList({ page, search: filterSearch || undefined, region: filterRegion || undefined });
  const items = (data?.data ?? []) as SourceItem[];

  if (isLoading) return <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((s) => {
        const stockPct = s.stockAvailable && s.minStockAlert && s.minStockAlert > 0
          ? Math.min(100, (s.stockAvailable / (s.minStockAlert * 10)) * 100) : null;
        return (
          <div key={s.id} className="card">
            <div className="card__body gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  {s.region && <p className="text-xs text-muted-foreground">{s.region}</p>}
                </div>
                <span className="badge badge--neutral badge--sm">{s.calorieRange ?? (s.specGar ? `${Number(s.specGar).toLocaleString()} GAR` : "—")}</span>
              </div>
              {stockPct !== null && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Stock</span>
                    <span className="font-medium">{Number(s.stockAvailable).toLocaleString()} MT</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full ${stockPct < 20 ? "bg-red-500" : stockPct < 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${stockPct}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-2 flex-wrap text-xs">
                {s.specGar  && <span>GAR: {Number(s.specGar).toLocaleString()}</span>}
                {s.specTs   && <span>TS: {s.specTs}%</span>}
                {s.specAsh  && <span>ASH: {s.specAsh}%</span>}
              </div>
              <div className="flex gap-1 flex-wrap">
                <span className={`badge badge--sm ${KYC_PSI_BADGE[s.kycStatus] ?? ""}`}>KYC: {s.kycStatus.replace("_"," ")}</span>
                <span className={`badge badge--sm ${KYC_PSI_BADGE[s.psiStatus] ?? ""}`}>PSI: {s.psiStatus.replace("_"," ")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertsTab() {
  const { data, isLoading } = useSourceAlerts();
  const alerts = (data?.data ?? []) as StockAlert[];
  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Low Stock Alerts</p>
        {isLoading ? <div className="animate-pulse space-y-2">{Array.from({length:3}).map((_,i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
        : alerts.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No low stock alerts — all levels OK</p>
        : alerts.map((a) => (
          <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg border ${a.alertLevel === "critical" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"}`}>
            <div>
              <p className="font-medium text-sm">{a.name}</p>
              {a.region && <p className="text-xs text-muted-foreground">{a.region}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{a.stockAvailable.toLocaleString()} MT</p>
              <p className="text-xs text-muted-foreground">threshold: {a.minStockAlert.toLocaleString()} MT</p>
            </div>
            <span className={`badge badge--sm ${a.alertLevel === "critical" ? "badge--danger" : "badge--warning"}`}>{a.alertLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ id }: { id: string }) {
  const { setConfirmDelete } = useSourcesUIStore();
  const { mutate, isPending } = useDeleteSource(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Deactivate Source?</h2>
          <p className="text-sm text-muted-foreground">This source will be marked inactive. Historical data is preserved.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral" onClick={() => setConfirmDelete(null)} disabled={isPending}>Cancel</button>
            <button type="button" className="button button--danger" disabled={isPending} aria-busy={isPending}
              onClick={() => mutate(undefined, { onSuccess: () => setConfirmDelete(null) })}>
              {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Deactivating…</> : "Deactivate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourcesClient() {
  const { activeTab, viewMode, filterSearch, filterRegion, modalOpen, confirmDeleteId,
    setActiveTab, setViewMode, setFilterSearch, setFilterRegion, openCreate } = useSourcesUIStore();

  const TABS = [{ key: "sources" as const, label: "Sources" }, { key: "alerts" as const, label: "Alerts" }, { key: "performance" as const, label: "Performance" }];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab + View toggle + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {TABS.map((t) => (
            <button key={t.key} type="button"
              className={`button button--sm ${activeTab === t.key ? "button--primary" : "button--ghost button--neutral"}`}
              onClick={() => setActiveTab(t.key)} aria-pressed={activeTab === t.key}>{t.label}</button>
          ))}
        </div>
        {activeTab === "sources" && (
          <>
            <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
              {(["table","card"] as const).map((v) => (
                <button key={v} type="button"
                  className={`button button--sm ${viewMode === v ? "button--primary" : "button--ghost button--neutral"}`}
                  onClick={() => setViewMode(v)} aria-pressed={viewMode === v}>
                  {v === "table" ? "Table" : "Cards"}
                </button>
              ))}
            </div>
            <div className="input-group flex-1 min-w-48">
              <span className="input-group__text">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                  <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
                </svg>
              </span>
              <input type="search" className="input" placeholder="Search name, region, calorie…"
                value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} aria-label="Search sources" />
            </div>
            <input type="text" className="input w-36" placeholder="Region filter"
              value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} aria-label="Filter by region" />
            <button type="button" className="button button--primary ms-auto" onClick={openCreate}>+ Add Source</button>
          </>
        )}
      </div>

      {activeTab === "sources"     && (viewMode === "table" ? <SourceTable /> : <SourceCards />)}
      {activeTab === "alerts"      && <AlertsTab />}
      {activeTab === "performance" && <div className="card"><div className="card__body"><p className="text-muted-foreground">Performance analytics — coming soon</p></div></div>}

      {modalOpen        && <SourceFormModal />}
      {confirmDeleteId  && <ConfirmDeleteModal id={confirmDeleteId} />}
    </div>
  );
}
