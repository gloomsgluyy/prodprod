"use client";

import { useShipmentUIStore } from "../store/shipment-ui-store";
import { useShipmentList } from "../hooks/use-shipments";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_BADGE: Record<string, string> = {
  upcoming:   "badge--neutral",
  loading:    "badge--primary",
  in_transit: "badge--info",
  completed:  "badge--success",
  cancelled:  "badge--danger",
};

const PAGE_SIZES = [10, 25, 50, 100];

export function ShipmentTable() {
  const {
    activeTab, filterSearch, filterRegion, filterYear,
    page, pageSize, setPage, setPageSize, openDetail, openEdit, openCloseModal,
    detailId
  } = useShipmentUIStore();
  const { isExecutive } = useAuthStore();
  const router = useRouter();

  const status = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading } = useShipmentList({
    page, pageSize, status,
    search:  filterSearch || undefined,
    region:  filterRegion || undefined,
    year:    filterYear   || undefined,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: pageSize > 10 ? 8 : 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="table table--striped text-sm w-full"
                aria-label="Shipments table"
              >
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>Shipment No</th>
                    <th>Status</th>
                    <th>Buyer</th>
                    <th>Vessel / Barge</th>
                    <th>Port Muat</th>
                    <th>Qty Plan (MT)</th>
                    <th>Qty Loaded</th>
                    <th>BL Date</th>
                    <th>Laycan</th>
                    <th>Source</th>
                    {isExecutive && <th>Sell $</th>}
                    {isExecutive && <th>Buy $</th>}
                    {isExecutive && <th>Margin</th>}
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={isExecutive ? 16 : 13} className="text-center text-muted-foreground py-10">
                        No shipments found
                      </td>
                    </tr>
                  ) : (
                    items.map((s, idx) => {
                      const qty = s.qtyLoaded ?? s.qtyPlan;
                      return (
                        <tr
                          key={s.id}
                          className={`cursor-pointer transition-colors ${detailId === s.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-surface"}`}
                           onClick={() => router.push(`/shipment-monitor/${s.id}`)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && openDetail(s.id)}
                          aria-label={`Open ${s.shipmentNumber}`}
                        >
                          <td className="text-muted-foreground">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="font-medium">{s.shipmentNumber}</td>
                          <td>
                            <span className={`badge badge--sm ${STATUS_BADGE[s.status] ?? ""}`}>
                              {s.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td>
                            <div>{s.buyer}</div>
                            {s.buyerCountry && (
                              <div className="text-xs text-muted-foreground">{s.buyerCountry}</div>
                            )}
                          </td>
                          <td className="text-xs">
                            {[s.vesselName, s.bargeName].filter(Boolean).join(" / ") || "—"}
                          </td>
                          <td>{s.pol ?? "—"}</td>
                          <td>{qty != null ? Number(qty).toLocaleString() : "—"}</td>
                          <td>{s.qtyLoaded != null ? Number(s.qtyLoaded).toLocaleString() : "—"}</td>
                          <td className="text-xs">
                            {s.blDate ? new Date(s.blDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="text-xs">
                            {s.laycanStart
                              ? `${new Date(s.laycanStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}${s.laycanEnd ? ` – ${new Date(s.laycanEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : ""}`
                              : "—"}
                          </td>
                          <td className="text-xs">{s.source ?? "—"}</td>
                          {isExecutive && (
                            <td className="font-mono text-xs">
                              {s.salesPrice != null ? `$${Number(s.salesPrice).toFixed(2)}` : "—"}
                            </td>
                          )}
                          {isExecutive && (
                            <td className="font-mono text-xs">
                              {s.buyingPrice != null ? `$${Number(s.buyingPrice).toFixed(2)}` : "—"}
                            </td>
                          )}
                          {isExecutive && (
                            <td className={`font-mono text-xs font-medium ${s.marginMt != null ? (Number(s.marginMt) >= 0 ? "text-emerald-500" : "text-red-500") : ""}`}>
                              {s.marginMt != null ? `$${Number(s.marginMt).toFixed(2)}` : "—"}
                            </td>
                          )}
                          <td>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-12 rounded-full bg-border overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${(s.completionScore ?? 0) >= 80 ? "bg-emerald-500" : (s.completionScore ?? 0) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                  style={{ width: `${s.completionScore ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {s.completionScore ?? 0}%
                              </span>
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1">
                              <Link href={`/shipment-monitor/${s.id}`} className="button button--xs button--primary"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Open workspace ${s.shipmentNumber}`}>Workspace</Link>
                              <button
                                type="button"
                                className="button button--xs button--ghost button--primary"
                                onClick={() => openEdit(s.id)}
                                aria-label={`Edit ${s.shipmentNumber}`}
                              >
                                Edit
                              </button>
                              {!["completed", "cancelled"].includes(s.status) && (
                                <button
                                  type="button"
                                  className="button button--xs button--success"
                                  onClick={() => openCloseModal(s.id)}
                                  aria-label={`Close ${s.shipmentNumber}`}
                                >
                                  Close
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {meta.total} shipments · Page {meta.page} of {meta.totalPages}
                  </p>
                  <select
                    className="select select--sm w-20"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    aria-label="Page size"
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>{s} / page</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1} onClick={() => setPage(1)}>«</button>
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>‹</button>
                  {/* Visible page numbers */}
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4));
                    return start + i;
                  }).map((p) => (
                    <button key={p} type="button"
                      className={`button button--sm ${p === meta.page ? "button--primary" : "button--ghost button--neutral"}`}
                      onClick={() => setPage(p)} aria-current={p === meta.page ? "page" : undefined}>
                      {p}
                    </button>
                  ))}
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>›</button>
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.totalPages)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
