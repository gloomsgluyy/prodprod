"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDirectoryUIStore } from "../store/directory-ui-store";
import {
  usePartnerList, usePartnerDetail, useCreatePartner,
  useUpdatePartner, useDeletePartner, useRunDueDiligence,
  type PartnerItem,
} from "../hooks/use-directory";

const TYPES = ["buyer","supplier","vendor","surveyor","freight"] as const;

const RISK_BADGE: Record<string, string> = {
  Low:    "badge--success",
  Medium: "badge--warning",
  High:   "badge--danger",
};

// ── Legal doc expiry ──────────────────────────────────────────────────────────
function LegalDocBadge({ doc }: { doc: { name: string; expiryDate?: string; status?: string } }) {
  const now = new Date();
  const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / 86400000) : null;

  const cls = !expiry ? "badge--neutral"
    : daysLeft! < 0  ? "badge--danger"
    : daysLeft! < 30 ? "badge--warning"
    : "badge--success";

  const label = !expiry ? doc.name
    : daysLeft! < 0  ? `${doc.name} (Expired)`
    : daysLeft! < 30 ? `${doc.name} (${daysLeft}d)`
    : doc.name;

  return <span className={`badge badge--xs ${cls}`} title={doc.expiryDate ?? ""}>{label}</span>;
}

// ── Partner form modal ────────────────────────────────────────────────────────
const formSchema = z.object({
  name:         z.string().min(1,"Required"),
  type:         z.enum(TYPES),
  country:      z.string().optional(),
  address:      z.string().optional(),
  contactName:  z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  npwp:         z.string().optional(),
  bankAccount:  z.string().optional(),
  fleetSize:    z.coerce.number().int().min(0).optional(),
  notes:        z.string().optional(),
  legalDocuments: z.array(z.object({
    name:       z.string().min(1,"Required"),
    expiryDate: z.string().optional(),
    status:     z.string().optional(),
  })).optional(),
});
type PartnerForm = z.infer<typeof formSchema>;

function PartnerFormModal() {
  const { editingId, modalOpen, closeModal } = useDirectoryUIStore();
  const isEdit = !!editingId;
  const { data } = usePartnerDetail(editingId ?? "");
  const detail  = data?.data;

  const { mutate: create, isPending: creating } = useCreatePartner();
  const { mutate: update, isPending: updating } = useUpdatePartner(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<PartnerForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "buyer", legalDocuments: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "legalDocuments" });

  useEffect(() => {
    if (detail && isEdit) {
      reset({
        name:          detail.name,
        type:          detail.type as PartnerForm["type"],
        country:       detail.country       ?? "",
        address:       detail.address       ?? "",
        contactName:   detail.contactName   ?? "",
        contactEmail:  detail.contactEmail  ?? "",
        contactPhone:  detail.contactPhone  ?? "",
        npwp:          detail.npwp          ?? "",
        bankAccount:   detail.bankAccount   ?? "",
        fleetSize:     detail.fleetSize     ?? undefined,
        notes:         detail.notes         ?? "",
        legalDocuments:(detail.legalDocuments as PartnerForm["legalDocuments"]) ?? [],
      });
    }
  }, [detail, isEdit, reset]);

  function onSubmit(d: PartnerForm) {
    if (isEdit) update(d, { onSuccess: closeModal });
    else        create(d, { onSuccess: closeModal });
  }

  if (!modalOpen && !isEdit) return null;

  const F = ({ id, label, type="text", ph }: { id: keyof PartnerForm; label: string; type?: string; ph?: string }) => (
    <div className="field">
      <label className="field__label text-xs" htmlFor={`dir-${id}`}>{label}</label>
      <input id={`dir-${id}`} type={type} className="input" placeholder={ph}
        {...register(id)} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Partner" : "Add Partner"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeModal} aria-label="Close">✕</button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {/* Basic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="field col-span-2">
                <label className="field__label text-xs" htmlFor="dir-name">Company Name *</label>
                <input id="dir-name" type="text"
                  className={`input ${errors.name?"input--invalid":""}`}
                  placeholder="PT. Company Name"
                  {...register("name")} />
                {errors.name && <p className="text-xs text-danger mt-0.5">{errors.name.message}</p>}
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="dir-type">Type *</label>
                <select id="dir-type" className="select" {...register("type")}>
                  {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <F id="country"     label="Country"      ph="Indonesia" />
              <F id="contactName" label="PIC Name"     ph="Budi Santoso" />
              <F id="contactPhone"label="Phone"        ph="+62-8xx" />
              <div className="field col-span-2">
                <label className="field__label text-xs" htmlFor="dir-email">Email</label>
                <input id="dir-email" type="email" className="input" placeholder="contact@company.com"
                  {...register("contactEmail")} />
              </div>
              <F id="npwp"        label="NPWP"         ph="01.234.567.8-xxx.xxx" />
              <F id="bankAccount" label="Bank Account" ph="BCA 1234567890" />
              <F id="fleetSize"   label="Fleet Size"   type="number" ph="0" />
            </div>

            <div className="field">
              <label className="field__label text-xs" htmlFor="dir-address">Address</label>
              <textarea id="dir-address" className="input" rows={2} {...register("address")} />
            </div>

            {/* Legal documents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Legal Documents</p>
                <button type="button" className="button button--xs button--ghost button--primary"
                  onClick={() => append({ name: "", expiryDate: "", status: "valid" })}>
                  + Add Doc
                </button>
              </div>
              {fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 mb-2 items-end">
                  <div className="field flex-1">
                    {i === 0 && <label className="field__label text-xs">Document</label>}
                    <input type="text" className="input" placeholder="SIUP / TDP / AHU"
                      {...register(`legalDocuments.${i}.name`)} />
                  </div>
                  <div className="field w-36">
                    {i === 0 && <label className="field__label text-xs">Expiry</label>}
                    <input type="date" className="input"
                      {...register(`legalDocuments.${i}.expiryDate`)} />
                  </div>
                  <button type="button" className="button button--xs button--ghost button--danger mb-0.5"
                    onClick={() => remove(i)} aria-label="Remove">✕</button>
                </div>
              ))}
            </div>

            <div className="field">
              <label className="field__label text-xs" htmlFor="dir-notes">Notes</label>
              <textarea id="dir-notes" className="input" rows={2} {...register("notes")} />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : isEdit ? "Update" : "Add Partner"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Partner card ──────────────────────────────────────────────────────────────
function PartnerCard({ partner }: { partner: PartnerItem }) {
  const { openDetail, openEdit, setConfirmDelete } = useDirectoryUIStore();
  const dd = partner.aiDueDiligence;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{partner.name}</p>
            {partner.country && <p className="text-xs text-muted-foreground">{partner.country}</p>}
          </div>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            <span className="badge badge--neutral badge--sm capitalize">{partner.type}</span>
            {!partner.isActive && <span className="badge badge--danger badge--xs">Inactive</span>}
          </div>
        </div>

        {/* Contact */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          {partner.contactName  && <p>👤 {partner.contactName}</p>}
          {partner.contactPhone && <p>📞 {partner.contactPhone}</p>}
          {partner.contactEmail && <p>✉️ {partner.contactEmail}</p>}
          {partner.fleetSize != null && partner.fleetSize > 0 && <p>🚢 Fleet: {partner.fleetSize}</p>}
        </div>

        {/* Legal docs */}
        {(partner.legalDocuments ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(partner.legalDocuments ?? []).map((doc, i) => (
              <LegalDocBadge key={i} doc={doc} />
            ))}
          </div>
        )}

        {/* AI Due Diligence */}
        {dd && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-surface border border-border text-xs">
            <span className={`badge badge--xs ${RISK_BADGE[dd.riskLevel] ?? "badge--neutral"}`}>{dd.riskLevel}</span>
            <span className="text-muted-foreground">DD Score: {dd.score}/100</span>
            {dd.isStub && <span className="text-amber-500 text-xs">(stub)</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 pt-1 border-t border-border">
          <button type="button" className="button button--xs button--ghost button--primary"
            onClick={() => openDetail(partner.id)}>View</button>
          <button type="button" className="button button--xs button--ghost button--neutral"
            onClick={() => openEdit(partner.id)}>Edit</button>
          <button type="button" className="button button--xs button--ghost button--danger ms-auto"
            onClick={() => setConfirmDelete(partner.id)}>Del</button>
        </div>
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function PartnerDetailDrawer() {
  const { detailId, closeDetail, openEdit } = useDirectoryUIStore();
  const { data, isLoading } = usePartnerDetail(detailId ?? "");
  const { mutate: runDD, isPending: ddLoading, data: ddResult } = useRunDueDiligence(detailId ?? "");
  const partner = data?.data;
  const dd = ddResult?.data ?? partner?.aiDueDiligence;

  if (!detailId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 w-full bg-background/50 backdrop-blur-sm"
        onClick={closeDetail} aria-label="Close" tabIndex={-1} />
      <aside className="relative bg-surface w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{partner?.name ?? "Loading…"}</h2>
            <p className="text-xs text-muted-foreground capitalize">{partner?.type}</p>
          </div>
          <button type="button" className="button button--ghost button--neutral button--icon-only"
            onClick={closeDetail} aria-label="Close">✕</button>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          {isLoading ? <div className="animate-pulse space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-8 bg-muted rounded"/>)}</div>
          : partner ? (
            <>
              <div className="flex gap-2">
                <button type="button" className="button button--sm button--ghost button--primary"
                  onClick={() => openEdit(partner.id)}>Edit</button>
                <button type="button" className="button button--sm button--primary"
                  disabled={ddLoading} aria-busy={ddLoading}
                  onClick={() => runDD()}>
                  {ddLoading ? <><span className="spinner spinner--sm" aria-hidden="true" /> Running…</> : "Run Due Diligence"}
                </button>
              </div>

              {/* Contact info */}
              <section>
                <p className="text-eyebrow mb-2">Contact</p>
                <div className="card p-3 text-sm space-y-1">
                  {[
                    ["PIC",     partner.contactName  ],
                    ["Phone",   partner.contactPhone ],
                    ["Email",   partner.contactEmail ],
                    ["Country", partner.country      ],
                    ["Address", partner.address      ],
                    ["NPWP",    partner.npwp         ],
                    ["Bank",    partner.bankAccount  ],
                    ["Fleet",   partner.fleetSize != null ? String(partner.fleetSize) : null],
                  ].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l as string} className="flex gap-3">
                      <span className="text-muted-foreground w-16 flex-shrink-0">{l}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Legal docs */}
              {(partner.legalDocuments ?? []).length > 0 && (
                <section>
                  <p className="text-eyebrow mb-2">Legal Documents</p>
                  <div className="flex flex-col gap-1">
                    {(partner.legalDocuments ?? []).map((doc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded border border-border">
                        <span>{doc.name}</span>
                        <LegalDocBadge doc={doc} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Due diligence */}
              {dd && (
                <section>
                  <p className="text-eyebrow mb-2">AI Due Diligence</p>
                  <div className="card p-4 text-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${RISK_BADGE[dd.riskLevel] ?? "badge--neutral"}`}>{dd.riskLevel} Risk</span>
                      <span className="text-muted-foreground">Score: {dd.score}/100</span>
                    </div>
                    <p className="text-muted-foreground">{dd.summary}</p>
                    {dd.recommendations?.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Recommendations:</p>
                        <ul className="space-y-0.5">
                          {dd.recommendations.map((r, i) => <li key={i} className="text-xs">• {r}</li>)}
                        </ul>
                      </div>
                    )}
                    {(dd as {flags?:string[]}).flags && (dd as {flags?:string[]}).flags!.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-600">Red Flags:</p>
                        <ul className="space-y-0.5">
                          {(dd as {flags?:string[]}).flags!.map((f, i) => <li key={i} className="text-xs text-amber-600">• {f}</li>)}
                        </ul>
                      </div>
                    )}
                    {(dd as {news?:Array<{title:string;url:string;source:string;publishedAt?:string}>}).news && (dd as {news?:Array<{title:string;url:string;source:string;publishedAt?:string}>}).news!.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">External News:</p>
                        <div className="space-y-2">
                          {(dd as {news?:Array<{title:string;url:string;source:string;publishedAt?:string}>}).news!.slice(0, 5).map((n, i) => (
                            <div key={i} className="p-2 rounded border border-border bg-background/50">
                              <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                                {n.title}
                                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                              </a>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.source} {n.publishedAt && `· ${new Date(n.publishedAt).toLocaleDateString("id-ID")}`}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(dd as {isStub?:boolean}).isStub && (
                      <p className="text-xs text-amber-500">⚠ Stub result — Groq integration pending</p>
                    )}
                  </div>
                </section>
              )}

              {partner.notes && (
                <section>
                  <p className="text-eyebrow mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{partner.notes}</p>
                </section>
              )}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────────
function ConfirmDeleteModal({ id }: { id: string }) {
  const { setConfirmDelete } = useDirectoryUIStore();
  const { mutate, isPending } = useDeletePartner(id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog" aria-modal="true">
      <div className="card w-full max-w-sm mx-4">
        <div className="card__body gap-4">
          <h2 className="font-semibold">Deactivate Partner?</h2>
          <p className="text-sm text-muted-foreground">Historical data is preserved. Partner will be hidden from active lists.</p>
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

// ── Main client ───────────────────────────────────────────────────────────────
const TABS: { key: "all"|"buyer"|"supplier"|"vendor"|"surveyor"|"freight"; label: string }[] = [
  { key:"all",      label:"All"       },
  { key:"buyer",    label:"Buyer"     },
  { key:"supplier", label:"Supplier"  },
  { key:"vendor",   label:"Vendor"    },
  { key:"surveyor", label:"Surveyor"  },
  { key:"freight",  label:"Fleet"     },
];

export function DirectoryClient() {
  const { activeTab, filterSearch, page, detailId, modalOpen, editingId, confirmDeleteId,
    setActiveTab, setFilterSearch, setPage, openCreate } = useDirectoryUIStore();

  const { data, isLoading } = usePartnerList({
    page,
    type:   activeTab === "all" ? undefined : activeTab,
    search: filterSearch || undefined,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto border border-border rounded-lg p-1 bg-surface">
          {TABS.map((t) => (
            <button key={t.key} type="button"
              className={`button button--sm flex-shrink-0 ${activeTab===t.key?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setActiveTab(t.key)} aria-pressed={activeTab===t.key}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search company, PIC, country…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
            aria-label="Search partners" />
        </div>
        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>+ Add Partner</button>
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({length:6}).map((_,i)=><div key={i} className="card h-48"/>)}
        </div>
      ) : items.length === 0 ? (
        <div className="card"><div className="card__body py-12 text-center text-muted-foreground">
          No partners found
        </div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p: PartnerItem) => <PartnerCard key={p.id} partner={p} />)}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{meta.total} partners · Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-1">
            <button type="button" className="button button--sm button--ghost button--neutral"
              disabled={meta.page<=1} onClick={()=>setPage(meta.page-1)}>←</button>
            <button type="button" className="button button--sm button--ghost button--neutral"
              disabled={meta.page>=meta.totalPages} onClick={()=>setPage(meta.page+1)}>→</button>
          </div>
        </div>
      )}

      {/* Overlays */}
      {(modalOpen || editingId) && <PartnerFormModal />}
      {detailId                 && <PartnerDetailDrawer />}
      {confirmDeleteId          && <ConfirmDeleteModal id={confirmDeleteId} />}
    </div>
  );
}
