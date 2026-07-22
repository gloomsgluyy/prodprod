export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCompletionScore } from "@/modules/shipment-monitor/utils/completion-score";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    select: {
      shipmentNumber: true, projectId: true, buyer: true, type: true, pic: true,
      salesPrice: true, buyingPrice: true, qtyPlan: true, paymentTerm: true, shippingTerm: true,
      supplier: true, source: true, iupOp: true, region: true,
      pol: true, pod: true, laycanStart: true, laycanEnd: true, vesselName: true, bargeName: true,
      specGar: true, specTs: true, specAsh: true, specTm: true,
      blDate: true, qtyLoaded: true, qtyFinal: true,
    },
  });

  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const score = computeCompletionScore(shipment);

  // Build field-level breakdown for UI
  const fields = [
    { group: "Header",     field: "Shipment Number",  filled: !!shipment.shipmentNumber },
    { group: "Header",     field: "Buyer",             filled: !!shipment.buyer },
    { group: "Header",     field: "Type",              filled: !!shipment.type },
    { group: "Header",     field: "PIC",               filled: !!shipment.pic },
    { group: "Header",     field: "Project Ref",       filled: !!shipment.projectId },
    { group: "Commercial", field: "Sales Price",       filled: !!shipment.salesPrice },
    { group: "Commercial", field: "Buying Price",      filled: !!shipment.buyingPrice },
    { group: "Commercial", field: "Qty Plan",          filled: !!shipment.qtyPlan },
    { group: "Commercial", field: "Payment Term",      filled: !!shipment.paymentTerm },
    { group: "Commercial", field: "Shipping Term",     filled: !!shipment.shippingTerm },
    { group: "Source",     field: "Supplier",          filled: !!shipment.supplier },
    { group: "Source",     field: "Source",            filled: !!shipment.source },
    { group: "Source",     field: "IUP OP",            filled: !!shipment.iupOp },
    { group: "Source",     field: "Region",            filled: !!shipment.region },
    { group: "Route",      field: "POL",               filled: !!shipment.pol },
    { group: "Route",      field: "POD",               filled: !!shipment.pod },
    { group: "Route",      field: "Laycan Start",      filled: !!shipment.laycanStart },
    { group: "Route",      field: "Laycan End",        filled: !!shipment.laycanEnd },
    { group: "Route",      field: "Vessel",            filled: !!shipment.vesselName },
    { group: "Route",      field: "Barge",             filled: !!shipment.bargeName },
    { group: "Quality",    field: "GAR",               filled: !!shipment.specGar },
    { group: "Quality",    field: "TS",                filled: !!shipment.specTs },
    { group: "Quality",    field: "ASH",               filled: !!shipment.specAsh },
    { group: "Quality",    field: "TM",                filled: !!shipment.specTm },
    { group: "Closing",    field: "BL Date",           filled: !!shipment.blDate },
    { group: "Closing",    field: "Qty Loaded",        filled: !!shipment.qtyLoaded },
    { group: "Closing",    field: "Qty Final",         filled: !!shipment.qtyFinal },
  ];

  return NextResponse.json({ data: { score, fields } });
}
