import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BargeWorkspace } from "@/modules/shipment-monitor/components/barge-workspace";

export const dynamic = "force-dynamic";

export default async function BargeLinePage({ params }: { params: Promise<{ id: string; childId: string }> }) {
  const { id, childId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const child = await prisma.childNomination.findFirst({ where: { id: childId, motherShipmentId: id }, select: { id: true } });
  if (!child) notFound();
  return <BargeWorkspace parentId={id} childId={childId} />;
}
