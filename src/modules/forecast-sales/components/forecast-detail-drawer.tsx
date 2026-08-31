"use client";

import { useState } from "react";
import { useForecastUIStore } from "../store/forecast-ui-store";
import { useForecastDetail, useSubmitForecast, useUpdateBuyerFeedback } from "../hooks/use-forecasts";
import { useForecastSupplierCandidates } from "../hooks/use-supplier-candidates";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { FCOButton } from "./fco-button";
import { SummaryReportButton } from "./summary-report-button";
import { SupplierCandidateModal } from "./supplier-candidate-modal";
import { UrgentAnalysisButton } from "./urgent-analysis-button";
import { generateShippingInstructionPDF, type SIData } from "@/lib/si-generator";


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
  const { data: candidateData } = useForecastSupplierCandidates(detailId ?? "");
  const { mutate: submit, isPending: submitting } = useSubmitForecast(detailId ?? "");
  const { mutate: updateFeedback, isPending: feedbackUpdating } = useUpdateBuyerFeedback(detailId ?? "");
  const project = data?.data;
  const candidates = candidateData?.data ?? [];

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");

  if (!detailId) return null;

  const canApprove = ["CEO","DIRUT","ASS_DIRUT"].includes(role ?? "");
  const canEditCandidates = ["draft","revision"].includes(project?.status ?? "");

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
                {["approved", "deal"].includes(project.status) && project.buyerFeedbackStatus === "deal" && (
                  <button type="button" className="button button--sm button--primary"
                    onClick={() => openConvert(project.id)}>→ Create Shipment</button>
                )}
                {["approved", "deal"].includes(project.status) && project.buyerFeedbackStatus !== "deal" && (
                  <span className="text-xs text-muted-foreground self-center" title="Buyer acceptance is required before creating a shipment">
                    Awaiting Buyer Acceptance to create shipment
                  </span>
                )}
                {canApprove && (
                  <UrgentAnalysisButton projectId={project.id} />
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
                  <button type="button" className="button button--sm button--ghost button--primary"
                    onClick={() => {
                      const siData: SIData = {
                        siNumber: `SI-${project.id.slice(0,8).toUpperCase()}-${new Date().getFullYear()}`,
                        projectName: project.projectName,
                        siTo: "PT. FONTANA RESOURCES INDONESIA",
                        shipper: "PT. FONTANA RESOURCES INDONESIA",
                        consignee: project.buyer,
                        notifyParty: project.buyer,
                        quantity: Number(project.quantity ?? 0),
                        nomination: project.projectName,
                        loadingPort: project.pol ?? "TBD",
                        dischargePort: project.pod ?? "TBD",
                        laycan: project.laycanStart && project.laycanEnd 
                          ? `${new Date(project.laycanStart).toLocaleDateString()} - ${new Date(project.laycanEnd).toLocaleDateString()}`
                          : "TBD",
                        shippingTerm: project.shippingTerm ?? "CIF",
                        analysisMethod: "ASTM",
                        goods: "BATUBARA",
                        marked: '" CLEAN ON BOARD "\n" FREIGHT PAYABLE AS PER CHARTER PARTY "',
                        specGar: project.specGar ? Number(project.specGar) : undefined,
                        specNar: (project as any).specNar ? Number((project as any).specNar) : undefined,
                        specTs: project.specTs ? Number(project.specTs) : undefined,
                        specAsh: project.specAsh ? Number(project.specAsh) : undefined,
                        specTm: project.specTm ? Number(project.specTm) : undefined,
                        specIm: (project as any).specIm ? Number((project as any).specIm) : undefined,
                        specVm: (project as any).specVm ? Number((project as any).specVm) : undefined,
                        specSize: (project as any).specSize ?? undefined,
                      };
                      const doc = generateShippingInstructionPDF(siData);
                      doc.save(`SI-${project.projectName.replace(/\s+/g, "_")}.pdf`);
                    }}
                  >
                    Generate SI
                  </button>
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
                  <Row label="NAR (kcal/kg)" value={project.specNar ? Number(project.specNar).toLocaleString() : null} />
                  <Row label="TS (%)"         value={project.specTs}  />
                  <Row label="ASH (%)"        value={project.specAsh} />
                  <Row label="TM (%)"         value={project.specTm}  />
                  <Row label="IM (%)"         value={project.specIm}  />
                  <Row label="VM (%)"         value={project.specVm}  />
                  <Row label="HGI"            value={project.specHgi} />
                  <Row label="Size"           value={project.specSize} />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-eyebrow">Supplier Candidates ({candidates.length})</p>
                  {canEditCandidates && (
                    <button type="button" className="button button--sm button--ghost button--primary"
                      onClick={() => { setEditingCandidateId(null); setShowCandidateModal(true); }}>
                      + Add Candidate
                    </button>
                  )}
                </div>
                {candidates.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {candidates.map((c) => {
                      const belowSpec = c.belowSpecFlags && Object.keys(c.belowSpecFlags).length > 0;
                      return (
                        <div key={c.id} className="card p-3 text-sm">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-medium">{c.supplierName}</p>
                              <p className="text-xs text-muted-foreground">{[c.origin, c.readinessStatus, c.legalStatus].filter(Boolean).join(" · ") || "No source detail"}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {c.selected && <span className="badge badge--sm badge--success">Selected</span>}
                              {c.fitScore != null && <span className="badge badge--sm badge--info">Fit {Number(c.fitScore).toFixed(0)}%</span>}
                              {canEditCandidates && (
                                <button type="button" className="button button--ghost button--neutral button--icon-only button--sm"
                                  onClick={() => { setEditingCandidateId(c.id); setShowCandidateModal(true); }}
                                  aria-label="Edit candidate">✎</button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 text-xs">
                            <Row label="Stock" value={c.stockMt ? `${Number(c.stockMt).toLocaleString()} MT` : null} />
                            <Row label="Price" value={c.priceUsd ? `$${Number(c.priceUsd).toFixed(2)}/MT` : null} />
                            <Row label="GAR/NAR" value={[c.gar, c.nar].filter(Boolean).join(" / ") || null} />
                            <Row label="TS/ASH/TM" value={[c.ts, c.ash, c.tm].filter(Boolean).join(" / ") || null} />
                            <Row label="IM/VM/HGI" value={[c.im, c.vm, c.hgi].filter(Boolean).join(" / ") || null} />
                            <Row label="Size" value={c.size} />
                          </div>
                          {belowSpec && (
                            <p className={`mt-2 text-xs ${c.belowSpecAcknowledged ? "text-warning" : "text-danger"}`}>
                              Below spec: {Object.keys(c.belowSpecFlags ?? {}).join(", ")}
                              {c.belowSpecAcknowledged && c.belowSpecReason ? ` — acknowledged: ${c.belowSpecReason}` : " — not acknowledged"}
                            </p>
                          )}
                          {c.notes && <p className="mt-2 text-xs text-muted-foreground">{c.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card p-6 text-center text-muted-foreground text-sm">
                    No supplier candidates added yet
                    {canEditCandidates && " — click Add Candidate to start sourcing"}
                  </div>
                )}
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
                        <div className="flex justify-between gap-2 mb-1">
                          <span className="font-medium">{a.user.name} ({a.user.role})</span>
                          <span className={`badge badge--xs ${a.status === "approved" ? "badge--success" : a.status === "rejected" ? "badge--danger" : "badge--neutral"}`}>
                            {a.status}
                          </span>
                        </div>
                        {a.comment && <p className="text-xs text-muted-foreground">{a.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* FCO History */}
              {project.fcoRecords.length > 0 && (
                <section>
                  <p className="text-eyebrow mb-2">FCO History</p>
                  <div className="flex flex-col gap-2">
                    {project.fcoRecords.map((fco) => (
                      <div key={fco.id} className="card p-3 text-sm">
                        <div className="flex justify-between gap-2 items-start">
                          <div>
                            <p className="font-medium">{fco.fcoNumber} v{fco.version}</p>
                            <p className="text-xs text-muted-foreground">{new Date(fco.generatedAt).toLocaleString()}</p>
                          </div>
                          {fco.pdfUrl && (
                            <a href={fco.pdfUrl} target="_blank" rel="noopener noreferrer"
                              className="button button--xs button--ghost button--primary">Download PDF</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Buyer Feedback Workflow */}
              {project.fcoNumber && ["approved","deal"].includes(project.status) && (
                <section>
                  <p className="text-eyebrow mb-2">Buyer Feedback</p>
                  <div className="card p-4">
                    <div className="flex justify-between gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Current Status</span>
                      <span className={`badge badge--sm ${
                        project.buyerFeedbackStatus === "deal" ? "badge--success" :
                        project.buyerFeedbackStatus === "failed" ? "badge--danger" :
                        project.buyerFeedbackStatus === "negotiation" ? "badge--warning" :
                        "badge--info"
                      }`}>
                        {project.buyerFeedbackStatus?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Not Set"}
                      </span>
                    </div>
                    {project.buyerFeedbackUpdatedAt && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Updated {new Date(project.buyerFeedbackUpdatedAt).toLocaleString()}
                      </p>
                    )}
                    {project.buyerFeedbackReason && (
                      <p className="text-xs bg-muted p-2 rounded mb-3">{project.buyerFeedbackReason}</p>
                    )}
                    
                    {project.buyerFeedbackStatus !== "deal" && (
                      <>
                        <div className="field mb-3">
                          <label className="field__label text-xs">Reason / Notes</label>
                          <textarea className="input text-xs" rows={2} value={feedbackReason}
                            onChange={(e) => setFeedbackReason(e.target.value)}
                            placeholder="Optional notes..." />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" className="button button--xs button--ghost button--primary"
                            disabled={feedbackUpdating}
                            onClick={() => updateFeedback({ status: "fco_sent", reason: feedbackReason })}>
                            FCO Sent
                          </button>
                          <button type="button" className="button button--xs button--ghost button--primary"
                            disabled={feedbackUpdating}
                            onClick={() => updateFeedback({ status: "waiting_feedback", reason: feedbackReason })}>
                            Waiting Feedback
                          </button>
                          <button type="button" className="button button--xs button--warning"
                            disabled={feedbackUpdating}
                            onClick={() => updateFeedback({ status: "negotiation", reason: feedbackReason })}>
                            Negotiation
                          </button>
                          <button type="button" className="button button--xs button--success"
                            disabled={feedbackUpdating}
                            onClick={() => updateFeedback({ status: "deal", reason: feedbackReason })}>
                            Deal
                          </button>
                          <button type="button" className="button button--xs button--danger"
                            disabled={feedbackUpdating || !feedbackReason.trim()}
                            onClick={() => updateFeedback({ status: "failed", reason: feedbackReason })}>
                            Failed
                          </button>
                        </div>
                      </>
                    )}

                    {project.buyerFeedbackHistory && project.buyerFeedbackHistory.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs font-medium cursor-pointer">History ({project.buyerFeedbackHistory.length})</summary>
                        <div className="mt-2 flex flex-col gap-1">
                          {project.buyerFeedbackHistory.slice(0, 5).map((h, i) => (
                            <div key={i} className="text-xs bg-muted p-2 rounded">
                              <span className="font-medium">{h.status.replace(/_/g, " ")}</span>
                              {h.reason && <span className="text-muted-foreground"> — {h.reason}</span>}
                              <p className="text-muted-foreground text-xs mt-1">{h.userName} · {new Date(h.timestamp).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
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

      {/* Supplier Candidate Modal */}
      {showCandidateModal && project && (
        <SupplierCandidateModal
          forecastId={detailId}
          editingId={editingCandidateId}
          targetSpec={{
            gar: project.specGar ? Number(project.specGar) : undefined,
            nar: project.specNar ? Number(project.specNar) : undefined,
            tm: project.specTm ? Number(project.specTm) : undefined,
            im: project.specIm ? Number(project.specIm) : undefined,
            ts: project.specTs ? Number(project.specTs) : undefined,
            ash: project.specAsh ? Number(project.specAsh) : undefined,
            vm: project.specVm ? Number(project.specVm) : undefined,
            hgi: project.specHgi ? Number(project.specHgi) : undefined,
            size: project.specSize ?? undefined,
            quantity: project.quantity ? Number(project.quantity) : undefined,
          }}
          onClose={() => { setShowCandidateModal(false); setEditingCandidateId(null); }}
        />
      )}
    </div>
  );
}
