export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { computeCompletionScore } from "@/modules/shipment-monitor/utils/completion-score";
import { z } from "zod";
import { canMutateShipment } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exec   = isExecutive(session.user.role);

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      createdBy:    { select: { id: true, name: true } },
    },
  });

  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Strip financial fields for non-execs
  const fin = exec ? {
    salesPrice:    Number(shipment.salesPrice    ?? 0),
    buyingPrice:   Number(shipment.buyingPrice   ?? 0),
    freightRate:   Number(shipment.freightRate   ?? 0),
    royaltyCost:   Number(shipment.royaltyCost   ?? 0),
    taxExportCost: Number(shipment.taxExportCost ?? 0),
    surveyCost:    Number(shipment.surveyCost    ?? 0),
    financeCost:   Number(shipment.financeCost   ?? 0),
    marginMt:      Number(shipment.marginMt      ?? 0),
  } : {};

  return NextResponse.json({
    data: {
      ...shipment,
      qtyPlan:          Number(shipment.qtyPlan    ?? 0),
      qtyLoaded:        Number(shipment.qtyLoaded  ?? 0),
      qtyFinal:         Number(shipment.qtyFinal   ?? 0),
      completionScore:  Number(shipment.completionScore ?? 0),
      salesPrice:       undefined,
      buyingPrice:      undefined,
      freightRate:      undefined,
      royaltyCost:      undefined,
      taxExportCost:    undefined,
      surveyCost:       undefined,
      financeCost:      undefined,
      marginMt:         undefined,
      ...fin,
    },
  });
}

const updateSchema = z.object({
  buyer:        z.string().min(1).optional(),
  buyerCountry: z.string().optional(),
  type:         z.enum(["export","domestic"]).optional(),
  qtyPlan:      z.coerce.number().positive().optional(),
  qtyLoaded:    z.coerce.number().positive().optional(),
  qtyFinal:     z.coerce.number().positive().optional(),
  salesPrice:   z.coerce.number().positive().optional(),
  buyingPrice:  z.coerce.number().positive().optional(),
  freightRate:  z.coerce.number().positive().optional(),
  royaltyCost:  z.coerce.number().min(0).optional(),
  taxExportCost:z.coerce.number().min(0).optional(),
  surveyCost:   z.coerce.number().min(0).optional(),
  financeCost:  z.coerce.number().min(0).optional(),
  marginMt:     z.coerce.number().optional(),
  pol:          z.string().optional(),
  pod:          z.string().optional(),
  laycanStart:  z.string().optional(),
  laycanEnd:    z.string().optional(),
  vesselName:   z.string().optional(),
  bargeName:    z.string().optional(),
  source:       z.string().optional(),
  supplier:     z.string().optional(),
  iupOp:        z.string().optional(),
  region:       z.string().optional(),
  specGar:      z.coerce.number().positive().optional(),
  specTs:       z.coerce.number().positive().optional(),
  specAsh:      z.coerce.number().positive().optional(),
  specTm:       z.coerce.number().positive().optional(),
  shippingTerm: z.string().optional(),
  paymentTerm:  z.string().optional(),
  blDate:       z.string().optional(),
  etd:          z.string().optional(),
  eta:          z.string().optional(),
  pic:          z.string().optional(),
  status:       z.enum(["upcoming","loading","in_transit","completed","cancelled"]).optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipment(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Recompute completion score after update
  const existing = await prisma.shipment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = { ...existing, ...parsed.data };
  const score  = computeCompletionScore(merged);

  const { laycanStart, laycanEnd, blDate, etd, eta, ...rest } = parsed.data;

  const dateFields = {
    ...(laycanStart !== undefined ? { laycanStart: laycanStart ? new Date(laycanStart) : null } : {}),
    ...(laycanEnd !== undefined ? { laycanEnd: laycanEnd ? new Date(laycanEnd) : null } : {}),
    ...(blDate !== undefined ? { blDate: blDate ? new Date(blDate) : null } : {}),
    ...(etd !== undefined ? { etd: etd ? new Date(etd) : null } : {}),
    ...(eta !== undefined ? { eta: eta ? new Date(eta) : null } : {}),
  };

  const shipment = await prisma.shipment.update({
    where: { id },
    data: { ...rest, ...dateFields, completionScore: score },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "shipment", entityId: id, shipmentId: id,
  });

  return NextResponse.json({ data: shipment });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipment(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.shipment.update({ where: { id }, data: { status: "cancelled" } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "cancelled", entity: "shipment", entityId: id, shipmentId: id,
  });

  return new NextResponse(null, { status: 204 });
}
