import { MVWorkspace } from "@/modules/shipment-monitor/components/mv-workspace";

export const dynamic = "force-dynamic";

export default async function MotherVesselWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MVWorkspace id={id} />;
}
