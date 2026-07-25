export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; candidateId: string }> };

const patchSchema = z.object({
  supplierName:         z.string().min(1).optional(),
  sourceId:             z.string().optional(),
  origin:               z.string().optional(),
  stockMt:              z.coerce.number().positive().optional(),
  priceUsd:             z.coerce.number().positive().optional(),
  readinessStatus:      z.string().optional(),
  legalStatus:          z.string().optional(),
  gar:                  z.coerce.number().optional(),
  nar:                  z.coerce.number().optional(),
  tm:                   z.coerce.number().optional(),
  im:                   z.coerce.number().optional(),
  ts:                   z.coerce.number().optional(),
  ash:                  z.coerce.number().optional(),
  vm:                   z.coerce.number().optional(),
  hgi:                  z.coerce.number().optional(),
  size:                 z.string().optional(),
  fitScore:             z.coerce.number().min(0).max(100).optional(),
  belowSpecFlags:       z.record(z.unknown()).optional(),
  belowSpecAcknowledged:z.boolean().optional(),
  belowSpecReason:      z.string().optional(),
  selected:             z.boolean().optional(),
  notes:                z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, candidateId } = await params;
  const body   = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.forecastSupplierCandidate.findFirst({
    where: { id: candidateId, forecastProjectId: id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If setting selected=true, deselect all others first
  if (parsed.data.selected === true) {
    await prisma.forecastSupplierCandidate.updateMany({
      where: { forecastProjectId: id, id: { not: candidateId } },
      data: { selected: false },
    });
  }

  const updated = await prisma.forecastSupplierCandidate.update({
    where: { id: candidateId },
    data: { ...parsed.data, belowSpecFlags: parsed.data.belowSpecFlags as never ?? undefined },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "supplier_candidate_updated", entity: "forecast_project", entityId: id, projectId: id,
    details: { candidateId, selected: parsed.data.selected },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, candidateId } = await params;
  const existing = await prisma.forecastSupplierCandidate.findFirst({
    where: { id: candidateId, forecastProjectId: id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.forecastSupplierCandidate.delete({ where: { id: candidateId } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "supplier_candidate_deleted", entity: "forecast_project", entityId: id, projectId: id,
    details: { candidateId, supplierName: existing.supplierName },
  });

  return NextResponse.json({ data: { deleted: true } });
}
