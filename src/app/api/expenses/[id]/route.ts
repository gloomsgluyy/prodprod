import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { isFinance } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  description:       z.string().min(1).optional(),
  amount:            z.coerce.number().positive().optional(),
  currency:          z.string().optional(),
  category:          z.string().optional(),
  supplierName:      z.string().optional(),
  priority:          z.enum(["low","medium","high","urgent"]).optional(),
  imageUrl:          z.string().url().optional().nullable(),
  notes:             z.string().optional(),
  relatedShipmentId: z.string().uuid().optional().nullable().or(z.literal("")),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await prisma.expense.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { relatedShipmentId, ...data } = parsed.data;
  const expense = await prisma.expense.update({ where: { id }, data: { ...data, shipmentId: relatedShipmentId || null } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "expense", entityId: id,
  });

  return NextResponse.json({ data: expense });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFinance(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await prisma.expense.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only draft/pending can be deleted
  if (!["draft","submitted"].includes(expense.status))
    return NextResponse.json({ error: "Cannot delete approved or paid expenses" }, { status: 409 });

  await prisma.expense.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
