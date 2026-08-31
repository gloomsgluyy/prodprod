export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 25;

const CATEGORIES = [
  "Sewa","Supplies","Fuel","Transport","Maintenance","Office",
  "Survey","Legal","Port Charges","Other",
] as const;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status     = searchParams.get("status");
  const search     = searchParams.get("search") ?? "";
  const shipmentOnly = searchParams.get("shipmentOnly") === "true";

  const where = {
    ...(status && status !== "all" ? { status: status as never } : {}),
    ...(shipmentOnly ? { shipmentId: { not: null } } : {}),
    ...(search ? {
      OR: [
        { description:  { contains: search, mode: "insensitive" as const } },
        { supplierName: { contains: search, mode: "insensitive" as const } },
        { category:     { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total, totalAmtAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, description: true, amount: true, currency: true,
        category: true, supplierName: true, priority: true, status: true,
        imageUrl: true, notes: true, shipmentId: true,
        approvedAt: true, createdAt: true, updatedAt: true,
        submittedBy: { select: { id: true, name: true } },
        approvedBy:  { select: { id: true, name: true } },
      },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  const data = items.map((e) => ({ ...e, relatedShipmentId: e.shipmentId, amount: Number(e.amount) }));

  return NextResponse.json({
    data,
    meta: {
      total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE),
      totalAmount: Number(totalAmtAgg._sum.amount ?? 0),
    },
  });
}

const createSchema = z.object({
  description:       z.string().min(1,"Required"),
  amount:            z.coerce.number().positive("Required"),
  currency:          z.string().default("IDR"),
  category:          z.enum(CATEGORIES).default("Other"),
  supplierName:      z.string().optional(),
  priority:          z.enum(["low","medium","high","urgent"]).default("medium"),
  imageUrl:          z.string().url().optional(),
  notes:             z.string().optional(),
  relatedShipmentId: z.string().uuid().optional().or(z.literal("")),
  submitNow:         z.boolean().default(false),
  isAnomaly:         z.boolean().default(false),
  anomalyReason:     z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { submitNow, relatedShipmentId, ...data } = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      ...data, shipmentId: relatedShipmentId || undefined,
       status:       submitNow ? "submitted" : "draft",
       approvalStatus: submitNow ? "pending" : "pending",
      submittedById:session.user.id,
      isAnomaly:    data.isAnomaly ?? false,
      anomalyReason:data.anomalyReason ?? null,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: submitNow ? "submitted" : "created",
    entity: "expense", entityId: expense.id,
    details: { description: expense.description, amount: Number(expense.amount) },
  });

  return NextResponse.json({ data: expense }, { status: 201 });
}

