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
      ],
    } : {}),
  };

  const exec = isExecutive(session.user.role);

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true, shipmentNumber: true, type: true, buyer: true, buyerCountry: true,
        vesselName: true, bargeName: true, pol: true, pod: true,
        qtyPlan: true, qtyLoaded: true, qtyFinal: true,
        blDate: true, laycanStart: true, laycanEnd: true,
        source: true, supplier: true, region: true, status: true,
        completionScore: true, pic: true, createdAt: true,
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

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Check unique shipment number
  const exists = await prisma.shipment.findUnique({ where: { shipmentNumber: parsed.data.shipmentNumber } });
  if (exists)
    return NextResponse.json({ error: "Shipment number already exists" }, { status: 409 });

  const { computeCompletionScore } = await import("@/modules/shipment-monitor/utils/completion-score");
  const score = computeCompletionScore(parsed.data);

  const { laycanStart, laycanEnd, blDate, etd, eta, ...rest } = parsed.data as any;

  const dateFields = {
    ...(laycanStart !== undefined ? { laycanStart: laycanStart ? new Date(laycanStart) : null } : {}),
    ...(laycanEnd !== undefined ? { laycanEnd: laycanEnd ? new Date(laycanEnd) : null } : {}),
    ...(blDate !== undefined ? { blDate: blDate ? new Date(blDate) : null } : {}),
    ...(etd !== undefined ? { etd: etd ? new Date(etd) : null } : {}),
    ...(eta !== undefined ? { eta: eta ? new Date(eta) : null } : {}),
  };

  const shipment = await prisma.shipment.create({
    data: { ...rest, ...dateFields, completionScore: score, createdById: session.user.id },
  });

  // Auto-create document checklist
  const DOC_REQUIREMENTS = [
    { code: "a", label: "Copy Laporan Hasil Verifikasi (LHV)" },
    { code: "b", label: "1 Original Draught Survey Report" },
    { code: "c", label: "1 Original Surat Keterangan Asal Barang" },
    { code: "d", label: "1 Original Surat Kebenaran Dokumen" },
    { code: "e", label: "1 Original Surat Kirim Barang" },
    { code: "f", label: "1 Original Bukti Bayar Royalti" },
    { code: "g", label: "3/3 Original Bill of Lading" },
    { code: "h", label: "3/3 Copies Non Negotiable Bill of Lading" },
    { code: "i", label: "Certificate of Sampling and Analysis" },
    { code: "j", label: "Certificate of Weight" },
    { code: "k", label: "Certificate of Draught Survey Report" },
  ];
  await prisma.shipmentDocument.createMany({
    data: DOC_REQUIREMENTS.map((d) => ({
      shipmentId: shipment.id,
      requirementCode: d.code,
      label: d.label,
      status: "pending",
    })),
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "shipment", entityId: shipment.id,
    shipmentId: shipment.id,
    details: { shipmentNumber: shipment.shipmentNumber, buyer: shipment.buyer },
  });

  return NextResponse.json({ data: shipment }, { status: 201 });
}

