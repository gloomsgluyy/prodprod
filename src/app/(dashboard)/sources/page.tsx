import { Suspense } from "react";
import { SourcesClient } from "@/modules/sources/components/sources-client";

export const metadata = { title: "Sources & Supplier · CoalTrade OS" };

export default function SourcesPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Sources & Supplier <span className="text-muted-foreground font-normal text-base">— Supplier Management</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <SourcesClient />
      </Suspense>
    </div>
  );
}
