"use client";

import { useForecastUIStore } from "../store/forecast-ui-store";
import { useForecastDetail, useSubmitForecast } from "../hooks/use-forecasts";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { FCOButton } from "./fco-button";
import { SummaryReportButton } from "./summary-report-button";


const STATUS_BADGE: Record<string, string> = {
  draft:"badge--neutral", submitted:"badge--info", waiting_approval:"badge--warning",
  approved:"badge--success", rejected:"badge--danger", revision:"badge--warning",
  deal:"badge--primary", failed:"badge--danger", cancelled:"badge--neutral",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0 w-32">{label}</span>
      <span className="text-xs font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export function ForecastDetailDrawer() {
  const { detailId, closeDetail, openEdit, openApprove, openConvert, openFailed } = useForecastUIStore();
  const { isExecutive, role } = useAuthStore();
  const { data, isLoading } = useForecastDetail(detailId ?? "");
  const { mutate: submit, isPending: submitting } = useSubmitForecast(detailId ?? "");
  const project = data?.data;

  if (!detailId) return null;

  const canApprove = ["CEO","DIRUT","ASS_DIRUT","COO","CMO","CPPO"].includes(role ?? "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-label="Project detail" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button type="button" className="absolute inset-0 bg-background/50 backdrop-blur-sm w-full"
        onClick={closeDetail} aria-label="Close drawer" tabIndex={-1} />

      <aside className="relative bg-surface w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-6 bg-muted rounded" />)}
          </div>
        ) : project ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-start justify-between gap-3 z-10">
              <div>
                <h2 className="font-semibold text-lg leading-tight">{project.projectName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {project.buyer} {project.buyerCountry && `· ${project.buyerCountry}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge ${STATUS_BADGE[project.status] ?? "badge--neutral"}`}>
                  {project.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <button type="button" className="button button--ghost button--neutral button--icon-only"
                  onClick={closeDetail} aria-label="Close">✕</button>
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-5">
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {["draft","revision"].includes(project.status) && (
                  <>
                    <button type="button" className="button button--sm button--ghost button--primary"
                      onClick={() => openEdit(project.id)}>Edit</button>
                    <button type="button" className="button button--sm button--primary"
                      disabled={submitting} aria-busy={submitting}
                      onClick={() => submit(undefined)}>
                      {submitting ? "Submitting…" : "Submit for Approval"}
                    </button>
                  </>
                )}
                {project.status === "waiting_approval" && canApprove && (
                  <button type="button" className="button button--sm button--success"
                    onClick={() => openApprove(project.id)}>Review</button>
                )}
                {project.status === "approved" && (
                  <button type="button" className="button button--sm button--primary"
                    onClick={() => openConvert(project.id)}>→ Create Shipment</button>
                )}
                <FCOButton
                  projectId={project.id}
                  project={project}
                  action={project.fcoNumber ? "revise" : "generate"}
                />
                {["approved","deal"].includes(project.status) && (
                  <SummaryReportButton forecastId={project.id} />
                )}
                {["approved","deal"].includes(project.status) && (
                  <button type="button" className="button button--sm button--ghost button--danger"
                    onClick={() => openFailed(project.id)}>Mark Failed</button>
                )}
              </div>

              {/* General info */}
              <section>
                <p className="text-eyebrow mb-2">Project Info</p>
                <div className="card p-4">
                  <Row label="Segment"     value={project.segment} />
                  <Row label="Quantity"    value={project.quantity ? `${Number(project.quantity).toLocaleString()} ${project.quantityUnit}` : null} />
                  <Row label="Shipping Term" value={project.shippingTerm} />
                  <Row label="POL"         value={project.pol} />
                  <Row label="POD"         value={project.pod} />
                  <Row label="Laycan"      value={project.laycanStart ? `${new Date(project.laycanStart).toLocaleDateString()} – ${project.laycanEnd ? new Date(project.laycanEnd).toLocaleDateString() : "?"}` : null} />
                  <Row label="FCO Number"  value={project.fcoNumber ? `${project.fcoNumber} v${project.fcoVersion}` : null} />
                  <Row label="Created By"  value={project.createdBy.name} />
                  <Row label="Created At"  value={new Date(project.createdAt).toLocaleDateString()} />
                </div>
              </section>

              {/* Coal spec */}
              <section>
                <p className="text-eyebrow mb-2">Coal Spec</p>
                <div className="card p-4">
                  <Row label="GAR (kcal/kg)" value={project.specGar ? Number(project.specGar).toLocaleString() : null} />
                  <Row label="TS (%)"         value={project.specTs}  />
                  <Row label="ASH (%)"        value={project.specAsh} />
                  <Row label="TM (%)"         value={project.specTm}  />
                </div>
              </section>

              {/* P&L — executive only */}
              {isExecutive && (
                <section>
                  <p className="text-eyebrow mb-2">Estimated P&amp;L (Confidential)</p>
                  <div className="card p-4">
                    <Row label="Sales Price Est."  value={project.salesPriceEst  ? `$${Number(project.salesPriceEst).toFixed(2)}/MT`  : null} />
                    <Row label="Buying Price Est." value={project.buyingPriceEst ? `$${Number(project.buyingPriceEst).toFixed(2)}/MT` : null} />
                    <Row label="Freight Est."      value={project.freightEst     ? `$${Number(project.freightEst).toFixed(2)}/MT`     : null} />
                    <Row label="Margin Est."       value={project.marginEst      ? `$${Number(project.marginEst).toFixed(2)}/MT`      : null} />
                  </div>
                </section>
              )}

              {/* Approval history */}
              {project.approvals.length > 0 && (
                <section>
                  <p className="text-eyebrow mb-2">Approval History</p>
                  <div className="flex flex-col gap-2">
                    {project.approvals.map((a) => (
                      <div key={a.id} className="card p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium">{a.user.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                            <span className={`badge badge--sm ${STATUS_BADGE[a.status] ?? "badge--neutral"}`}>
                              {a.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        {a.comment && <p className="text-xs text-muted-foreground italic">&ldquo;{a.comment}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Revision history */}
              {project.revisions.length > 0 && (
                <section>
                  <p className="text-eyebrow mb-2">Revision History</p>
                  <div className="flex flex-col gap-2">
                    {project.revisions.map((r) => (
                      <div key={r.id} className="card p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium">{r.user.name}</span>
                          <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Reason: {r.reason}</p>
                        <p className="text-xs mt-0.5">{(r.changes as unknown[]).length} field(s) changed</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Failure info */}
              {project.status === "failed" && (project.failedReason || project.buyerFeedback) && (
                <section>
                  <p className="text-eyebrow mb-2">Failure Info</p>
                  <div className="card p-4 text-sm space-y-1">
                    {project.failedCategory && <Row label="Category" value={project.failedCategory} />}
                    {project.failedReason   && <Row label="Reason"   value={project.failedReason}   />}
                    {project.buyerFeedback  && <Row label="Buyer Feedback" value={project.buyerFeedback} />}
                  </div>
                </section>
              )}

              {/* Remarks */}
              {project.remarks && (
                <section>
                  <p className="text-eyebrow mb-1">Remarks</p>
                  <p className="text-sm text-muted-foreground">{project.remarks}</p>
                </section>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-muted-foreground text-sm">Project not found</div>
        )}
      </aside>
    </div>
  );
}
