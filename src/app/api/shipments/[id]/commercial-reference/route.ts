export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/**
 * FR-SHIP-018: Commercial Reference
 * Returns linked Forecast Sales project data (FCO, contract, pricing, payment term)
 * for display in the Shipment Monitor detail panel.
 * No separate upload — data comes from the linked project (no re-upload rule per BR-SHIP-037).
 */
export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    select: {
      id: true,
      shipmentNumber: true,
      shippingTerm: true,
      paymentTerm: true,
      salesPrice: true,
      marginMt: true,
      projectId: true,
      project: {
        select: {
          id: true,
          projectName: true,
          buyer: true,
          buyerCountry: true,
          shippingTerm: true,
          salesPriceEst: true,
          fcoNumber: true,
          fcoVersion: true,
          fcoPdfUrl: true,
          fcoSentDate: true,
          status: true,
          laycanStart: true,
          laycanEnd: true,
          quantity: true,
          specGar: true,
          specTs: true,
          specAsh: true,
          specTm: true,
          fcoRecords: {
            orderBy: { version: "desc" },
            take: 3,
            select: {
              id: true,
              fcoNumber: true,
              version: true,
              action: true,
              pdfUrl: true,
              generatedAt: true,
              generatedBy: true,
            },
          },
        },
      },
    },
  });

  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!shipment.project) {
    return NextResponse.json({
      data: {
        linked: false,
        message: "No Forecast Sales project linked to this shipment",
        shipmentRef: {
          shippingTerm: shipment.shippingTerm,
          paymentTerm:  shipment.paymentTerm,
          salesPrice:   shipment.salesPrice ? Number(shipment.salesPrice) : null,
        },
      },
    });
  }

  const project = shipment.project;

  return NextResponse.json({
    data: {
      linked:         true,
      projectId:      project.id,
      projectName:    project.projectName,
      buyer:          project.buyer,
      buyerCountry:   project.buyerCountry,
      // Commercial terms
      salesTerm:         project.shippingTerm ?? shipment.shippingTerm,
      targetSellingPrice:project.salesPriceEst ? Number(project.salesPriceEst) : null,
      priceBasis:        null,
      paymentTerms:      shipment.paymentTerm,
      // Shipment-level overrides
      actualSalesPrice:  shipment.salesPrice ? Number(shipment.salesPrice) : null,
      marginMt:          shipment.marginMt   ? Number(shipment.marginMt)   : null,
      // Laycan & quantity
      laycanStart: project.laycanStart?.toISOString() ?? null,
      laycanEnd:   project.laycanEnd?.toISOString()   ?? null,
      quantity:    project.quantity ? Number(project.quantity) : null,
      // Spec
      specGar: project.specGar ? Number(project.specGar) : null,
      specTs:  project.specTs  ? Number(project.specTs)  : null,
      specAsh: project.specAsh ? Number(project.specAsh) : null,
      specTm:  project.specTm  ? Number(project.specTm)  : null,
      // FCO documents
      fcoNumber:  project.fcoNumber,
      fcoVersion: project.fcoVersion,
      fcoPdfUrl:  project.fcoPdfUrl,
      fcoSentDate:project.fcoSentDate?.toISOString() ?? null,
      fcoHistory: project.fcoRecords,
      projectStatus: project.status,
    },
  });
}
