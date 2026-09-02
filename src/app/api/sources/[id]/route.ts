export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { canMutateOperations } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

const DECIMAL_FIELDS = [
  "specGar","specTs","specAsh","specTm","specIm","specFc","specAdb","specNar",
  "stockAvailable","minStockAlert","fobBargePriceUsd","fobBargePriceIdr",
  "rkabVolume","rkabUsed","kuotaExportTotal","kuotaExportUsed",
  "cobMt","haulingDistanceKm","haulingCostIdrPerMt",
] as const;

function serialise(s: Record<string, unknown>) {
  const out = { ...s };
  for (const f of DECIMAL_FIELDS) {
    if (out[f] != null) out[f] = Number(out[f]);
  }
  if (out.rkabVolume != null && out.rkabUsed != null)
    out.rkabRemaining = Number(out.rkabVolume) - Number(out.rkabUsed);
  if (out.kuotaExportTotal != null && out.kuotaExportUsed != null)
    out.kuotaExportRemaining = Number(out.kuotaExportTotal) - Number(out.kuotaExportUsed);
  return out;
}

const updateSchema = z.object({
  name:         z.string().min(1).optional(),
  region:       z.string().optional(),
  calorieRange: z.string().optional(),
  specGar:  z.coerce.number().positive().optional(),
  specTs:   z.coerce.number().positive().optional(),
  specAsh:  z.coerce.number().positive().optional(),
  specTm:   z.coerce.number().positive().optional(),
  specIm:   z.coerce.number().positive().optional(),
  specFc:   z.coerce.number().positive().optional(),
  specAdb:  z.coerce.number().positive().optional(),
  specNar:  z.coerce.number().positive().optional(),
  stockAvailable: z.coerce.number().min(0).optional(),
  minStockAlert:  z.coerce.number().min(0).optional(),
  stockLocations: z.array(z.object({
    location: z.string(), quantity: z.coerce.number().min(0), condition: z.string().optional(),
  })).optional(),
  // RKAB & Quota (FR-SRC-004 A)
  iupOpStatus:          z.enum(["active","expired","pending"]).optional(),
  iupExpiryDate:        z.string().optional().nullable(),
  rkabYear:             z.coerce.number().int().optional(),
  rkabVolume:           z.coerce.number().min(0).optional(),
  rkabUsed:             z.coerce.number().min(0).optional(),
  kuotaExportTotal:     z.coerce.number().min(0).optional(),
  kuotaExportUsed:      z.coerce.number().min(0).optional(),
  // COB (FR-SRC-004 C)
  cobMt:                z.coerce.number().min(0).optional(),
  cobUpdatedAt:         z.string().optional().nullable(),
  cobNotes:             z.string().optional(),
  cargoReadinessStatus: z.enum(["ready","partial_ready","not_ready","legal_pending"]).optional(),
  cargoReadinessNotes:  z.string().optional(),
  // Hauling (FR-SRC-004 D)
  haulingRequired:      z.boolean().optional(),
  haulingVendor:        z.string().optional(),
  haulingDistanceKm:    z.coerce.number().min(0).optional(),
  haulingCostIdrPerMt:  z.coerce.number().min(0).optional(),
  haulingLeadTimeDays:  z.coerce.number().int().min(0).optional(),
  haulingNotes:         z.string().optional(),
  // Logistics
  fobBargeOnly:          z.boolean().optional(),
  requiresTransshipment: z.boolean().optional(),
  priceLinkedIndex:      z.string().optional(),
  fobBargePriceUsd:      z.coerce.number().positive().optional(),
  fobBargePriceIdr:      z.coerce.number().positive().optional(),
  jettyPort:             z.string().optional(),
  anchorage:             z.string().optional(),
  kycStatus:    z.enum(["not_started","in_progress","completed"]).optional(),
  psiStatus:    z.enum(["not_started","in_progress","completed"]).optional(),
  iupNumber:    z.string().optional(),
  contractType: z.string().optional(),
  contactPerson: z.string().optional(),
  phone:         z.string().optional(),
  email:         z.string().email().optional().or(z.literal("")),
  notes:         z.string().optional(),
  isActive:      z.boolean().optional(),
}).partial();

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: serialise(source as unknown as Record<string, unknown>) });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateOperations(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { iupExpiryDate, cobUpdatedAt, ...rest } = parsed.data;
  const source = await prisma.source.update({
    where: { id },
    data: {
      ...rest,
      ...(iupExpiryDate !== undefined ? { iupExpiryDate: iupExpiryDate ? new Date(iupExpiryDate) : null } : {}),
      ...(cobUpdatedAt  !== undefined ? { cobUpdatedAt:  cobUpdatedAt  ? new Date(cobUpdatedAt)  : null } : {}),
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "source", entityId: id,
    details: { updatedFields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data: serialise(source as unknown as Record<string, unknown>) });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateOperations(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.source.update({ where: { id }, data: { isActive: false } });
  await writeAuditLog({ userId: session.user.id, userRole: session.user.role, action: "deleted", entity: "source", entityId: id });
  return new NextResponse(null, { status: 204 });
}
