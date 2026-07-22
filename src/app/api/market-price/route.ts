export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canEditMarketPrice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { invalidate } from "@/lib/cache";
import { z } from "zod";

const PAGE_SIZE = 20;

const PRICE_FIELDS = ["ici1","ici2","ici3","ici4","ici5","newcastle","hba","hba1","hba2","hba3"] as const;

function serialisePrice(row: Record<string, unknown> | null) {
  if (!row) return null;
  const out = { ...row };
  for (const f of PRICE_FIELDS) {
    if (out[f] != null) out[f] = Number(out[f]);
  }
  return out;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [items, total] = await Promise.all([
    prisma.marketPrice.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, date: true,
        ici1: true, ici2: true, ici3: true, ici4: true, ici5: true,
        newcastle: true, hba: true, hba1: true, hba2: true, hba3: true,
        source: true, action: true, createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.marketPrice.count(),
  ]);

  return NextResponse.json({
    data: items.map((p) => serialisePrice(p as unknown as Record<string, unknown>)),
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  ici1:      z.number().positive().optional(),
  ici2:      z.number().positive().optional(),
  ici3:      z.number().positive().optional(),
  ici4:      z.number().positive().optional(),
  ici5:      z.number().positive().optional(),
  newcastle: z.number().positive().optional(),
  hba:       z.number().positive().optional(),
  hba1:      z.number().positive().optional(),
  hba2:      z.number().positive().optional(),
  hba3:      z.number().positive().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditMarketPrice(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const entry = await prisma.marketPrice.create({
    data: {
      ...parsed.data,
      date: new Date(),
      source: "Manual",
      action: "manual",
      updatedBy: session.user.id,
    },
  });

  await Promise.all([
    invalidate("dashboard:market-mini"),
    writeAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: "created",
      entity: "market_price",
      entityId: entry.id,
    }),
  ]);

  return NextResponse.json({ data: entry }, { status: 201 });
}

