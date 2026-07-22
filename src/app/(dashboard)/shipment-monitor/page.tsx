import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShipmentClient } from "@/modules/shipment-monitor/components/shipment-client";

export const metadata = { title: "Shipment Monitor · CoalTrade OS" };

export default async function ShipmentMonitorPage() {
  // Active shipment count for the badge — fast COUNT query
  const activeCount = await prisma.shipment.count({
    where: { status: { in: ["loading", "in_transit"] } },
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header flex items-center gap-3">
        <h1 className="page__title text-2xl font-semibold">Shipment Monitor</h1>
        {activeCount > 0 && (
          <span className="badge badge--primary">{activeCount} active</span>
        )}
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
        <ShipmentClient />
      </Suspense>
    </div>
  );
}
