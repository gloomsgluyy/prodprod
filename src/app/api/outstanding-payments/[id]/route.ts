import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { isFinance } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  shipmentId:     z.string().uuid().optional().nullable(),
  invoiceNumber:  z.string().optional(),
  perusahaan:     z.string().min(1).optional(),
  kodeBatu:       z.string().optional(),
  priceInclPph:   z.coerce.number().positive().optional(),
  quantity:       z.coerce.number().positive().optional(),
  totalDp:        z.coerce.number().positive().optional(),
  tahun:          z.coerce.number().int().optional(),
  calculationDate:     z.string().optional().nullable(),
  dpToShipmentDate:    z.string().optional().nullable(),
  dueDate:             z.string().optional().nullable(),
  disputeStatus:       z.string().optional(),
  timeframe:           z.string().optional(),
  status:              z.enum(["pending","partial","paid"]).optional(),
  notes:               z.string().optional(),
  invoiceDocumentId:   z.string().uuid().optional().nullable(),
  paymentProofDocumentId: z.string().uuid().optional().nullable(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await prisma.outstandingPayment.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.outstandingPayment.update({ where: { id }, data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "outstanding_payment", entityId: id,
  });

  return NextResponse.json({ data: record });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await prisma.outstandingPayment.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.outstandingPayment.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "deleted", entity: "outstanding_payment", entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}
