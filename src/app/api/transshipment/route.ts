export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const where = {
    ...(status && status !== "all" ? { status } : {}),
    ...(search ? {
      OR: [
        { mvName:         { contains: search, mode: "insensitive" as const } },
        { shipmentNumber: { contains: search, mode: "insensitive" as const } },
        { loadingPort:    { contains: search, mode: "insensitive" as const } },
        { dischargePort:  { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transshipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.transshipment.count({ where }),
  ]);

  // Compute total freight for each
  const data = items.map((t) => ({
    ...t,
    freightRate: t.freightRate != null ? Number(t.freightRate) : null,
    qtyLoaded:   t.qtyLoaded   != null ? Number(t.qtyLoaded)   : null,
    totalFreight: t.freightRate != null && t.qtyLoaded != null
      ? Math.round(Number(t.freightRate) * Number(t.qtyLoaded) * 100) / 100
      : null,
  }));

  // Summary metrics
  const [totalRev, totalVol] = await Promise.all([
    prisma.transshipment.aggregate({ _sum: { freightRate: true } }),
    prisma.transshipment.aggregate({ _sum: { qtyLoaded:   true } }),
  ]);

  return NextResponse.json({
    data,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
    summary: {
      totalShipments: total,
      totalVolumeMt:  Number(totalVol._sum.qtyLoaded ?? 0),
      avgFreightRate: Number(totalRev._sum.freightRate ?? 0),
    },
  });
}

const schema = z.object({
  shipmentId:     z.string().uuid().optional(),
  mvName:         z.string().min(1),
  shipmentNumber: z.string().optional(),
  vesselName:     z.string().optional(),
  bargeName:      z.string().optional(),
  loadingPort:    z.string().optional(),
  dischargePort:  z.string().optional(),
  freightRate:    z.coerce.number().positive().optional(),
  qtyLoaded:      z.coerce.number().positive().optional(),
  eta:            z.string().optional(),
  status:         z.enum(["active","completed"]).default("active"),
  weather:        z.string().optional(),
  allowance:      z.coerce.number().positive().optional(),
  demurrage:      z.coerce.number().positive().optional(),
  despatch:       z.coerce.number().positive().optional(),
  pbm:            z.coerce.number().positive().optional(),
  pnbp:           z.coerce.number().positive().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "transshipment", entityId: record.id,
    details: { mvName: record.mvName },
  });

  return NextResponse.json({ data: record }, { status: 201 });
}

