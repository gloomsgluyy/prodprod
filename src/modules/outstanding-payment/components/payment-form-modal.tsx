"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePaymentUIStore } from "../store/payment-ui-store";
import { useCreatePayment, useUpdatePayment, useOutstandingPayments, type OutstandingPaymentItem } from "../hooks/use-outstanding-payments";
import { useShipmentList } from "@/modules/shipment-monitor/hooks/use-shipments";

const schema = z.object({
  perusahaan:       z.string().min(1, "Required"),
  shipmentId:       z.string().optional(),
  invoiceNumber:    z.string().optional(),
  kodeBatu:         z.string().optional(),
  priceInclPph:     z.coerce.number().positive().optional(),
  quantity:         z.coerce.number().positive().optional(),
  totalDp:          z.coerce.number().positive().optional(),
  tahun:            z.coerce.number().int().default(new Date().getFullYear()),
  calculationDate:  z.string().optional(),
  dpToShipmentDate: z.string().optional(),
  dueDate:          z.string().optional(),
  disputeStatus:    z.string().optional(),
  timeframe:        z.string().optional(),
  status:           z.enum(["pending","partial","paid"]).default("pending"),
  notes:            z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PaymentFormModal() {
  const { editingId, closeModal } = usePaymentUIStore();
  const isEdit = !!editingId;

  // Load existing payments to find editing record
  const { data: listData } = useOutstandingPayments({ page: 1 });
  const editingRecord = isEdit
    ? listData?.data?.find((p) => p.id === editingId)
    : undefined;

  const { mutate: create, isPending: creating } = useCreatePayment();
  const { mutate: update, isPending: updating } = useUpdatePayment(editingId ?? "");
  const isPending = creating || updating;

  // Load shipments for dropdown (first 300)
  const { data: shipmentsData } = useShipmentList({ page: 1, pageSize: 300 });
  const shipments = shipmentsData?.data ?? [];

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tahun: new Date().getFullYear(), status: "pending" },
  });

  const linkedShipmentId = watch("shipmentId");
  const hasLinkedShipment = !!linkedShipmentId;

  useEffect(() => {
    if (editingRecord) {
      reset({
        perusahaan:       editingRecord.perusahaan,
        shipmentId:       editingRecord.shipmentId ?? "",
        invoiceNumber:    editingRecord.invoiceNumber ?? "",
        kodeBatu:         editingRecord.kodeBatu ?? "",
        priceInclPph:     editingRecord.priceInclPph ?? undefined,
        quantity:         editingRecord.quantity ?? undefined,
        totalDp:          editingRecord.totalDp ?? undefined,
        tahun:            editingRecord.tahun,
        calculationDate:  editingRecord.calculationDate?.split("T")[0] ?? "",
        dpToShipmentDate: editingRecord.dpToShipmentDate?.split("T")[0] ?? "",
        dueDate:          editingRecord.dueDate?.split("T")[0] ?? "",
        disputeStatus:    editingRecord.disputeStatus ?? "",
        timeframe:        editingRecord.timeframe ?? "",
        status:           editingRecord.status,
        notes:            editingRecord.notes ?? "",
      });
    }
  }, [editingRecord, reset]);

  async function onSubmit(data: FormValues) {
    const payload = { ...data, shipmentId: data.shipmentId || undefined };
    
    // Save record first
    const savePromise = new Promise<string>((resolve, reject) => {
      if (isEdit && editingId) {
        update(payload as Partial<OutstandingPaymentItem>, { 
          onSuccess: () => resolve(editingId),
          onError: reject
        });
      } else {
        create(payload as Partial<OutstandingPaymentItem>, { 
          onSuccess: (response) => resolve(response.data.id),
          onError: reject
        });
      }
    });

    try {
      const recordId = await savePromise;
      
      // Upload files if provided and shipment is linked
      if (data.shipmentId && (invoiceFile || proofFile)) {
        const uploads: Promise<void>[] = [];
        
        if (invoiceFile) {
          uploads.push(uploadDocument(recordId, data.shipmentId, invoiceFile, 'invoice'));
        }
        
        if (proofFile) {
          uploads.push(uploadDocument(recordId, data.shipmentId, proofFile, 'payment_proof'));
        }
        
        await Promise.all(uploads);
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to save payment record:', error);
    }
  }

  async function uploadDocument(paymentId: string, shipmentId: string, file: File, docType: 'invoice' | 'payment_proof') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('paymentId', paymentId);
    formData.append('documentType', docType);
    
    if (docType === 'invoice') setIsUploadingInvoice(true);
    else setIsUploadingProof(true);
    
    try {
      const response = await fetch(`/api/outstanding-payments/${paymentId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
    } finally {
      if (docType === 'invoice') setIsUploadingInvoice(false);
      else setIsUploadingProof(false);
    }
  }

  const F = ({ id, label, type = "text", ph }: { id: keyof FormValues; label: string; type?: string; ph?: string }) => {
    const err = errors[id];
    return (
      <div className="field">
        <label className="field__label text-xs" htmlFor={`pay-${id}`}>{label}</label>
        <input id={`pay-${id}`} type={type} step={type === "number" ? "0.01" : undefined}
          className={`input ${err ? "input--invalid" : ""}`} placeholder={ph}
          aria-invalid={!!err} {...register(id)} />
        {err && <p className="text-xs text-danger mt-0.5" role="alert">{err.message}</p>}
      </div>
    );
  };

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Invoice/proof download links (shown in edit mode if IDs exist)
  function docLink(docId: string | null | undefined, shipId: string | null | undefined, label: string) {
    if (!docId || !shipId) return null;
    return (
      <a href={`/api/shipments/${shipId}/documents/${docId}`} target="_blank" rel="noopener noreferrer"
        className="link text-xs">↗ View {label}</a>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Payment" : "New Payment Record"}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Payment Record" : "New Payment Record"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeModal} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {/* Required */}
            <F id="perusahaan" label="Perusahaan *" ph="PT. Buyer Indonesia" />

            {/* Linked shipment */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="pay-shipmentId">Linked Shipment</label>
              <select id="pay-shipmentId" className="select" {...register("shipmentId")}>
                <option value="">— Not linked —</option>
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>{s.shipmentNumber} — {s.buyer}</option>
                ))}
              </select>
            </div>

            {/* Invoice + Kode Batu */}
            <div className="grid grid-cols-2 gap-3">
              <F id="invoiceNumber" label="Invoice Number" ph="INV-2025-001" />
              <F id="kodeBatu"      label="Kode Batu"      ph="KB-001" />
            </div>

            {/* Financials */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <F id="priceInclPph" label="Price Incl. PPh (Rp)" type="number" ph="1500000000" />
              <F id="quantity"     label="Qty (MT)"              type="number" ph="50000" />
              <F id="totalDp"      label="Total DP (Rp)"         type="number" ph="750000000" />
              <F id="tahun"        label="Tahun"                 type="number" ph="2026" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <F id="calculationDate"  label="Calculation Date"     type="date" />
              <F id="dpToShipmentDate" label="DP to Shipment Date"  type="date" />
              <F id="dueDate"          label="Due Date"             type="date" />
            </div>

            {/* Status + Dispute + Timeframe */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="pay-status">Status *</label>
                <select id="pay-status" className="select" {...register("status")}>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <F id="disputeStatus" label="Dispute Status" ph="none / disputed / under review" />
              <F id="timeframe"     label="Timeframe (Days/Notes)" ph="30 days" />
            </div>

            {/* Notes */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="pay-notes">Notes</label>
              <textarea id="pay-notes" className="input" rows={2}
                placeholder="Additional remarks…" {...register("notes")} />
            </div>

            {/* File Upload Section */}
            {hasLinkedShipment && (
              <div className="border border-border rounded-lg p-4 bg-surface/50">
                <p className="text-eyebrow mb-3">Evidence Documents</p>
                
                {/* Invoice Upload */}
                <div className="space-y-2 mb-3">
                  <label className="field__label text-xs" htmlFor="invoice-file">Invoice Document</label>
                  {isEdit && editingRecord?.invoiceDocumentId ? (
                    <div className="flex items-center gap-2">
                      <a href={`/api/shipments/${editingRecord.shipmentId}/documents/${editingRecord.invoiceDocumentId}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="link text-xs">↗ View Current Invoice</a>
                      <span className="text-muted-foreground text-xs">— or replace:</span>
                    </div>
                  ) : null}
                  <input 
                    id="invoice-file"
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                    disabled={isUploadingInvoice}
                    className="input text-xs"
                  />
                  {invoiceFile && (
                    <p className="text-xs text-muted-foreground">Selected: {invoiceFile.name}</p>
                  )}
                </div>

                {/* Payment Proof Upload */}
                <div className="space-y-2">
                  <label className="field__label text-xs" htmlFor="proof-file">Payment Proof Document</label>
                  {isEdit && editingRecord?.paymentProofDocumentId ? (
                    <div className="flex items-center gap-2">
                      <a href={`/api/shipments/${editingRecord.shipmentId}/documents/${editingRecord.paymentProofDocumentId}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="link text-xs">↗ View Current Proof</a>
                      <span className="text-muted-foreground text-xs">— or replace:</span>
                    </div>
                  ) : null}
                  <input 
                    id="proof-file"
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    disabled={isUploadingProof}
                    className="input text-xs"
                  />
                  {proofFile && (
                    <p className="text-xs text-muted-foreground">Selected: {proofFile.name}</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Files will be uploaded automatically after saving the record.
                </p>
              </div>
            )}

            {!hasLinkedShipment && (
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
                <p className="text-xs text-amber-600">
                  ⚠️ Link a shipment first to enable document upload
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending
                  ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</>
                  : isEdit ? "Update Record" : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
