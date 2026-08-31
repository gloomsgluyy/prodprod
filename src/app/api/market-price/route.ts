export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canEditMarketPrice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { invalidate } from "@/lib/cache";
import { z } from "zod";

const PAGE_SIZE = 20;

const PRICE_FIELDS = [
  "ici1","ici2","ici3","ici4","ici5","newcastle","hba","hba1","hba2","hba3","mgoUsd","usdIdr",
] as const;

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
        mgoUsd: true, usdIdr: true,
        source: true, action: true, notes: true, createdAt: true,
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

const priceNumber = z.number().positive().nullable();

const createSchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source:    z.string().trim().min(1).max(80).default("Manual"),
  notes:     z.string().trim().max(500).optional(),
  ici1:      priceNumber.optional(),
  ici2:      priceNumber.optional(),
  ici3:      priceNumber.optional(),
  ici4:      priceNumber.optional(),
  ici5:      priceNumber.optional(),
  newcastle: priceNumber.optional(),
  hba:       priceNumber.optional(),
  hba1:      priceNumber.optional(),
  hba2:      priceNumber.optional(),
  hba3:      priceNumber.optional(),
  mgoUsd:    priceNumber.optional(),
  usdIdr:    priceNumber.optional(),
}).superRefine((data, ctx) => {
  if (!PRICE_FIELDS.some((field) => data[field] != null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ici1"],
      message: "At least one price field must be filled.",
    });
  }
});

function dateOnly(value?: string) {
  if (!value) return new Date();
  return new Date(`${value}T00:00:00.000Z`);
}

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
      ...Object.fromEntries(
        PRICE_FIELDS
          .filter((field) => parsed.data[field] != null)
          .map((field) => [field, parsed.data[field]]),
      ),
      date: dateOnly(parsed.data.date),
      source: parsed.data.source,
      action: "manual",
      updatedBy: session.user.id,
      notes: parsed.data.notes || null,
    },
    include: { user: { select: { name: true } } },
  });

  await Promise.all([
    invalidate("dashboard:market-mini"),
    invalidate("market-price:latest"),
    invalidate("market-price:fx-rate"),
    invalidate("market-price:chart"),
    writeAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: "created",
      entity: "market_price",
      entityId: entry.id,
      details: {
        source: parsed.data.source,
        date: parsed.data.date ?? "today",
        fields: PRICE_FIELDS.filter((field) => parsed.data[field] != null),
      },
    }),
  ]);

  return NextResponse.json({ data: serialisePrice(entry as unknown as Record<string, unknown>) }, { status: 201 });
}

