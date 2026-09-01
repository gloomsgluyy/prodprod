import { MVWorkspace } from "@/modules/shipment-monitor/components/mv-workspace";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MotherVesselWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await prisma.shipment.findFirst({ where: { id, shipmentClass: "mother_vessel" }, select: { id: true } });
  if (!shipment) notFound();
  return <MVWorkspace id={id} />;
}
