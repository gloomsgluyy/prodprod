"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentSI, useGenerateSI, useShipmentDetail } from "../../hooks/use-shipments";

const schema = z.object({
  buyer:             z.string().min(1,"Required"),
  supplier:          z.string().min(1,"Required"),
  source:            z.string().min(1,"Required"),
  pol:               z.string().min(1,"Required"),
  pod:               z.string().min(1,"Required"),
  laycanStart:       z.string().min(1,"Required"),
  laycanEnd:         z.string().min(1,"Required"),
  product:           z.string().default("Coal"),
  quantity:          z.coerce.number().positive("Required"),
  tolerance:         z.string().optional(),
  vesselBarge:       z.string().min(1,"Required"),
  contractReference: z.string().min(1,"Required"),
  documentRequired:  z.string().optional(),
  remarks:           z.string().optional(),
  specGar:           z.coerce.number().positive().optional(),
  specTs:            z.coerce.number().positive().optional(),
  specAsh:           z.coerce.number().positive().optional(),
  specTm:            z.coerce.number().positive().optional(),
  isEarly:           z.boolean().default(false),
  earlyReason:       z.string().optional(),
});

type SIForm = z.infer<typeof schema>;

const APPROVAL_BADGE: Record<string, string> = {
  pending:  "badge--warning",
  approved: "badge--success",
  rejected: "badge--danger",
};

export function TabSI() {
  const { detailId, siFormOpen, toggleSIForm } = useShipmentUIStore();
  const { data: detailData } = useShipmentDetail(detailId ?? "");
  const { data: siData, isLoading } = useShipmentSI(detailId ?? "");
  const { mutate: generate, isPending, error: genError } = useGenerateSI(detailId ?? "");
  const shipment = detailData?.data;
  const siList   = siData?.data ?? [];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SIForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      buyer:    shipment?.buyer    ?? "",
      supplier: shipment?.supplier ?? "",
      source:   shipment?.source   ?? "",
      pol:      shipment?.pol      ?? "",
      pod:      shipment?.pod      ?? "",
      laycanStart: shipment?.laycanStart?.split("T")[0] ?? "",
      laycanEnd:   shipment?.laycanEnd?.split("T")[0]   ?? "",
      quantity:    Number(shipment?.qtyPlan ?? 0),
      vesselBarge: [shipment?.vesselName, shipment?.bargeName].filter(Boolean).join(" / "),
      contractReference: "",
      product: "Coal",
      specGar: Number(shipment?.specGar ?? 0),
      specTs:  Number(shipment?.specTs  ?? 0),
      specAsh: Number(shipment?.specAsh ?? 0),
      specTm:  Number(shipment?.specTm  ?? 0),
      isEarly: false,
    },
  });

  const isEarly = watch("isEarly");

  function onSubmit(d: SIForm) {
    const coalSpec = { gar: d.specGar, ts: d.specTs, ash: d.specAsh, tm: d.specTm };
    generate({ ...d, coalSpec }, { onSuccess: toggleSIForm });
  }

  const handleDownloadPdf = (si: any) => {
    Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]).then(([{ jsPDF }, { default: autoTable }]) => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("SHIPPING INSTRUCTION", 14, 20);
      
      doc.setFontSize(10);
      doc.text(`SI Number: ${si.siNumber}`, 14, 30);
      doc.text(`Version: ${si.version}`, 14, 35);
      doc.text(`Date: ${new Date(si.createdAt).toLocaleDateString()}`, 14, 40);
      doc.text(`Status: ${si.approvalStatus.toUpperCase()}`, 14, 45);

      autoTable(doc, {
        startY: 55,
        theme: 'grid',
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        body: [
          ["Buyer", si.buyer],
          ["Supplier", si.supplier],
          ["Source", si.source],
          ["Quantity", `${Number(si.quantity).toLocaleString()} MT`],
          ["Vessel / Barge", si.vesselBarge],
          ["Port of Loading (POL)", si.pol],
          ["Port of Discharge (POD)", si.pod],
          ["Laycan", `${new Date(si.laycanStart).toLocaleDateString()} - ${new Date(si.laycanEnd).toLocaleDateString()}`],
          ["Contract Reference", si.contractReference],
          ["Product", si.product],
          ["Document Required", si.documentRequired || "-"],
          ["Remarks", si.remarks || "-"],
        ],
      });

      doc.save(`${si.siNumber}.pdf`);
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-eyebrow">Shipping Instructions</p>
          <span className="badge badge--neutral badge--sm">{siList.length} version(s)</span>
        </div>
        <button type="button" className="button button--sm button--primary" onClick={toggleSIForm}>
          {siFormOpen ? "Cancel" : siList.length === 0 ? "+ Generate SI" : "+ Revise SI"}
        </button>
      </div>

      {/* SI form */}
      {siFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-4 flex flex-col gap-4">
          <p className="font-medium text-sm">{siList.length === 0 ? "Generate Shipping Instruction" : `Revise SI (v${siList.length + 1})`}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: "buyer" as const,             label: "Buyer *" },
              { id: "supplier" as const,           label: "Supplier *" },
              { id: "source" as const,             label: "Source *" },
              { id: "pol" as const,                label: "POL *" },
              { id: "pod" as const,                label: "POD *" },
              { id: "product" as const,            label: "Product *" },
              { id: "vesselBarge" as const,        label: "Vessel / Barge *" },
              { id: "contractReference" as const,  label: "Contract Ref *" },
              { id: "tolerance" as const,          label: "Tolerance" },
            ].map(({ id, label }) => (
              <div key={id} className="field">
                <label className="field__label text-xs" htmlFor={`si-${id}`}>{label}</label>
                <input id={`si-${id}`} type="text" className={`input ${errors[id] ? "input--invalid" : ""}`}
                  aria-invalid={!!errors[id]} {...register(id)} />
                {errors[id] && <p className="text-xs text-danger mt-0.5" role="alert">{(errors[id] as { message?: string })?.message}</p>}
              </div>
            ))}
            <div className="field">
              <label className="field__label text-xs" htmlFor="si-qty">Quantity (MT) *</label>
              <input id="si-qty" type="number" step="0.01" className={`input ${errors.quantity ? "input--invalid" : ""}`}
                aria-invalid={!!errors.quantity} {...register("quantity")} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="si-laycanStart">Laycan Start *</label>
              <input id="si-laycanStart" type="date" className="input" {...register("laycanStart")} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="si-laycanEnd">Laycan End *</label>
              <input id="si-laycanEnd" type="date" className="input" {...register("laycanEnd")} />
            </div>
          </div>

          {/* Coal spec inline */}
          <fieldset className="border border-border rounded-lg p-3 grid grid-cols-4 gap-3">
            <legend className="px-1 text-xs text-muted-foreground">Coal Spec</legend>
            {(["specGar","specTs","specAsh","specTm"] as const).map((k) => (
              <div key={k} className="field">
                <label className="field__label text-xs" htmlFor={`si-${k}`}>{k.replace("spec","").toUpperCase()}</label>
                <input id={`si-${k}`} type="number" step="0.01" className="input" {...register(k)} />
              </div>
            ))}
          </fieldset>

          {/* H-10 early SI */}
          <div className="flex gap-3 items-start">
            <label className="field__item mt-0.5">
              <input type="checkbox" className="checkbox" {...register("isEarly")} />
              <span className="field__label font-normal text-sm">Early SI (before H-10)</span>
            </label>
            {isEarly && (
              <div className="field flex-1">
                <label className="field__label text-xs" htmlFor="si-earlyReason">Early SI Reason *</label>
                <input id="si-earlyReason" type="text" className="input" placeholder="Reason for early issuance…"
                  {...register("earlyReason")} />
                <p className="text-xs text-amber-500 mt-0.5">⚠ Requires CEO approval before activation</p>
              </div>
            )}
          </div>

          {/* Docs + Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="si-docReq">Documents Required</label>
              <textarea id="si-docReq" className="input" rows={2} {...register("documentRequired")} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="si-remarks">Remarks</label>
              <textarea id="si-remarks" className="input" rows={2} {...register("remarks")} />
            </div>
          </div>

          {genError && <p className="text-sm text-danger" role="alert">{(genError as Error).message}</p>}

          <button type="submit" className="button button--primary self-end" disabled={isPending} aria-busy={isPending}>
            {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Generating…</> : "Generate SI"}
          </button>
        </form>
      )}

      {/* SI history */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">{Array.from({length:2}).map((_,i)=><div key={i} className="h-16 bg-muted rounded"/>)}</div>
      ) : siList.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-sm">
          No SI generated yet for this shipment
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {siList.map((si) => (
            <div key={si.id} className="card p-4 text-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold">{si.siNumber}</p>
                  <p className="text-xs text-muted-foreground">v{si.version} · {new Date(si.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {si.isEarly && <span className="badge badge--warning badge--sm">Early SI</span>}
                  <span className={`badge badge--sm ${APPROVAL_BADGE[si.approvalStatus] ?? "badge--neutral"}`}>
                    {si.approvalStatus}
                  </span>
                  <button type="button" className="button button--xs button--ghost button--primary" onClick={() => handleDownloadPdf(si)}>
                    Download PDF ↓
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <span>Buyer: {si.buyer}</span>
                <span>Supplier: {si.supplier}</span>
                <span>Qty: {Number(si.quantity).toLocaleString()} MT</span>
                <span>Vessel: {si.vesselBarge}</span>
                <span>Laycan: {new Date(si.laycanStart).toLocaleDateString()} – {new Date(si.laycanEnd).toLocaleDateString()}</span>
                <span>POL: {si.pol}</span>
                <span>POD: {si.pod}</span>
                <span>Contract: {si.contractReference}</span>
              </div>
              {si.approvedBy && (
                <p className="text-xs text-emerald-600 mt-2">✓ Approved by {si.approvedBy.name} on {si.approvedAt ? new Date(si.approvedAt).toLocaleDateString() : ""}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
