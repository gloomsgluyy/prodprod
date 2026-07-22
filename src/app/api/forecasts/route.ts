export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page    = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status  = searchParams.get("status");
  const search  = searchParams.get("search") ?? "";
  const segment = searchParams.get("segment");

  const where = {
    ...(status  && status  !== "all" ? { status: status as never } : {}),
    ...(segment && segment !== "all" ? { segment } : {}),
    ...(search ? {
      OR: [
        { projectName: { contains: search, mode: "insensitive" as const } },
        { buyer:       { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.forecastProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, projectName: true, buyer: true, buyerCountry: true,
        segment: true, quantity: true, quantityUnit: true,
        laycanStart: true, laycanEnd: true, shippingTerm: true,
        pol: true, pod: true,
        salesPriceEst: true, buyingPriceEst: true, freightEst: true, marginEst: true,
        specGar: true, specTs: true, specAsh: true, specTm: true,
        status: true, fcoNumber: true, fcoVersion: true,
        createdAt: true, updatedAt: true,
        createdBy: { select: { id: true, name: true } },
        _count: { select: { approvals: true } },
      },
    }),
    prisma.forecastProject.count({ where }),
  ]);

  // Strip P&L fields for non-executives
  const exec = isExecutive(session.user.role);
  const data = items.map((p) => ({
    ...p,
    salesPriceEst:  exec ? Number(p.salesPriceEst  ?? 0) : undefined,
    buyingPriceEst: exec ? Number(p.buyingPriceEst ?? 0) : undefined,
    freightEst:     exec ? Number(p.freightEst     ?? 0) : undefined,
    marginEst:      exec ? Number(p.marginEst      ?? 0) : undefined,
  }));

  return NextResponse.json({
    data,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  projectName:    z.string().min(1),
  buyer:          z.string().min(1),
  buyerCountry:   z.string().optional(),
  segment:        z.string().optional(),
  quantity:       z.coerce.number().positive().optional(),
  quantityUnit:   z.string().default("MT"),
  laycanStart:    z.string().optional(),
  laycanEnd:      z.string().optional(),
  shippingTerm:   z.string().optional(),
  pol:            z.string().optional(),
  pod:            z.string().optional(),
  salesPriceEst:  z.coerce.number().positive().optional(),
  buyingPriceEst: z.coerce.number().positive().optional(),
  freightEst:     z.coerce.number().positive().optional(),
  marginEst:      z.coerce.number().optional(),
  specGar:        z.coerce.number().positive().optional(),
  specTs:         z.coerce.number().positive().optional(),
  specAsh:        z.coerce.number().positive().optional(),
  specTm:         z.coerce.number().positive().optional(),
  remarks:        z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.create({
    data: { ...parsed.data, createdById: session.user.id },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "forecast_project", entityId: project.id,
    projectId: project.id, details: { projectName: project.projectName },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}

