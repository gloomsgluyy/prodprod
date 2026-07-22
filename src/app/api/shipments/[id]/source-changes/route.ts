export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const changes = await prisma.sourceChangeLog.findMany({
    where: { shipmentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy:  { select: { name: true } },
      ceoApprovedBy:{ select: { name: true } },
    },
  });
  return NextResponse.json({ data: changes });
}

const schema = z.object({
  currentSource:    z.string().min(1),
  currentSupplier:  z.string().min(1),
  newSource:        z.string().min(1),
  newSupplier:      z.string().min(1),
  reasonCategory:   z.enum(["Stock issue","Quality issue","Price issue","Legal issue","Logistics issue","Buyer request","Other"]),
  reasonDetail:     z.string().min(1),
  evidenceFileUrl:  z.string().url().optional(),
  impactDescription:z.string().min(1),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Get current active version
  const latest = await prisma.sourceChangeLog.findFirst({
    where: { shipmentId: id },
    orderBy: { activeVersion: "desc" },
    select: { activeVersion: true },
  });
  const activeVersion = (latest?.activeVersion ?? 0) + 1;

  const change = await prisma.sourceChangeLog.create({
    data: {
      shipmentId: id,
      ...parsed.data,
      requestedById: session.user.id,
      activeVersion,
      ceoApprovalStatus: "pending",
      newContractStatus: "pending",
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "source_change_requested", entity: "shipment", entityId: id, shipmentId: id,
    details: { newSource: parsed.data.newSource, version: activeVersion },
  });

  return NextResponse.json({ data: change }, { status: 201 });
}
