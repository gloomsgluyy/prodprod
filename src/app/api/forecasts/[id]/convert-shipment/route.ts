import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Roles that can convert approved forecast to shipment — sales/traffic/exec
const CONVERTER_ROLES = [
  "CEO", "DIRUT", "ASS_DIRUT", "COO",
  "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4",
  "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "ADMIN_OPERATION",
] as const;

const schema = z.object({
  shipmentNumber: z.string().min(1),
  vesselName:     z.string().optional(),
  pic:            z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!CONVERTER_ROLES.includes(session.user.role as never))
    return NextResponse.json({ error: "Forbidden — only sales/traffic can convert to shipment" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(["approved", "deal"] as string[]).includes(project.status))
    return NextResponse.json({ error: "Only approved projects can be converted to shipments" }, { status: 409 });

  // Buyer acceptance is mandatory; a missing feedback status must not bypass this gate.
  if (project.buyerFeedbackStatus !== "deal")
    return NextResponse.json({ error: "Buyer feedback status must be 'deal' before conversion. Current: " + (project.buyerFeedbackStatus ?? "not set") }, { status: 409 });

  if (!project.fcoNumber || !project.fcoVersion)
    return NextResponse.json({ error: "An approved FCO must be generated before initializing a Shipment" }, { status: 409 });

  if (project.linkedShipmentId)
    return NextResponse.json({ error: "This Forecast already has a linked Shipment" }, { status: 409 });

  // Check shipment number uniqueness
  const existing = await prisma.shipment.findUnique({
    where: { shipmentNumber: parsed.data.shipmentNumber },
  });
  if (existing)
    return NextResponse.json({ error: "Shipment number already exists" }, { status: 409 });

  const approvedSnapshot = {
    forecastProjectId: project.id,
    projectName: project.projectName,
    entity: project.entity,
    offerDate: project.offerDate?.toISOString() ?? null,
    fcoNumber: project.fcoNumber,
    fcoVersion: project.fcoVersion,
    marketSection: project.segment,
    buyer: project.buyer,
    buyerCountry: project.buyerCountry,
    attention: project.attention,
    buyerCode: project.buyerCode,
    commodity: project.commodity,
    quantity: project.quantity ? Number(project.quantity) : null,
    quantityUnit: project.quantityUnit,
    quantityTolerance: project.quantityTolerance,
    laycanStart: project.laycanStart?.toISOString() ?? null,
    laycanEnd: project.laycanEnd?.toISOString() ?? null,
    validityDate: project.validityDate?.toISOString() ?? null,
    validityTime: project.validityTime,
    timezone: project.timezone,
    pol: project.pol,
    pod: project.pod,
    priceBasis: project.priceBasis,
    basePriceMethod: project.basePriceMethod,
    formula: project.formula,
    averagePeriod: project.averagePeriod,
    applyPriceAdjustment: project.applyPriceAdjustment,
    adjustmentFormula: project.adjustmentFormula,
    rejectionGar: project.rejectionGar ? Number(project.rejectionGar) : null,
    shippingTerm: project.shippingTerm,
    paymentTerm: project.paymentTerm,
    surveyor: project.surveyor,
    coalSpec: { gar: project.specGar ? Number(project.specGar) : null, nar: project.specNar ? Number(project.specNar) : null, ts: project.specTs ? Number(project.specTs) : null, ash: project.specAsh ? Number(project.specAsh) : null, tm: project.specTm ? Number(project.specTm) : null, im: project.specIm ? Number(project.specIm) : null, vm: project.specVm ? Number(project.specVm) : null, hgi: project.specHgi ? Number(project.specHgi) : null, size: project.specSize, standard: project.specStandard, source: project.specificationSource },
    otherTerms: project.remarks,
    calculatorSnapshot: project.calculatorSnapshot,
  };

  const { shipment, updatedProject } = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        shipmentNumber: parsed.data.shipmentNumber,
        projectId:      id,
        buyer:          project.buyer,
        buyerCountry:   project.buyerCountry,
        qtyPlan:        project.quantity,
        salesPrice:     project.salesPriceEst,
        buyingPrice:    project.buyingPriceEst,
        freightRate:    project.freightEst,
        marginMt:       project.marginEst,
        pol:            project.pol,
        pod:            project.pod,
        laycanStart:    project.laycanStart,
        laycanEnd:      project.laycanEnd,
        shippingTerm:   project.shippingTerm,
        specGar:        project.specGar,
        specTs:         project.specTs,
        specAsh:        project.specAsh,
        specTm:         project.specTm,
        vesselName:     parsed.data.vesselName,
        fcoNumber:      project.fcoNumber,
        fcoVersion:     project.fcoVersion,
        forecastSnapshot: approvedSnapshot,
        pic:            parsed.data.pic,
        status:         "upcoming",
        createdById:    session.user.id,
      },
    });
    const linked = await tx.forecastProject.updateMany({
      where: { id, linkedShipmentId: null },
      data: { status: "deal", linkedShipmentId: shipment.id },
    });
    if (linked.count !== 1) throw new Error("Forecast already has a linked Shipment");
    const updatedProject = await tx.forecastProject.findUniqueOrThrow({ where: { id } });
    return { shipment, updatedProject };
  });

  // Auto-initialize document requirements for converted shipment
  const DEFAULT_DOCS = [
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
    data: DEFAULT_DOCS.map((d) => ({
      shipmentId: shipment.id,
      requirementCode: d.code,
      label: d.label,
      status: "pending",
    })),
    skipDuplicates: true,
  });


  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "converted_to_shipment", entity: "forecast_project",
    entityId: id, projectId: id, shipmentId: shipment.id,
    details: { shipmentNumber: shipment.shipmentNumber },
  });

  return NextResponse.json({ data: { shipment, project: updatedProject } }, { status: 201 });
}
