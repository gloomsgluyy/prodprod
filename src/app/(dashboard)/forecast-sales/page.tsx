import { Suspense } from "react";
import { ForecastClient } from "@/modules/forecast-sales/components/forecast-client";

export const metadata = { title: "Forecast Sales · CoalTrade OS" };

export default function ForecastSalesPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Forecast Sales <span className="text-muted-foreground font-normal text-base">— Sales Forecast Pipeline</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <ForecastClient />
      </Suspense>
    </div>
  );
}
