export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const [shipments, payments, quality] = await Promise.all([
    prisma.shipment.findMany({ where: { status: { in: ["upcoming", "loading", "in_transit"] } }, select: { id: true, shipmentNumber: true, laycanStart: true, blDate: true, createdAt: true, siHistory: { select: { id: true }, take: 1 } } }),
    prisma.outstandingPayment.findMany({ where: { status: { not: "paid" }, dueDate: { lt: now } }, select: { id: true, shipmentId: true, invoiceNumber: true, dueDate: true, shipment: { select: { shipmentNumber: true } } } }),
    prisma.qualityResult.findMany({ where: { status: "pending" }, select: { id: true, shipmentId: true, cargoName: true, createdAt: true } }),
  ]);
  const alerts = [
    ...shipments.flatMap((shipment) => {
      const age = Math.floor((now.getTime() - shipment.createdAt.getTime()) / 86400000);
      const h10 = shipment.laycanStart && Math.ceil((shipment.laycanStart.getTime() - now.getTime()) / 86400000) < 10 && shipment.siHistory.length === 0;
      return [
        ...(h10 ? [{ id: `si-${shipment.id}`, type: "SI overdue", message: "Laycan is within H-10 without SI", shipmentId: shipment.id, shipmentNumber: shipment.shipmentNumber, link: `/shipment-monitor?open=${shipment.id}&tab=si`, severity: "critical" }] : []),
        ...(!shipment.blDate && age > 3 ? [{ id: `bl-${shipment.id}`, type: "Draft BL pending", message: `No BL date after ${age} days`, shipmentId: shipment.id, shipmentNumber: shipment.shipmentNumber, link: `/shipment-monitor?open=${shipment.id}`, severity: "warning" }] : []),
      ];
    }),
    ...payments.map((payment) => ({ id: `invoice-${payment.id}`, type: "Invoice overdue", message: `${payment.invoiceNumber ?? "Invoice"} is overdue`, shipmentId: payment.shipmentId, shipmentNumber: payment.shipment?.shipmentNumber ?? "Unlinked payment", link: payment.shipmentId ? `/shipment-monitor?open=${payment.shipmentId}` : "/outstanding-payment", severity: "critical" })),
    ...quality.map((result) => ({ id: `surveyor-${result.id}`, type: "Surveyor report pending", message: `${result.cargoName} quality result awaits completion`, shipmentId: result.shipmentId, shipmentNumber: shipments.find((shipment) => shipment.id === result.shipmentId)?.shipmentNumber ?? "Unlinked quality", link: result.shipmentId ? `/shipment-monitor?open=${result.shipmentId}&tab=quality` : "/quality", severity: "warning" })),
  ];
  const categories = [
    { type: "SI overdue (> H-10)", key: "SI overdue", link: "/shipment-monitor?tab=si" },
    { type: "Draft BL pending (> 3 days)", key: "Draft BL pending", link: "/shipment-monitor" },
    { type: "COO pending", key: "COO pending", link: "/shipment-monitor" },
    { type: "Invoice overdue", key: "Invoice overdue", link: "/outstanding-payment" },
    { type: "Surveyor report pending", key: "Surveyor report pending", link: "/quality" },
  ].map((category) => ({
    ...category,
    count: alerts.filter((alert) => alert.type === category.key).length,
  }));
  return NextResponse.json({ data: alerts, categories });
}
