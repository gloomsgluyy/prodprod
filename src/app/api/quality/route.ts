export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status     = searchParams.get("status");
  const shipmentId = searchParams.get("shipmentId");
  const search     = searchParams.get("search") ?? "";

  const where = {
    ...(status     && status !== "all" ? { status: status as never } : {}),
    ...(shipmentId ? { shipmentId } : {}),
    ...(search     ? {
      OR: [
        { cargoId:   { contains: search, mode: "insensitive" as const } },
        { cargoName: { contains: search, mode: "insensitive" as const } },
        { surveyor:  { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.qualityResult.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, cargoId: true, cargoName: true, shipmentId: true,
        surveyor: true, samplingDate: true, status: true,
        comparisonStatus: true, warningNotes: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.qualityResult.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

// Spec fields schema — reused for all 7 stages
const specSchema = z.object({
  gar: z.coerce.number().positive().optional(),
  nar: z.coerce.number().positive().optional(),
  tm:  z.coerce.number().positive().optional(),
  im:  z.coerce.number().positive().optional(),
  ts:  z.coerce.number().positive().optional(),
  ash: z.coerce.number().positive().optional(),
  vm:  z.coerce.number().positive().optional(),
  hgi: z.coerce.number().positive().optional(),
  adb: z.coerce.number().positive().optional(),
}).optional();

const createSchema = z.object({
  cargoId:          z.string().min(1),
  cargoName:        z.string().min(1),
  shipmentId:       z.string().uuid().optional(),
  surveyor:         z.string().optional(),
  samplingDate:     z.string().optional(),
  status:           z.enum(["pending","passed","warning","need_review","claim_potential","rejected","approved"]).default("pending"),
  specResult:       specSchema,
  contractSpec:     specSchema,
  sourceEstimate:   specSchema,
  qcResult:         specSchema,
  qcDocumentId:     z.string().uuid().optional(),
  psiResult:        specSchema,
  psiDocumentId:    z.string().uuid().optional(),
  coaPolResult:     specSchema,
  coaPolDocumentId: z.string().uuid().optional(),
  coaPodResult:     specSchema,
  coaPodDocumentId: z.string().uuid().optional(),
  comparisonStatus: z.string().optional(),
  warningNotes:     z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.qualityResult.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "quality_result", entityId: record.id,
    details: { cargoId: record.cargoId },
  });

  return NextResponse.json({ data: record }, { status: 201 });
}

