export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const candidateSchema = z.object({
  supplierName:         z.string().min(1),
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
  belowSpecAcknowledged:z.boolean().default(false),
  belowSpecReason:      z.string().optional(),
  selected:             z.boolean().default(false),
  notes:                z.string().optional(),
});

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const candidates = await prisma.forecastSupplierCandidate.findMany({
    where: { forecastProjectId: id },
    orderBy: [{ selected: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ data: candidates });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.forecastProject.findUnique({ where: { id }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body   = await request.json();
  const parsed = candidateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const candidate = await prisma.forecastSupplierCandidate.create({
    data: {
      ...parsed.data,
      forecastProjectId: id,
      createdById: session.user.id,
      belowSpecFlags: parsed.data.belowSpecFlags as never ?? undefined,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "supplier_candidate_added", entity: "forecast_project", entityId: id, projectId: id,
    details: { supplierName: parsed.data.supplierName },
  });

  return NextResponse.json({ data: candidate }, { status: 201 });
}
