"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShipmentUIStore } from "../store/shipment-ui-store";
import { useCreateShipment, useUpdateShipment, useShipmentDetail } from "../hooks/use-shipments";

const schema = z.object({
  shipmentNumber: z.string().min(1,"Required"),
  buyer:          z.string().min(1,"Required"),
  buyerCountry:   z.string().optional(),
  type:           z.enum(["export","domestic"]).default("export"),
  product:        z.string().default("Coal"),
  qtyPlan:        z.coerce.number().positive().optional(),
  salesPrice:     z.coerce.number().positive().optional(),
  buyingPrice:    z.coerce.number().positive().optional(),
  freightRate:    z.coerce.number().positive().optional(),
  pol:            z.string().optional(),
  pod:            z.string().optional(),
  laycanStart:    z.string().optional(),
  laycanEnd:      z.string().optional(),
  vesselName:     z.string().optional(),
  bargeName:      z.string().optional(),
  source:         z.string().optional(),
  supplier:       z.string().optional(),
  iupOp:          z.string().optional(),
  region:         z.string().optional(),
  specGar:        z.coerce.number().positive().optional(),
  specTs:         z.coerce.number().positive().optional(),
  specAsh:        z.coerce.number().positive().optional(),
  specTm:         z.coerce.number().positive().optional(),
  shippingTerm:   z.string().optional(),
  paymentTerm:    z.string().optional(),
  pic:            z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ShipmentFormModal() {
  const { createModalOpen, editingId, closeCreateEdit } = useShipmentUIStore();
  const isEdit = !!editingId;

  const { data: detailData } = useShipmentDetail(editingId ?? "");
  const detail = detailData?.data;

  const { mutate: create, isPending: creating } = useCreateShipment();
  const { mutate: update, isPending: updating } = useUpdateShipment(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "export", product: "Coal" },
  });

  useEffect(() => {
    if (detail && isEdit) {
      reset({
        shipmentNumber: detail.shipmentNumber,
        buyer:          detail.buyer,
        buyerCountry:   detail.buyerCountry ?? "",
        type:           detail.type as "export" | "domestic",
        product:        detail.product,
        qtyPlan:        detail.qtyPlan ?? undefined,
        salesPrice:     detail.salesPrice ?? undefined,
        buyingPrice:    detail.buyingPrice ?? undefined,
        freightRate:    detail.freightRate ?? undefined,
        pol:            detail.pol ?? "",
        pod:            detail.pod ?? "",
        laycanStart:    detail.laycanStart?.split("T")[0] ?? "",
        laycanEnd:      detail.laycanEnd?.split("T")[0]   ?? "",
        vesselName:     detail.vesselName ?? "",
        bargeName:      detail.bargeName  ?? "",
        source:         detail.source     ?? "",
        supplier:       detail.supplier   ?? "",
        iupOp:          detail.iupOp      ?? "",
        region:         detail.region     ?? "",
        specGar:        detail.specGar    ?? undefined,
        specTs:         detail.specTs     ?? undefined,
        specAsh:        detail.specAsh    ?? undefined,
        specTm:         detail.specTm     ?? undefined,
        shippingTerm:   detail.shippingTerm ?? "",
        paymentTerm:    detail.paymentTerm  ?? "",
        pic:            detail.pic          ?? "",
      });
    }
  }, [detail, isEdit, reset]);

  function onSubmit(data: FormValues) {
    if (isEdit && editingId) {
      update(data, { onSuccess: closeCreateEdit });
    } else {
      create(data, { onSuccess: closeCreateEdit });
    }
  }

  const F = ({ id, label, type = "text", ph }: { id: keyof FormValues; label: string; type?: string; ph?: string }) => {
    const err = errors[id];
    return (
      <div className="field">
        <label className="field__label text-xs" htmlFor={`shp-${id}`}>{label}</label>
        <input id={`shp-${id}`} type={type} step={type === "number" ? "0.01" : undefined}
          className={`input ${err ? "input--invalid" : ""}`} placeholder={ph}
          aria-invalid={!!err} {...register(id)} />
        {err && <p className="text-xs text-danger mt-0.5" role="alert">{(err as { message?: string })?.message}</p>}
      </div>
    );
  };

  const open = createModalOpen || isEdit;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Shipment" : "Add Shipment"}>
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Shipment" : "Add Shipment"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeCreateEdit} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Identity */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <F id="shipmentNumber" label="Shipment No *" ph="SHP-2025-001" />
              <F id="buyer"          label="Buyer *"        ph="PT. Coal Buyer" />
              <F id="buyerCountry"   label="Buyer Country" />
              <div className="field">
                <label className="field__label text-xs" htmlFor="shp-type">Type</label>
                <select id="shp-type" className="select" {...register("type")}>
                  <option value="export">Export</option>
                  <option value="domestic">Domestic</option>
                </select>
              </div>
              <F id="product" label="Product" ph="Coal" />
              <F id="pic"     label="PIC"     ph="Trader name" />
            </div>

            {/* Commercial */}
            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <legend className="px-1 text-xs text-muted-foreground">Commercial</legend>
              <F id="qtyPlan"     label="Qty Plan (MT)"      type="number" ph="50000" />
              <F id="salesPrice"  label="Sales Price (USD/MT)" type="number" ph="68.00" />
              <F id="buyingPrice" label="Buying Price (USD/MT)"type="number" ph="48.00" />
              <F id="freightRate" label="Freight (USD/MT)"     type="number" ph="8.00" />
              <F id="shippingTerm" label="Shipping Term" ph="FOB Barge" />
              <F id="paymentTerm"  label="Payment Term" ph="Net 30" />
            </fieldset>

            {/* Route */}
            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <legend className="px-1 text-xs text-muted-foreground">Route & Schedule</legend>
              <F id="pol"        label="POL"          ph="Taboneo" />
              <F id="pod"        label="POD"          ph="Shanghai" />
              <F id="laycanStart" label="Laycan Start" type="date" />
              <F id="laycanEnd"   label="Laycan End"   type="date" />
              <F id="vesselName"  label="Vessel (MV)"  ph="MV Harmony" />
              <F id="bargeName"   label="Barge (TB/BG)"ph="TB Jaya" />
            </fieldset>

            {/* Source */}
            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <legend className="px-1 text-xs text-muted-foreground">Source</legend>
              <F id="source"   label="Source"   ph="Source name" />
              <F id="supplier" label="Supplier" ph="Supplier name" />
              <F id="iupOp"    label="IUP OP"   ph="IUP-KT-001" />
              <F id="region"   label="Region"   ph="Kalimantan Timur" />
            </fieldset>

            {/* Coal spec */}
            <fieldset className="border border-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <legend className="px-1 text-xs text-muted-foreground">Coal Spec</legend>
              <F id="specGar" label="GAR (kcal/kg)" type="number" ph="5000" />
              <F id="specTs"  label="TS (%)"         type="number" ph="0.5" />
              <F id="specAsh" label="ASH (%)"         type="number" ph="8" />
              <F id="specTm"  label="TM (%)"          type="number" ph="35" />
            </fieldset>

            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeCreateEdit} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending
                  ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</>
                  : isEdit ? "Update Shipment" : "Create Shipment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
