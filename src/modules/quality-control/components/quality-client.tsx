"use client";

import { useQualityUIStore } from "../store/quality-ui-store";
import { useQualityList, useDeleteQuality, useQualityDetail } from "../hooks/use-quality";
import { QualityFormModal } from "./quality-form-modal";
import { compareSpecs } from "../utils/quality-compare";

const STATUSES = ["all","pending","passed","warning","need_review","claim_potential","rejected","approved"] as const;

const STATUS_BADGE: Record<string, string> = {
  pending:         "badge--neutral",
  passed:          "badge--success",
  warning:         "badge--warning",
  need_review:     "badge--info",
  claim_potential: "badge--danger",
  rejected:        "badge--danger",
  approved:        "badge--success",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-500", passed: "text-emerald-500", warning: "text-orange-500",
  need_review: "text-violet-500", claim_potential: "text-red-600",
  rejected: "text-red-500", approved: "text-emerald-600",
};

function SummaryCards() {
  const statuses = ["pending","passed","warning","need_review","claim_potential","rejected"] as const;
  const queries  = statuses.map((s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQualityList({ page: 1, status: s })
  );
  const labels: Record<string, string> = {
    pending:"Pending", passed:"Passed", warning:"Warning",
    need_review:"Need Review", claim_potential:"Claim Potential", rejected:"Rejected",
  };
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {statuses.map((s, i) => (
        <div key={s} className="card card--stat">
          <div className="card__body">
            <p className="text-eyebrow">{labels[s]}</p>
            <p className={`text-2xl font-light ${STATUS_COLORS[s]}`}>
              {queries[i].isLoading ? "…" : queries[i].data?.meta?.total ?? 0}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailPanel() {
  const { detailId, closeDetail } = useQualityUIStore();
  const { data, isLoading } = useQualityDetail(detailId ?? "");
  const record = data?.data;

  if (!detailId) return null;

  const deltas = record?.contractSpec && record?.qcResult
    ? compareSpecs(record.qcResult, record.contractSpec)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 w-full bg-background/50 backdrop-blur-sm"
        onClick={closeDetail} aria-label="Close" tabIndex={-1} />
      <aside className="relative bg-surface w-full max-w-2xl h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{record?.cargoName ?? "Loading…"}</h2>
            <p className="text-xs text-muted-foreground">{record?.cargoId}</p>
          </div>
          <div className="flex items-center gap-2">
            {record && <span className={`badge ${STATUS_BADGE[record.status] ?? ""}`}>{record.status.replace(/_/g," ")}</span>}
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeDetail} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          {isLoading ? <div className="animate-pulse space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-8 bg-muted rounded"/>)}</div>
          : record ? (
            <>
              {/* Spec comparison table */}
              {deltas.length > 0 && (
                <section>
                  <p className="text-eyebrow mb-2">Spec vs Contract Comparison (QC Result)</p>
                  <div className="overflow-x-auto">
                    <table className="table text-xs">
                      <thead><tr><th>Param</th><th>Contract</th><th>QC Result</th><th>Delta</th><th>Status</th></tr></thead>
                      <tbody>
                        {deltas.map((d) => (
                          <tr key={d.param}>
                            <td className="font-medium">{d.label}</td>
                            <td>{d.contract ?? "—"}</td>
                            <td>{d.measured ?? "—"}</td>
                            <td className={d.delta != null ? (d.delta > 0 ? "text-emerald-500" : d.delta < 0 ? "text-red-500" : "") : ""}>
                              {d.delta != null ? `${d.delta > 0 ? "+" : ""}${d.delta}` : "—"}
                            </td>
                            <td><span className={`badge badge--xs ${d.status === "pass" ? "badge--success" : d.status === "warning" ? "badge--warning" : "badge--danger"}`}>{d.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* All 7 stages */}
              <section>
                <p className="text-eyebrow mb-2">All Stage Results</p>
                <div className="overflow-x-auto">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Stage</th>
                        {["GAR","NAR","TM","IM","TS","ASH","VM","HGI","ADB"].map((p)=><th key={p}>{p}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Spec Result",    record.specResult],
                        ["Contract Spec",  record.contractSpec],
                        ["Source Est.",    record.sourceEstimate],
                        ["QC Result",      record.qcResult],
                        ["PSI Result",     record.psiResult],
                        ["COA POL",        record.coaPolResult],
                        ["COA POD",        record.coaPodResult],
                      ].map(([label, spec]) => (
                        <tr key={label as string}>
                          <td className="font-medium">{label as string}</td>
                          {(["gar","nar","tm","im","ts","ash","vm","hgi","adb"] as const).map((p) => (
                            <td key={p}>{spec ? ((spec as Record<string,number|undefined>)[p] ?? "—") : "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {record.warningNotes && (
                <section>
                  <p className="text-eyebrow mb-1">Warning Notes</p>
                  <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">{record.warningNotes}</p>
                </section>
              )}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ConfirmDeleteModal({ id }: { id: string }) {
  const { setConfirmDelete } = useQualityUIStore();
  const { mutate, isPending } = useDeleteQuality(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Delete Quality Result?</h2>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="button button--ghost button--neutral" onClick={() => setConfirmDelete(null)} disabled={isPending}>Cancel</button>
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

export function QualityClient() {
  const { filterStatus, filterSearch, page, modalOpen, detailId, confirmDeleteId,
    setFilterStatus, setFilterSearch, setPage, openCreate, openDetail, openEdit, setConfirmDelete } = useQualityUIStore();

  const { data, isLoading } = useQualityList({
    page,
    status: filterStatus === "all" ? undefined : filterStatus,
    search: filterSearch || undefined,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards />

      <div className="flex flex-wrap items-center gap-3">
        <select className="select select--sm w-44" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Status" : s.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
          ))}
        </select>
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search cargo, surveyor…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} aria-label="Search quality results" />
        </div>
        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>+ Add Result</button>
      </div>

      <div className="card">
        <div className="card__body gap-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-muted rounded"/>)}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table--striped text-sm" aria-label="Quality results table">
                  <thead>
                    <tr><th>#</th><th>Cargo</th><th>Surveyor</th><th>Sampling Date</th><th>Status</th><th>Comparison</th><th></th></tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted-foreground py-8">No quality results</td></tr>
                    ) : items.map((r, idx) => (
                      <tr key={r.id} className="cursor-pointer hover:bg-surface" onClick={() => openDetail(r.id)}>
                        <td className="text-muted-foreground">{(page-1)*25+idx+1}</td>
                        <td>
                          <div className="font-medium">{r.cargoName}</div>
                          <div className="text-xs text-muted-foreground">{r.cargoId}</div>
                        </td>
                        <td>{r.surveyor ?? "—"}</td>
                        <td className="text-xs">{r.samplingDate ? new Date(r.samplingDate).toLocaleDateString() : "—"}</td>
                        <td><span className={`badge badge--sm ${STATUS_BADGE[r.status] ?? ""}`}>{r.status.replace(/_/g," ")}</span></td>
                        <td>{r.comparisonStatus ?? "—"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button type="button" className="button button--xs button--ghost button--primary" onClick={() => openEdit(r.id)}>Edit</button>
                            <button type="button" className="button button--xs button--ghost button--danger" onClick={() => setConfirmDelete(r.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">{meta.total} results · Page {meta.page} of {meta.totalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" className="button button--sm button--ghost button--neutral" disabled={meta.page<=1} onClick={()=>setPage(meta.page-1)}>←</button>
                    <button type="button" className="button button--sm button--ghost button--neutral" disabled={meta.page>=meta.totalPages} onClick={()=>setPage(meta.page+1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modalOpen       && <QualityFormModal />}
      {detailId        && <DetailPanel />}
      {confirmDeleteId && <ConfirmDeleteModal id={confirmDeleteId} />}
    </div>
  );
}
