"use client";

import { useDealList } from "../hooks/use-deals";
import { useSalesMonitorUIStore } from "../store/sales-monitor-ui-store";

const STATUS_BADGE: Record<string, string> = {
  waiting_approval: "badge--neutral",
  waiting_buyer:    "badge--warning",
  offer_submitted:  "badge--info",
  confirmed:        "badge--primary",
  in_transit:       "badge--primary",
  completed:        "badge--success",
  cancelled:        "badge--danger",
  rejected:         "badge--danger",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DealTable() {
  const {
    activeTab, filterStatus, filterSearch, page,
    setPage, openEdit, setConfirmDelete,
  } = useSalesMonitorUIStore();

  const segment = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading } = useDealList({
    page,
    status: filterStatus === "all" ? undefined : filterStatus,
    search: filterSearch || undefined,
  });

  const items = (data?.data ?? []).filter((d) =>
    !segment || d.segment === segment,
  );
  const meta = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm" aria-label="Deals table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Project Name</th>
                    <th>Buyer</th>
                    <th>Segment</th>
                    <th>Qty (MT)</th>
                    <th>Price /MT</th>
                    <th>Spec GAR</th>
                    <th>Laycan / Port</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-muted-foreground py-8">
                        No deals found
                      </td>
                    </tr>
                  ) : (
                    items.map((deal, idx) => (
                      <tr key={deal.id}>
                        <td className="text-muted-foreground">
                          {(page - 1) * 25 + idx + 1}
                        </td>
                        <td className="font-medium">{deal.projectName}</td>
                        <td>
                          <div>{deal.buyer}</div>
                          {deal.buyerCountry && (
                            <div className="text-xs text-muted-foreground">{deal.buyerCountry}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge--sm ${deal.segment === "export" ? "badge--info" : "badge--neutral"}`}>
                            {deal.segment}
                          </span>
                        </td>
                        <td>{Number(deal.quantity).toLocaleString()}</td>
                        <td>
                          {deal.pricePerMt != null ? `$${Number(deal.pricePerMt).toFixed(2)}` : "—"}
                        </td>
                        <td>{deal.specGar != null ? `${Number(deal.specGar).toLocaleString()} kcal` : "—"}</td>
                        <td className="text-xs">
                          {[deal.laycanPol, deal.shippingTerm].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td>
                          <span className={`badge badge--sm ${STATUS_BADGE[deal.status] ?? "badge--neutral"}`}>
                            {statusLabel(deal.status)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="button button--xs button--ghost button--primary"
                              onClick={() => openEdit(deal.id)}
                              aria-label={`Edit ${deal.projectName}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button button--xs button--ghost button--danger"
                              onClick={() => setConfirmDelete(deal.id)}
                              aria-label={`Delete ${deal.projectName}`}
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {meta.total} deals · Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage(meta.page + 1)}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
