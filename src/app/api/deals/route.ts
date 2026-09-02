export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { canMutateCommercial } from "@/lib/roles";

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
        { projectName: { contains: search, mode: "insensitive" as const } },
        { buyer:       { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, projectName: true, buyer: true, buyerCountry: true,
        segment: true, quantity: true, pricePerMt: true, dealNumber: true,
        status: true, shippingTerm: true, laycanPol: true, vesselName: true,
        specGar: true, specTs: true, specAsh: true, createdAt: true,
      },
    }),
    prisma.deal.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  projectName:  z.string().min(1),
  buyer:        z.string().min(1),
  buyerCountry: z.string().optional(),
  segment:      z.enum(["local", "export"]).default("export"),
  commodity:    z.string().optional(),
  quantity:     z.number().positive(),
  pricePerMt:   z.number().positive().optional(),
  dealNumber:   z.string().optional(),
  type:         z.string().optional(),
  status:       z.enum(["waiting_approval","waiting_buyer","offer_submitted","confirmed","in_transit","completed","cancelled","rejected"]).default("waiting_approval"),
  specGar:      z.number().positive().optional(),
  specTs:       z.number().positive().optional(),
  specAsh:      z.number().positive().optional(),
  specTm:       z.number().positive().optional(),
  shippingTerm: z.string().optional(),
  laycanPol:    z.string().optional(),
  vesselName:   z.string().optional(),
  notes:        z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateCommercial(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const deal = await prisma.deal.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id,
    userRole: session.user.role,
    action: "created",
    entity: "deal",
    entityId: deal.id,
    details: { projectName: deal.projectName },
  });

  return NextResponse.json({ data: deal }, { status: 201 });
}

