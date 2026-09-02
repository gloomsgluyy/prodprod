export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") ?? 25)));
  const status   = searchParams.get("status");
  const search   = searchParams.get("search") ?? "";
  const region   = searchParams.get("region") ?? "";
  const year     = searchParams.get("year");

  const where = {
    shipmentClass: "mother_vessel" as const,
    ...(status && status !== "all" ? { status: status as never } : {}),
    ...(region ? { region: { contains: region, mode: "insensitive" as const } } : {}),
    ...(year   ? {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    } : {}),
     ...(search ? {
      OR: [
        { buyer:          { contains: search, mode: "insensitive" as const } },
        { vesselName:     { contains: search, mode: "insensitive" as const } },
        { bargeName:      { contains: search, mode: "insensitive" as const } },
         { shipmentNumber: { contains: search, mode: "insensitive" as const } },
         { project: { projectName: { contains: search, mode: "insensitive" as const } } },
         { childNominations: { some: { OR: [
           { bargeName: { contains: search, mode: "insensitive" as const } },
           { nominationNumber: { contains: search, mode: "insensitive" as const } },
           { source: { contains: search, mode: "insensitive" as const } },
           { supplier: { contains: search, mode: "insensitive" as const } },
         ] } } },
      ],
    } : {}),
  };

  const exec = isExecutive(session.user.role);

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
         id: true, shipmentNumber: true, shipmentClass: true, type: true, buyer: true, buyerCountry: true,
        vesselName: true, bargeName: true, pol: true, pod: true,
        qtyPlan: true, qtyLoaded: true, qtyFinal: true,
        blDate: true, laycanStart: true, laycanEnd: true,
        source: true, supplier: true, region: true, status: true,
         completionScore: true, pic: true, createdAt: true, updatedAt: true,
         _count: { select: { childNominations: true } },
        // Executive-only
        salesPrice: exec, buyingPrice: exec, marginMt: exec,
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  const data = items.map((s) => ({
    ...s,
    qtyPlan:    s.qtyPlan    != null ? Number(s.qtyPlan)    : null,
    qtyLoaded:  s.qtyLoaded  != null ? Number(s.qtyLoaded)  : null,
    qtyFinal:   s.qtyFinal   != null ? Number(s.qtyFinal)   : null,
    salesPrice: s.salesPrice != null ? Number(s.salesPrice) : null,
    buyingPrice:s.buyingPrice!= null ? Number(s.buyingPrice): null,
    marginMt:   s.marginMt   != null ? Number(s.marginMt)   : null,
     completionScore: s.completionScore != null ? Number(s.completionScore) : null,
     childNominationCount: s._count.childNominations,
  }));

  return NextResponse.json({
    data,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}

const createSchema = z.object({
  shipmentNumber: z.string().min(1),
  projectId:      z.string().uuid().optional(),
  type:           z.enum(["export","domestic"]).default("export"),
  buyer:          z.string().min(1),
  buyerCountry:   z.string().optional(),
  product:        z.string().default("Coal"),
  qtyPlan:        z.coerce.number().positive().optional(),
  salesPrice:     z.coerce.number().positive().optional(),
  buyingPrice:    z.coerce.number().positive().optional(),
  freightRate:    z.coerce.number().positive().optional(),
  marginMt:       z.coerce.number().optional(),
  pol:            z.string().optional(),
  pod:            z.string().optional(),
  laycanStart:    z.string().optional(),
  laycanEnd:      z.string().optional(),
  vesselName:     z.string().optional(),
  bargeName:      z.string().optional(),
  source:         z.string().optional(),
  supplier:       z.string().optional(),
  iupOp:          z.string().optional(),
  region:         z.string().optional(),
  specGar:        z.coerce.number().positive().optional(),
  specTs:         z.coerce.number().positive().optional(),
  specAsh:        z.coerce.number().positive().optional(),
  specTm:         z.coerce.number().positive().optional(),
  shippingTerm:   z.string().optional(),
  paymentTerm:    z.string().optional(),
  pic:            z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Shipments must be initialized from an approved Forecast/FCO" }, { status: 410 });
}

