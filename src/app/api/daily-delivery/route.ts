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
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [items, total] = await Promise.all([
    prisma.dailyDeliveryLog.findMany({
      orderBy: { blDate: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.dailyDeliveryLog.count(),
  ]);

  const data = items.map((d) => ({
    ...d,
    blQty:         Number(d.blQty),
    invoiceAmount: d.invoiceAmount != null ? Number(d.invoiceAmount) : null,
  }));

  return NextResponse.json({
    data,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const schema = z.object({
  blDate:        z.string(),
  buyer:         z.string().min(1),
  supplier:      z.string().min(1),
  shippingTerm:  z.string().min(1),
  area:          z.string().optional(),
  flow:          z.enum(["domestic","export"]),
  blQty:         z.coerce.number().positive(),
  invoiceAmount: z.coerce.number().positive().optional(),
  product:       z.string().min(1),
  projectName:   z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const entry = await prisma.dailyDeliveryLog.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "daily_delivery", entityId: entry.id,
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}

