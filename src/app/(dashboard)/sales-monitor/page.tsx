import { Suspense } from "react";
import { SalesMonitorClient } from "@/modules/sales-monitor/components/sales-monitor-client";

export const metadata = { title: "Sales Monitor · CoalTrade OS" };

export default function SalesMonitorPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Sales Monitor <span className="text-muted-foreground font-normal text-base">— Deal Pipeline</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <SalesMonitorClient />
      </Suspense>
    </div>
  );
}
