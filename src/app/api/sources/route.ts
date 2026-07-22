export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 50;

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
  // computed
  if (out.rkabVolume != null && out.rkabUsed != null)
    out.rkabRemaining = Number(out.rkabVolume) - Number(out.rkabUsed);
  if (out.kuotaExportTotal != null && out.kuotaExportUsed != null)
    out.kuotaExportRemaining = Number(out.kuotaExportTotal) - Number(out.kuotaExportUsed);
  return out;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? searchParams.get("limit") ?? PAGE_SIZE)));
  const search   = searchParams.get("search") ?? "";
  const region   = searchParams.get("region") ?? "";

  const where = {
    isActive: true,
    ...(region ? { region: { contains: region, mode: "insensitive" as const } } : {}),
    ...(search ? {
      OR: [
        { name:         { contains: search, mode: "insensitive" as const } },
        { region:       { contains: search, mode: "insensitive" as const } },
        { calorieRange: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.source.findMany({ where, orderBy: { name: "asc" }, take: pageSize, skip: (page - 1) * pageSize }),
    prisma.source.count({ where }),
  ]);

  return NextResponse.json({
    data: items.map((s) => serialise(s as unknown as Record<string, unknown>)),
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}

const sourceSchema = z.object({
  name:                  z.string().min(1),
  region:                z.string().optional(),
  calorieRange:          z.string().optional(),
  // Coal spec
  specGar:  z.coerce.number().positive().optional(),
  specTs:   z.coerce.number().positive().optional(),
  specAsh:  z.coerce.number().positive().optional(),
  specTm:   z.coerce.number().positive().optional(),
  specIm:   z.coerce.number().positive().optional(),
  specFc:   z.coerce.number().positive().optional(),
  specAdb:  z.coerce.number().positive().optional(),
  specNar:  z.coerce.number().positive().optional(),
  // Stock
  stockAvailable: z.coerce.number().min(0).optional(),
  minStockAlert:  z.coerce.number().min(0).optional(),
  stockLocations: z.array(z.object({
    location: z.string(), quantity: z.coerce.number().min(0), condition: z.string().optional(),
  })).optional(),
  // RKAB & Quota
  iupOpStatus:          z.enum(["active","expired","pending"]).optional(),
  iupExpiryDate:        z.string().optional(),
  rkabYear:             z.coerce.number().int().optional(),
  rkabVolume:           z.coerce.number().min(0).optional(),
  rkabUsed:             z.coerce.number().min(0).optional(),
  kuotaExportTotal:     z.coerce.number().min(0).optional(),
  kuotaExportUsed:      z.coerce.number().min(0).optional(),
  // COB
  cobMt:                z.coerce.number().min(0).optional(),
  cobUpdatedAt:         z.string().optional(),
  cobNotes:             z.string().optional(),
  cargoReadinessStatus: z.enum(["ready","partial_ready","not_ready","legal_pending"]).optional(),
  cargoReadinessNotes:  z.string().optional(),
  // Hauling
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
  // Compliance
  kycStatus:    z.enum(["not_started","in_progress","completed"]).optional(),
  psiStatus:    z.enum(["not_started","in_progress","completed"]).optional(),
  iupNumber:    z.string().optional(),
  contractType: z.string().optional(),
  // Contact
  contactPerson: z.string().optional(),
  phone:         z.string().optional(),
  email:         z.string().email().optional().or(z.literal("")),
  notes:         z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = sourceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { iupExpiryDate, cobUpdatedAt, ...rest } = parsed.data;
  const source = await prisma.source.create({
    data: {
      ...rest,
      iupExpiryDate: iupExpiryDate ? new Date(iupExpiryDate) : undefined,
      cobUpdatedAt:  cobUpdatedAt  ? new Date(cobUpdatedAt)  : undefined,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "source", entityId: source.id,
    details: { name: source.name },
  });

  return NextResponse.json({ data: serialise(source as unknown as Record<string, unknown>) }, { status: 201 });
}

