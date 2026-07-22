"use client";

import { useForecastList } from "../hooks/use-forecasts";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import type { ForecastListItem } from "../hooks/use-forecasts";

const STATUS_BADGE: Record<string, string> = {
  draft:            "badge--neutral",
  submitted:        "badge--info",
  waiting_approval: "badge--warning",
  approved:         "badge--success",
  rejected:         "badge--danger",
  revision:         "badge--warning",
  deal:             "badge--primary",
  failed:           "badge--danger",
  cancelled:        "badge--neutral",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ActionCell({ project }: { project: ForecastListItem }) {
  const { openDetail, openEdit, openApprove, openConvert, openFailed, setConfirmDelete } = useForecastUIStore();
  const { role } = useAuthStore();

  const APPROVER_ROLES = ["CEO","DIRUT","ASS_DIRUT","COO","CMO","CPPO"];
  const canApprove = APPROVER_ROLES.includes(role ?? "");

  return (
    <div className="flex flex-wrap gap-1">
      <button type="button" className="button button--xs button--ghost button--primary"
        onClick={() => openDetail(project.id)}>
        View
      </button>
      {["draft","revision"].includes(project.status) && (
        <button type="button" className="button button--xs button--ghost button--neutral"
          onClick={() => openEdit(project.id)}>
          Edit
        </button>
      )}
      {project.status === "waiting_approval" && canApprove && (
        <button type="button" className="button button--xs button--success"
          onClick={() => openApprove(project.id)}>
          Review
        </button>
      )}
      {project.status === "approved" && (
        <button type="button" className="button button--xs button--primary"
          onClick={() => openConvert(project.id)}>
          → Shipment
        </button>
      )}
      {["approved","deal"].includes(project.status) && (
        <button type="button" className="button button--xs button--ghost button--danger"
          onClick={() => openFailed(project.id)}>
          Failed
        </button>
      )}
      {project.status === "draft" && (
        <button type="button" className="button button--xs button--ghost button--danger"
          onClick={() => setConfirmDelete(project.id)}>
          Del
        </button>
      )}
    </div>
  );
}

export function ForecastTable() {
  const { activeTab, filterStatus, filterSearch, page, setPage } = useForecastUIStore();
  const { isExecutive } = useAuthStore();

  const segment = activeTab === "all" ? undefined : activeTab;
  const { data, isLoading } = useForecastList({
    page,
    status:  filterStatus === "all" ? undefined : filterStatus,
    search:  filterSearch || undefined,
    segment,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm" aria-label="Forecast projects">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Project Name</th>
                    <th>Buyer</th>
                    <th>Segment</th>
                    <th>Qty (MT)</th>
                    <th>Spec GAR</th>
                    <th>Laycan</th>
                    <th>Status</th>
                    {isExecutive && <th>Margin Est.</th>}
                    <th>FCO</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={isExecutive ? 11 : 10} className="text-center text-muted-foreground py-8">
                        No forecast projects found
                      </td>
                    </tr>
                  ) : (
                    items.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="text-muted-foreground">{(page - 1) * 25 + idx + 1}</td>
                        <td className="font-medium">{p.projectName}</td>
                        <td>
                          <div>{p.buyer}</div>
                          {p.buyerCountry && <div className="text-xs text-muted-foreground">{p.buyerCountry}</div>}
                        </td>
                        <td>
                          <span className={`badge badge--sm ${p.segment === "export" ? "badge--info" : "badge--neutral"}`}>
                            {p.segment ?? "—"}
                          </span>
                        </td>
                        <td>{p.quantity != null ? Number(p.quantity).toLocaleString() : "—"}</td>
                        <td>{p.specGar != null ? `${Number(p.specGar).toLocaleString()} kcal` : "—"}</td>
                        <td className="text-xs">
                          {p.laycanStart
                            ? `${new Date(p.laycanStart).toLocaleDateString()}${p.laycanEnd ? ` – ${new Date(p.laycanEnd).toLocaleDateString()}` : ""}`
                            : "—"}
                        </td>
                        <td>
                          <span className={`badge badge--sm ${STATUS_BADGE[p.status] ?? "badge--neutral"}`}>
                            {statusLabel(p.status)}
                          </span>
                        </td>
                        {isExecutive && (
                          <td className="font-mono text-xs">
                            {p.marginEst != null ? `$${Number(p.marginEst).toFixed(2)}/MT` : "—"}
                          </td>
                        )}
                        <td>
                          {p.fcoNumber
                            ? <span className="badge badge--primary badge--sm">v{p.fcoVersion}</span>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td><ActionCell project={p} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {meta.total} projects · Page {meta.page} of {meta.totalPages}
                </p>
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
