export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { canMutateShipment } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipment(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await prisma.shipment.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  const changes = await prisma.bargeChangeLog.findMany({
    where: { shipmentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      changedBy:  { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ data: changes });
}

const schema = z.object({
  oldBarge:        z.string().min(1),
  newBarge:        z.string().min(1),
  department:      z.string().min(1),
  reasonCategory:  z.string().min(1),
  reasonDetail:    z.string().min(1),
  evidenceFileUrl: z.string().url().optional(),
  approvalRequired:z.boolean().default(false),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const [change] = await prisma.$transaction([
    prisma.bargeChangeLog.create({ data: { shipmentId: id, ...parsed.data, changedById: session.user.id, status: "active" } }),
    prisma.shipment.update({ where: { id }, data: { bargeName: parsed.data.newBarge } }),
  ]);

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "barge_change", entity: "shipment", entityId: id, shipmentId: id,
    details: { oldBarge: parsed.data.oldBarge, newBarge: parsed.data.newBarge },
  });

  return NextResponse.json({ data: change }, { status: 201 });
}
