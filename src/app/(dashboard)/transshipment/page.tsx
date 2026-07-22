import { Suspense } from "react";
import { TransshipmentClient } from "@/modules/transshipment/components/transshipment-client";

export const metadata = { title: "Transshipment · CoalTrade OS" };

export default function TransshipmentPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Transshipment <span className="text-muted-foreground font-normal text-base">— Voyage & Freight</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <TransshipmentClient />
      </Suspense>
    </div>
  );
}
