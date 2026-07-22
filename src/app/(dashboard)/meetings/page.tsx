import { Suspense } from "react";
import { MeetingsClient } from "@/modules/meetings/components/meetings-client";

export const metadata = { title: "Meetings · CoalTrade OS" };

export default function MeetingsPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Meetings <span className="text-muted-foreground font-normal text-base">— MOM & Task Extraction</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <MeetingsClient />
      </Suspense>
    </div>
  );
}
