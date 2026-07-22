import { Suspense } from "react";
import { DirectoryClient } from "@/modules/directory/components/directory-client";

export const metadata = { title: "Directory · CoalTrade OS" };

export default function DirectoryPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Partners & Directory <span className="text-muted-foreground font-normal text-base">— CRM Master Data</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <DirectoryClient />
      </Suspense>
    </div>
  );
}
