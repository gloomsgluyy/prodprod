"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQualityUIStore } from "../store/quality-ui-store";
import { useCreateQuality, useUpdateQuality, useQualityDetail } from "../hooks/use-quality";

const specShape = z.object({
  gar: z.coerce.number().positive().optional(),
  nar: z.coerce.number().positive().optional(),
  tm:  z.coerce.number().positive().optional(),
  im:  z.coerce.number().positive().optional(),
  ts:  z.coerce.number().positive().optional(),
  ash: z.coerce.number().positive().optional(),
  vm:  z.coerce.number().positive().optional(),
  hgi: z.coerce.number().positive().optional(),
  adb: z.coerce.number().positive().optional(),
});

const schema = z.object({
  cargoId:       z.string().min(1, "Required"),
  cargoName:     z.string().min(1, "Required"),
  shipmentId:    z.string().optional(),
  surveyor:      z.string().optional(),
  samplingDate:  z.string().optional(),
  status:        z.enum(["pending","passed","warning","need_review","claim_potential","rejected","approved"]).default("pending"),
  warningNotes:  z.string().optional(),
  specResult:    specShape.optional(),
  contractSpec:  specShape.optional(),
  sourceEstimate:specShape.optional(),
  qcResult:      specShape.optional(),
  psiResult:     specShape.optional(),
  coaPolResult:  specShape.optional(),
  coaPodResult:  specShape.optional(),
});

type FormValues = z.infer<typeof schema>;

const SPEC_PARAMS = ["gar","nar","tm","im","ts","ash","vm","hgi","adb"] as const;
const SPEC_LABELS: Record<string, string> = { gar:"GAR", nar:"NAR", tm:"TM %", im:"IM %", ts:"TS %", ash:"ASH %", vm:"VM %", hgi:"HGI", adb:"ADB" };

const STAGES = [
  { key: "specResult"    as const, label: "Spec Result" },
  { key: "contractSpec"  as const, label: "Contract Spec" },
  { key: "sourceEstimate"as const, label: "Source Estimate" },
  { key: "qcResult"      as const, label: "QC Result" },
  { key: "psiResult"     as const, label: "PSI Result" },
  { key: "coaPolResult"  as const, label: "COA POL" },
  { key: "coaPodResult"  as const, label: "COA POD" },
] as const;

const STATUSES = ["pending","passed","warning","need_review","claim_potential","rejected","approved"] as const;

export function QualityFormModal() {
  const { editingId, closeModal } = useQualityUIStore();
  const isEdit = !!editingId;

  const { data: detailData } = useQualityDetail(editingId ?? "");
  const detail = detailData?.data;

  const { mutate: create, isPending: creating } = useCreateQuality();
  const { mutate: update, isPending: updating } = useUpdateQuality(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "pending" },
  });

  useEffect(() => {
    if (detail && isEdit) {
      reset({
        cargoId:      detail.cargoId,
        cargoName:    detail.cargoName,
        shipmentId:   detail.shipmentId ?? "",
        surveyor:     detail.surveyor   ?? "",
        samplingDate: detail.samplingDate?.split("T")[0] ?? "",
        status:       detail.status as FormValues["status"],
        warningNotes: detail.warningNotes ?? "",
        specResult:    detail.specResult    ?? undefined,
        contractSpec:  detail.contractSpec  ?? undefined,
        sourceEstimate:detail.sourceEstimate?? undefined,
        qcResult:      detail.qcResult      ?? undefined,
        psiResult:     detail.psiResult     ?? undefined,
        coaPolResult:  detail.coaPolResult  ?? undefined,
        coaPodResult:  detail.coaPodResult  ?? undefined,
      });
    }
  }, [detail, isEdit, reset]);

  function onSubmit(data: FormValues) {
    if (isEdit && editingId) {
      update(data, { onSuccess: closeModal });
    } else {
      create(data, { onSuccess: closeModal });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Quality Result" : "Add Quality Result"}>
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Quality Result" : "Add Quality Result"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeModal} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Header */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="qc-cargoId">Cargo ID *</label>
                <input id="qc-cargoId" type="text" className={`input ${errors.cargoId ? "input--invalid" : ""}`}
                  placeholder="SHP-001 / CARGO-A" {...register("cargoId")} />
                {errors.cargoId && <p className="text-xs text-danger mt-0.5" role="alert">{errors.cargoId.message}</p>}
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="qc-cargoName">Cargo Name *</label>
                <input id="qc-cargoName" type="text" className={`input ${errors.cargoName ? "input--invalid" : ""}`}
                  {...register("cargoName")} />
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="qc-shipmentId">Linked Shipment ID</label>
                <input id="qc-shipmentId" type="text" className="input" placeholder="UUID or blank"
                  {...register("shipmentId")} />
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="qc-surveyor">Surveyor</label>
                <input id="qc-surveyor" type="text" className="input" {...register("surveyor")} />
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="qc-samplingDate">Sampling Date</label>
                <input id="qc-samplingDate" type="date" className="input" {...register("samplingDate")} />
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="qc-status">Status</label>
                <select id="qc-status" className="select" {...register("status")}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7 Spec Stages — grid of columns */}
            <div>
              <p className="text-eyebrow mb-2">Coal Spec by Stage</p>
              <div className="overflow-x-auto">
                <table className="table text-xs w-full" aria-label="Spec input per stage">
                  <thead>
                    <tr>
                      <th className="w-20">Param</th>
                      {STAGES.map((s) => <th key={s.key}>{s.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SPEC_PARAMS.map((param) => (
                      <tr key={param}>
                        <td className="font-medium">{SPEC_LABELS[param]}</td>
                        {STAGES.map((stage) => (
                          <td key={stage.key}>
                            <input
                              type="number"
                              step="0.01"
                              className="input input--sm w-20"
                              placeholder="—"
                              aria-label={`${SPEC_LABELS[param]} for ${stage.label}`}
                              {...register(`${stage.key}.${param}` as never)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warning notes */}
            <div className="field">
              <label className="field__label text-xs" htmlFor="qc-notes">Warning Notes</label>
              <textarea id="qc-notes" className="input" rows={2}
                placeholder="Describe any quality warnings or deviations…" {...register("warningNotes")} />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : isEdit ? "Update" : "Add Result"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
