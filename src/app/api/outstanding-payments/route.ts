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
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const where = {
    ...(status && status !== "all" ? { status: status as never } : {}),
    ...(search ? {
      OR: [
        { perusahaan: { contains: search, mode: "insensitive" as const } },
        { kodeBatu:   { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total, totalQtyAgg, totalDpAgg] = await Promise.all([
    prisma.outstandingPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, perusahaan: true, kodeBatu: true, invoiceNumber: true,
        priceInclPph: true, quantity: true, totalDp: true, tahun: true,
        calculationDate: true, dpToShipmentDate: true, dueDate: true,
        disputeStatus: true, timeframe: true, status: true, notes: true,
        invoiceDocumentId: true, paymentProofDocumentId: true,
        shipmentId: true,
        shipment: { select: { shipmentNumber: true } },
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.outstandingPayment.count({ where }),
    prisma.outstandingPayment.aggregate({ where, _sum: { quantity: true } }),
    prisma.outstandingPayment.aggregate({ where, _sum: { totalDp: true } }),
  ]);

  const data = items.map((p) => ({
    ...p,
    priceInclPph: p.priceInclPph != null ? Number(p.priceInclPph) : null,
    quantity:     p.quantity     != null ? Number(p.quantity)     : null,
    totalDp:      p.totalDp      != null ? Number(p.totalDp)      : null,
  }));

  return NextResponse.json({
    data,
    meta: {
      total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE),
      totalQty: Number(totalQtyAgg._sum.quantity ?? 0),
      totalDp:  Number(totalDpAgg._sum.totalDp  ?? 0),
    },
  });
}

const createSchema = z.object({
  shipmentId:     z.string().uuid().optional(),
  invoiceNumber:  z.string().optional(),
  perusahaan:     z.string().min(1, "Required"),
  kodeBatu:       z.string().optional(),
  priceInclPph:   z.coerce.number().positive().optional(),
  quantity:       z.coerce.number().positive().optional(),
  totalDp:        z.coerce.number().positive().optional(),
  tahun:          z.coerce.number().int().default(new Date().getFullYear()),
  calculationDate:     z.string().optional(),
  dpToShipmentDate:    z.string().optional(),
  dueDate:             z.string().optional(),
  disputeStatus:       z.string().optional(),
  timeframe:           z.string().optional(),
  status:              z.enum(["pending","partial","paid"]).default("pending"),
  notes:               z.string().optional(),
  invoiceDocumentId:   z.string().uuid().optional(),
  paymentProofDocumentId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.outstandingPayment.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "outstanding_payment", entityId: record.id,
    details: { perusahaan: record.perusahaan },
  });

  return NextResponse.json({ data: record }, { status: 201 });
}

