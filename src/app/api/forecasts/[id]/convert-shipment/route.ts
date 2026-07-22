import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  shipmentNumber: z.string().min(1),
  vesselName:     z.string().optional(),
  bargeName:      z.string().optional(),
  source:         z.string().optional(),
  supplier:       z.string().optional(),
  pic:            z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.status !== "approved")
    return NextResponse.json({ error: "Only approved projects can be converted to shipments" }, { status: 409 });

  // Check shipment number uniqueness
  const existing = await prisma.shipment.findUnique({
    where: { shipmentNumber: parsed.data.shipmentNumber },
  });
  if (existing)
    return NextResponse.json({ error: "Shipment number already exists" }, { status: 409 });

  const [shipment, updatedProject] = await prisma.$transaction([
    prisma.shipment.create({
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
        bargeName:      parsed.data.bargeName,
        source:         parsed.data.source,
        supplier:       parsed.data.supplier,
        pic:            parsed.data.pic,
        status:         "upcoming",
        createdById:    session.user.id,
      },
    }),
    prisma.forecastProject.update({
      where: { id },
      data: { status: "deal", linkedShipmentId: parsed.data.shipmentNumber },
    }),
  ]);

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "converted_to_shipment", entity: "forecast_project",
    entityId: id, projectId: id, shipmentId: shipment.id,
    details: { shipmentNumber: shipment.shipmentNumber },
  });

  return NextResponse.json({ data: { shipment, project: updatedProject } }, { status: 201 });
}
