"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForecastSupplierCandidates, useCreateCandidate, useUpdateCandidate, useDeleteCandidate } from "../hooks/use-supplier-candidates";
import { useSourceList } from "@/modules/sources/hooks/use-sources";

const schema = z.object({
  sourceId: z.string().optional(),
  supplierName: z.string().min(1, "Required"),
  origin: z.string().optional(),
  stockMt: z.coerce.number().positive().optional(),
  priceUsd: z.coerce.number().positive().optional(),
  readinessStatus: z.string().optional(),
  legalStatus: z.string().optional(),
  gar: z.coerce.number().positive().optional(),
  nar: z.coerce.number().positive().optional(),
  tm: z.coerce.number().min(0).max(100).optional(),
  im: z.coerce.number().min(0).max(100).optional(),
  ts: z.coerce.number().min(0).max(100).optional(),
  ash: z.coerce.number().min(0).max(100).optional(),
  vm: z.coerce.number().min(0).max(100).optional(),
  hgi: z.coerce.number().min(0).max(200).optional(),
  size: z.string().optional(),
  belowSpecReason: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  forecastId: string;
  editingId?: string | null;
  targetSpec: {
    gar?: number;
    nar?: number;
    tm?: number;
    im?: number;
    ts?: number;
    ash?: number;
    vm?: number;
    hgi?: number;
    size?: string;
    quantity?: number;
  };
  onClose: () => void;
}

export function SupplierCandidateModal({ forecastId, editingId, targetSpec, onClose }: Props) {
  const isEdit = !!editingId;
  const { data: candidatesData } = useForecastSupplierCandidates(forecastId);
  const { data: sourcesData } = useSourceList({ page: 1, pageSize: 100 });
  const { mutate: create, isPending: creating } = useCreateCandidate(forecastId);
  const { mutate: update, isPending: updating } = useUpdateCandidate(forecastId, editingId ?? "");
  const { mutate: deleteCandidate, isPending: deleting } = useDeleteCandidate(forecastId, editingId ?? "");
  const isPending = creating || updating || deleting;

  const candidates = candidatesData?.data ?? [];
  const sources = sourcesData?.data ?? [];
  const editingRecord = isEdit ? candidates.find((c) => c.id === editingId) : undefined;

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedSourceId = watch("sourceId");
  const candidateSpec = {
    gar: watch("gar"),
    nar: watch("nar"),
    tm: watch("tm"),
    im: watch("im"),
    ts: watch("ts"),
    ash: watch("ash"),
    vm: watch("vm"),
    hgi: watch("hgi"),
  };
  const candidateStock = watch("stockMt");

  useEffect(() => {
    if (editingRecord) {
      reset({
        sourceId: editingRecord.sourceId ?? "",
        supplierName: editingRecord.supplierName,
        origin: editingRecord.origin ?? "",
        stockMt: editingRecord.stockMt ? Number(editingRecord.stockMt) : undefined,
        priceUsd: editingRecord.priceUsd ? Number(editingRecord.priceUsd) : undefined,
        readinessStatus: editingRecord.readinessStatus ?? "",
        legalStatus: editingRecord.legalStatus ?? "",
        gar: editingRecord.gar ? Number(editingRecord.gar) : undefined,
        nar: editingRecord.nar ? Number(editingRecord.nar) : undefined,
        tm: editingRecord.tm ? Number(editingRecord.tm) : undefined,
        im: editingRecord.im ? Number(editingRecord.im) : undefined,
        ts: editingRecord.ts ? Number(editingRecord.ts) : undefined,
        ash: editingRecord.ash ? Number(editingRecord.ash) : undefined,
        vm: editingRecord.vm ? Number(editingRecord.vm) : undefined,
        hgi: editingRecord.hgi ? Number(editingRecord.hgi) : undefined,
        size: editingRecord.size ?? "",
        belowSpecReason: editingRecord.belowSpecReason ?? "",
        notes: editingRecord.notes ?? "",
      });
    }
  }, [editingRecord, reset]);

  // Auto-fill from source when selected
  useEffect(() => {
    if (!selectedSourceId || isEdit) return;
    const source = sources.find((s) => s.id === selectedSourceId);
    if (!source) return;

    setValue("supplierName", source.name);
    setValue("origin", source.region ?? "");
    setValue("stockMt", source.stockAvailable ? Number(source.stockAvailable) : undefined);
    setValue("priceUsd", source.fobBargePriceUsd ? Number(source.fobBargePriceUsd) : undefined);
    setValue("readinessStatus", source.isActive ? "active" : "inactive");
    setValue("legalStatus", source.kycStatus ?? "");
    setValue("gar", source.specGar ? Number(source.specGar) : undefined);
    setValue("nar", source.specNar ? Number(source.specNar) : undefined);
    setValue("tm", source.specTm ? Number(source.specTm) : undefined);
    setValue("im", source.specIm ? Number(source.specIm) : undefined);
    setValue("ts", source.specTs ? Number(source.specTs) : undefined);
    setValue("ash", source.specAsh ? Number(source.specAsh) : undefined);
    setValue("vm", undefined); // Not in SourceItem
    setValue("hgi", undefined); // Not in SourceItem
    setValue("size", "");
  }, [selectedSourceId, sources, setValue, isEdit]);

  // Calculate fit score
  const fitAnalysis = useMemo(() => {
    let score = 100;
    const belowSpecFlags: Record<string, string> = {};
    const warnings: string[] = [];

    // GAR/NAR check (critical)
    const candidateGar = candidateSpec.gar ?? candidateSpec.nar;
    const targetGar = targetSpec.gar ?? targetSpec.nar;
    if (targetGar && candidateGar && candidateGar < targetGar) {
      const diff = targetGar - candidateGar;
      const penalty = Math.min(35, (diff / targetGar) * 120);
      score -= penalty;
      belowSpecFlags.GAR = `${diff.toFixed(0)} below target`;
      warnings.push(`GAR below by ${diff.toFixed(0)}`);
    }

    // TM check (above target is bad)
    if (targetSpec.tm && candidateSpec.tm && candidateSpec.tm > targetSpec.tm) {
      const diff = candidateSpec.tm - targetSpec.tm;
      score -= Math.min(20, diff * 6);
      belowSpecFlags.TM = `${diff.toFixed(1)}% above target`;
      warnings.push(`TM above by ${diff.toFixed(1)}%`);
    }

    // TS check (above target is bad)
    if (targetSpec.ts && candidateSpec.ts && candidateSpec.ts > targetSpec.ts) {
      const diff = candidateSpec.ts - targetSpec.ts;
      score -= Math.min(20, diff * 6);
      belowSpecFlags.TS = `${diff.toFixed(2)}% above target`;
      warnings.push(`TS above by ${diff.toFixed(2)}%`);
    }

    // ASH check (above target is bad)
    if (targetSpec.ash && candidateSpec.ash && candidateSpec.ash > targetSpec.ash) {
      const diff = candidateSpec.ash - targetSpec.ash;
      score -= Math.min(20, diff * 6);
      belowSpecFlags.ASH = `${diff.toFixed(1)}% above target`;
      warnings.push(`ASH above by ${diff.toFixed(1)}%`);
    }

    // Stock check
    if (targetSpec.quantity && candidateStock && candidateStock < targetSpec.quantity) {
      score -= 15;
      belowSpecFlags.STOCK = `Below quantity (${candidateStock.toFixed(0)} < ${targetSpec.quantity.toFixed(0)} MT)`;
      warnings.push("Stock insufficient");
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    const needsAcknowledgement = finalScore < 80 || Object.keys(belowSpecFlags).length > 0;

    return { score: finalScore, belowSpecFlags, warnings, needsAcknowledgement };
  }, [candidateSpec, candidateStock, targetSpec]);

  function onSubmit(data: FormValues) {
    const payload = {
      ...data,
      fitScore: fitAnalysis.score,
      belowSpecFlags: fitAnalysis.belowSpecFlags,
      belowSpecAcknowledged: fitAnalysis.needsAcknowledgement ? !!data.belowSpecReason : false,
    };

    if (fitAnalysis.needsAcknowledgement && !data.belowSpecReason) {
      alert("Below-spec acknowledgement required: please provide reason for selecting supplier with fit score < 80%");
      return;
    }

    if (isEdit && editingId) {
      update(payload, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  }

  function handleDelete() {
    if (!editingId || !confirm("Delete this supplier candidate?")) return;
    deleteCandidate(undefined, { onSuccess: onClose });
  }

  const F = ({ id, label, type = "text", ph, unit }: { id: keyof FormValues; label: string; type?: string; ph?: string; unit?: string }) => {
    const err = errors[id];
    return (
      <div className="field">
        <label className="field__label text-xs" htmlFor={`cand-${id}`}>{label}</label>
        <div className="relative">
          <input id={`cand-${id}`} type={type} step={type === "number" ? "0.01" : undefined}
            className={`input ${err ? "input--invalid" : ""} ${unit ? "pr-12" : ""}`} placeholder={ph}
            aria-invalid={!!err} {...register(id)} />
          {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>}
        </div>
        {err && <p className="text-xs text-danger mt-0.5" role="alert">{err.message}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Supplier Candidate" : "New Supplier Candidate"}>
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Supplier Candidate" : "Add Supplier Candidate"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={onClose} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Source selector */}
            {!isEdit && (
              <div className="field">
                <label className="field__label text-xs" htmlFor="cand-sourceId">Select from Sources (optional)</label>
                <select id="cand-sourceId" className="select" {...register("sourceId")}>
                  <option value="">— Manual entry —</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.region} — {s.specGar ? `${s.specGar} GAR` : "No spec"} — {s.stockAvailable ? `${Number(s.stockAvailable).toFixed(0)} MT` : "No stock"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Select a source to auto-fill data, or enter manually</p>
              </div>
            )}

            {/* Fit Score Display */}
            <div className={`border rounded-lg p-4 ${fitAnalysis.needsAcknowledgement ? "bg-warning/5 border-warning" : "bg-success/5 border-success"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-eyebrow">Fit Score Calculator</p>
                <span className={`badge ${fitAnalysis.score >= 80 ? "badge--success" : "badge--warning"}`}>
                  Fit {fitAnalysis.score}%
                </span>
              </div>
              {fitAnalysis.warnings.length > 0 && (
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {fitAnalysis.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              )}
              {fitAnalysis.needsAcknowledgement && (
                <p className="text-xs text-warning mt-2 font-medium">⚠️ Below-spec acknowledgement required (fit score &lt; 80%)</p>
              )}
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F id="supplierName" label="Supplier Name *" ph="PT Supplier Indonesia" />
              <F id="origin" label="Origin / Region" ph="Kalimantan Timur" />
              <F id="stockMt" label="Stock Available (MT)" type="number" ph="50000" />
              <F id="priceUsd" label="Price (USD/MT)" type="number" ph="45.50" />
              <F id="readinessStatus" label="Readiness Status" ph="ready / 7 days / 14 days" />
              <F id="legalStatus" label="Legal/KYC Status" ph="verified / pending / failed" />
            </div>

            {/* Coal spec */}
            <div className="border-t border-border pt-4">
              <p className="text-eyebrow mb-3">Coal Specification</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <F id="gar" label="GAR" type="number" ph={targetSpec.gar?.toString()} unit="kcal/kg" />
                <F id="nar" label="NAR" type="number" ph={targetSpec.nar?.toString()} unit="kcal/kg" />
                <F id="tm" label="TM" type="number" ph={targetSpec.tm?.toString()} unit="%" />
                <F id="im" label="IM" type="number" ph={targetSpec.im?.toString()} unit="%" />
                <F id="ts" label="TS" type="number" ph={targetSpec.ts?.toString()} unit="%" />
                <F id="ash" label="ASH" type="number" ph={targetSpec.ash?.toString()} unit="%" />
                <F id="vm" label="VM" type="number" ph={targetSpec.vm?.toString()} unit="%" />
                <F id="hgi" label="HGI" type="number" ph={targetSpec.hgi?.toString()} />
              </div>
              <div className="mt-3">
                <F id="size" label="Size" ph="0-50mm" />
              </div>
            </div>

            {/* Below-spec acknowledgement */}
            {fitAnalysis.needsAcknowledgement && (
              <div className="border border-warning rounded-lg bg-warning/5 p-4">
                <p className="text-eyebrow mb-2 text-warning">Below-Spec Acknowledgement Required *</p>
                <div className="field">
                  <label className="field__label text-xs" htmlFor="cand-belowSpecReason">Reason for selecting below-spec supplier</label>
                  <textarea id="cand-belowSpecReason" className="input" rows={3}
                    placeholder="Explain why this supplier is acceptable despite below-spec score (e.g., blending plan, buyer approved, no alternatives available)"
                    {...register("belowSpecReason")} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Below-spec flags: {Object.keys(fitAnalysis.belowSpecFlags).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="cand-notes">Additional Notes</label>
              <textarea id="cand-notes" className="input" rows={2}
                placeholder="Internal remarks about this supplier candidate"
                {...register("notes")} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between">
              <div>
                {isEdit && (
                  <button type="button" className="button button--ghost button--danger"
                    onClick={handleDelete} disabled={isPending}>Delete</button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" className="button button--ghost button--neutral"
                  onClick={onClose} disabled={isPending}>Cancel</button>
                <button type="submit" className="button button--primary"
                  disabled={isPending} aria-busy={isPending}>
                  {isPending
                    ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</>
                    : isEdit ? "Update Candidate" : "Add Candidate"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
