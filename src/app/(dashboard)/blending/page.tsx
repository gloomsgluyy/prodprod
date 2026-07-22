import { Suspense } from "react";
import { BlendingClient } from "@/modules/blending-simulator/components/blending-client";

export const metadata = { title: "Blending Simulator · CoalTrade OS" };

export default function BlendingPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Blending Simulator <span className="text-muted-foreground font-normal text-base">— Weighted Average Calculator</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <BlendingClient />
      </Suspense>
    </div>
  );
}
