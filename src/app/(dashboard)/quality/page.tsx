import { Suspense } from "react";
import { QualityClient } from "@/modules/quality-control/components/quality-client";

export const metadata = { title: "Quality Control · CoalTrade OS" };

export default function QualityPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Quality Control <span className="text-muted-foreground font-normal text-base">— Spec & Inspection</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <QualityClient />
      </Suspense>
    </div>
  );
}
