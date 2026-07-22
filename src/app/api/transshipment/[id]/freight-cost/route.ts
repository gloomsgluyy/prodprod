export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Freight cost stored in Transshipment JSON column `milestones` is re-used for freight detail
// since the schema has no dedicated FreightCostDetail table.
// We store it as a JSON object keyed under "freightCost" in the existing record.

const schema = z.object({
  freightRate:        z.coerce.number().optional(),
  freightAllowance:   z.coerce.number().optional(),
  barcingCostPerMt:   z.coerce.number().optional(),
  barcingVendor:      z.string().optional(),
  pbmCostPerMt:       z.coerce.number().optional(),
  pbmVendor:          z.string().optional(),
  pnbpAmountIdr:      z.coerce.number().optional(),
  stsCostPerMt:       z.coerce.number().optional(),
  royaltyPerMt:       z.coerce.number().optional(),
  exportTaxPerMt:     z.coerce.number().optional(),
  surveyCost:         z.coerce.number().optional(),
  mgoReferencePrice:  z.coerce.number().optional(),
  otherCost:          z.coerce.number().optional(),
  otherCostNotes:     z.string().optional(),
}).partial();

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.transshipment.findUnique({
    where: { id },
    select: { milestones: true, freightRate: true, allowance: true, pbm: true, pnbp: true, demurrage: true, despatch: true },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const milestones = record.milestones as Record<string, unknown> | null;
  const freight = Array.isArray(milestones) ? {} : ((milestones?.freightCost as Record<string, unknown>) ?? {});

  // Compute totalCostPerMt
  const fc = freight as Record<string, number>;
  const totalCostPerMt = (fc.freightRate ?? Number(record.freightRate ?? 0))
    + (fc.barcingCostPerMt ?? 0)
    + (fc.pbmCostPerMt ?? Number(record.pbm ?? 0))
    + (fc.stsCostPerMt ?? 0)
    + (fc.royaltyPerMt ?? 0)
    + (fc.exportTaxPerMt ?? 0)
    + (fc.otherCost ?? 0);

  return NextResponse.json({ data: { ...freight, totalCostPerMt: Math.round(totalCostPerMt * 100) / 100 } });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const milestones = record.milestones as Record<string, unknown> | null;
  const existing = Array.isArray(milestones) ? {} : (milestones?.freightCost ?? {});
  const updated = { ...(existing as object), ...parsed.data, updatedAt: new Date().toISOString() };

  const milestonesBase = Array.isArray(milestones) ? { milestoneList: milestones } : (milestones ?? {});
  await prisma.transshipment.update({
    where: { id },
    data: { milestones: { ...milestonesBase, freightCost: updated } },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "freight_cost_updated", entity: "transshipment", entityId: id,
    details: parsed.data,
  });

  return NextResponse.json({ data: updated });
}
